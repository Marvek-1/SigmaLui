import {
  CrossVenueFrame,
  CrossVenueCortexTelemetry,
  VenueState,
  VenueConsensus,
  MarketEvidence,
  VenueId,
  SuperSignal,
} from '../types';

export const CROSS_VENUE_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'TAO'] as const;
export type CrossVenueSymbol = typeof CROSS_VENUE_SYMBOLS[number];

type DirectionBias = 'LONG' | 'SHORT' | 'NEUTRAL';
type ReliabilityWeights = { binance: number; okx: number; bybit: number };

type LeadLagObservation = {
  symbol: string;
  leadExchange: VenueId;
  lagExchange: VenueId;
  medianLeadLagMs: number;
  historicalPredictiveAccuracy: number;
  sampleSize?: number;
  asOf?: number;
};

type TimedFetch<T = unknown> = {
  ok: boolean;
  data?: T;
  latencyMs: number;
  receivedAt: number;
  error?: string;
};

type VenueHealth = {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  mode: 'MARKET_DATA_AND_EXECUTION' | 'PUBLIC_MARKET_DATA_ONLY';
  latencyMs: number;
};

const MAX_STALE_MS = 10_000;
const PRICE_DISPERSION_DECAY_BPS = 15;
const MIN_LIVE_VENUES_FOR_TRIANGULATION = 3;
const EPS = 1e-12;

/**
 * Neutral priors only.
 *
 * IMPORTANT:
 * These are not "learned" values. Runtime-learned reliability must be injected from
 * a validated holdout/backtest pipeline with sample size and timestamp metadata.
 */
export const VENUE_RELIABILITY_PRIORS: Record<CrossVenueSymbol, ReliabilityWeights> = {
  BTC: { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 },
  ETH: { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 },
  SOL: { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 },
  BNB: { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 },
  TAO: { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 },
};

/**
 * Backward-compatible export. Do not treat these as learned evidence.
 * Prefer setLearnedReliabilityVector() to inject validated values.
 */
export const LEARNED_RELIABILITY_VECTORS = VENUE_RELIABILITY_PRIORS;

const runtimeReliability = new Map<string, ReliabilityWeights>();

export function setLearnedReliabilityVector(
  symbol: string,
  weights: ReliabilityWeights,
  metadata: { sampleSize: number; asOf: number }
): void {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!CROSS_VENUE_SYMBOLS.includes(normalizedSymbol as CrossVenueSymbol)) {
    throw new Error(`Unsupported cross-venue symbol: ${normalizedSymbol}`);
  }
  if (!Number.isFinite(metadata.sampleSize) || metadata.sampleSize < 30) {
    throw new Error('Reliability vector requires at least 30 validated observations');
  }
  if (!Number.isFinite(metadata.asOf) || metadata.asOf <= 0) {
    throw new Error('Reliability vector requires a valid asOf timestamp');
  }
  runtimeReliability.set(normalizedSymbol, normalizeWeights(weights));
}

/**
 * Deliberately empty by default.
 * Lead/lag is a time-series statistic and cannot be inferred from one REST snapshot.
 */
export const HISTORICAL_LEAD_LAG_MEDIANS: LeadLagObservation[] = [];

export function setValidatedLeadLagMedians(entries: LeadLagObservation[]): void {
  HISTORICAL_LEAD_LAG_MEDIANS.splice(
    0,
    HISTORICAL_LEAD_LAG_MEDIANS.length,
    ...entries.filter((entry) =>
      Number.isFinite(entry.medianLeadLagMs) &&
      entry.medianLeadLagMs >= 0 &&
      Number.isFinite(entry.historicalPredictiveAccuracy) &&
      entry.historicalPredictiveAccuracy >= 0 &&
      entry.historicalPredictiveAccuracy <= 1
    )
  );
}

let cachedFrames: Record<string, CrossVenueFrame> = {};
let lastSyncTimestamp = 0;
let isSyncing = false;

let venueHealth: Record<'binance' | 'okx' | 'bybit', VenueHealth> = {
  binance: { status: 'OFFLINE', mode: 'MARKET_DATA_AND_EXECUTION', latencyMs: 0 },
  okx: { status: 'OFFLINE', mode: 'PUBLIC_MARKET_DATA_ONLY', latencyMs: 0 },
  bybit: { status: 'OFFLINE', mode: 'PUBLIC_MARKET_DATA_ONLY', latencyMs: 0 },
};

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace('USDT', '').replace('.P', '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function positiveNumber(value: unknown): number | null {
  const n = finiteNumber(value);
  return n !== null && n > 0 ? n : null;
}

function normalizeWeights(weights: ReliabilityWeights): ReliabilityWeights {
  const b = Math.max(0, finiteNumber(weights.binance) ?? 0);
  const o = Math.max(0, finiteNumber(weights.okx) ?? 0);
  const y = Math.max(0, finiteNumber(weights.bybit) ?? 0);
  const sum = b + o + y;

  if (sum <= EPS) {
    return { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 };
  }

  return {
    binance: b / sum,
    okx: o / sum,
    bybit: y / sum,
  };
}

function reliabilityWeightsFor(symbol: string): ReliabilityWeights {
  const normalized = normalizeSymbol(symbol);
  return normalizeWeights(
    runtimeReliability.get(normalized) ??
      VENUE_RELIABILITY_PRIORS[normalized as CrossVenueSymbol] ??
      { binance: 1 / 3, okx: 1 / 3, bybit: 1 / 3 }
  );
}

function spreadBps(bestBid: number, bestAsk: number): number {
  if (!(bestBid > 0) || !(bestAsk > 0) || bestAsk < bestBid) return Number.POSITIVE_INFINITY;
  const mid = (bestBid + bestAsk) / 2;
  return ((bestAsk - bestBid) / mid) * 10_000;
}

/**
 * L1 book imbalance from best bid/ask quantities.
 * Range [-1, +1]. This is not full-depth order-book imbalance.
 */
function l1BookImbalance(bidQty: number, askQty: number): number {
  const total = bidQty + askQty;
  if (!(bidQty >= 0) || !(askQty >= 0) || total <= EPS) return 0;
  return clamp((bidQty - askQty) / total, -1, 1);
}

function fractionalChange(current: number, previous: number | undefined): number {
  if (!(current > 0) || previous === undefined || !(previous > 0)) return 0;
  return current / previous - 1;
}

function pct24h(last: number, open24h: number | null, nativeFraction: number | null): number {
  if (nativeFraction !== null && Number.isFinite(nativeFraction)) return nativeFraction;
  if (open24h !== null && open24h > 0 && last > 0) return last / open24h - 1;
  return 0;
}

/**
 * Conservative directional label from snapshot data.
 * A venue is directional only when 24h momentum and L1 imbalance do not contradict.
 * This intentionally avoids inventing a microsecond "signal" from a REST ticker.
 */
function deriveDirectionBias(momentum24h: number, imbalance: number): DirectionBias {
  if (momentum24h > 0 && imbalance >= 0) return 'LONG';
  if (momentum24h < 0 && imbalance <= 0) return 'SHORT';
  return 'NEUTRAL';
}

function populationStd(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  const mean = finite.reduce((a, b) => a + b, 0) / finite.length;
  const variance = finite.reduce((acc, x) => acc + (x - mean) ** 2, 0) / finite.length;
  return Math.sqrt(variance);
}

function weightedOrderflowAgreement(
  values: number[],
  weights: number[]
): number {
  let weightedSigned = 0;
  let weightedAbs = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i += 1) {
    const value = clamp(values[i] ?? 0, -1, 1);
    const weight = Math.max(0, weights[i] ?? 0);
    weightedSigned += weight * value;
    weightedAbs += weight * Math.abs(value);
    totalWeight += weight;
  }

  if (totalWeight <= EPS || weightedAbs <= EPS) return 0;
  return clamp(Math.abs(weightedSigned) / weightedAbs, 0, 1);
}

function countFreshVenues(frame: CrossVenueFrame): number {
  return [frame.binance, frame.okx, frame.bybit].filter((v) => !v.stale).length;
}

/**
 * Reliability-weighted directional consensus.
 *
 * Returns:
 * - agreement: directional net agreement in [0,1]
 * - consensusDirection: tradable direction only when one side dominates
 *
 * Neutral venues contribute to coverage but not to directional mass.
 */
function deriveWeightedConsensus(
  venues: VenueState[],
  reliability: ReliabilityWeights
): {
  agreement: number;
  consensusDirection: 'LONG' | 'SHORT' | 'NEUTRAL' | 'DIVERGENT';
  freshReliabilityMass: number;
} {
  const weightsByVenue: Record<VenueId, number> = {
    BINANCE: reliability.binance,
    OKX: reliability.okx,
    BYBIT: reliability.bybit,
  };

  let longWeight = 0;
  let shortWeight = 0;
  let neutralWeight = 0;
  let freshWeight = 0;

  for (const venue of venues) {
    if (venue.stale) continue;
    const w = weightsByVenue[venue.venue] ?? 0;
    freshWeight += w;
    if (venue.directionBias === 'LONG') longWeight += w;
    else if (venue.directionBias === 'SHORT') shortWeight += w;
    else neutralWeight += w;
  }

  if (freshWeight <= EPS) {
    return {
      agreement: 0,
      consensusDirection: 'NEUTRAL',
      freshReliabilityMass: 0,
    };
  }

  const directionalNet = Math.abs(longWeight - shortWeight);
  const agreement = clamp(directionalNet / freshWeight, 0, 1);

  let consensusDirection: 'LONG' | 'SHORT' | 'NEUTRAL' | 'DIVERGENT';
  if (longWeight > shortWeight && longWeight > neutralWeight) {
    consensusDirection = 'LONG';
  } else if (shortWeight > longWeight && shortWeight > neutralWeight) {
    consensusDirection = 'SHORT';
  } else if (longWeight === 0 && shortWeight === 0) {
    consensusDirection = 'NEUTRAL';
  } else {
    consensusDirection = 'DIVERGENT';
  }

  return {
    agreement,
    consensusDirection,
    freshReliabilityMass: clamp(freshWeight, 0, 1),
  };
}

/**
 * Snapshot cross-correlation utility for validated time-series windows.
 *
 * Convention:
 * positive leadLagMs means series A leads series B.
 * This function should be fed synchronized returns, not raw price levels.
 */
export function estimateLeadLagByCrossCorrelation(
  seriesA: number[],
  seriesB: number[],
  stepMs: number,
  maxLagSteps = 20
): { leadLagMs: number; correlation: number } | null {
  if (
    seriesA.length !== seriesB.length ||
    seriesA.length < Math.max(20, maxLagSteps * 2 + 5) ||
    !(stepMs > 0)
  ) {
    return null;
  }

  const pearson = (a: number[], b: number[]): number => {
    if (a.length !== b.length || a.length < 3) return 0;
    const ma = a.reduce((x, y) => x + y, 0) / a.length;
    const mb = b.reduce((x, y) => x + y, 0) / b.length;
    let cov = 0;
    let va = 0;
    let vb = 0;
    for (let i = 0; i < a.length; i += 1) {
      const da = a[i] - ma;
      const db = b[i] - mb;
      cov += da * db;
      va += da * da;
      vb += db * db;
    }
    if (va <= EPS || vb <= EPS) return 0;
    return cov / Math.sqrt(va * vb);
  };

  let bestLag = 0;
  let bestCorrelation = -Infinity;

  for (let lag = -maxLagSteps; lag <= maxLagSteps; lag += 1) {
    const startA = lag > 0 ? 0 : -lag;
    const startB = lag > 0 ? lag : 0;
    const length = seriesA.length - Math.abs(lag);
    if (length < 10) continue;

    const a = seriesA.slice(startA, startA + length);
    const b = seriesB.slice(startB, startB + length);
    const corr = pearson(a, b);

    if (corr > bestCorrelation) {
      bestCorrelation = corr;
      bestLag = lag;
    }
  }

  if (!Number.isFinite(bestCorrelation)) return null;

  return {
    leadLagMs: bestLag * stepMs,
    correlation: clamp(bestCorrelation, -1, 1),
  };
}

export function synthesizeCrossVenueFrame(
  symbol: string,
  binanceState: VenueState,
  okxState: VenueState,
  bybitState: VenueState
): CrossVenueFrame {
  const venues = [binanceState, okxState, bybitState];
  const freshVenues = venues.filter((v) => !v.stale && Number.isFinite(v.markPrice) && v.markPrice > 0);

  const markPrices = freshVenues.map((v) => v.markPrice);
  const avgPrice =
    markPrices.length > 0
      ? markPrices.reduce((a, b) => a + b, 0) / markPrices.length
      : 0;

  const minPrice = markPrices.length > 0 ? Math.min(...markPrices) : 0;
  const maxPrice = markPrices.length > 0 ? Math.max(...markPrices) : 0;
  const priceBasisUsd = markPrices.length >= 2 ? maxPrice - minPrice : 0;
  const dispersionBps =
    markPrices.length >= 2 && avgPrice > 0
      ? Number(((priceBasisUsd / avgPrice) * 10_000).toFixed(4))
      : 0;

  const reliabilityWeights = reliabilityWeightsFor(symbol);
  const consensus = deriveWeightedConsensus(venues, reliabilityWeights);

  const fundingDispersion = populationStd(
    freshVenues.map((v) => v.fundingRate)
  );

  const oiDispersion = populationStd(
    freshVenues.map((v) => v.openInterestDelta)
  );

  const orderflowAgreement = weightedOrderflowAgreement(
    venues.filter((v) => !v.stale).map((v) => v.orderbookImbalance),
    venues
      .filter((v) => !v.stale)
      .map((v) =>
        v.venue === 'BINANCE'
          ? reliabilityWeights.binance
          : v.venue === 'OKX'
            ? reliabilityWeights.okx
            : reliabilityWeights.bybit
      )
  );

  /**
   * Cross-venue evidence may penalize conviction, never inflate it.
   *
   * priceCoherence = exp(-dispersion / tau), tau = 15 bps.
   * This has a clear interpretation: every 15 bps of cross-venue dispersion
   * reduces the coherence term by a factor e^-1.
   */
  const priceCoherence = Math.exp(-dispersionBps / PRICE_DISPERSION_DECAY_BPS);
  const convictionMultiplier = clamp(
    consensus.agreement *
      consensus.freshReliabilityMass *
      priceCoherence,
    0,
    1
  );

  const histLead = HISTORICAL_LEAD_LAG_MEDIANS.find(
    (h) => normalizeSymbol(h.symbol) === normalizeSymbol(symbol)
  );

  const leadVenue: 'BINANCE' | 'OKX' | 'BYBIT' | 'SYNCHRONIZED' =
    histLead?.leadExchange ?? 'SYNCHRONIZED';
  const leadLagMs = histLead?.medianLeadLagMs ?? 0;
  const leadLagInsight = histLead
    ? `${leadVenue} historically leads ${histLead.lagExchange} on ${normalizeSymbol(symbol)} by median ${leadLagMs}ms (validated sample required)`
    : `Lead/lag unavailable for ${normalizeSymbol(symbol)}: snapshot data is insufficient for causal timing inference`;

  let disagreementCategory: CrossVenueFrame['disagreementCategory'] = 'UNANIMOUS_CONVERGENCE';
  let disagreementDiagnosis =
    'Fresh venues are directionally coherent within the current reliability-weighted snapshot.';

  if (freshVenues.length < MIN_LIVE_VENUES_FOR_TRIANGULATION) {
    disagreementCategory = 'REGIONAL_FLOW_DIFFERENTIAL';
    disagreementDiagnosis =
      `Insufficient fresh venues (${freshVenues.length}/3). Cross-venue evidence is degraded and must not be treated as full triangulation.`;
  } else if (dispersionBps > 15) {
    disagreementCategory = 'TRANSIENT_ARBITRAGE';
    disagreementDiagnosis =
      `Cross-venue mark-price dispersion is elevated (${dispersionBps.toFixed(2)} bps). This can reflect transient basis/liquidity divergence; it is not proof of arbitrage.`;
  } else if (orderflowAgreement < 0.35) {
    disagreementCategory = 'REGIONAL_FLOW_DIFFERENTIAL';
    disagreementDiagnosis =
      'Top-of-book imbalance disagrees materially across venues. No spoofing attribution is made from L1 data alone.';
  } else if (
    consensus.consensusDirection === 'DIVERGENT' ||
    consensus.agreement < 0.5
  ) {
    disagreementCategory = 'REGIONAL_FLOW_DIFFERENTIAL';
    disagreementDiagnosis =
      'Reliability-weighted directional evidence is divergent. Downstream execution conviction should be reduced.';
  }

  return {
    symbol: normalizeSymbol(symbol),
    binance: binanceState,
    okx: okxState,
    bybit: bybitState,
    observedAt: Date.now(),
    agreement: Number(consensus.agreement.toFixed(6)),
    dispersionBps,
    priceBasisUsd,
    fundingDispersion,
    oiDispersion,
    orderflowAgreement,
    consensusDirection: consensus.consensusDirection,
    convictionMultiplier,
    leadVenue,
    leadLagMs,
    leadLagInsight,
    reliabilityWeights,
    disagreementDiagnosis,
    disagreementCategory,
  };
}

async function fetchJsonTimed<T>(
  url: string,
  signal: AbortSignal
): Promise<TimedFetch<T>> {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    const receivedAt = Date.now();
    if (!response.ok) {
      return {
        ok: false,
        latencyMs: receivedAt - started,
        receivedAt,
        error: `HTTP ${response.status}`,
      };
    }
    const data = (await response.json()) as T;
    return {
      ok: true,
      data,
      latencyMs: receivedAt - started,
      receivedAt,
    };
  } catch (error) {
    const receivedAt = Date.now();
    return {
      ok: false,
      latencyMs: receivedAt - started,
      receivedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function markHealth(
  fetches: TimedFetch[],
  mode: VenueHealth['mode']
): VenueHealth {
  const successes = fetches.filter((x) => x.ok);
  const latency =
    successes.length > 0
      ? Math.round(
          successes.reduce((sum, x) => sum + x.latencyMs, 0) / successes.length
        )
      : 0;

  const ratio = successes.length / Math.max(1, fetches.length);
  return {
    status: ratio >= 0.95 ? 'ONLINE' : ratio > 0 ? 'DEGRADED' : 'OFFLINE',
    mode,
    latencyMs: latency,
  };
}

function staleCopy(state: VenueState | undefined): VenueState | null {
  if (!state) return null;
  return {
    ...state,
    stale: true,
    directionBias: 'NEUTRAL',
  };
}

function syntheticUnknownState(
  symbol: string,
  venue: VenueId,
  receiveTimestamp: number
): VenueState {
  /**
   * This state is structurally complete for compatibility with the existing VenueState
   * type, but stale=true guarantees it is excluded from consensus mathematics.
   * No production decision may use its numeric zero placeholders.
   */
  return {
    venue,
    venueName:
      venue === 'BINANCE'
        ? 'Binance Futures (USDT-M)'
        : venue === 'OKX'
          ? 'OKX Perpetuals (SWAP)'
          : 'Bybit Linear (Perpetual)',
    symbol,
    contractType: venue === 'OKX' ? 'Linear Swap' : 'USDT-M Perpetual',
    isExecutionVenue: venue === 'BINANCE',
    markPrice: 0,
    indexPrice: 0,
    lastPrice: 0,
    bestBid: 0,
    bestAsk: 0,
    spreadBps: Number.POSITIVE_INFINITY,
    orderbookImbalance: 0,
    openInterest: 0,
    openInterestDelta: 0,
    fundingRate: 0,
    fundingDirection: 'NEUTRAL',
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    volume24hUsd: 0,
    basisBps: 0,
    exchangeTimestamp: 0,
    receiveTimestamp,
    latencyMs: 0,
    stale: true,
    directionBias: 'NEUTRAL',
  };
}

function exchangeAgeIsStale(exchangeTimestamp: number, receiveTimestamp: number): boolean {
  if (!(exchangeTimestamp > 0)) return true;
  const age = receiveTimestamp - exchangeTimestamp;
  return age < -2_000 || age > MAX_STALE_MS;
}

function buildBinanceState(
  symbol: string,
  tick: any,
  premium: any,
  book: any,
  oi: any,
  receiveTimestamp: number,
  latencyMs: number,
  previous?: VenueState
): VenueState | null {
  const mark = positiveNumber(premium?.markPrice);
  const index = positiveNumber(premium?.indexPrice);
  const last = positiveNumber(tick?.lastPrice);
  const bid = positiveNumber(book?.bidPrice);
  const ask = positiveNumber(book?.askPrice);
  const bidQty = finiteNumber(book?.bidQty) ?? 0;
  const askQty = finiteNumber(book?.askQty) ?? 0;

  if (mark === null || index === null || last === null || bid === null || ask === null) {
    return staleCopy(previous);
  }

  const quoteVolume = Math.max(0, finiteNumber(tick?.quoteVolume) ?? 0);
  const oiNative = Math.max(0, finiteNumber(oi?.openInterest) ?? 0);
  const oiUsd = oiNative * mark;
  const funding = finiteNumber(premium?.lastFundingRate) ?? 0;
  const exchangeTimestamp =
    finiteNumber(premium?.time) ??
    finiteNumber(book?.time) ??
    finiteNumber(tick?.closeTime) ??
    0;
  const imbalance = l1BookImbalance(bidQty, askQty);
  const nativeMomentum = (finiteNumber(tick?.priceChangePercent) ?? 0) / 100;

  return {
    venue: 'BINANCE',
    venueName: 'Binance Futures (USDT-M)',
    symbol,
    contractType: 'USDT-M Perpetual',
    isExecutionVenue: true,
    markPrice: mark,
    indexPrice: index,
    lastPrice: last,
    bestBid: bid,
    bestAsk: ask,
    spreadBps: spreadBps(bid, ask),
    orderbookImbalance: imbalance,
    openInterest: oiUsd,
    openInterestDelta: fractionalChange(oiUsd, previous?.openInterest),
    fundingRate: funding,
    fundingDirection: funding > 0 ? 'POSITIVE' : funding < 0 ? 'NEGATIVE' : 'NEUTRAL',
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    volume24hUsd: quoteVolume,
    basisBps: (index > 0 && Number.isFinite(mark) && Number.isFinite(index)) ? ((mark - index) / index) * 10_000 : 0,
    exchangeTimestamp,
    receiveTimestamp,
    latencyMs,
    stale: exchangeAgeIsStale(exchangeTimestamp, receiveTimestamp),
    directionBias: deriveDirectionBias(nativeMomentum, imbalance),
  };
}

function buildOkxState(
  symbol: string,
  tick: any,
  markRow: any,
  fundingRow: any,
  oiRow: any,
  receiveTimestamp: number,
  latencyMs: number,
  previous?: VenueState
): VenueState | null {
  const mark = positiveNumber(markRow?.markPx);
  const last = positiveNumber(tick?.last);
  const bid = positiveNumber(tick?.bidPx);
  const ask = positiveNumber(tick?.askPx);
  const bidQty = Math.max(0, finiteNumber(tick?.bidSz) ?? 0);
  const askQty = Math.max(0, finiteNumber(tick?.askSz) ?? 0);

  if (mark === null || last === null || bid === null || ask === null) {
    return staleCopy(previous);
  }

  const funding = finiteNumber(fundingRow?.fundingRate) ?? 0;
  const oiUsd = Math.max(
    0,
    finiteNumber(oiRow?.oiUsd) ??
      ((finiteNumber(oiRow?.oiCcy) ?? 0) * mark)
  );

  const open24h = positiveNumber(tick?.open24h);
  const momentum = pct24h(last, open24h, null);
  const imbalance = l1BookImbalance(bidQty, askQty);
  const exchangeTimestamp =
    finiteNumber(tick?.ts) ??
    finiteNumber(markRow?.ts) ??
    finiteNumber(oiRow?.ts) ??
    0;

  /**
   * OKX ticker volume units for derivatives are contract/currency dependent.
   * Do not label them USD unless the API explicitly returns a USD notional.
   * Keep 0 here rather than fabricate a conversion without instrument metadata.
   */
  const volume24hUsd = 0;

  return {
    venue: 'OKX',
    venueName: 'OKX Perpetuals (SWAP)',
    symbol,
    contractType: 'Linear Swap',
    isExecutionVenue: false,
    markPrice: mark,
    indexPrice: mark, // Unknown in this REST bundle; basis is not used for scoring.
    lastPrice: last,
    bestBid: bid,
    bestAsk: ask,
    spreadBps: spreadBps(bid, ask),
    orderbookImbalance: imbalance,
    openInterest: oiUsd,
    openInterestDelta: fractionalChange(oiUsd, previous?.openInterest),
    fundingRate: funding,
    fundingDirection: funding > 0 ? 'POSITIVE' : funding < 0 ? 'NEGATIVE' : 'NEUTRAL',
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    volume24hUsd,
    basisBps: 0,
    exchangeTimestamp,
    receiveTimestamp,
    latencyMs,
    stale: exchangeAgeIsStale(exchangeTimestamp, receiveTimestamp),
    directionBias: deriveDirectionBias(momentum, imbalance),
  };
}

function buildBybitState(
  symbol: string,
  tick: any,
  responseTimestamp: number,
  receiveTimestamp: number,
  latencyMs: number,
  previous?: VenueState
): VenueState | null {
  const mark = positiveNumber(tick?.markPrice);
  const index = positiveNumber(tick?.indexPrice);
  const last = positiveNumber(tick?.lastPrice);
  const bid = positiveNumber(tick?.bid1Price);
  const ask = positiveNumber(tick?.ask1Price);
  const bidQty = Math.max(0, finiteNumber(tick?.bid1Size) ?? 0);
  const askQty = Math.max(0, finiteNumber(tick?.ask1Size) ?? 0);

  if (mark === null || index === null || last === null || bid === null || ask === null) {
    return staleCopy(previous);
  }

  const funding = finiteNumber(tick?.fundingRate) ?? 0;
  const oiUsd = Math.max(0, finiteNumber(tick?.openInterestValue) ?? 0);
  const turnover24h = Math.max(0, finiteNumber(tick?.turnover24h) ?? 0);
  const momentum = pct24h(last, null, finiteNumber(tick?.price24hPcnt));
  const imbalance = l1BookImbalance(bidQty, askQty);

  return {
    venue: 'BYBIT',
    venueName: 'Bybit Linear (Perpetual)',
    symbol,
    contractType: 'Linear Perpetual',
    isExecutionVenue: false,
    markPrice: mark,
    indexPrice: index,
    lastPrice: last,
    bestBid: bid,
    bestAsk: ask,
    spreadBps: spreadBps(bid, ask),
    orderbookImbalance: imbalance,
    openInterest: oiUsd,
    openInterestDelta: fractionalChange(oiUsd, previous?.openInterest),
    fundingRate: funding,
    fundingDirection: funding > 0 ? 'POSITIVE' : funding < 0 ? 'NEGATIVE' : 'NEUTRAL',
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    volume24hUsd: turnover24h,
    basisBps: (index > 0 && Number.isFinite(mark) && Number.isFinite(index)) ? ((mark - index) / index) * 10_000 : 0,
    exchangeTimestamp: responseTimestamp,
    receiveTimestamp,
    latencyMs,
    stale: exchangeAgeIsStale(responseTimestamp, receiveTimestamp),
    directionBias: deriveDirectionBias(momentum, imbalance),
  };
}

/**
 * Fetch real public derivatives snapshots from Binance, OKX, and Bybit.
 *
 * This is REST snapshot synchronization, not a WebSocket/tick-stream implementation.
 * A true lead/lag engine should run on synchronized WebSocket return series.
 */
export async function syncLiveCrossVenueMarket(): Promise<Record<string, CrossVenueFrame>> {
  if (isSyncing) return cachedFrames;
  isSyncing = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_500);

  try {
    const binanceTickP = fetchJsonTimed<any[]>(
      'https://fapi.binance.com/fapi/v1/ticker/24hr',
      controller.signal
    );
    const binancePremiumP = fetchJsonTimed<any[]>(
      'https://fapi.binance.com/fapi/v1/premiumIndex',
      controller.signal
    );
    const binanceBookP = fetchJsonTimed<any[]>(
      'https://fapi.binance.com/fapi/v1/ticker/bookTicker',
      controller.signal
    );

    const okxTickP = fetchJsonTimed<any>(
      'https://www.okx.com/api/v5/market/tickers?instType=SWAP',
      controller.signal
    );
    const okxMarkP = fetchJsonTimed<any>(
      'https://www.okx.com/api/v5/public/mark-price?instType=SWAP',
      controller.signal
    );
    const okxOiP = fetchJsonTimed<any>(
      'https://www.okx.com/api/v5/public/open-interest?instType=SWAP',
      controller.signal
    );

    const bybitTickP = fetchJsonTimed<any>(
      'https://api.bybit.com/v5/market/tickers?category=linear',
      controller.signal
    );

    const binanceOiP = Promise.all(
      CROSS_VENUE_SYMBOLS.map((sym) =>
        fetchJsonTimed<any>(
          `https://fapi.binance.com/fapi/v1/openInterest?symbol=${sym}USDT`,
          controller.signal
        )
      )
    );

    const okxFundingP = Promise.all(
      CROSS_VENUE_SYMBOLS.map((sym) =>
        fetchJsonTimed<any>(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${sym}-USDT-SWAP`,
          controller.signal
        )
      )
    );

    const [
      binanceTick,
      binancePremium,
      binanceBook,
      okxTick,
      okxMark,
      okxOi,
      bybitTick,
      binanceOi,
      okxFunding,
    ] = await Promise.all([
      binanceTickP,
      binancePremiumP,
      binanceBookP,
      okxTickP,
      okxMarkP,
      okxOiP,
      bybitTickP,
      binanceOiP,
      okxFundingP,
    ]);

    const binanceFetches: TimedFetch[] = [
      binanceTick,
      binancePremium,
      binanceBook,
      ...binanceOi,
    ];
    const okxFetches: TimedFetch[] = [okxTick, okxMark, okxOi, ...okxFunding];
    const bybitFetches: TimedFetch[] = [bybitTick];

    venueHealth = {
      binance: markHealth(binanceFetches, 'MARKET_DATA_AND_EXECUTION'),
      okx: markHealth(okxFetches, 'PUBLIC_MARKET_DATA_ONLY'),
      bybit: markHealth(bybitFetches, 'PUBLIC_MARKET_DATA_ONLY'),
    };

    const bTickMap = new Map(
      (binanceTick.ok && Array.isArray(binanceTick.data) ? binanceTick.data : [])
        .map((t: any) => [t.symbol, t])
    );
    const bPremMap = new Map(
      (binancePremium.ok && Array.isArray(binancePremium.data) ? binancePremium.data : [])
        .map((p: any) => [p.symbol, p])
    );
    const bBookMap = new Map(
      (binanceBook.ok && Array.isArray(binanceBook.data) ? binanceBook.data : [])
        .map((b: any) => [b.symbol, b])
    );
    const bOiMap = new Map(
      binanceOi
        .filter((x) => x.ok && x.data)
        .map((x) => [(x.data as any).symbol, x.data])
    );

    const okxTickRows =
      okxTick.ok && Array.isArray((okxTick.data as any)?.data)
        ? (okxTick.data as any).data
        : [];
    const okxMarkRows =
      okxMark.ok && Array.isArray((okxMark.data as any)?.data)
        ? (okxMark.data as any).data
        : [];
    const okxOiRows =
      okxOi.ok && Array.isArray((okxOi.data as any)?.data)
        ? (okxOi.data as any).data
        : [];

    const okxTickMap = new Map(okxTickRows.map((t: any) => [t.instId, t]));
    const okxMarkMap = new Map(okxMarkRows.map((t: any) => [t.instId, t]));
    const okxOiMap = new Map(okxOiRows.map((t: any) => [t.instId, t]));
    const okxFundingMap = new Map(
      okxFunding
        .filter((x) => x.ok && Array.isArray((x.data as any)?.data))
        .flatMap((x) => (x.data as any).data)
        .map((row: any) => [row.instId, row])
    );

    const bybitRows =
      bybitTick.ok && Array.isArray((bybitTick.data as any)?.result?.list)
        ? (bybitTick.data as any).result.list
        : [];
    const bybitMap = new Map(bybitRows.map((t: any) => [t.symbol, t]));
    const bybitResponseTs =
      finiteNumber((bybitTick.data as any)?.time) ??
      bybitTick.receivedAt;

    const now = Date.now();
    const nextFrames: Record<string, CrossVenueFrame> = {};

    for (const sym of CROSS_VENUE_SYMBOLS) {
      const previous = cachedFrames[sym];
      const bSymbol = `${sym}USDT`;
      const oSymbol = `${sym}-USDT-SWAP`;

      const binanceState =
        buildBinanceState(
          sym,
          bTickMap.get(bSymbol),
          bPremMap.get(bSymbol),
          bBookMap.get(bSymbol),
          bOiMap.get(bSymbol),
          binanceTick.receivedAt,
          venueHealth.binance.latencyMs,
          previous?.binance
        ) ??
        syntheticUnknownState(sym, 'BINANCE', now);

      const okxState =
        buildOkxState(
          sym,
          okxTickMap.get(oSymbol),
          okxMarkMap.get(oSymbol),
          okxFundingMap.get(oSymbol),
          okxOiMap.get(oSymbol),
          okxTick.receivedAt,
          venueHealth.okx.latencyMs,
          previous?.okx
        ) ??
        syntheticUnknownState(sym, 'OKX', now);

      const bybitState =
        buildBybitState(
          sym,
          bybitMap.get(bSymbol),
          bybitResponseTs,
          bybitTick.receivedAt,
          venueHealth.bybit.latencyMs,
          previous?.bybit
        ) ??
        syntheticUnknownState(sym, 'BYBIT', now);

      nextFrames[sym] = synthesizeCrossVenueFrame(
        sym,
        binanceState,
        okxState,
        bybitState
      );
    }

    cachedFrames = nextFrames;
    lastSyncTimestamp = now;
    return cachedFrames;
  } catch (error) {
    console.warn(
      '[CrossVenueCortex] sync failed closed:',
      error instanceof Error ? error.message : String(error)
    );

    /**
     * Preserve prior frames only as stale evidence.
     * Never manufacture live consensus when a sync fails.
     */
    const now = Date.now();
    cachedFrames = Object.fromEntries(
      Object.entries(cachedFrames).map(([symbol, frame]) => [
        symbol,
        synthesizeCrossVenueFrame(
          symbol,
          staleCopy(frame.binance) ?? syntheticUnknownState(symbol, 'BINANCE', now),
          staleCopy(frame.okx) ?? syntheticUnknownState(symbol, 'OKX', now),
          staleCopy(frame.bybit) ?? syntheticUnknownState(symbol, 'BYBIT', now)
        ),
      ])
    );

    venueHealth = {
      binance: { ...venueHealth.binance, status: 'OFFLINE' },
      okx: { ...venueHealth.okx, status: 'OFFLINE' },
      bybit: { ...venueHealth.bybit, status: 'OFFLINE' },
    };

    return cachedFrames;
  } finally {
    clearTimeout(timeoutId);
    isSyncing = false;
  }
}

export function getCrossVenueFrames(): Record<string, CrossVenueFrame> {
  return cachedFrames;
}

export function getCrossVenueFrame(symbol: string): CrossVenueFrame | undefined {
  return cachedFrames[normalizeSymbol(symbol)];
}

export function augmentSignalWithCrossVenueEvidence(signal: SuperSignal): SuperSignal {
  const assetSym = normalizeSymbol(signal.asset);
  const frame = getCrossVenueFrame(assetSym);

  /**
   * Full triangulation means three fresh, independent venue observations.
   * Never fall back to BTC evidence for an unknown symbol.
   */
  if (!frame || countFreshVenues(frame) < MIN_LIVE_VENUES_FOR_TRIANGULATION) {
    return {
      ...signal,
      crossVenueTriangulated: false,
    };
  }

  const consensusDirection =
    frame.consensusDirection === 'LONG' || frame.consensusDirection === 'SHORT'
      ? frame.consensusDirection
      : 'NEUTRAL';

  const venueConsensus: VenueConsensus = {
    binance: frame.binance.directionBias,
    okx: frame.okx.directionBias,
    bybit: frame.bybit.directionBias,
    agreement: frame.agreement,
    /**
     * VenueConsensus.dispersion is preserved as percentage points for compatibility:
     * 15 bps -> 0.15%. CrossVenueFrame.dispersionBps remains the canonical bps field.
     */
    dispersion: frame.dispersionBps / 100,
    consensusDirection,
  };

  const marketEvidence: MarketEvidence = {
    binance: {
      oiDelta: frame.binance.openInterestDelta,
      funding: frame.binance.fundingRate,
      markPrice: frame.binance.markPrice,
      spreadBps: frame.binance.spreadBps,
      orderbookImbalance: frame.binance.orderbookImbalance,
    },
    okx: {
      oiDelta: frame.okx.openInterestDelta,
      funding: frame.okx.fundingRate,
      markPrice: frame.okx.markPrice,
      spreadBps: frame.okx.spreadBps,
      orderbookImbalance: frame.okx.orderbookImbalance,
    },
    bybit: {
      oiDelta: frame.bybit.openInterestDelta,
      funding: frame.bybit.fundingRate,
      markPrice: frame.bybit.markPrice,
      spreadBps: frame.bybit.spreadBps,
      orderbookImbalance: frame.bybit.orderbookImbalance,
    },
  };

  return {
    ...signal,
    venueConsensus,
    marketEvidence,
    executionVenue: 'BINANCE',
    crossVenueTriangulated: true,
  };
}

export function getCrossVenueTelemetry(): CrossVenueCortexTelemetry {
  const frames = Object.values(cachedFrames);
  const freshFrames = frames.filter(
    (frame) => countFreshVenues(frame) === MIN_LIVE_VENUES_FOR_TRIANGULATION
  );

  const overallConsensusRatio =
    freshFrames.length > 0
      ? Number(
          (
            freshFrames.reduce((sum, frame) => sum + frame.agreement, 0) /
            freshFrames.length
          ).toFixed(4)
        )
      : 0;

  const averageDispersionBps =
    freshFrames.length > 0
      ? Number(
          (
            freshFrames.reduce((sum, frame) => sum + frame.dispersionBps, 0) /
            freshFrames.length
          ).toFixed(4)
        )
      : 0;

  return {
    isLiveSynced:
      lastSyncTimestamp > 0 &&
      Date.now() - lastSyncTimestamp <= MAX_STALE_MS &&
      freshFrames.length > 0,
    lastSyncTimestamp,
    activeFramesCount: freshFrames.length,
    overallConsensusRatio,
    averageDispersionBps,
    leadLagObservatory: HISTORICAL_LEAD_LAG_MEDIANS,
    venueStatus: venueHealth,
  } as CrossVenueCortexTelemetry;
}

/**
 * Explicit test-only synthetic scenario injector.
 * Production must fail closed if this is accidentally called.
 */
export function injectDisagreementScenario(
  symbol: string,
  scenario:
    | 'BYBIT_LEAD_LONG'
    | 'BINANCE_LOCAL_SPOOF'
    | 'UNANIMOUS_CONVERGENCE'
    | 'FUNDING_ARBITRAGE'
): CrossVenueFrame {
  const isProduction =
    (globalThis as any)?.process?.env?.NODE_ENV === 'production';

  if (isProduction) {
    throw new Error('Synthetic cross-venue scenarios are forbidden in production');
  }

  const sym = normalizeSymbol(symbol);
  const now = Date.now();

  const makeSynthetic = (
    venue: VenueId,
    price: number,
    funding: number,
    imbalance: number,
    directionBias: DirectionBias
  ): VenueState => ({
    venue,
    venueName:
      venue === 'BINANCE'
        ? 'Binance Futures (USDT-M)'
        : venue === 'OKX'
          ? 'OKX Perpetuals (SWAP)'
          : 'Bybit Linear (Perpetual)',
    symbol: sym,
    contractType: venue === 'OKX' ? 'Linear Swap' : 'USDT-M Perpetual',
    isExecutionVenue: venue === 'BINANCE',
    markPrice: price,
    indexPrice: price,
    lastPrice: price,
    bestBid: price * 0.99995,
    bestAsk: price * 1.00005,
    spreadBps: 1,
    orderbookImbalance: imbalance,
    openInterest: 1_000_000,
    openInterestDelta: 0,
    fundingRate: funding,
    fundingDirection: funding > 0 ? 'POSITIVE' : funding < 0 ? 'NEGATIVE' : 'NEUTRAL',
    aggressiveBuyVolume: 0,
    aggressiveSellVolume: 0,
    volume24hUsd: 0,
    basisBps: 0,
    exchangeTimestamp: now,
    receiveTimestamp: now,
    latencyMs: 0,
    stale: false,
    directionBias,
  });

  const anchor = 100;
  let binance = makeSynthetic('BINANCE', anchor, 0.00008, 0.15, 'LONG');
  let okx = makeSynthetic('OKX', anchor, 0.00008, 0.15, 'LONG');
  let bybit = makeSynthetic('BYBIT', anchor, 0.00008, 0.15, 'LONG');

  if (scenario === 'BYBIT_LEAD_LONG') {
    bybit = makeSynthetic('BYBIT', 100.4, 0.00008, 0.65, 'LONG');
    binance = makeSynthetic('BINANCE', 100.0, 0.00008, 0.05, 'NEUTRAL');
    okx = makeSynthetic('OKX', 100.15, 0.00008, 0.25, 'LONG');
  } else if (scenario === 'BINANCE_LOCAL_SPOOF') {
    /**
     * Name kept for UI compatibility only.
     * The engine does not infer spoofing from L1 imbalance.
     */
    binance = makeSynthetic('BINANCE', 100, 0.00008, -0.75, 'SHORT');
    okx = makeSynthetic('OKX', 100, 0.00008, 0.35, 'LONG');
    bybit = makeSynthetic('BYBIT', 100, 0.00008, 0.42, 'LONG');
  } else if (scenario === 'FUNDING_ARBITRAGE') {
    binance.fundingRate = 0.00035;
    bybit.fundingRate = 0.00004;
    okx.fundingRate = 0.00008;
  }

  const synthesized = synthesizeCrossVenueFrame(sym, binance, okx, bybit);
  cachedFrames[sym] = synthesized;
  return synthesized;
}
