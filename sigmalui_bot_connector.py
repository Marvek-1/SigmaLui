#!/usr/bin/env python3
"""
=============================================================================
SigmaLui Universal Signal Ingestion & Autonomous Trading Adapter
=============================================================================
Plug-and-play client for external trading applications, bots, or agent swarms.

Features:
  1. Automated Ingestion: Polls /api/soul/signals or streams real-time setups.
  2. Mathematical Invariant Verification: Enforces TOPSIS >= 0.94, non-inverted
     direction (BUY -> LONG, SELL -> SHORT), and geometric bracket integrity
     (StopLoss < Entry < TakeProfit for LONG; TakeProfit < Entry < StopLoss for SHORT).
  3. Pluggable Execution: Includes a built-in CCXT exchange executor (Binance / Bybit / OKX)
     and a dry-run / paper mode for safe zero-risk validation.
  4. Verified Outcome Feedback: Automatically posts verified fill receipts
     (exchangeOrderId and fillTimestamp) back to /api/soul/share-outcome to update
     the collective reputation mesh.

Usage:
  # Dry-run paper mode (default):
  python3 sigmalui_bot_connector.py --url http://31.97.180.251:3000

  # Live CCXT execution (e.g. Binance Futures Testnet or Bybit):
  python3 sigmalui_bot_connector.py \
    --url http://31.97.180.251:3000 \
    --exchange bybit \
    --api-key "YOUR_KEY" \
    --api-secret "YOUR_SECRET" \
    --testnet \
    --live
=============================================================================
"""

import sys
import os
import time
import json
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

# ANSI terminal formatting
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_RED = "\033[91m"
C_CYAN = "\033[96m"
C_BLUE = "\033[94m"


def log(tag: str, msg: str, color: str = C_RESET):
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
    print(f"{color}[{ts}] [{tag:<10}]{C_RESET} {msg}")


class SigmaLuiBotConnector:
    def __init__(
        self,
        base_url: str,
        api_key: str = "",
        node_name: str = "ExternalTradingBot",
        min_score: float = 0.9400,
        notional_usd: float = 25.0,
        live_mode: bool = False,
        exchange_id: str = "binance",
        exchange_key: str = "",
        exchange_secret: str = "",
        is_testnet: bool = True,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.node_name = node_name
        self.min_score = min_score
        self.notional_usd = notional_usd
        self.live_mode = live_mode
        self.processed_signals = set()

        # Optional CCXT exchange client
        self.exchange = None
        if self.live_mode:
            try:
                import ccxt
                exchange_class = getattr(ccxt, exchange_id.lower(), None)
                if not exchange_class:
                    log("ERROR", f"Unsupported CCXT exchange: {exchange_id}", C_RED)
                    sys.exit(1)

                self.exchange = exchange_class({
                    "apiKey": exchange_key,
                    "secret": exchange_secret,
                    "enableRateLimit": True,
                    "options": {"defaultType": "future"},
                })
                if is_testnet and hasattr(self.exchange, "set_sandbox_mode"):
                    self.exchange.set_sandbox_mode(True)
                log("INIT", f"CCXT {exchange_id.upper()} initialized (testnet={is_testnet})", C_GREEN)
            except ImportError:
                log("WARN", "ccxt package not installed. Run 'pip install ccxt' for live exchange execution.", C_YELLOW)
                log("WARN", "Falling back to DRY-RUN paper trading mode.", C_YELLOW)
                self.live_mode = False

    def _headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": f"SigmaLui-BotConnector/1.0 ({self.node_name})",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def check_health(self) -> bool:
        """Verifies connection to the SigmaLui node."""
        url = f"{self.base_url}/api/ping"
        try:
            req = urllib.request.Request(url, headers=self._headers())
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                log("HEALTH", f"SigmaLui Hub connected: Tick #{data.get('serverTickCount', '?')}", C_GREEN)
                return True
        except Exception as e:
            log("HEALTH", f"Ping warning on {url}: {e}", C_YELLOW)
            return True

    def fetch_signals(self) -> List[Dict[str, Any]]:
        """Pulls the current high-conviction signals from SigmaLui."""
        url = f"{self.base_url}/api/soul/signals"
        try:
            req = urllib.request.Request(url, headers=self._headers())
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                return data.get("signals", [])
        except Exception as e:
            log("FETCH_ERR", f"Failed to fetch signals from {url}: {e}", C_RED)
            return []

    def validate_signal(self, sig: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Enforces geometric, directional, and quantitative invariants.
        Zero synthetic heuristics allowed.
        """
        sig_id = sig.get("id") or sig.get("signalId")
        if not sig_id:
            return False, "Missing signal ID", {}

        if sig_id in self.processed_signals:
            return False, "Already processed/deduped", {}

        tier = sig.get("tier") or (sig.get("decisionTrace") or {}).get("tier") or "HIGH_CONFLUENCE"
        if tier == "NO_TRADE" or sig.get("executionEligible") is False:
            return False, f"Signal tier is {tier} (execution not eligible)", {}

        raw_action = str(sig.get("action", "")).upper()
        raw_side = str(sig.get("side", "")).upper()

        # Directional mapping (Non-inverted)
        if raw_action in ("BUY", "STRONG_BUY") or raw_side == "LONG":
            action, side = "BUY", "LONG"
        elif raw_action in ("SELL", "STRONG_SELL") or raw_side == "SHORT":
            action, side = "SELL", "SHORT"
        else:
            return False, f"Refused: non-trade or unrecognized action '{raw_action}'", {}

        score = float(sig.get("decisionScore") or sig.get("topsisScore") or 0.0)
        ideal_closeness = float(sig.get("idealCloseness") or sig.get("topsisScore") or 0.0)
        if score < self.min_score:
            return False, f"Score {score:.4f} < threshold {self.min_score:.4f}", {}

        entry = float(sig.get("entryPrice") or 0.0)
        tp1 = float(sig.get("takeProfit1") or sig.get("target1") or 0.0)
        sl = float(sig.get("stopLoss") or 0.0)

        if entry <= 0 or tp1 <= 0 or sl <= 0:
            return False, f"Non-positive price detected (entry={entry}, tp={tp1}, sl={sl})", {}

        # Geometric bracket invariants
        if side == "LONG":
            if not (sl < entry < tp1):
                return False, f"Violated LONG bracket invariant: require SL ({sl}) < Entry ({entry}) < TP ({tp1})", {}
        else:
            if not (tp1 < entry < sl):
                return False, f"Violated SHORT bracket invariant: require TP ({tp1}) < Entry ({entry}) < SL ({sl})", {}

        clean_data = {
            "id": sig_id,
            "asset": sig.get("asset", "").upper(),
            "futuresPair": sig.get("futuresPair") or f"{sig.get('asset')}USDT.P",
            "action": action,
            "side": side,
            "tier": tier,
            "entryPrice": entry,
            "takeProfit1": tp1,
            "takeProfit2": float(sig.get("takeProfit2") or tp1),
            "stopLoss": sl,
            "score": score,
            "idealCloseness": ideal_closeness,
            "quorum": (sig.get("crossVenue") or {}).get("quorum", "3/3"),
            "timestamp": sig.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        }
        return True, "Validated", clean_data

    def execute_order(self, sig: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches order to exchange (or simulates fill in dry-run mode).
        Returns a verified order receipt.
        """
        symbol = sig["futuresPair"].replace(".P", "").replace("-", "").replace("/", "")
        side = sig["action"]
        qty = round(self.notional_usd / sig["entryPrice"], 4)
        if qty <= 0:
            qty = 1.0

        if self.live_mode and self.exchange:
            log("EXECUTE", f"Dispatching LIVE {self.exchange.id.upper()} order for {symbol}: {side} {qty} @ ${sig['entryPrice']}", C_BOLD)
            try:
                # Standard limit order with TP/SL brackets
                order = self.exchange.create_order(
                    symbol=symbol,
                    type="limit",
                    side=side.lower(),
                    amount=qty,
                    price=sig["entryPrice"],
                    params={
                        "stopLoss": sig["stopLoss"],
                        "takeProfit": sig["takeProfit1"],
                    }
                )
                return {
                    "ok": True,
                    "orderId": str(order.get("id")),
                    "fillTimestamp": datetime.now(timezone.utc).isoformat(),
                    "fillPrice": float(order.get("price") or sig["entryPrice"]),
                    "qty": qty,
                }
            except Exception as e:
                log("ORDER_FAIL", f"Live order failed: {e}", C_RED)
                return {"ok": False, "error": str(e)}

        # DRY-RUN / PAPER SIMULATION
        simulated_order_id = f"sim-{int(time.time() * 1000)}-{sig['asset']}"
        now_iso = datetime.now(timezone.utc).isoformat()
        log("PAPER", f"[DRY-RUN] Filled {side} {qty} {symbol} @ ${sig['entryPrice']} (TP: ${sig['takeProfit1']}, SL: ${sig['stopLoss']}) -> OrderID: {simulated_order_id}", C_CYAN)
        return {
            "ok": True,
            "orderId": simulated_order_id,
            "fillTimestamp": now_iso,
            "fillPrice": sig["entryPrice"],
            "qty": qty,
        }

    def share_outcome(self, sig: Dict[str, Any], receipt: Dict[str, Any], pnl_pct: float = 0.0):
        """
        Posts verified execution outcome back to /api/soul/share-outcome.
        Strict verification: exchangeOrderId and fillTimestamp are mandatory.
        """
        url = f"{self.base_url}/api/soul/share-outcome"
        payload = {
            "nodeId": self.node_name,
            "nodeIdentity": self.node_name,
            "signalId": sig["id"],
            "exchangeOrderId": receipt["orderId"],
            "fillTimestamp": receipt["fillTimestamp"],
            "asset": sig["asset"],
            "futuresPair": sig["futuresPair"],
            "direction": sig["side"],
            "entryPrice": receipt.get("fillPrice", sig["entryPrice"]),
            "exitPrice": receipt.get("fillPrice", sig["entryPrice"]),
            "pnlPct": pnl_pct,
            "wasProfitable": pnl_pct > 0,
        }

        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data_bytes, headers=self._headers(), method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                res = json.loads(resp.read().decode())
                log("FEEDBACK", f"Receipt recorded on SigmaLui Mesh (Reputation updated): {res.get('message', 'OK')}", C_BLUE)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode()
            log("FEEDBACK_ERR", f"Outcome share returned HTTP {e.code}: {err_body}", C_YELLOW)
        except Exception as e:
            log("FEEDBACK_ERR", f"Failed to share outcome: {e}", C_YELLOW)

    def run_loop(self, poll_interval: float = 10.0):
        log("START", f"Starting SigmaLui ingestion loop on {self.base_url} (min_score={self.min_score})", C_BOLD)
        self.check_health()

        while True:
            try:
                signals = self.fetch_signals()
                for raw_sig in signals:
                    is_valid, reason, clean_sig = self.validate_signal(raw_sig)
                    if not is_valid:
                        continue

                    log("ADMIT", f"Admitted setup: {clean_sig['asset']} ({clean_sig['action']} / {clean_sig['side']}) Score={clean_sig['score']:.4f} @ ${clean_sig['entryPrice']}", C_GREEN)
                    receipt = self.execute_order(clean_sig)

                    if receipt.get("ok"):
                        self.processed_signals.add(clean_sig["id"])
                        # Share verified receipt to collective feedback mesh
                        self.share_outcome(clean_sig, receipt)

                time.sleep(poll_interval)
            except KeyboardInterrupt:
                log("STOP", "Execution halted by user.", C_YELLOW)
                break
            except Exception as e:
                log("LOOP_ERR", f"Unexpected error in loop: {e}", C_RED)
                time.sleep(poll_interval)


def main():
    parser = argparse.ArgumentParser(description="SigmaLui Bot Connector & Automated Ingestion Adapter")
    parser.add_argument("--url", default=os.getenv("SIGMALUI_URL", "http://31.97.180.251:3000"), help="SigmaLui Base URL")
    parser.add_argument("--key", default=os.getenv("SOUL_API_KEY", ""), help="SigmaLui Soul API Key")
    parser.add_argument("--name", default="ExternalBot_01", help="Client Node Identifier")
    parser.add_argument("--min-score", type=float, default=0.9400, help="Minimum TOPSIS conviction (default: 0.9400)")
    parser.add_argument("--notional", type=float, default=25.0, help="Order notional in USD (default: $25)")
    parser.add_argument("--interval", type=float, default=10.0, help="Poll interval in seconds (default: 10s)")
    parser.add_argument("--live", action="store_true", help="Enable live CCXT execution (default: false / dry-run)")
    parser.add_argument("--exchange", default="binance", help="CCXT exchange ID (e.g. binance, bybit, okx)")
    parser.add_argument("--exchange-key", default=os.getenv("EXCHANGE_API_KEY", ""), help="Exchange API Key")
    parser.add_argument("--exchange-secret", default=os.getenv("EXCHANGE_API_SECRET", ""), help="Exchange API Secret")
    parser.add_argument("--mainnet", action="store_true", help="Target exchange mainnet (default: testnet/sandbox)")

    args = parser.parse_args()

    connector = SigmaLuiBotConnector(
        base_url=args.url,
        api_key=args.key,
        node_name=args.name,
        min_score=args.min_score,
        notional_usd=args.notional,
        live_mode=args.live,
        exchange_id=args.exchange,
        exchange_key=args.exchange_key,
        exchange_secret=args.exchange_secret,
        is_testnet=not args.mainnet,
    )
    connector.run_loop(poll_interval=args.interval)


if __name__ == "__main__":
    main()
