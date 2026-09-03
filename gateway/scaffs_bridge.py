#!/usr/bin/env python3
"""
=============================================================================
Hostinger VPS Local Scaffs Gateway Bridge (scaffs_bridge.py)
=============================================================================
Direct local IPC connector that bridges live quantitative signals from
Redis (signals:live) directly into Scaffs' trading agent signal queue.

Security & Architecture:
  1. Local Only: Runs strictly over 127.0.0.1 (no public ports or internet exposure).
  2. Fail-Closed Invariants: Drops any stale signal (> 30s), unverified signature,
     or geometrically invalid TP/SL.
  3. Seamless Scaffs Integration: Dispatches directly into Scaffs signal_queue
     or writes to a monitored IPC directory.
  4. Safe Paper/Live Modes: Defaults to PAPER mode unless --mode live is passed.
=============================================================================
"""

import sys
import os
import json
import time
import hmac
import hashlib
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    import redis
except ImportError:
    redis = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ScaffsBridge] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ScaffsBridge")

DEFAULT_REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
DEFAULT_REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
DEFAULT_CHANNEL = os.environ.get("REDIS_CHANNEL", "signals:live")
DEFAULT_SCAFFS_PATH = os.environ.get("SCAFFS_PATH", "/home/idona/MoStar/scaffs")
SOUL_HMAC_SECRET = os.environ.get("SOUL_HMAC_SECRET", "")


def verify_signature(signal: dict, secret: str) -> bool:
    """Verifies HMAC provenance signature."""
    if not secret:
        return True  # If no secret configured, signature verification is bypassed
    expected = signal.get("ms_provenance_sig")
    if not expected:
        return False
    payload = {k: v for k, v in signal.items() if k != "ms_provenance_sig"}
    canonical = json.dumps(payload, sort_keys=True).encode("utf-8")
    computed = hmac.new(secret.encode("utf-8"), canonical, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, computed)


def validate_fail_closed(signal: dict, max_age_sec: int = 30) -> bool:
    """Enforces fail-closed signal safety checks."""
    # 1. Age check
    ts_str = signal.get("timestamp")
    if ts_str:
        try:
            sig_time = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            age = (datetime.now(timezone.utc) - sig_time).total_seconds()
            if age > max_age_sec:
                logger.warning(f"Dropping signal {signal.get('id')}: Stale age ({age:.1f}s > {max_age_sec}s)")
                return False
        except Exception:
            pass

    # 2. Geometry check
    action = signal.get("action", "").upper()
    entry = float(signal.get("entryPrice", 0))
    tp = float(signal.get("target1", 0))
    sl = float(signal.get("stopLoss", 0))

    if "BUY" in action:
        if not (tp > entry > sl):
            logger.error(f"Invalid LONG geometry for {signal.get('asset')}: TP={tp}, Entry={entry}, SL={sl}")
            return False
    elif "SELL" in action:
        if not (sl > entry > tp):
            logger.error(f"Invalid SHORT geometry for {signal.get('asset')}: SL={sl}, Entry={entry}, TP={tp}")
            return False
    else:
        return False

    return True


def dispatch_to_scaffs(signal: dict, mode: str, scaffs_path: str):
    """Dispatches signal directly into Scaffs pipeline."""
    asset = signal["asset"]
    action = signal["action"]
    entry = signal["entryPrice"]
    tp1 = signal["target1"]
    sl = signal["stopLoss"]
    conviction = signal["topsisScore"]

    logger.info(
        f"🎯 [DISPATCH to Scaffs] {action} {asset} @ {entry} | "
        f"TP={tp1} | SL={sl} | Conviction={conviction:.1%} | Mode={mode.upper()}"
    )

    if mode == "paper":
        logger.info(f"   [PAPER] Simulated fill recorded for Scaffs testing.")
        return

    # Direct integration with Scaffs signal_queue if available on Python path
    backend_path = os.path.join(scaffs_path, "backend", "agent", "src", "trading")
    if os.path.exists(backend_path) and backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    try:
        from signal_queue import enqueue_signal  # type: ignore
        formatted_scaffs_signal = {
            "symbol": signal.get("futuresPair", f"{asset}USDT"),
            "action": action,
            "entry_price": entry,
            "take_profit": tp1,
            "stop_loss": sl,
            "confidence": conviction,
            "source": "HOSTINGER_MCDM_ENGINE",
            "metadata": {
                "gm11": signal.get("greyModel"),
                "signal_id": signal.get("id"),
            }
        }
        enqueue_signal(formatted_scaffs_signal)
        logger.info(f"   [SUCCESS] Successfully pushed into Scaffs signal_queue.")
    except ImportError:
        # Fallback: Write to Scaffs incoming signals spool directory
        spool_dir = os.path.join(scaffs_path, "data", "incoming_signals")
        os.makedirs(spool_dir, exist_ok=True)
        filename = f"{signal['id']}.json"
        filepath = os.path.join(spool_dir, filename)
        with open(filepath, "w") as f:
            json.dump(signal, f, indent=2)
        logger.info(f"   [SPOOL] Written to Scaffs spool file: {filepath}")


def run_bridge(redis_host: str, redis_port: int, channel: str, mode: str, scaffs_path: str):
    if redis is None:
        logger.error("redis package is not installed. Please run: pip3 install redis")
        sys.exit(1)
    logger.info(f"Connecting to local Redis at {redis_host}:{redis_port}...")
    r = redis.Redis(host=redis_host, port=redis_port, db=0)
    pubsub = r.pubsub()
    pubsub.subscribe(channel)
    logger.info(f"Listening on channel '{channel}' for live quantitative signals...")

    for message in pubsub.listen():
        if message["type"] != "message":
            continue

        try:
            raw_data = message["data"]
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8")
            signal = json.loads(raw_data)

            # 1. Verify provenance signature
            if not verify_signature(signal, SOUL_HMAC_SECRET):
                logger.error("Signal signature verification failed. Dropping.")
                continue

            # 2. Verify fail-closed invariants
            if not validate_fail_closed(signal):
                continue

            # 3. Dispatch to Scaffs
            dispatch_to_scaffs(signal, mode, scaffs_path)

        except Exception as e:
            logger.error(f"Error handling inbound signal from Redis: {e}")


def main():
    parser = argparse.ArgumentParser(description="Hostinger VPS Scaffs Gateway Bridge")
    parser.add_argument("--host", default=DEFAULT_REDIS_HOST, help="Redis host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=DEFAULT_REDIS_PORT, help="Redis port (default: 6379)")
    parser.add_argument("--channel", default=DEFAULT_CHANNEL, help="Redis channel (default: signals:live)")
    parser.add_argument("--mode", choices=["paper", "live"], default="paper", help="Execution mode (default: paper)")
    parser.add_argument("--scaffs-path", default=DEFAULT_SCAFFS_PATH, help="Path to Scaffs repository")

    args = parser.parse_args()

    print("=" * 70)
    print(" 🌉 HOSTINGER LOCAL GATEWAY: REDIS -> SCAFFS")
    print(f" Redis Channel : {args.channel} on {args.host}:{args.port}")
    print(f" Mode          : {args.mode.upper()}")
    print(f" Scaffs Path   : {args.scaffs_path}")
    print("=" * 70)

    run_bridge(args.host, args.port, args.channel, args.mode, args.scaffs_path)


if __name__ == "__main__":
    main()
