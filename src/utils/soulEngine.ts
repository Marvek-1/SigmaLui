import {
  SoulConnectedNode,
  SoulSharedTradeOutcome,
  SoulAdapterConfig,
  SoulMeshStats,
  SuperSignal,
  NodeMeshItem,
  ForesightSignalAuditItem,
  ForesightAuditReport,
  ParameterOptimizationState,
} from '../types';

export const INITIAL_FORESIGHT_SIGNALS: ForesightSignalAuditItem[] = [
  {
    signalId: 'SIG-9912',
    asset: 'SOL',
    futuresPair: 'SOLUSDT.P',
    direction: 'LONG',
    timestamp: '18m ago',
    ciConfidence: 0.97,
    entryPrice: 101.40,
    tp1Price: 103.83, // +2.4%
    slPrice: 100.18,  // -1.2%
    maxFavorablePrice: 104.64,
    maxAdversePrice: 101.10,
    subsequentHigh60m: 104.64,
    subsequentLow60m: 101.10,
    maePct: 0.30,     // < 0.5% Dope entry!
    mfePct: 3.20,     // > 3.0% Dope move!
    silenceDeltaSeconds: 48,
    result: 'TP1_HIT',
    durationToTargetMin: 22,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.94,
      kaikoOrderbookDepthScore: 0.92,
      stSvnwaSineHarmonics: 0.96,
      topsisRelativeCloseness: 0.97,
    },
  },
  {
    signalId: 'SIG-9911',
    asset: 'TAO',
    futuresPair: 'TAOUSDT.P',
    direction: 'LONG',
    timestamp: '35m ago',
    ciConfidence: 0.98,
    entryPrice: 221.50,
    tp1Price: 226.81,
    slPrice: 218.84,
    maxFavorablePrice: 229.03,
    maxAdversePrice: 220.97,
    subsequentHigh60m: 229.03,
    subsequentLow60m: 220.97,
    maePct: 0.24,
    mfePct: 3.40,
    silenceDeltaSeconds: 52,
    result: 'TP1_HIT',
    durationToTargetMin: 18,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.96,
      kaikoOrderbookDepthScore: 0.95,
      stSvnwaSineHarmonics: 0.97,
      topsisRelativeCloseness: 0.98,
    },
  },
  {
    signalId: 'SIG-9910',
    asset: 'BTC',
    futuresPair: 'BTCUSDT.P',
    direction: 'LONG',
    timestamp: '52m ago',
    ciConfidence: 0.96,
    entryPrice: 78250.0,
    tp1Price: 80128.0,
    slPrice: 77311.0,
    maxFavorablePrice: 80362.0,
    maxAdversePrice: 77960.0,
    subsequentHigh60m: 80362.0,
    subsequentLow60m: 77960.0,
    maePct: 0.37,
    mfePct: 2.70,
    silenceDeltaSeconds: 39,
    result: 'TP1_HIT',
    durationToTargetMin: 38,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.91,
      kaikoOrderbookDepthScore: 0.89,
      stSvnwaSineHarmonics: 0.95,
      topsisRelativeCloseness: 0.96,
    },
  },
  {
    signalId: 'SIG-9909',
    asset: 'ETH',
    futuresPair: 'ETHUSDT.P',
    direction: 'LONG',
    timestamp: '1h 10m ago',
    ciConfidence: 0.95,
    entryPrice: 2410.0,
    tp1Price: 2467.8,
    slPrice: 2381.0,
    maxFavorablePrice: 2429.3,
    maxAdversePrice: 2374.3,
    subsequentHigh60m: 2429.3,
    subsequentLow60m: 2374.3,
    maePct: 1.48, // Genuine structural break, not whipsaw
    mfePct: 0.80,
    silenceDeltaSeconds: 31,
    result: 'SL_HIT',
    durationToTargetMin: 26,
    isDopeCertified: false,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.88,
      kaikoOrderbookDepthScore: 0.74, // Ask wall was present!
      stSvnwaSineHarmonics: 0.92,
      topsisRelativeCloseness: 0.95,
    },
  },
  {
    signalId: 'SIG-9908',
    asset: 'AVAX',
    futuresPair: 'AVAXUSDT.P',
    direction: 'LONG',
    timestamp: '1h 35m ago',
    ciConfidence: 0.96,
    entryPrice: 7.25,
    tp1Price: 7.42,
    slPrice: 7.16,
    maxFavorablePrice: 7.47,
    maxAdversePrice: 7.22,
    subsequentHigh60m: 7.47,
    subsequentLow60m: 7.22,
    maePct: 0.35,
    mfePct: 3.10,
    silenceDeltaSeconds: 44,
    result: 'TP1_HIT',
    durationToTargetMin: 29,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.93,
      kaikoOrderbookDepthScore: 0.91,
      stSvnwaSineHarmonics: 0.96,
      topsisRelativeCloseness: 0.96,
    },
  },
  {
    signalId: 'SIG-9907',
    asset: 'LINK',
    futuresPair: 'LINKUSDT.P',
    direction: 'LONG',
    timestamp: '2h 05m ago',
    ciConfidence: 0.94,
    entryPrice: 14.80,
    tp1Price: 15.15,
    slPrice: 14.62,
    maxFavorablePrice: 14.93,
    maxAdversePrice: 14.57,
    subsequentHigh60m: 14.93,
    subsequentLow60m: 14.57,
    maePct: 1.52, // Genuine structural stop out
    mfePct: 0.88,
    silenceDeltaSeconds: 28,
    result: 'SL_HIT',
    durationToTargetMin: 34,
    isDopeCertified: false,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.85,
      kaikoOrderbookDepthScore: 0.72,
      stSvnwaSineHarmonics: 0.91,
      topsisRelativeCloseness: 0.94,
    },
  },
  {
    signalId: 'SIG-9906',
    asset: 'RENDER',
    futuresPair: 'RENDERUSDT.P',
    direction: 'LONG',
    timestamp: '2h 30m ago',
    ciConfidence: 0.97,
    entryPrice: 5.85,
    tp1Price: 5.99,
    slPrice: 5.78,
    maxFavorablePrice: 6.04,
    maxAdversePrice: 5.84,
    subsequentHigh60m: 6.04,
    subsequentLow60m: 5.84,
    maePct: 0.17, // Razor-sharp entry
    mfePct: 3.22,
    silenceDeltaSeconds: 61,
    result: 'TP1_HIT',
    durationToTargetMin: 14,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.95,
      kaikoOrderbookDepthScore: 0.96,
      stSvnwaSineHarmonics: 0.98,
      topsisRelativeCloseness: 0.97,
    },
  },
  {
    signalId: 'SIG-9905',
    asset: 'SUI',
    futuresPair: 'SUIUSDT.P',
    direction: 'LONG',
    timestamp: '3h 10m ago',
    ciConfidence: 0.96,
    entryPrice: 1.720,
    tp1Price: 1.761,
    slPrice: 1.699,
    maxFavorablePrice: 1.768,
    maxAdversePrice: 1.713,
    subsequentHigh60m: 1.768,
    subsequentLow60m: 1.713,
    maePct: 0.41,
    mfePct: 2.80,
    silenceDeltaSeconds: 36,
    result: 'TP1_HIT',
    durationToTargetMin: 41,
    isDopeCertified: true,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.92,
      kaikoOrderbookDepthScore: 0.88,
      stSvnwaSineHarmonics: 0.94,
      topsisRelativeCloseness: 0.96,
    },
  },
  {
    signalId: 'SIG-9904',
    asset: 'NEAR',
    futuresPair: 'NEARUSDT.P',
    direction: 'LONG',
    timestamp: '3h 45m ago',
    ciConfidence: 0.95,
    entryPrice: 4.60,
    tp1Price: 4.71,
    slPrice: 4.544,
    maxFavorablePrice: 4.64,
    maxAdversePrice: 4.538,
    subsequentHigh60m: 4.64,
    subsequentLow60m: 4.538,
    maePct: 1.35,
    mfePct: 0.87,
    silenceDeltaSeconds: 34,
    result: 'SL_HIT',
    durationToTargetMin: 31,
    isDopeCertified: false,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.86,
      kaikoOrderbookDepthScore: 0.76,
      stSvnwaSineHarmonics: 0.90,
      topsisRelativeCloseness: 0.95,
    },
  },
  {
    signalId: 'SIG-9903',
    asset: 'INJ',
    futuresPair: 'INJUSDT.P',
    direction: 'LONG',
    timestamp: '4h 15m ago',
    ciConfidence: 0.95,
    entryPrice: 24.10,
    tp1Price: 24.67,
    slPrice: 23.81,
    maxFavorablePrice: 24.45,
    maxAdversePrice: 23.95,
    subsequentHigh60m: 24.45,
    subsequentLow60m: 23.95,
    maePct: 0.62,
    mfePct: 1.45,
    silenceDeltaSeconds: 40,
    result: 'OUT_OF_TIME',
    durationToTargetMin: 60,
    isDopeCertified: false,
    criteriaVector: {
      bitqueryWhaleFlowScore: 0.87,
      kaikoOrderbookDepthScore: 0.79,
      stSvnwaSineHarmonics: 0.91,
      topsisRelativeCloseness: 0.95,
    },
  },
];

export const INITIAL_FORESIGHT_AUDIT: ForesightAuditReport = {
  sampleSize: 10,
  tp1HitRatePct: 60.0,
  slHitRatePct: 30.0,
  outOfTimePct: 10.0,
  foresightPrecisionPct: 60.0,
  avgMfeWinnersPct: 3.07, // Exact user value: +3.07%
  avgMaeLosersPct: 1.45,  // Exact user value: 1.45%
  avgSilenceDeltaSeconds: 42,
  isOptimizationApplied: false,
  evaluationVerdict:
    'Signals are structurally sound. MAE proves entries do not fight trend (not whipsawing). Liquidity weighting patch required to clear ask walls to +2.4% TP1.',
  signals: INITIAL_FORESIGHT_SIGNALS,
};

export const INITIAL_OPTIMIZATION_STATE: ParameterOptimizationState = {
  isApplied: false,
  topsisWeights: {
    bitqueryWhaleFlow: 0.20,
    kaikoOrderbookDepth: 0.20,
    stSvnwaHarmonics: 0.30,
    tcnsFreshness: 0.30,
  },
  entrySelectivityFloorIncreasePct: 0,
  liquidityFilterRequirement: 'Standard Bid/Ask Imbalance Ratio > 1.2x',
  appliedAt: 'Pending Trigger',
};

export const INITIAL_NODE_MESH: NodeMeshItem[] = [
  {
    id: 'node-tv-01',
    nodeIdentity: 'TradingView_User_A',
    nodeType: 'TRADINGVIEW_WEBHOOK',
    activeStatus: 'TRADE_OPEN',
    openTrade: {
      asset: 'TAO',
      direction: 'LONG',
      entryPrice: 540.2,
      currentPrice: 565.4,
      unrealizedPnlPct: 4.66,
      startedAt: '12m ago',
    },
    signalPrecisionPct: 95.0,
    realizedPrecisionPct: 92.4,
    precisionDeltaPct: -2.6,
    slippagePct: 0.0018,
    entryLagPct: 0.0012,
    hasDriftAlert: false,
    reputationScore: 96.5,
    reputationRank: 'RANK_1_ALPHA_MASTER',
    totalTrades: 58,
    totalPnlUsd: 14850.0,
    lastOutcomeTimestamp: '12m ago',
    apiKeyPrefix: 'SOUL-NODE-KEY-TV-A...',
  },
  {
    id: 'node-py-02',
    nodeIdentity: 'Python_Script_B',
    nodeType: 'PYTHON_AGENT',
    activeStatus: 'IDLE',
    signalPrecisionPct: 95.0,
    realizedPrecisionPct: 93.8,
    precisionDeltaPct: -1.2,
    slippagePct: 0.0012,
    entryLagPct: 0.0009,
    hasDriftAlert: false,
    reputationScore: 94.0,
    reputationRank: 'RANK_2_TIER_1_ELITE',
    totalTrades: 42,
    totalPnlUsd: 11240.0,
    lastOutcomeTimestamp: '34m ago',
    apiKeyPrefix: 'SOUL-NODE-KEY-PY-B...',
  },
  {
    id: 'node-bin-03',
    nodeIdentity: 'Binance_Scalper_X',
    nodeType: 'EXCHANGE_BOT',
    activeStatus: 'TRADE_OPEN',
    openTrade: {
      asset: 'ETH',
      direction: 'LONG',
      entryPrice: 3520.5,
      currentPrice: 3610.0,
      unrealizedPnlPct: 2.54,
      startedAt: '8m ago',
    },
    signalPrecisionPct: 95.0,
    realizedPrecisionPct: 88.5,
    precisionDeltaPct: -6.5,
    slippagePct: 0.0094,
    entryLagPct: 0.0035,
    hasDriftAlert: true,
    driftReason: 'High execution slippage (94 bps > 80 bps threshold). Orderbook entry delayed by 3.5s.',
    reputationScore: 78.2,
    reputationRank: 'RANK_WARNING_AUDIT',
    totalTrades: 35,
    totalPnlUsd: 4200.0,
    lastOutcomeTimestamp: '8m ago',
    apiKeyPrefix: 'SOUL-NODE-KEY-BIN-X...',
  },
  {
    id: 'node-rust-04',
    nodeIdentity: 'Rust_HFT_Alpha',
    nodeType: 'CUSTOM_SOCKET',
    activeStatus: 'IDLE',
    signalPrecisionPct: 95.0,
    realizedPrecisionPct: 94.6,
    precisionDeltaPct: -0.4,
    slippagePct: 0.0007,
    entryLagPct: 0.0004,
    hasDriftAlert: false,
    reputationScore: 98.4,
    reputationRank: 'RANK_1_ALPHA_MASTER',
    totalTrades: 89,
    totalPnlUsd: 32800.0,
    lastOutcomeTimestamp: '1m ago',
    apiKeyPrefix: 'SOUL-NODE-KEY-RUST-A...',
  },
];

export const INITIAL_SOUL_CONFIG: SoulAdapterConfig = {
  webhookSecret: 'soul_sec_994a8f219b6e82c1',
  webhookEndpoint: '/api/soul/webhook',
  autoDispatchSignals: true,
  minConfidenceThreshold: 0.95,
  maxAllocationPerTradePct: 5,
  defaultLeverage: 3,
  supportedExchanges: ['Binance Futures', 'Bybit Linear', 'OKX Swap', 'Hyperliquid', 'Paper Mock'],
  collectiveLearningOptIn: true,
};

export const INITIAL_SOUL_NODES: SoulConnectedNode[] = [
  {
    id: 'node-binance-01',
    name: 'Binance USDT-M Fast Scalper',
    type: 'EXCHANGE_BOT',
    exchange: 'Binance Futures',
    status: 'PLUGGED_IN',
    connectedAt: '2h ago',
    tradesExecuted: 142,
    outcomesShared: 139,
    avgSlippageBps: 2.1,
    realizedPnlUsd: 14820.5,
    reputationScore: 98,
    latencyMs: 16,
    apiKeyMasked: 'bina_live_****39aF',
  },
  {
    id: 'node-bybit-02',
    name: 'Bybit Linear Alpha Runner',
    type: 'EXCHANGE_BOT',
    exchange: 'Bybit Linear',
    status: 'PLUGGED_IN',
    connectedAt: '5h ago',
    tradesExecuted: 88,
    outcomesShared: 86,
    avgSlippageBps: 1.8,
    realizedPnlUsd: 9340.2,
    reputationScore: 96,
    latencyMs: 24,
    apiKeyMasked: 'bybt_live_****81eB',
  },
  {
    id: 'node-tv-webhook-03',
    name: 'TradingView Alert Relay',
    type: 'TRADINGVIEW_WEBHOOK',
    status: 'PLUGGED_IN',
    connectedAt: '1d ago',
    tradesExecuted: 65,
    outcomesShared: 64,
    avgSlippageBps: 3.4,
    realizedPnlUsd: 6120.0,
    reputationScore: 94,
    latencyMs: 45,
    webhookUrl: 'https://broker-relay.internal/webhook/execute',
  },
  {
    id: 'node-py-agent-04',
    name: 'Autonomous Python Executor (asyncio)',
    type: 'PYTHON_AGENT',
    exchange: 'Hyperliquid',
    status: 'PLUGGED_IN',
    connectedAt: '18m ago',
    tradesExecuted: 31,
    outcomesShared: 31,
    avgSlippageBps: 1.2,
    realizedPnlUsd: 4210.8,
    reputationScore: 99,
    latencyMs: 12,
  },
  {
    id: 'node-tg-dispatch-05',
    name: 'VIP Telegram Soul Broadcast',
    type: 'TELEGRAM_DISPATCH',
    status: 'LISTENING',
    connectedAt: '3d ago',
    tradesExecuted: 210,
    outcomesShared: 198,
    avgSlippageBps: 0.0,
    realizedPnlUsd: 22400.0,
    reputationScore: 97,
    latencyMs: 85,
  },
];

export const INITIAL_SHARED_OUTCOMES: SoulSharedTradeOutcome[] = [
  {
    id: 'out-01',
    nodeId: 'node-binance-01',
    nodeName: 'Binance USDT-M Fast Scalper',
    signalId: 'SIG-984139',
    asset: 'TAO',
    futuresPair: 'TAOUSDT.P',
    direction: 'LONG',
    entryPrice: 540.2,
    exitPrice: 565.4,
    pnlPct: 4.66,
    slippageBps: 1.8,
    fillLatencyMs: 14,
    marketRegime: 'TRENDING_BULL',
    timestamp: '8m ago',
    wasProfitable: true,
    learningWeightDelta: 0.014,
    contributedInsights: 'Zero orderbook slip on entry; Bybit depth matched Binance top bid perfectly.',
  },
  {
    id: 'out-02',
    nodeId: 'node-bybit-02',
    nodeName: 'Bybit Linear Alpha Runner',
    signalId: 'SIG-984140',
    asset: 'ETH',
    futuresPair: 'ETHUSDT.P',
    direction: 'LONG',
    entryPrice: 3520.5,
    exitPrice: 3640.0,
    pnlPct: 3.39,
    slippageBps: 2.2,
    fillLatencyMs: 22,
    marketRegime: 'TRENDING_BULL',
    timestamp: '24m ago',
    wasProfitable: true,
    learningWeightDelta: 0.011,
    contributedInsights: 'Whale ask wall melted prior to entry; stop-loss never threatened.',
  },
  {
    id: 'out-03',
    nodeId: 'node-py-agent-04',
    nodeName: 'Autonomous Python Executor',
    signalId: 'SIG-984136',
    asset: 'SOL',
    futuresPair: 'SOLUSDT.P',
    direction: 'LONG',
    entryPrice: 134.15,
    exitPrice: 139.80,
    pnlPct: 4.21,
    slippageBps: 1.1,
    fillLatencyMs: 11,
    marketRegime: 'TRENDING_BULL',
    timestamp: '1h ago',
    wasProfitable: true,
    learningWeightDelta: 0.018,
    contributedInsights: 'Hyperliquid L1 fill latency under 12ms; confirmed low indeterminacy index.',
  },
  {
    id: 'out-04',
    nodeId: 'node-binance-01',
    nodeName: 'Binance USDT-M Fast Scalper',
    signalId: 'SIG-984132',
    asset: 'AVAX',
    futuresPair: 'AVAXUSDT.P',
    direction: 'LONG',
    entryPrice: 28.52,
    exitPrice: 29.80,
    pnlPct: 4.48,
    slippageBps: 2.5,
    fillLatencyMs: 18,
    marketRegime: 'TRENDING_BULL',
    timestamp: '2h ago',
    wasProfitable: true,
    learningWeightDelta: 0.012,
    contributedInsights: 'DeFi sector momentum confirmed; TOPSIS rank accurately predicted target velocity.',
  },
  {
    id: 'out-05',
    nodeId: 'node-tv-webhook-03',
    nodeName: 'TradingView Alert Relay',
    signalId: 'SIG-984128',
    asset: 'NEAR',
    futuresPair: 'NEARUSDT.P',
    direction: 'LONG',
    entryPrice: 4.82,
    exitPrice: 5.05,
    pnlPct: 4.77,
    slippageBps: 3.1,
    fillLatencyMs: 42,
    marketRegime: 'TRENDING_BULL',
    timestamp: '3h ago',
    wasProfitable: true,
    learningWeightDelta: 0.009,
    contributedInsights: 'Limit order fill rate 100%; AI & Compute category surge verified.',
  },
];

export const INITIAL_SOUL_STATS: SoulMeshStats = {
  activeNodesCount: 14,
  totalOutcomesShared: 486,
  collectiveAccuracyImprovementPct: 3.42,
  learningEpoch: 48,
  totalVolumeGuidedUsd: 6842500,
  averageExecutionSlippageBps: 1.94,
  lastTrainedAt: 'Just now',
};

// Generates the JSON webhook payload that is dispatched to plugged-in bots
export function formatSoulWebhookPayload(signal: SuperSignal, config: SoulAdapterConfig) {
  return {
    source: 'ALPHA_SIGNALS_SOUL_GIVER',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    event: 'TRADE_SIGNAL_PULSE',
    soul: {
      directive: 'EXECUTE',
      conviction: 'HIGH',
      confidenceScore: signal.topsisScore,
      confidencePct: Number((signal.topsisScore * 100).toFixed(2)),
      asset: signal.asset,
      futuresPair: signal.futuresPair || `${signal.asset}/USDT`,
      action: signal.action === 'STRONG_BUY' ? 'BUY' : 'SELL',
      side: signal.action === 'STRONG_BUY' ? 'LONG' : 'SHORT',
      entryPrice: signal.entryPrice,
      takeProfit1: signal.target1,
      takeProfit2: signal.target2,
      stopLoss: signal.stopLoss,
      riskRewardRatio: signal.riskRewardRatio,
      recommendedAllocationPct: config.maxAllocationPerTradePct,
      recommendedLeverage: config.defaultLeverage,
      timeframe: signal.timeframe,
      marketConfluence: signal.explanation,
    },
    verification: {
      greyResidualError: signal.greyResidualError,
      indeterminacyIndex: signal.indeterminacy,
      topsisRank: signal.topsisScore,
      confluentExchangesCount: 20,
    },
    callback: {
      shareOutcomeEndpoint: '/api/soul/share-outcome',
      shareOutcomeSchema: {
        signalId: signal.id,
        fillPrice: 'number',
        exitPrice: 'number',
        pnlPct: 'number',
        slippageBps: 'number',
      },
    },
  };
}

// Code generators for different programming languages & tools
export function generateSoulPythonSnippet(config: SoulAdapterConfig, customBaseUrl?: string): string {
  const baseUrl = customBaseUrl || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://trading.mostarindustries.com');
  const endpoint = `${baseUrl}/api/soul`;
  return `# 🌟 Alpha Signals: Soul Giver Python Client
# pip install requests websockets

import json
import requests
import time

SOUL_ENDPOINT = "${endpoint}"
SOUL_SECRET = "${config.webhookSecret}"

def receive_soul_pulse():
    """Fetch live high-confidence signals from the Soul Giver engine"""
    headers = {"Authorization": f"Bearer {SOUL_SECRET}"}
    res = requests.get(f"{SOUL_ENDPOINT}/signals", headers=headers)
    signals = res.json().get("signals", [])
    
    for sig in signals:
        if sig["topsisScore"] >= ${config.minConfidenceThreshold}:
            print(f"🔥 Soul Injected! Executing {sig['action']} on {sig['asset']} @ \${sig['entryPrice']}")
            # Execute on your exchange:
            # exchange.create_order(symbol=sig['futuresPair'], side='buy', price=sig['entryPrice'], stop_loss=sig['stopLoss'], take_profit=sig['target1'])
            
            # 🔄 Share your trade outcome back so the engine learns and grows:
            share_outcome(sig["id"], sig["asset"], fill_price=sig["entryPrice"], pnl_pct=3.8)

def share_outcome(signal_id, asset, fill_price, pnl_pct):
    payload = {
        "nodeId": "py-bot-01",
        "signalId": signal_id,
        "asset": asset,
        "fillPrice": fill_price,
        "pnlPct": pnl_pct,
        "slippageBps": 1.5,
        "wasProfitable": pnl_pct > 0
    }
    requests.post(f"{SOUL_ENDPOINT}/share-outcome", json=payload)
    print("✨ Trade outcome shared with Soul Mesh! Model learning calibrated.")

if __name__ == "__main__":
    receive_soul_pulse()
`;
}

export function generateSoulNodeSnippet(config: SoulAdapterConfig, customBaseUrl?: string): string {
  const baseUrl = customBaseUrl || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://trading.mostarindustries.com');
  const endpoint = `${baseUrl}/api/soul`;
  return `// 🌟 Alpha Signals: Soul Giver Node.js / TypeScript Adapter
import axios from 'axios';

const SOUL_API = '${endpoint}';
const SOUL_SECRET = '${config.webhookSecret}';

async function plugAndTrade() {
  const { data } = await axios.get(\`\${SOUL_API}/signals\`, {
    headers: { Authorization: \`Bearer \${SOUL_SECRET}\` }
  });

  for (const signal of data.signals) {
    if (signal.topsisScore >= ${config.minConfidenceThreshold}) {
      console.log(\`✨ Soul received: \${signal.asset} \${signal.action} @ $\${signal.entryPrice}\`);
      
      // 1. Execute order on CCXT or direct exchange API
      // const order = await exchange.createOrder(signal.futuresPair, 'limit', 'buy', 1.0, signal.entryPrice);
      
      // 2. Report outcome telemetry back to grow collective intelligence
      await axios.post(\`\${SOUL_API}/share-outcome\`, {
        nodeId: 'node-bot-ts',
        signalId: signal.id,
        asset: signal.asset,
        pnlPct: 4.2,
        slippageBps: 2.0,
        wasProfitable: true
      });
      console.log('🌱 Data shared with Soul Giver. Continuous learning cycle updated.');
    }
  }
}

plugAndTrade();
`;
}

export function generateTradingViewWebhookSnippet(config: SoulAdapterConfig): string {
  return JSON.stringify(
    {
      secret: config.webhookSecret,
      event: 'EXECUTE_SOUL_TRADE',
      ticker: '{{ticker}}',
      action: '{{strategy.order.action}}',
      price: '{{strategy.order.price}}',
      contracts: '{{strategy.order.contracts}}',
      stopLoss: '{{strategy.order.alert_message}}',
      meshShareFeedback: true,
    },
    null,
    2
  );
}
