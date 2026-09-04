#!/usr/bin/env python3
"""
=============================================================================
Cross-Venue Market Cortex (cross_venue_cortex.py)
=============================================================================
Multi-Exchange Market Truth Triangulation Engine
Synchronizes public derivatives streams from:
  1. Binance Futures (USDT-M) - [Market Data + Execution Venue]
  2. OKX Perpetuals (SWAP)    - [Public Market Data ONLY - Zero Execution Risk]
  3. Bybit Linear (Perpetual) - [Public Market Data ONLY - Zero Execution Risk]

Architectural Mandate:
  "Signal venue != execution venue."
  Binance is one witness, not the judge. Sigma triangulates market truth
  across independent matching engines, measures disagreement and lead-lag,
  and delivers high-provenance signals to Scaffs for Binance execution.
=============================================================================
"""

import time
import math
import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger("CrossVenueCortex")

@dataclass
class VenueState:
    venue: str                 # 'BINANCE', 'OKX', 'BYBIT'
    symbol: str                # e.g. 'BTC'
    is_execution_venue: bool   # True for Binance, False for OKX / Bybit (Phase 1)
    mark_price: float
    index_price: float
    last_price: float
    best_bid: float
    best_ask: float
    spread_bps: float
    orderbook_imbalance: float # -1.0 (heavy asks) to +1.0 (heavy bids)
    open_interest: float
    open_interest_delta: float # e.g. +0.038 (+3.8%)
    funding_rate: float
    funding_direction: str     # 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    aggressive_buy_volume: float
    aggressive_sell_volume: float
    volume: float
    basis: float
    exchange_timestamp: int
    receive_timestamp: int
    latency_ms: int
    stale: bool = False
    direction_bias: str = "LONG"

@dataclass
class CrossVenueFrame:
    symbol: str
    binance: VenueState
    okx: VenueState
    bybit: VenueState
    observed_at: int = field(default_factory=lambda: int(time.time() * 1000))

    # Cross-Venue Agreement & Dispersion Metrics
    cross_venue_agreement: float = 1.0       # 0.0 to 1.0 (1.0 = 3/3 unanimous)
    cross_venue_dispersion_bps: float = 0.0  # Max price variance across venues in basis points
    cross_venue_price_basis: float = 0.0     # Max price - Min price in USD
    cross_venue_funding_dispersion: float = 0.0
    cross_venue_oi_dispersion: float = 0.0
    cross_venue_orderflow_agreement: float = 1.0

    # Direction & Conviction
    consensus_direction: str = "LONG"        # 'LONG', 'SHORT', 'NEUTRAL', 'DIVERGENT'
    conviction_multiplier: float = 1.0

    # Lead / Lag Dynamics
    lead_venue: str = "SYNCHRONIZED"         # 'BINANCE', 'OKX', 'BYBIT', 'SYNCHRONIZED'
    venue_lead_lag_ms: int = 0
    lead_lag_insight: str = ""

    # Learned Reliability Vector
    reliability_weights: Dict[str, float] = field(default_factory=dict)

    # Disagreement As Information
    disagreement_diagnosis: str = ""
    disagreement_category: str = "UNANIMOUS_CONVERGENCE"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class CrossVenueMarketCortex:
    """
    Synthesizes multi-exchange state vectors into canonical market frames.
    Quantifies disagreement as valuable market intelligence rather than noise.
    """

    VENUE_RELIABILITY_PRIORS = {
        "BTC": {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3},
        "ETH": {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3},
        "SOL": {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3},
        "BNB": {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3},
        "TAO": {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3},
    }

    def __init__(self):
        self.cached_frames: Dict[str, CrossVenueFrame] = {}

    def synthesize_frame(
        self,
        symbol: str,
        binance: VenueState,
        okx: VenueState,
        bybit: VenueState
    ) -> CrossVenueFrame:
        """
        Constructs synchronized CrossVenueFrame and computes all cross-venue metrics
        using hardened mathematical invariants.
        """
        venues = [binance, okx, bybit]
        fresh_venues = [v for v in venues if not v.stale and v.mark_price > 0]
        
        mark_prices = [v.mark_price for v in fresh_venues]
        if len(mark_prices) >= 2:
            min_p, max_p = min(mark_prices), max(mark_prices)
            avg_p = sum(mark_prices) / len(mark_prices)
            price_basis = max_p - min_p
            dispersion_bps = (price_basis / avg_p) * 10000.0 if avg_p > 0 else 0.0
        else:
            price_basis = 0.0
            dispersion_bps = 0.0
            avg_p = mark_prices[0] if mark_prices else 0.0

        # Weights: neutral 1/3 priors
        weights = self.VENUE_RELIABILITY_PRIORS.get(symbol, {"BINANCE": 1/3, "OKX": 1/3, "BYBIT": 1/3})

        # Directional net agreement: A = |sum(w_i * d_i)| / sum(w_i)
        dir_map = {"LONG": 1.0, "SHORT": -1.0, "NEUTRAL": 0.0}
        weighted_signed_dir = 0.0
        total_fresh_weight = 0.0
        long_mass = 0.0
        short_mass = 0.0
        neutral_mass = 0.0

        for v in venues:
            if v.stale:
                continue
            w = weights.get(v.venue, 1/3)
            total_fresh_weight += w
            d = dir_map.get(v.direction_bias, 0.0)
            weighted_signed_dir += w * d
            if v.direction_bias == "LONG":
                long_mass += w
            elif v.direction_bias == "SHORT":
                short_mass += w
            else:
                neutral_mass += w

        if total_fresh_weight > 1e-9:
            agreement = min(1.0, max(0.0, abs(weighted_signed_dir) / total_fresh_weight))
            if long_mass > short_mass and long_mass > neutral_mass:
                consensus_dir = "LONG"
            elif short_mass > long_mass and short_mass > neutral_mass:
                consensus_dir = "SHORT"
            elif long_mass == 0 and short_mass == 0:
                consensus_dir = "NEUTRAL"
            else:
                consensus_dir = "DIVERGENT"
        else:
            agreement = 0.0
            consensus_dir = "NEUTRAL"

        # Funding dispersion across fresh venues
        fundings = [v.funding_rate for v in fresh_venues]
        if fundings:
            avg_f = sum(fundings) / len(fundings)
            f_disp = math.sqrt(sum((f - avg_f) ** 2 for f in fundings) / len(fundings))
        else:
            f_disp = 0.0

        # OI delta dispersion across fresh venues
        oi_deltas = [v.open_interest_delta for v in fresh_venues]
        if oi_deltas:
            avg_oi = sum(oi_deltas) / len(oi_deltas)
            oi_disp = math.sqrt(sum((oi - avg_oi) ** 2 for oi in oi_deltas) / len(oi_deltas))
        else:
            oi_disp = 0.0

        # Top-of-book orderflow agreement: O = |sum(w_i * imb_i)| / sum(w_i * |imb_i|)
        weighted_signed_imb = 0.0
        weighted_abs_imb = 0.0
        for v in venues:
            if v.stale:
                continue
            w = weights.get(v.venue, 1/3)
            imb = max(-1.0, min(1.0, v.orderbook_imbalance))
            weighted_signed_imb += w * imb
            weighted_abs_imb += w * abs(imb)

        if weighted_abs_imb > 1e-9:
            flow_agree = min(1.0, max(0.0, abs(weighted_signed_imb) / weighted_abs_imb))
        else:
            flow_agree = 0.0

        # Hardened conviction multiplier: M = clamp(A * fresh_mass * P, 0, 1)
        # Price coherence: exp(-dispersion_bps / 15.0)
        price_coherence = math.exp(-dispersion_bps / 15.0)
        fresh_mass = min(1.0, max(0.0, total_fresh_weight))
        conviction_mult = min(1.0, max(0.0, agreement * fresh_mass * price_coherence))

        # Lead / Lag: Not inferred from REST snapshots
        lead_venue = "SYNCHRONIZED"
        lead_lag_ms = 0
        lead_insight = f"Lead/lag unavailable for {symbol}: snapshot data is insufficient for causal timing inference"

        # Disagreement As Information Diagnosis
        if len(fresh_venues) < 3:
            diag = f"Insufficient fresh venues ({len(fresh_venues)}/3). Cross-venue evidence is degraded."
            category = "REGIONAL_FLOW_DIFFERENTIAL"
        elif dispersion_bps > 15.0:
            diag = f"Cross-venue mark-price dispersion elevated ({dispersion_bps:.1f} bps). Basis/liquidity divergence."
            category = "TRANSIENT_ARBITRAGE"
        elif flow_agree < 0.35:
            diag = "Top-of-book imbalance disagrees materially across venues."
            category = "REGIONAL_FLOW_DIFFERENTIAL"
        elif consensus_dir == "DIVERGENT" or agreement < 0.5:
            diag = "Reliability-weighted directional evidence is divergent. Conviction safely discounted."
            category = "REGIONAL_FLOW_DIFFERENTIAL"
        else:
            diag = "Fresh venues are directionally coherent within current reliability-weighted snapshot."
            category = "UNANIMOUS_CONVERGENCE"

        weights = self.LEARNED_RELIABILITY.get(symbol, {"BINANCE": 0.90, "OKX": 0.90, "BYBIT": 0.90})

        frame = CrossVenueFrame(
            symbol=symbol,
            binance=binance,
            okx=okx,
            bybit=bybit,
            observed_at=int(time.time() * 1000),
            cross_venue_agreement=agreement,
            cross_venue_dispersion_bps=round(dispersion_bps, 2),
            cross_venue_price_basis=round(price_basis, 2),
            cross_venue_funding_dispersion=f_disp,
            cross_venue_oi_dispersion=oi_disp,
            cross_venue_orderflow_agreement=flow_agree,
            consensus_direction=consensus_dir,
            conviction_multiplier=conviction_mult,
            lead_venue=lead_venue,
            venue_lead_lag_ms=lead_lag_ms,
            lead_lag_insight=lead_insight,
            reliability_weights=weights,
            disagreement_diagnosis=diag,
            disagreement_category=category
        )

        self.cached_frames[symbol] = frame
        return frame

    def attach_provenance_to_signal(self, signal: Dict[str, Any], symbol: str) -> Dict[str, Any]:
        """
        Embeds source evidence and venue consensus into the signal directive.
        Guarantees: Signal Venue != Execution Venue.
        Fails closed: crossVenueTriangulated is strictly False unless 3 fresh venues exist.
        """
        frame = self.cached_frames.get(symbol)
        if not frame:
            signal["crossVenueTriangulated"] = False
            return signal

        fresh_count = sum(1 for v in [frame.binance, frame.okx, frame.bybit] if not v.stale and v.mark_price > 0)
        if fresh_count < 3:
            signal["crossVenueTriangulated"] = False
            return signal

        signal["venueConsensus"] = {
            "binance": frame.binance.direction_bias,
            "okx": frame.okx.direction_bias,
            "bybit": frame.bybit.direction_bias,
            "agreement": frame.cross_venue_agreement,
            "dispersion": frame.cross_venue_dispersion_bps / 100.0,
            "consensusDirection": frame.consensus_direction,
        }

        signal["marketEvidence"] = {
            "binance": {
                "oiDelta": frame.binance.open_interest_delta,
                "funding": frame.binance.funding_rate,
                "markPrice": frame.binance.mark_price,
                "spreadBps": frame.binance.spread_bps,
            },
            "okx": {
                "oiDelta": frame.okx.open_interest_delta,
                "funding": frame.okx.funding_rate,
                "markPrice": frame.okx.mark_price,
                "spreadBps": frame.okx.spread_bps,
            },
            "bybit": {
                "oiDelta": frame.bybit.open_interest_delta,
                "funding": frame.bybit.funding_rate,
                "markPrice": frame.bybit.mark_price,
                "spreadBps": frame.bybit.spread_bps,
            },
        }

        # Crucial architectural guarantee
        signal["executionVenue"] = "BINANCE"
        signal["crossVenueTriangulated"] = True
        signal["provenance"] = "CROSS_VENUE_MARKET_CORTEX (BINANCE + OKX + BYBIT)"

        return signal
