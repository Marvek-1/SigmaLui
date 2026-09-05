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

export type SignalAction = 'STRONG_BUY' | 'BUY' | 'STRONG_SELL' | 'SELL' | 'NO_TRADE';
export type OrderSide = 'BUY' | 'SELL' | 'NO_TRADE';
export type PositionSide = 'LONG' | 'SHORT' | 'FLAT';
export type SignalTier = 'APEX_SOVEREIGN' | 'HIGH_CONFLUENCE' | 'ALPHA_PRIME' | 'NO_TRADE';

export interface CrossVenueEvidenceSummary {
  quorum: '3/3' | '2/3' | '1/3' | '0/3';
  dispersionPct: number;
  basisPct: number;
  fundingDivergence: number;
  orderbookImbalance: {
    binance: number;
    okx: number;
    bybit: number;
  };
}

export interface NeutrosophicTrace {
  T: number;
  I: number;
  F: number;
  accuracy: number;
  score: number;
}

export interface GreyTrace {
  a: number;
  b: number;
  mrpe: number;
  forecast: number[];
}

export interface TopsisTrace {
  dPlus: number;
  dMinus: number;
  closeness: number;
  idealVersion: string;
}

export interface FractalTrace {
  '5m': { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
  '1h': { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
  '4h': { ci: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; greyError: number };
}

export interface HardGatesTrace {
  dataFreshness: boolean;
  venueIntegrity: boolean;
  basis: boolean;
  fractal: boolean;
  wassersteinRegime: boolean;
  expectedShortfall: boolean;
  kaikoVacuum: boolean;
}

export interface DecisionTrace {
  decisionId: string;
  modelVersion: string;
  selectedAction: 'LONG' | 'SHORT' | 'NO_TRADE';
  tier: SignalTier;
  decisionScore: number;
  idealCloseness: number;
  crossVenue: CrossVenueEvidenceSummary;
  neutrosophic: NeutrosophicTrace;
  grey: GreyTrace;
  topsis: TopsisTrace;
  fractal: FractalTrace;
  hardGates: HardGatesTrace;
  executionEligible: boolean;
}

export interface RiskApproval {
  approved: boolean;
  conviction?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  directive?: 'EXECUTE' | 'REFUSE' | 'HOLD';
  allocationPct?: number;
  leverage?: number;
  gateReasons?: string[];
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
  action: SignalAction;
  riskApproval?: RiskApproval;
  timeframe: 'FRACTAL_CONFLUENT (5m+1h+4h)';
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  riskRewardRatio: number;
  topsisScore: number; // e.g. 0.964
  tier?: SignalTier;
  decisionScore?: number;
  idealCloseness?: number;
  decisionTrace?: DecisionTrace;
  indeterminacy: number; // e.g. 0.08
  greyResidualError: number; // e.g. 0.014
  liquidityClearancePct: number;
  fractalScore: number;
  status: 'ACTIVE' | 'TARGET_1_HIT' | 'TARGET_2_HIT' | 'STOPPED_OUT' | 'SHADOW_VERIFIED';
  pnlPct: number;
  explanation: string;
  // Cross-Venue Triangulation & Provenance Evidence
  venueConsensus?: VenueConsensus;
  marketEvidence?: MarketEvidence;
  executionVenue?: 'BINANCE';
  crossVenueTriangulated?: boolean;
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

export interface DailyAccuracy {
  date: string;
  wins: number;
  losses: number;
  winRate: number;                     // 0–100 derived from wins & losses
  lossRate: number;                    // 0–100 derived from wins & losses
  predictionConfidence: number | null; // 0–100 calibrated model probability, null if uncalibrated/missing
  resolvedSignals: number;             // sample size n = wins + losses
}

export interface CalibrationMetrics {
  meanPredictedProbability: number | null;
  empiricalWinRate: number | null;
  brierScore: number | null;
  expectedCalibrationError: number | null;
  calibrationSampleSize: number;
  calibrationWindow: string;
  wilsonIntervalLowerPct: number;
  wilsonIntervalUpperPct: number;
  calibrationStatus: 'INSUFFICIENT_SAMPLE' | 'CALIBRATED' | 'OVERCONFIDENT' | 'UNDERCONFIDENT';
}

// ---------------------------------------------------------
// SOUL GIVER: Autonomous Trading Adapter & Collective Learning Mesh
// ---------------------------------------------------------

export type SoulNodeType =
  | 'EXCHANGE_BOT'
  | 'TRADINGVIEW_WEBHOOK'
  | 'PYTHON_AGENT'
  | 'TELEGRAM_DISPATCH'
  | 'CCXT_RUNNER'
  | 'CUSTOM_SOCKET';

export interface NodeMeshItem {
  id: string;
  nodeIdentity: string; // e.g. 'TradingView_User_A', 'Python_Script_B'
  nodeType: SoulNodeType;
  activeStatus: 'TRADE_OPEN' | 'IDLE' | 'FLAGGED_DRIFT' | 'DISCONNECTED';
  openTrade?: {
    asset: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    currentPrice: number;
    unrealizedPnlPct: number;
    startedAt: string;
  };
  signalPrecisionPct: number; // e.g. 95.0%
  realizedPrecisionPct: number; // e.g. 92.4%
  precisionDeltaPct: number; // e.g. -2.6%
  slippagePct: number; // e.g. 0.0018 (0.18%)
  entryLagPct: number; // e.g. 0.12%
  hasDriftAlert: boolean; // True if slippage > 0.008 or entryLagPct > 0.20%
  driftReason?: string;
  reputationScore: number; // 0 to 100
  reputationRank: 'RANK_1_ALPHA_MASTER' | 'RANK_2_TIER_1_ELITE' | 'RANK_3_STABLE_RUNNER' | 'RANK_WARNING_AUDIT';
  totalTrades: number;
  totalPnlUsd: number;
  lastOutcomeTimestamp: string;
  apiKeyPrefix: string;
}

export interface NodeApiKey {
  id: string;
  key: string;
  nodeIdentity: string;
  tier: 'ALL_SIGNALS' | 'PREMIUM_95' | 'ULTRA_98';
  createdAt: string;
  expiresAt: string;
  rateLimitPerMin: number;
  isActive: boolean;
  totalCalls: number;
}

// ---------------------------------------------------------
// PERFECT FORESIGHT BENCHMARK & STRATEGY AUDIT
// ---------------------------------------------------------

export interface ForesightSignalAuditItem {
  signalId: string;
  asset: string;
  futuresPair: string;
  direction: 'LONG' | 'SHORT';
  timestamp: string;
  ciConfidence: number; // e.g. 0.97
  entryPrice: number;
  tp1Price: number; // Target 1 (+2.4%)
  slPrice: number; // Stop Loss (-1.2%)
  maxFavorablePrice: number;
  maxAdversePrice: number;
  subsequentHigh60m: number;
  subsequentLow60m: number;
  maePct: number; // Max Adverse Excursion (Dope < 0.5%)
  mfePct: number; // Max Favorable Excursion (Dope > 3.0%)
  silenceDeltaSeconds: number; // Lead time before breakout, e.g. +42s
  result: 'TP1_HIT' | 'SL_HIT' | 'OUT_OF_TIME';
  durationToTargetMin: number;
  isDopeCertified: boolean; // MAE < 0.5% or MFE > 3.0% and TP1 Hit
  criteriaVector: {
    bitqueryWhaleFlowScore: number;
    kaikoOrderbookDepthScore: number;
    stSvnwaSineHarmonics: number;
    topsisRelativeCloseness: number;
  };
}

export interface ForesightAuditReport {
  sampleSize: number;
  tp1HitRatePct: number; // 60% baseline
  slHitRatePct: number; // 30% baseline
  outOfTimePct: number; // 10% baseline
  foresightPrecisionPct: number;
  avgMfeWinnersPct: number; // +3.07%
  avgMaeLosersPct: number; // 1.45%
  avgSilenceDeltaSeconds: number; // 42s
  isOptimizationApplied: boolean;
  optimizedAt?: string;
  evaluationVerdict: string;
  signals: ForesightSignalAuditItem[];
}

export interface ParameterOptimizationState {
  isApplied: boolean;
  topsisWeights: {
    bitqueryWhaleFlow: number; // 0.35 (shifted +15%)
    kaikoOrderbookDepth: number; // 0.35 (shifted +15%)
    stSvnwaHarmonics: number; // 0.15
    tcnsFreshness: number; // 0.15
  };
  entrySelectivityFloorIncreasePct: number; // 15%
  liquidityFilterRequirement: string;
  appliedAt: string;
}

export interface EntropyGuardStatus {
  wassersteinDistance: number; // e.g. 0.038 (Hard limit: 0.150)
  hardLimit: number; // 0.150
  regimeStatus: 'NORMAL_HARMONIC' | 'PROTECTIVE_STASIS' | 'RE_NORMALIZING';
  marketRegime: string; // e.g. "Low-Entropy Trending Bull"
  lastRenormalizedAt: string;
  noisyAssetsSuppressed: string[]; // e.g. ['DOGE', 'PEPE']
  entropyTrend: 'FALLING' | 'STABLE' | 'RISING';
}

export interface TickBufferingStatus {
  tickConfirmationCount: number; // 3 ticks
  latencyTradeoffMs: number; // 48ms
  spuriousTicksFilteredCount: number; // e.g. 142 ticks
  isActive: boolean;
  cleanFillRatioPct: number; // 100%
}

export interface ExecutionQualityStatus {
  kaikoDepthMillisecondValid: boolean;
  strategicSilencesTriggered: number;
  subMillisecondValidationMs: number;
  executionQualityScore: number; // 0-100, e.g. 98.8
  lastAuditedAsset: string;
}

export interface GhostTradingStatus {
  livePnlPct: number; // e.g. +14.79%
  ghostPnlPct: number; // e.g. +14.82%
  divergenceBps: number; // e.g. 3 bps (0.03%)
  divergenceLimitBps: number; // 10 bps (0.10%)
  isWarningActive: boolean;
  ghostTradesMonitored: number;
  soakProgressHours: number; // e.g. 4.2 / 48
}

export interface DeadManSwitchStatus {
  isActive: boolean;
  timeoutThresholdMs: number; // 2000ms
  currentMaxHeartbeatLatencyMs: number; // e.g. 312ms
  harvestersOnlineCount: number; // 20
  totalHarvesters: number; // 20
  circuitBreakerTripped: boolean;
  binanceOrdersProtected: number;
}

export interface LiveMarketTelemetry {
  isLiveConnected: boolean;
  source: string;
  lastSyncTimestamp: number;
  lastError: string | null;
  symbolsCount: number;
  samplePrices: {
    BTC: number;
    ETH: number;
    SOL: number;
    BNB: number;
    XRP: number;
    TAO: number;
  };
}

export interface AutoRecalibrationSnapshot {
  cycleId: string;
  cycleNumber: number;
  timestamp: string;
  nextScheduledCycle: string;
  wassersteinDistance: number;
  dominantMarketTruth: string;
  activeTopsisWeights: {
    bitqueryWhaleFlow: number;
    kaikoOrderbookDepth: number;
    stSvnwaHarmonics: number;
    tcnsFreshness: number;
  };
  floorHitRatePct: number;
  entropyGuard: EntropyGuardStatus;
  tickBuffering: TickBufferingStatus;
  executionQuality: ExecutionQualityStatus;
  ghostTrading: GhostTradingStatus;
  deadManSwitch: DeadManSwitchStatus;
  status: 'CALIBRATED_OPTIMAL' | 'RE_NORMALIZING' | 'STASIS';
  message: string;
}


export interface SoulConnectedNode {
  id: string;
  name: string;
  type: SoulNodeType;
  exchange?: string;
  status: 'PLUGGED_IN' | 'LISTENING' | 'IDLE' | 'DISCONNECTED';
  connectedAt: string;
  tradesExecuted: number;
  outcomesShared: number;
  avgSlippageBps: number;
  realizedPnlUsd: number;
  reputationScore: number; // 0 to 100
  latencyMs: number;
  apiKeyMasked?: string;
  webhookUrl?: string;
}

export interface SoulSharedTradeOutcome {
  id: string;
  nodeId: string;
  nodeName: string;
  signalId: string;
  asset: string;
  futuresPair: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnlPct: number;
  slippageBps: number;
  fillLatencyMs: number;
  marketRegime: string;
  timestamp: string;
  wasProfitable: boolean;
  learningWeightDelta: number; // Quantitative weight adjustment made to the engine
  contributedInsights: string;
}

export interface SoulAdapterConfig {
  webhookSecret: string;
  webhookEndpoint: string;
  autoDispatchSignals: boolean;
  minConfidenceThreshold: number; // e.g. 0.95 (95%)
  maxAllocationPerTradePct: number; // e.g. 5%
  defaultLeverage: number; // e.g. 3x
  supportedExchanges: string[];
  collectiveLearningOptIn: boolean;
}

export interface SoulMeshStats {
  activeNodesCount: number;
  totalOutcomesShared: number;
  collectiveAccuracyImprovementPct: number; // e.g. +3.12%
  learningEpoch: number;
  totalVolumeGuidedUsd: number;
  averageExecutionSlippageBps: number;
  lastTrainedAt: string;
}

// ---------------------------------------------------------
// SIGNAL SIPHON PORT & EXTERNAL APP MONITOR
// ---------------------------------------------------------

export type ConsumerAppType =
  | 'PYTHON_QUANT'
  | 'TELEGRAM_BOT'
  | 'RUST_HFT'
  | 'NODE_EXECUTOR'
  | 'TRADINGVIEW_PINE'
  | 'CUSTOM_ENGINE';

export type ConsumerProtocol = 'SSE_STREAM' | 'REST_SIPHON' | 'WEBSOCKET' | 'WEBHOOK_PUSH';

export interface ExternalAppTrade {
  id: string;
  appId: string;
  appName: string;
  signalId: string;
  asset: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  status: 'OPEN' | 'TARGET_HIT' | 'STOPPED_OUT' | 'CLOSED';
  pnlPct: number;
  pnlUsd: number;
  slippageBps: number;
  durationMinutes: number;
  timestamp: string;
  effectivenessRating: 'EXCELLENT' | 'HIGH' | 'MODERATE' | 'POOR';
}

export interface ExternalConsumerApp {
  id: string;
  name: string;
  appType: ConsumerAppType;
  connectedSince: string;
  remoteIp: string;
  protocol: ConsumerProtocol;
  status: 'STREAMING' | 'SUCKING' | 'IDLE' | 'DISCONNECTED';
  signalsSucked: number;
  tradesExecuted: number;
  tradesWon: number;
  tradesLost: number;
  winRatePct: number;
  totalPnlUsd: number;
  totalPnlPct: number;
  avgExecutionSlippageBps: number;
  avgExecutionLatencyMs: number;
  efficacyScore: number; // 0 to 100
  lastSignalSucked: string;
  lastActiveTime: string;
  accessTier: 'ALL_SUPER_SIGNALS' | 'PREMIUM_CONVICTION_95' | 'ULTRA_CONVICTION_98';
  recentTrades: ExternalAppTrade[];
}

export interface SignalPortConfig {
  portNumber: number;
  streamEndpoint: string;
  suckSignalsEndpoint: string;
  reportTradeEndpoint: string;
  activeApiKey: string;
  isPortOpen: boolean;
  minConvictionFloor: number;
  totalDataTransferredKb: number;
}

export interface SiphonActivityEvent {
  id: string;
  timestamp: string;
  appId: string;
  appName: string;
  eventType: 'APP_CONNECTED' | 'SIGNAL_SUCKED' | 'TRADE_OPENED' | 'TARGET_REACHED' | 'EFFICACY_EVALUATED';
  detail: string;
  asset?: string;
  pnlDelta?: number;
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeName: string;
  eventType:
    | 'HANDSHAKE_SUCCESS'
    | 'AUTH_FAILURE'
    | 'TOKEN_EXPIRED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'IP_FINGERPRINT_MISMATCH'
    | 'CHALLENGE_VERIFIED'
    | 'SECURITY_BREACH';
  status: 'AUTHORIZED' | 'EXPIRED' | 'REJECTED' | 'SECURITY_BREACH';
  ipAddress: string; // Masked (e.g. 194.26.***.***)
  ipRaw: string;
  nodeTier: 'PREMIUM_95' | 'ULTRA_98' | 'MASTER' | 'UNAUTHENTICATED';
  endpoint: string;
  userAgent: string;
  latencyMs: number;
  failureReason?: string;
  rateLimitQuota: string;
  actionTaken: string;
  isBanned?: boolean;
}

export interface AccessLogSummary {
  totalHandshakes: number;
  authorizedCount: number;
  authFailureCount: number;
  securityBreachCount: number;
  activeBannedIpsCount: number;
  avgHandshakeLatencyMs: number;
  firewallStatus: 'ACTIVE_ENFORCEMENT' | 'MONITORING_ONLY';
  rateLimitEnforcement: boolean;
  ipFingerprinting: boolean;
  challengeResponse: boolean;
}

// =========================================================
// CROSS-VENUE MARKET CORTEX TYPES (Binance + OKX + Bybit)
// =========================================================

export type VenueId = 'BINANCE' | 'OKX' | 'BYBIT';

export interface VenueState {
  venue: VenueId;
  venueName: string;
  symbol: string;
  contractType: string; // 'USDT-M Perpetual' | 'Linear Swap'
  isExecutionVenue: boolean; // True for Binance, False for OKX / Bybit (Phase 1)
  markPrice: number;
  indexPrice: number;
  lastPrice: number;
  bestBid: number;
  bestAsk: number;
  spreadBps: number;
  orderbookImbalance: number; // -1.0 (heavy asks) to +1.0 (heavy bids)
  openInterest: number;
  openInterestDelta: number; // relative change e.g. +0.038 (+3.8%)
  fundingRate: number;
  fundingDirection: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  aggressiveBuyVolume: number;
  aggressiveSellVolume: number;
  volume24hUsd: number;
  basisBps: number;
  exchangeTimestamp: number;
  receiveTimestamp: number;
  latencyMs: number;
  stale: boolean;
  directionBias: 'LONG' | 'SHORT' | 'NEUTRAL';
}

export interface VenueConsensus {
  binance: 'LONG' | 'SHORT' | 'NEUTRAL';
  okx: 'LONG' | 'SHORT' | 'NEUTRAL';
  bybit: 'LONG' | 'SHORT' | 'NEUTRAL';
  agreement: number; // 0.0 to 1.0 (1.0 = 3/3 unanimous)
  dispersion: number; // e.g. 0.07
  consensusDirection: 'LONG' | 'SHORT' | 'NEUTRAL' | 'DIVERGENT';
}

export interface MarketEvidenceVenue {
  oiDelta: number;
  funding: number;
  markPrice: number;
  spreadBps: number;
  orderbookImbalance: number;
}

export interface MarketEvidence {
  binance: MarketEvidenceVenue;
  okx: MarketEvidenceVenue;
  bybit: MarketEvidenceVenue;
}

export interface CrossVenueFrame {
  symbol: string; // 'BTC', 'ETH', 'SOL', 'BNB', 'TAO'
  binance: VenueState;
  okx: VenueState;
  bybit: VenueState;
  observedAt: number;

  // Cross-Venue Triangulation & Disagreement Metrics
  agreement: number; // 0.0 to 1.0
  dispersionBps: number; // max basis across venues
  priceBasisUsd: number;
  fundingDispersion: number;
  oiDispersion: number;
  orderflowAgreement: number;

  // Synthesis
  consensusDirection: 'LONG' | 'SHORT' | 'NEUTRAL' | 'DIVERGENT';
  convictionMultiplier: number; // dampened if divergent, boosted if 3/3 unanimous

  // Lead / Lag Dynamics
  leadVenue: 'BINANCE' | 'OKX' | 'BYBIT' | 'SYNCHRONIZED';
  leadLagMs: number;
  leadLagInsight: string;

  // Learned Reliability Vector
  reliabilityWeights: {
    binance: number;
    okx: number;
    bybit: number;
  };

  // Disagreement As Information Diagnosis
  disagreementDiagnosis: string;
  disagreementCategory:
    | 'UNANIMOUS_CONVERGENCE'
    | 'LOCAL_LIQUIDATION_SPIKE'
    | 'REGIONAL_FLOW_DIFFERENTIAL'
    | 'TRANSIENT_ARBITRAGE'
    | 'LEAD_LAG_ACCELERATION'
    | 'LOCAL_ORDERBOOK_SPOOFING_FILTERED';
}

export interface CrossVenueCortexTelemetry {
  isLiveSynced: boolean;
  lastSyncTimestamp: number;
  activeFramesCount: number;
  overallConsensusRatio: number; // e.g. 0.88
  averageDispersionBps: number;
  leadLagObservatory: {
    symbol: string;
    leadExchange: VenueId;
    lagExchange: VenueId;
    medianLeadLagMs: number;
    historicalPredictiveAccuracy: number;
  }[];
  venueStatus: {
    binance: { status: 'ONLINE'; mode: 'MARKET_DATA_AND_EXECUTION'; latencyMs: number };
    okx: { status: 'ONLINE'; mode: 'PUBLIC_MARKET_DATA_ONLY'; latencyMs: number };
    bybit: { status: 'ONLINE'; mode: 'PUBLIC_MARKET_DATA_ONLY'; latencyMs: number };
  };
}

