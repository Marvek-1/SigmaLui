import {
  ExternalConsumerApp,
  ExternalAppTrade,
  SignalPortConfig,
  SiphonActivityEvent,
  SuperSignal,
} from '../types';

export const INITIAL_PORT_CONFIG: SignalPortConfig = {
  portNumber: 8443,
  streamEndpoint: '/api/port/v1/stream',
  suckSignalsEndpoint: '/api/port/v1/suck-signals',
  reportTradeEndpoint: '/api/port/v1/report-trade',
  activeApiKey: 'suck_live_alpha_98a72f1c84',
  isPortOpen: true,
  minConvictionFloor: 0.94,
  totalDataTransferredKb: 84920,
};

export const INITIAL_EXTERNAL_APPS: ExternalConsumerApp[] = [
  {
    id: 'app-hyper-01',
    name: 'Hyperliquid L1 HFT Bot',
    appType: 'RUST_HFT',
    connectedSince: '4h 12m ago',
    remoteIp: '185.190.24.112',
    protocol: 'SSE_STREAM',
    status: 'STREAMING',
    signalsSucked: 342,
    tradesExecuted: 68,
    tradesWon: 59,
    tradesLost: 9,
    winRatePct: 86.8,
    totalPnlUsd: 28450.0,
    totalPnlPct: 34.2,
    avgExecutionSlippageBps: 1.1,
    avgExecutionLatencyMs: 9,
    efficacyScore: 97,
    lastSignalSucked: 'TAOUSDT.P @ 540.2 (LONG)',
    lastActiveTime: '3s ago',
    accessTier: 'ULTRA_CONVICTION_98',
    recentTrades: [
      {
        id: 'tr-01',
        appId: 'app-hyper-01',
        appName: 'Hyperliquid L1 HFT Bot',
        signalId: 'SIG-984139',
        asset: 'TAO',
        direction: 'LONG',
        entryPrice: 540.2,
        currentPrice: 565.4,
        targetPrice: 565.0,
        stopLoss: 528.0,
        status: 'TARGET_HIT',
        pnlPct: 4.66,
        pnlUsd: 4660.0,
        slippageBps: 0.9,
        durationMinutes: 18,
        timestamp: '12m ago',
        effectivenessRating: 'EXCELLENT',
      },
      {
        id: 'tr-02',
        appId: 'app-hyper-01',
        appName: 'Hyperliquid L1 HFT Bot',
        signalId: 'SIG-984140',
        asset: 'ETH',
        direction: 'LONG',
        entryPrice: 3520.5,
        currentPrice: 3640.0,
        targetPrice: 3640.0,
        stopLoss: 3450.0,
        status: 'TARGET_HIT',
        pnlPct: 3.39,
        pnlUsd: 3390.0,
        slippageBps: 1.2,
        durationMinutes: 35,
        timestamp: '42m ago',
        effectivenessRating: 'EXCELLENT',
      },
    ],
  },
  {
    id: 'app-bybit-02',
    name: 'Bybit Linear Scalp Matrix',
    appType: 'PYTHON_QUANT',
    connectedSince: '12h 45m ago',
    remoteIp: '54.210.88.4',
    protocol: 'REST_SIPHON',
    status: 'SUCKING',
    signalsSucked: 210,
    tradesExecuted: 44,
    tradesWon: 37,
    tradesLost: 7,
    winRatePct: 84.1,
    totalPnlUsd: 17290.5,
    totalPnlPct: 22.8,
    avgExecutionSlippageBps: 1.9,
    avgExecutionLatencyMs: 22,
    efficacyScore: 92,
    lastSignalSucked: 'SOLUSDT.P @ 134.15 (LONG)',
    lastActiveTime: '15s ago',
    accessTier: 'PREMIUM_CONVICTION_95',
    recentTrades: [
      {
        id: 'tr-03',
        appId: 'app-bybit-02',
        appName: 'Bybit Linear Scalp Matrix',
        signalId: 'SIG-984136',
        asset: 'SOL',
        direction: 'LONG',
        entryPrice: 134.15,
        currentPrice: 139.8,
        targetPrice: 139.5,
        stopLoss: 130.5,
        status: 'TARGET_HIT',
        pnlPct: 4.21,
        pnlUsd: 2105.0,
        slippageBps: 1.8,
        durationMinutes: 48,
        timestamp: '1h 10m ago',
        effectivenessRating: 'HIGH',
      },
    ],
  },
  {
    id: 'app-tv-relay-03',
    name: 'TradingView Pine Webhook Relay',
    appType: 'TRADINGVIEW_PINE',
    connectedSince: '1d 3h ago',
    remoteIp: '34.238.102.19',
    protocol: 'WEBHOOK_PUSH',
    status: 'STREAMING',
    signalsSucked: 185,
    tradesExecuted: 32,
    tradesWon: 26,
    tradesLost: 6,
    winRatePct: 81.3,
    totalPnlUsd: 11840.0,
    totalPnlPct: 18.5,
    avgExecutionSlippageBps: 3.2,
    avgExecutionLatencyMs: 46,
    efficacyScore: 88,
    lastSignalSucked: 'AVAXUSDT.P @ 28.52 (LONG)',
    lastActiveTime: '1m ago',
    accessTier: 'ALL_SUPER_SIGNALS',
    recentTrades: [
      {
        id: 'tr-04',
        appId: 'app-tv-relay-03',
        appName: 'TradingView Pine Webhook Relay',
        signalId: 'SIG-984132',
        asset: 'AVAX',
        direction: 'LONG',
        entryPrice: 28.52,
        currentPrice: 29.8,
        targetPrice: 29.7,
        stopLoss: 27.6,
        status: 'TARGET_HIT',
        pnlPct: 4.48,
        pnlUsd: 1792.0,
        slippageBps: 2.8,
        durationMinutes: 84,
        timestamp: '2h ago',
        effectivenessRating: 'HIGH',
      },
    ],
  },
  {
    id: 'app-tg-vip-04',
    name: 'VIP Telegram Alpha Dispatcher',
    appType: 'TELEGRAM_BOT',
    connectedSince: '2d ago',
    remoteIp: '149.154.167.51',
    protocol: 'SSE_STREAM',
    status: 'STREAMING',
    signalsSucked: 512,
    tradesExecuted: 114,
    tradesWon: 96,
    tradesLost: 18,
    winRatePct: 84.2,
    totalPnlUsd: 41200.0,
    totalPnlPct: 46.1,
    avgExecutionSlippageBps: 0.0,
    avgExecutionLatencyMs: 82,
    efficacyScore: 94,
    lastSignalSucked: 'NEARUSDT.P @ 4.82 (LONG)',
    lastActiveTime: '8s ago',
    accessTier: 'ALL_SUPER_SIGNALS',
    recentTrades: [],
  },
  {
    id: 'app-node-exec-05',
    name: 'Node.js Micro-Arb Executor',
    appType: 'NODE_EXECUTOR',
    connectedSince: '45m ago',
    remoteIp: '192.241.155.8',
    protocol: 'WEBSOCKET',
    status: 'SUCKING',
    signalsSucked: 48,
    tradesExecuted: 12,
    tradesWon: 11,
    tradesLost: 1,
    winRatePct: 91.7,
    totalPnlUsd: 4820.0,
    totalPnlPct: 12.4,
    avgExecutionSlippageBps: 1.4,
    avgExecutionLatencyMs: 14,
    efficacyScore: 96,
    lastSignalSucked: 'BTCUSDT.P @ 64820.0 (LONG)',
    lastActiveTime: '22s ago',
    accessTier: 'ULTRA_CONVICTION_98',
    recentTrades: [],
  },
];

export const INITIAL_SIPHON_EVENTS: SiphonActivityEvent[] = [
  {
    id: 'ev-01',
    timestamp: 'Just now',
    appId: 'app-hyper-01',
    appName: 'Hyperliquid L1 HFT Bot',
    eventType: 'SIGNAL_SUCKED',
    detail: 'Sucked TAOUSDT.P Long directive (TOPSIS Conf 98.4%). Instant L1 order triggered.',
    asset: 'TAO',
  },
  {
    id: 'ev-02',
    timestamp: '2m ago',
    appId: 'app-hyper-01',
    appName: 'Hyperliquid L1 HFT Bot',
    eventType: 'TARGET_REACHED',
    detail: 'Target 1 hit on TAOUSDT.P @ $565.4 (+4.66% net PnL). Efficacy rated EXCELLENT.',
    asset: 'TAO',
    pnlDelta: 4.66,
  },
  {
    id: 'ev-03',
    timestamp: '5m ago',
    appId: 'app-bybit-02',
    appName: 'Bybit Linear Scalp Matrix',
    eventType: 'TRADE_OPENED',
    detail: 'Filled LONG position on ETHUSDT.P @ $3,520.5 with 2.1 bps slippage.',
    asset: 'ETH',
  },
  {
    id: 'ev-04',
    timestamp: '14m ago',
    appId: 'app-node-exec-05',
    appName: 'Node.js Micro-Arb Executor',
    eventType: 'APP_CONNECTED',
    detail: 'Opened persistent siphon pipe on Port 8443 via WebSocket stream.',
  },
  {
    id: 'ev-05',
    timestamp: '22m ago',
    appId: 'app-tv-relay-03',
    appName: 'TradingView Pine Webhook Relay',
    eventType: 'EFFICACY_EVALUATED',
    detail: 'Closed AVAX trade with +$1,792 profit. Zero draw-down during trade hold period.',
    asset: 'AVAX',
    pnlDelta: 4.48,
  },
];

// Generates copyable command-line or code snippets to suck signals from Port 8443
export function generateSiphonSnippets(config: SignalPortConfig) {
  const curlCmd = `# 🌊 SUCK ALL SUPER SIGNALS DIRECTLY VIA HTTP STREAM (PORT ${config.portNumber})
curl -N -X GET "https://ai.studio/build${config.streamEndpoint}?apiKey=${config.activeApiKey}" \\
  -H "Accept: text/event-stream"`;

  const pythonSuckCode = `# 🐍 Python Real-Time Signal Siphon Client (Port ${config.portNumber})
import json
import requests

SIPHON_STREAM_URL = "https://ai.studio/build${config.streamEndpoint}"
API_KEY = "${config.activeApiKey}"

def suck_super_signals():
    print(f"Connecting to Super Signal Siphon Port ${config.portNumber}...")
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "text/event-stream"
    }
    
    # Persistent stream connection ("sucking" signals in real-time)
    with requests.get(SIPHON_STREAM_URL, headers=headers, stream=True) as response:
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith("data:"):
                    signal = json.loads(decoded[5:].strip())
                    print(f"⚡ Sucked Super Signal: {signal['asset']} {signal['action']} @ \${signal['entryPrice']}")
                    
                    # 1. Execute immediately on your exchange / engine
                    # execute_trade(signal)
                    
                    # 2. Report progress back to monitor trade effectiveness
                    report_trade_progress(signal['id'], signal['asset'], pnl_pct=3.8, status="TARGET_HIT")

def report_trade_progress(signal_id, asset, pnl_pct, status):
    requests.post("https://ai.studio/build${config.reportTradeEndpoint}", json={
        "apiKey": API_KEY,
        "appName": "My Custom Python Quant",
        "signalId": signal_id,
        "asset": asset,
        "status": status,
        "pnlPct": pnl_pct
    })

if __name__ == "__main__":
    suck_super_signals()
`;

  const nodeSuckCode = `// 🚀 Node.js / TypeScript Super Signal Siphon Client (Port ${config.portNumber})
import EventSource from 'eventsource';
import axios from 'axios';

const PORT_URL = 'https://ai.studio/build${config.streamEndpoint}?apiKey=${config.activeApiKey}';
const REPORT_URL = 'https://ai.studio/build${config.reportTradeEndpoint}';

console.log('Connecting to Port ${config.portNumber} Signal Siphon...');
const sse = new EventSource(PORT_URL);

sse.onmessage = async (event) => {
  const signal = JSON.parse(event.data);
  console.log(\`✨ Sucked Signal: \${signal.asset} \${signal.action} @ $\${signal.entryPrice} (Score: \${signal.topsisScore})\`);

  // Execute trade on your engine:
  // await broker.placeOrder(signal);

  // Report execution progress so app monitors effectiveness in real-time:
  await axios.post(REPORT_URL, {
    apiKey: '${config.activeApiKey}',
    appName: 'Node Siphon Bot',
    signalId: signal.id,
    asset: signal.asset,
    status: 'OPEN',
    slippageBps: 1.2
  });
};

sse.onerror = (err) => console.error('Siphon stream error:', err);
`;

  const rustSuckCode = `// 🦀 Rust High-Speed Siphon Client
// reqwest = { version = "0.11", features = ["stream"] }
// tokio = { version = "1.0", features = ["full"] }

use futures_util::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = "https://ai.studio/build${config.streamEndpoint}?apiKey=${config.activeApiKey}";
    println!("🦀 Rust HFT Engine connected to Signal Port ${config.portNumber}");
    
    let response = reqwest::get(url).await?;
    let mut stream = response.bytes_stream();
    
    while let Some(item) = stream.next().await {
        let chunk = item?;
        let text = String::from_utf8_lossy(&chunk);
        println!("⚡ Sucked high-conviction pulse: {}", text);
    }
    Ok(())
}
`;

  return {
    curlCmd,
    pythonSuckCode,
    nodeSuckCode,
    rustSuckCode,
  };
}
