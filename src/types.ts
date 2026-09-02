export type MarketState = 'TRENDING_BULL' | 'TRENDING_BEAR' | 'MEAN_REVERTING' | 'HIGH_VOLATILITY' | 'CONFUSED_CONFLICT';

export type HMMRegime = 'TRENDING_BULL' | 'TRENDING_BEAR' | 'RANGE' | 'CHOPPY' | 'TRANSITIONAL';

export type Timeframe = '5m' | '1h' | '4h';

export interface ApiSource {
  id: string;
  name: string;
  category: 'Technicals' | 'On-Chain & Whale' | 'Social & Sentiment' | 'Orderflow & Liquidity' | 'Macro & DeFi';
  endpoint: string;
  latencyMs: number;
  status: 'ONLINE' | 'DEGRADED' | 'RATE_LIMITED';
  currentValue: number;
  unit: string;
  reliabilityScore: number; // 0 to 1
  graScore: number; // Grey Relational Grade
  currentWeight: number; // N-AHP weight
  penaltyCount: number;
  lastUpdated: string;
  dataAgeSeconds?: number; // For TCNS temporal decay
  signalDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface CriteriaItem {
  id: string;
  name: string;
  weight: number;
  value: number; // Normalized [0, 1]
  isBenefit: boolean; // Benefit vs Cost criterion
}

export interface GreyModelResult {
  a: number; // Development coefficient
  b: number; // Grey action quantity (u)
  agoSequence: number[]; // Accumulated Generating Operation
  predictedSequence: number[]; // Fitted historical values
  residuals: number[]; // Absolute relative errors
  meanRelativeError: number; // MRPE (Noise)
  isStable: boolean; // MRPE <= threshold (e.g. 0.02 or 0.05)
  lookaheadForecast: [number, number, number]; // Next 3 intervals (t+1, t+2, t+3)
  momentumDelta: number; // Forecast momentum (% change over 3 steps)
  formulaStr: string;
}

export interface NeutrosophicTriple {
  T: number; // Truth membership [0, 1]
  I: number; // Indeterminacy membership [0, 1]
  F: number; // Falsity membership [0, 1]
  score: number; // Deneutrosophicated score S(x) = (2 + T - I - F)/3
}

export interface TcnsDecayedTriple extends NeutrosophicTriple {
  originalT: number;
  originalI: number;
  originalF: number;
  dataAgeMinutes: number;
  decayPenalty: number;
  isStale: boolean;
}

export interface NeutrosophicMatrixRow {
  criterionId: string;
  criterionName: string;
  category: string;
  T: number;
  I: number;
  F: number;
  calculatedWeight: number;
  deneutrosophicatedScore: number;
  conflictContribution: number;
  sineAggregatedScore?: number;
  dataAgeSeconds?: number;
}

export interface TopsisCalculation {
  idealSolutionOffset: number; // Penalty multiplier based on Indeterminacy
  dPlus: number; // Distance to Positive Ideal Solution
  dMinus: number; // Distance to Negative Ideal Solution
  closenessCoefficient: number; // Ci = D- / (D+ + D-)
  passed95Threshold: boolean; // Ci > 0.95 and I < 0.15
  criteriaContributions: { [criterionId: string]: number };
  distanceMetricUsed?: 'HAUSDORFF' | 'EUCLIDEAN';
  maxOutlierDivergence?: number;
}

export interface LiquidityLevel {
  price: number;
  volumeUsd: number;
  type: 'BID_WALL' | 'ASK_WALL' | 'LIQUIDATION_POOL';
  distancePct: number;
}

export interface LiquidityHeatmapAnalysis {
  closestOverheadWallDistancePct: number;
  closestSupportWallDistancePct: number;
  hasClearPathToUpside: boolean; // Wall > 0.8% away
  liquidityScore: number; // 0 to 1
  levels: LiquidityLevel[];
}

export interface FractalConfluence {
  tf5m: { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
  tf1h: { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
  tf4h: { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
  isConfluent: boolean; // Ci > 0.95 across all 3
  confluenceScore: number; // 0 to 1
}

// 9 Quantitative Artifacts Interface Definitions

export interface AgentAlphaArtifacts {
  stSvnwa: {
    enabled: boolean;
    harmonicSineScore: number;
    cyclicSymmetryPreserved: boolean;
    description: string;
  };
  tcns: {
    enabled: boolean;
    maxDataAgeSeconds: number;
    decayedTruth: number;
    inflatedIndeterminacy: number;
    staleFeedsCount: number;
  };
  hausdorffTopsis: {
    enabled: boolean;
    hausdorffCi: number;
    euclideanCi: number;
    maxOutlierPenalized: boolean;
    outlierAnomalyApi: string | null;
  };
}

export interface AgentBetaArtifacts {
  wassersteinHmm: {
    currentRegime: HMMRegime;
    wassersteinDistanceToTrending: number; // <0.15 is ideal
    regimeProbabilities: { [key in HMMRegime]: number };
    isChurnAllowed: boolean; // True ONLY in TRENDING
  };
  bitquerySmartMoney: {
    uniqueWhaleWalletsAccumulating: number; // >$1M balance
    filteredWashVolumeUsd: number; // 80% filtered out
    entityNetInflowUsd: number;
    isHighConvictionInflow: boolean;
  };
  zerionDeFi: {
    stablecoinPoolExitVolumeUsd: number;
    yieldFarmerDipBuyReadinessPct: number; // e.g. 96%
    activeProtocolsMonitored: number;
    isDipPreparationActive: boolean;
  };
}

export interface AgentGammaArtifacts {
  coherentRiskExpectedShortfall: {
    es95DxyPct: number;
    es95TreasuryYieldPct: number;
    macroContagionAlert: boolean; // True if ES > 1.8%
    isBuySuppressed: boolean;
  };
  deepSeekR1Sentiment: {
    speakerIndeterminacyScore: number; // 0 (genuine) to 1 (shill)
    linguisticComplexity: number;
    convictionIndex: number;
    isExitLiquidityBait: boolean;
  };
  kaikoLiquidityVacuum: {
    depthHalfPercentRatio: number; // Sell Wall / Buy Wall
    isVacuumKillSwitchTriggered: boolean; // Triggered if ratio > 5:1
    bidVolumeDepthUsd: number;
    askVolumeDepthUsd: number;
  };
}

export interface QuantitativeArtifactsSnapshot {
  alpha: AgentAlphaArtifacts;
  beta: AgentBetaArtifacts;
  gamma: AgentGammaArtifacts;
}

export interface SuperSignal {
  id: string;
  asset: string;
  futuresPair?: string; // e.g. 'BTCUSDT.P'
  sector?: FuturesSector;
  fundingRate?: number;
  openInterestUsd?: number;
  maxLeverage?: number;
  timestamp: string;
  action: 'STRONG_BUY' | 'STRONG_SELL';
  timeframe: 'FRACTAL_CONFLUENT (5m+1h+4h)';
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  riskRewardRatio: number;
  topsisScore: number; // e.g. 0.964
  indeterminacy: number; // e.g. 0.08
  greyResidualError: number; // e.g. 0.014
  liquidityClearancePct: number;
  fractalScore: number;
  status: 'ACTIVE' | 'TARGET_1_HIT' | 'TARGET_2_HIT' | 'STOPPED_OUT' | 'SHADOW_VERIFIED';
  pnlPct: number;
  explanation: string;
  artifactsUsed?: {
    hausdorffUsed: boolean;
    wassersteinRegime: HMMRegime;
    bitquerySmartMoneyNet: number;
    zerionDeFiExits: number;
    expectedShortfallPass: boolean;
    kaikoVacuumSafe: boolean;
  };
  diagnostics: {
    apisUsed: number;
    bullishApis: number;
    bearishApis: number;
    neutralApis: number;
    marketState: MarketState;
  };
}

export interface SilentDiscardLog {
  id: string;
  timestamp: string;
  asset: string;
  gateFailed:
    | 'GATE_1_GREY_NOISE'
    | 'GATE_2_CONFUSED_INDETERMINACY'
    | 'GATE_3_TOPSIS_BELOW_95'
    | 'GATE_4_FRACTAL_MISMATCH'
    | 'GATE_5_LIQUIDITY_WALL_BLOCK'
    | 'ARTIFACT_WASSERSTEIN_REGIME_LOCK'
    | 'ARTIFACT_EXPECTED_SHORTFALL_MACRO_SPIKE'
    | 'ARTIFACT_KAIKO_LIQUIDITY_VACUUM_KILL';
  reason: string;
  metrics: {
    greyError?: number;
    indeterminacy?: number;
    topsisScore?: number;
    wallDistancePct?: number;
    fractalMisalignedTf?: string;
    wassersteinDistance?: number;
    expectedShortfall?: number;
    vacuumRatio?: number;
  };
}

export interface GraVerificationRecord {
  id: string;
  signalId: string;
  timestamp: string;
  asset: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING';
  actualPriceDeltaPct: number;
  apiEvaluations: {
    apiId: string;
    apiName: string;
    greyRelationalGrade: number; // gamma_0i
    wasFalseTruth: boolean;
    weightAdjustment: number; // e.g. -0.05
  }[];
  resolutionCoefficientRho: number;
}

export type FuturesSector =
  | 'Mega Cap'
  | 'Layer 1/2'
  | 'AI & Compute'
  | 'DeFi & RWA'
  | 'Meme & Momentum'
  | 'Infrastructure & DePIN'
  | 'Custom';

export interface CryptoFuturesPair {
  symbol: string; // e.g. 'BTC' or 'BTCUSDT'
  pair: string; // e.g. 'BTCUSDT.P'
  name: string; // 'Bitcoin Perpetual'
  sector: FuturesSector;
  markPrice: number;
  indexPrice: number;
  basisBps: number; // (Mark - Index) / Index * 10000 (basis points)
  priceChange24h: number;
  fundingRate: number; // e.g. 0.0001 = +0.01%
  predictedFundingRate: number;
  nextFundingCountdown: string; // '02:45:12'
  openInterestUsd: number;
  oiChange24hPct: number;
  volume24hUsd: number;
  longShortRatio: number; // Accounts L/S
  topTraderRatio: number; // Top positions L/S
  liquidations24h: {
    longUsd: number;
    shortUsd: number;
  };
  maxLeverage: number; // e.g. 125, 100, 50, 20
  volatility24hPct: number;
  monitoredInChurner: boolean;
  contractType: 'PERPETUAL' | 'DELIVERY';
  priceHistory: number[];
  rsiHistory: number[];
  volumeHistory: number[];
  whaleFlowHistory: number[];
  socialHistory: number[];
  marketState: MarketState;
}

export interface AssetDataFeed extends CryptoFuturesPair {}

export interface PipelineStats {
  totalProcessedTicks: number;
  signalsEmitted: number;
  signalsShadowed: number;
  successfulSignals: number;
  failedSignals: number;
  successRatePct: number; // Target >= 95%
  discardedNoiseCount: number;
  currentIndeterminacy: number;
  avgLatencyMs: number;
  redisMemoryKb: number;
  resolutionRho: number;
  activeGate1Threshold?: number; // e.g. 0.02 (2%) or 0.01 (1%)
  monitoredFuturesPairsCount?: number;
}
