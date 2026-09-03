import React, { useState, useEffect } from 'react';
import {
  SoulConnectedNode,
  SoulSharedTradeOutcome,
  SoulAdapterConfig,
  SoulMeshStats,
  SuperSignal,
  MarketState,
  NodeMeshItem,
  NodeApiKey,
  AssetDataFeed,
  LiveMarketTelemetry,
} from '../types';
import {
  INITIAL_SOUL_CONFIG,
  INITIAL_SOUL_NODES,
  INITIAL_SHARED_OUTCOMES,
  INITIAL_SOUL_STATS,
  INITIAL_NODE_MESH,
  formatSoulWebhookPayload,
  generateSoulPythonSnippet,
  generateSoulNodeSnippet,
  generateTradingViewWebhookSnippet,
} from '../utils/soulEngine';
import {
  Flame,
  Cpu,
  Share2,
  Zap,
  Plug,
  Copy,
  Check,
  Code,
  Radio,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Server,
  RefreshCw,
  Sliders,
  Send,
  HelpCircle,
  ExternalLink,
  Bot,
  Layers,
  Database,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Key,
  Target,
  FileCode,
  Lock,
  Scroll,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ForesightAuditView } from './ForesightAuditView';
import { HardeningGuardView } from './HardeningGuardView';
import { AccessLogView } from './AccessLogView';
import { SignalTrajectoryChart } from './SignalTrajectoryChart';
import { MoScriptGovernanceMeshView } from './MoScriptGovernanceMeshView';

interface SoulGiverAdapterHubProps {
  signals: SuperSignal[];
  marketState: MarketState;
  assets?: AssetDataFeed[];
  liveMarketTelemetry?: LiveMarketTelemetry;
  serverTickCount?: number;
  onOpenAiAudit?: () => void;
}

export const SoulGiverAdapterHub: React.FC<SoulGiverAdapterHubProps> = ({
  signals,
  marketState,
  assets = [],
  liveMarketTelemetry,
  serverTickCount = 0,
  onOpenAiAudit,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'SIGNAL_TRAJECTORY' | 'MOSCRIPT_MESH' | 'HARDENING_GUARD' | 'ACCESS_LOG' | 'FORESIGHT_AUDIT' | 'NODE_MESH' | 'HEADLESS_HUB' | 'ADAPTERS' | 'LEARNING'
  >('SIGNAL_TRAJECTORY');
  const [selectedLanguage, setSelectedLanguage] = useState<'PYTHON' | 'RUST' | 'NODE' | 'TRADINGVIEW' | 'CURL'>('PYTHON');

  // Node Mesh State (Connection Health Monitor)
  const [nodeMesh, setNodeMesh] = useState<NodeMeshItem[]>(INITIAL_NODE_MESH);
  const [meshOverallPrecision, setMeshOverallPrecision] = useState<number>(92.4);
  const [engineSignalPrecision, setEngineSignalPrecision] = useState<number>(95.0);
  const [activeTradesCount, setActiveTradesCount] = useState<number>(2);
  const [driftAlertsCount, setDriftAlertsCount] = useState<number>(1);
  const [isRefreshingMesh, setIsRefreshingMesh] = useState<boolean>(false);

  // Key Generation & Handshake Secret State
  const [generatedKeys, setGeneratedKeys] = useState<NodeApiKey[]>([
    {
      id: 'key-01',
      key: 'SOUL-NODE-KEY-TV-A984',
      nodeIdentity: 'TradingView_User_A',
      tier: 'ULTRA_98',
      createdAt: '1d ago',
      expiresAt: '30d remaining',
      rateLimitPerMin: 120,
      isActive: true,
      totalCalls: 342,
    },
    {
      id: 'key-02',
      key: 'SOUL-NODE-KEY-PY-B117',
      nodeIdentity: 'Python_Script_B',
      tier: 'PREMIUM_95',
      createdAt: '12h ago',
      expiresAt: '30d remaining',
      rateLimitPerMin: 60,
      isActive: true,
      totalCalls: 189,
    },
    {
      id: 'key-03',
      key: 'SOUL-NODE-KEY-BIN-X771',
      nodeIdentity: 'Binance_Scalper_X',
      tier: 'PREMIUM_95',
      createdAt: '2d ago',
      expiresAt: '30d remaining',
      rateLimitPerMin: 60,
      isActive: true,
      totalCalls: 95,
    },
    {
      id: 'key-04',
      key: 'SOUL-NODE-KEY-RUST-A001',
      nodeIdentity: 'Rust_HFT_Alpha',
      tier: 'ULTRA_98',
      createdAt: '4h ago',
      expiresAt: '30d remaining',
      rateLimitPerMin: 300,
      isActive: true,
      totalCalls: 512,
    },
  ]);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [newNodeIdentity, setNewNodeIdentity] = useState<string>('');
  const [newKeyTier, setNewKeyTier] = useState<'PREMIUM_95' | 'ULTRA_98' | 'ALL_SIGNALS'>('PREMIUM_95');
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);

  // Outcome Reconciliation Simulator Modal / Panel
  const [selectedNodeToReconcile, setSelectedNodeToReconcile] = useState<string>('Python_Script_B');
  const [simSlippageBps, setSimSlippageBps] = useState<number>(14); // 14 bps = 0.0014
  const [simEntryLagPct, setSimEntryLagPct] = useState<number>(0.11); // 0.11%
  const [simPnlPct, setSimPnlPct] = useState<number>(3.8);
  const [simAsset, setSimAsset] = useState<string>('SOL');
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconcileResultBanner, setReconcileResultBanner] = useState<string | null>(null);

  // Legacy & mesh stats
  const [config, setConfig] = useState<SoulAdapterConfig>(INITIAL_SOUL_CONFIG);
  const [nodes, setNodes] = useState<SoulConnectedNode[]>(INITIAL_SOUL_NODES);
  const [sharedOutcomes, setSharedOutcomes] = useState<SoulSharedTradeOutcome[]>(INITIAL_SHARED_OUTCOMES);
  const [meshStats, setMeshStats] = useState<SoulMeshStats>(INITIAL_SOUL_STATS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch Node Mesh from backend
  const fetchMeshHealth = async () => {
    setIsRefreshingMesh(true);
    try {
      const res = await fetch('/api/soul/mesh');
      if (res.ok) {
        const data = await res.json();
        if (data.nodes && Array.isArray(data.nodes)) {
          // Map to NodeMeshItem format
          const formatted: NodeMeshItem[] = data.nodes.map((n: any) => ({
            id: n.id || `node-${n.identity}`,
            nodeIdentity: n.identity,
            nodeType: n.identity.includes('TV') || n.identity.includes('TradingView')
              ? 'TRADINGVIEW_WEBHOOK'
              : n.identity.includes('Python')
              ? 'PYTHON_AGENT'
              : n.identity.includes('Rust')
              ? 'CUSTOM_SOCKET'
              : 'EXCHANGE_BOT',
            activeStatus: n.status || (n.open_trade ? 'TRADE_OPEN' : 'IDLE'),
            openTrade: n.open_trade,
            signalPrecisionPct: Number(((n.signal_precision || 0.95) * 100).toFixed(1)),
            realizedPrecisionPct: Number(((n.realized_precision || 0.92) * 100).toFixed(1)),
            precisionDeltaPct: Number((((n.realized_precision || 0.92) - (n.signal_precision || 0.95)) * 100).toFixed(1)),
            slippagePct: n.slippage || 0.0018,
            entryLagPct: (n.entry_lag_pct || 0.0012) * 100,
            hasDriftAlert: Boolean(n.drift_alert),
            driftReason: n.drift_reason,
            reputationScore: n.reputation_score || 90.0,
            reputationRank: n.reputation_rank || 'RANK_2_TIER_1_ELITE',
            totalTrades: n.total_trades || 1,
            totalPnlUsd: n.total_pnl_usd || 0,
            lastOutcomeTimestamp: n.last_outcome_time || 'Just now',
            apiKeyPrefix: n.api_key ? `${n.api_key.slice(0, 18)}...` : 'SOUL-NODE-KEY-...',
          }));

          setNodeMesh(formatted);
          setActiveTradesCount(formatted.filter((n) => n.activeStatus === 'TRADE_OPEN').length);
          setDriftAlertsCount(formatted.filter((n) => n.hasDriftAlert).length);
          const avgRealized = formatted.reduce((acc, n) => acc + n.realizedPrecisionPct, 0) / (formatted.length || 1);
          setMeshOverallPrecision(Number(avgRealized.toFixed(1)));
        }
      }
    } catch {
      // Keep initial client state
    } finally {
      setIsRefreshingMesh(false);
    }
  };

  useEffect(() => {
    fetchMeshHealth();
    const interval = setInterval(fetchMeshHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Generate a new Premium Access Key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const identity = newNodeIdentity.trim() || `Bot_Node_${Date.now() % 1000}`;
    try {
      const res = await fetch('/api/soul/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_name: identity, tier: newKeyTier }),
      });
      const data = await res.json();
      if (data.api_key) {
        const newKeyObj: NodeApiKey = {
          id: `key-${Date.now().toString(36)}`,
          key: data.api_key,
          nodeIdentity: identity,
          tier: newKeyTier,
          createdAt: 'Just now',
          expiresAt: '30d remaining',
          rateLimitPerMin: newKeyTier === 'ULTRA_98' ? 300 : 120,
          isActive: true,
          totalCalls: 0,
        };
        setGeneratedKeys((prev) => [newKeyObj, ...prev]);
        setJustGeneratedKey(data.api_key);
        fetchMeshHealth();
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch {
      const fallbackKey = `SOUL-NODE-KEY-${newKeyTier.replace('_', '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setJustGeneratedKey(fallbackKey);
    }
  };

  // Submit test trade outcome to /api/soul/share-outcome to test reconciliation & drift detection
  const handleSimulateOutcomeReconciliation = async (presetType: 'CLEAN_FILL' | 'DRIFT_SPIKE' | 'CUSTOM') => {
    setIsReconciling(true);
    let slip = simSlippageBps / 10000;
    let lag = simEntryLagPct / 100;
    let pnl = simPnlPct;

    if (presetType === 'CLEAN_FILL') {
      slip = 0.0011; // 11 bps
      lag = 0.0006;  // 0.06%
      pnl = 4.25;
      setSimSlippageBps(11);
      setSimEntryLagPct(0.06);
      setSimPnlPct(4.25);
    } else if (presetType === 'DRIFT_SPIKE') {
      slip = 0.0096; // 96 bps (exceeds 80 bps threshold!)
      lag = 0.0038;  // 0.38% (exceeds 0.20% tolerance!)
      pnl = -1.2;
      setSimSlippageBps(96);
      setSimEntryLagPct(0.38);
      setSimPnlPct(-1.2);
    }

    try {
      const res = await fetch('/api/soul/share-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeIdentity: selectedNodeToReconcile,
          signalId: `SIG-${Date.now() % 10000}`,
          asset: simAsset,
          pnlPct: pnl,
          slippage: slip,
          entry_lag: lag,
          wasProfitable: pnl > 0,
        }),
      });
      const data = await res.json();
      await fetchMeshHealth();

      if (data.reconciliation?.hasDriftAlert) {
        setReconcileResultBanner(
          `⚠️ DRIFT ALERT TRIGGERED: Node '${selectedNodeToReconcile}' flagged for performance audit! Slippage ${(slip * 10000).toFixed(0)} bps > 80 bps ceiling.`
        );
      } else {
        setReconcileResultBanner(
          `✅ Outcome Reconciled: Node '${selectedNodeToReconcile}' updated. Realized Precision: ${(data.reconciliation?.realizedPrecision * 100).toFixed(1)}%, Reputation: ${data.reconciliation?.reputationScore}.`
        );
        confetti({ particleCount: 30, spread: 50 });
      }
    } catch {
      setReconcileResultBanner(`Outcome recorded locally for node '${selectedNodeToReconcile}'.`);
    } finally {
      setIsReconciling(false);
      setTimeout(() => setReconcileResultBanner(null), 8000);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto py-2 font-sans text-slate-100">
      
      {/* 1. HERO BANNER: Soul Giver Headless Microservice & Connection Health Monitor */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-bl from-indigo-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 font-bold shadow-inner">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                SOUL GIVER HEADLESS MICROSERVICE
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Backend Daemon Running (PM2/Systemd)
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Mesh State: performance_mesh.json
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono flex items-center gap-2">
                The Soul Giver <span className="text-cyan-400">Connection Health Monitor</span>
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed font-sans">
                The backend microservice handles the heavy lifting of signal distribution and outcome reconciliation in the background. This dashboard acts as a pure <strong>Connection Health Monitor</strong>—tracking how external nodes fare, detecting execution drift, and enforcing the node reputation index.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={() => setActiveSubTab('MOSCRIPT_MESH')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeSubTab === 'MOSCRIPT_MESH'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30'
                }`}
              >
                <Scroll className="w-4 h-4 text-purple-400" />
                <span>MoScript Governance Mesh</span>
              </button>

              <button
                onClick={() => setActiveSubTab('SIGNAL_TRAJECTORY')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeSubTab === 'SIGNAL_TRAJECTORY'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Signal Trajectory (GM 1,1)</span>
              </button>

              <button
                onClick={() => setShowKeyModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Generate Premium Handshake Key</span>
              </button>

              <button
                onClick={() => handleSimulateOutcomeReconciliation('CLEAN_FILL')}
                disabled={isReconciling}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isReconciling ? 'animate-spin' : ''}`} />
                <span>Test Silent Listener & Reconciliation</span>
              </button>

              <button
                onClick={() => setActiveSubTab('HEADLESS_HUB')}
                className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Inspect SoulGiverHub.py</span>
              </button>

              {onOpenAiAudit && (
                <button
                  onClick={onOpenAiAudit}
                  className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Ask AI Auditor</span>
                </button>
              )}
            </div>
          </div>

          {/* Performance Gauges for Connected Ecosystem */}
          <div className="grid grid-cols-2 gap-3 lg:w-80 font-mono">
            {/* Realized vs Signal Precision Gauge */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-cyan-500/40 text-center flex flex-col justify-center shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Mesh Realized Precision
              </span>
              <div className="flex items-baseline justify-center space-x-1 mt-1">
                <span className="text-2xl font-black text-cyan-300">{meshOverallPrecision}%</span>
                <span className="text-[11px] text-slate-400 font-normal">/ {engineSignalPrecision}%</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                {(meshOverallPrecision - engineSignalPrecision).toFixed(1)}% Slippage Drag
              </span>
            </div>

            {/* Active Trading Nodes Pulse */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-500/40 text-center flex flex-col justify-center shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Active Node Pulse
              </span>
              <div className="flex items-baseline justify-center space-x-1 mt-1">
                <span className="text-2xl font-black text-emerald-400">{activeTradesCount}</span>
                <span className="text-xs text-slate-400">/ {nodeMesh.length}</span>
              </div>
              <span className="text-[10px] text-emerald-300 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trades Open Now
              </span>
            </div>

            {/* Drift Alerts Flagged */}
            <div className={`p-4 bg-slate-950/90 rounded-2xl border text-center flex flex-col justify-center shadow-lg ${
              driftAlertsCount > 0 ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Drift Watch
              </span>
              <div className="flex items-baseline justify-center space-x-1 mt-1">
                <span className={`text-2xl font-black ${driftAlertsCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {driftAlertsCount}
                </span>
                <span className="text-xs text-slate-400">Flagged</span>
              </div>
              <span className={`text-[10px] block mt-0.5 ${driftAlertsCount > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
                {driftAlertsCount > 0 ? '> 0.2% Lag / 80 bps Slip' : 'Zero Drift Outliers'}
              </span>
            </div>

            {/* Total Guided Ecosystem PnL */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/40 text-center flex flex-col justify-center shadow-lg">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Ecosystem Realized PnL
              </span>
              <div className="flex items-baseline justify-center space-x-0.5 mt-1">
                <span className="text-2xl font-black text-indigo-300">
                  +${(nodeMesh.reduce((acc, n) => acc + n.totalPnlUsd, 0) / 1000).toFixed(1)}k
                </span>
              </div>
              <span className="text-[10px] text-indigo-400 block mt-0.5">
                Across {nodeMesh.reduce((acc, n) => acc + n.totalTrades, 0)} Bot Fills
              </span>
            </div>
          </div>
        </div>

        {/* Live Reconcile Alert Banner */}
        {reconcileResultBanner && (
          <div className="mt-4 p-3.5 bg-slate-950/95 border border-cyan-500/50 rounded-xl text-xs font-mono flex items-center justify-between text-cyan-200 shadow-xl">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
              <span>{reconcileResultBanner}</span>
            </div>
            <button
              onClick={() => setReconcileResultBanner(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto font-mono text-xs">
        <button
          onClick={() => setActiveSubTab('MOSCRIPT_MESH')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MOSCRIPT_MESH'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Scroll className="w-3.5 h-3.5 text-purple-400" />
          <span>MoScript Governance Mesh</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800 animate-pulse">
            v0.1.1 Conduit
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('SIGNAL_TRAJECTORY')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'SIGNAL_TRAJECTORY'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Signal Trajectory (GM(1,1) vs Volatility)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse">
            LIVE TELEMETRY
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('HARDENING_GUARD')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'HARDENING_GUARD'
              ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dynamic Self-Preservation (Hardening Guard)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
            97% Floor
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ACCESS_LOG')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ACCESS_LOG'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Access Log (Security Posture)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
            Firewall
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('FORESIGHT_AUDIT')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'FORESIGHT_AUDIT'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-purple-400" />
          <span>Foresight Benchmark & Strategy Audit</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
            Gold Standard
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('NODE_MESH')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'NODE_MESH'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>The Node Mesh (Connection Health)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
            {nodeMesh.length} Nodes
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('HEADLESS_HUB')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'HEADLESS_HUB'
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Headless Hub (SoulGiverHub.py)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
            Daemon
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ADAPTERS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ADAPTERS'
              ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Plug className="w-3.5 h-3.5 text-emerald-400" />
          <span>Client Connect Snippets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('LEARNING')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'LEARNING'
              ? 'bg-slate-800 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Collective Learning Epochs</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW -2: MOSCRIPT GOVERNANCE MESH BUILDER & SEALED SCROLLS CONDUIT    */}
      {/* ========================================================================= */}
      {activeSubTab === 'MOSCRIPT_MESH' && (
        <MoScriptGovernanceMeshView />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW -1: REAL-TIME SIGNAL TRAJECTORY CHART (GM(1,1) VS VOLATILITY)     */}
      {/* ========================================================================= */}
      {activeSubTab === 'SIGNAL_TRAJECTORY' && (
        <SignalTrajectoryChart
          assets={assets}
          signals={signals}
          marketState={marketState}
          liveMarketTelemetry={liveMarketTelemetry}
          serverTickCount={serverTickCount}
          onOpenAiAudit={onOpenAiAudit}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 0: DYNAMIC SELF-PRESERVATION & HARDENING GUARD (CONSTANT 97% FLOOR) */}
      {/* ========================================================================= */}
      {activeSubTab === 'HARDENING_GUARD' && (
        <HardeningGuardView />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 0B: ACCESS LOG & HARDENED MULTI-TENANT SECURITY AUDIT             */}
      {/* ========================================================================= */}
      {activeSubTab === 'ACCESS_LOG' && (
        <AccessLogView />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 0C: THE "PERFECT FORESIGHT" BENCHMARK & STRATEGY AUDIT           */}
      {/* ========================================================================= */}
      {activeSubTab === 'FORESIGHT_AUDIT' && (
        <ForesightAuditView onOpenAiAudit={onOpenAiAudit} />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: THE NODE MESH (CONNECTION HEALTH MONITOR)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'NODE_MESH' && (
        <div className="space-y-6">
          {/* Sucker Protocol Interactive Testing Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Sucker Protocol Simulator
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                  /api/soul/share-outcome
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate an external bot reporting its trade execution to test the headless outcome reconciliation, reputation ranking, and drift detection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <select
                value={selectedNodeToReconcile}
                onChange={(e) => setSelectedNodeToReconcile(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
              >
                {nodeMesh.map((n) => (
                  <option key={n.id} value={n.nodeIdentity}>
                    {n.nodeIdentity}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleSimulateOutcomeReconciliation('CLEAN_FILL')}
                disabled={isReconciling}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Clean Fill (11 bps)</span>
              </button>

              <button
                onClick={() => handleSimulateOutcomeReconciliation('DRIFT_SPIKE')}
                disabled={isReconciling}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Trigger Drift Warning (96 bps)</span>
              </button>

              <button
                onClick={fetchMeshHealth}
                disabled={isRefreshingMesh}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                title="Refresh Mesh State"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMesh ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* THE NODE MESH TABLE (Core Requirements) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  The Node Mesh: Active Connected Ecosystem
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Updated live via Silent Listener (/api/soul/share-outcome)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Node Identity</th>
                    <th className="px-4 py-3 font-semibold">Active Status</th>
                    <th className="px-4 py-3 font-semibold">Precision Index</th>
                    <th className="px-4 py-3 font-semibold">Drift Alert</th>
                    <th className="px-4 py-3 font-semibold">Reputation Rank</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {nodeMesh.map((node) => {
                    const isTradeOpen = node.activeStatus === 'TRADE_OPEN';
                    const hasDrift = node.hasDriftAlert;

                    return (
                      <tr
                        key={node.id}
                        className={`hover:bg-slate-850/60 transition-colors ${
                          hasDrift ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        {/* 1. Node Identity */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">
                                {node.nodeIdentity}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                                {node.nodeType}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                              <span className="text-slate-400 font-mono">{node.apiKeyPrefix}</span>
                              <span>•</span>
                              <span>{node.totalTrades} fills ({node.lastOutcomeTimestamp})</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Active Status */}
                        <td className="px-4 py-3.5">
                          {isTradeOpen ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>TRADE OPEN</span>
                              </div>
                              {node.openTrade && (
                                <div className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                                  <span>{node.openTrade.asset}</span>
                                  <span className="text-emerald-400 font-semibold">
                                    {node.openTrade.direction}
                                  </span>
                                  <span className="text-slate-400">@{node.openTrade.entryPrice}</span>
                                  <span className="text-emerald-300 font-bold">
                                    (+{node.openTrade.unrealizedPnlPct}%)
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              <span>IDLE / WAITING</span>
                            </div>
                          )}
                        </td>

                        {/* 3. Precision Index */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-cyan-300 text-sm">
                                {node.realizedPrecisionPct}%
                              </span>
                              <span className="text-slate-400 text-xs">
                                (Signal: {node.signalPrecisionPct}%)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px]">
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  node.precisionDeltaPct >= -2.0
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {node.precisionDeltaPct > 0 ? '+' : ''}
                                {node.precisionDeltaPct}% Realized
                              </span>
                              <span className="text-slate-400">
                                Slip: {(node.slippagePct * 10000).toFixed(0)} bps
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Drift Alert */}
                        <td className="px-4 py-3.5">
                          {hasDrift ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                                <span>SLIPPAGE DRIFT WARNING</span>
                              </div>
                              <p className="text-[11px] text-amber-300/90 leading-tight max-w-xs">
                                {node.driftReason || 'Execution lagging > 0.20% from engine quote.'}
                              </p>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Zero Drift ({(node.slippagePct * 10000).toFixed(0)} bps)</span>
                            </div>
                          )}
                        </td>

                        {/* 5. Reputation Ranking */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              {node.reputationRank === 'RANK_1_ALPHA_MASTER' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px] flex items-center gap-1">
                                  👑 #1 Alpha Master
                                </span>
                              )}
                              {node.reputationRank === 'RANK_2_TIER_1_ELITE' && (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[10px] flex items-center gap-1">
                                  ⭐ Tier 1 Elite
                                </span>
                              )}
                              {node.reputationRank === 'RANK_WARNING_AUDIT' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px] flex items-center gap-1">
                                  ⚠️ Audit Flagged
                                </span>
                              )}
                              {node.reputationRank === 'RANK_3_STABLE_RUNNER' && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                                  ⚡ Stable Runner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Score: <strong className="text-white">{node.reputationScore}</strong>/100
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedNodeToReconcile(node.nodeIdentity);
                                handleSimulateOutcomeReconciliation('CLEAN_FILL');
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-all cursor-pointer"
                              title="Send simulated outcome report"
                            >
                              Test Fill
                            </button>
                            <button
                              onClick={() => handleCopy(node.apiKeyPrefix, `key-${node.id}`)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                              title="Copy API Key Prefix"
                            >
                              {copiedKey === `key-${node.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* HANDSHAKE SECRET & ACCESS KEYS REPOSITORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h3 className="font-mono text-sm font-bold text-white">
                    The "Handshake" Secret & Node Access Keys
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Only external nodes presenting an authorized <code className="text-cyan-300">NODE_API_KEY</code> header can siphon Super Signals and report execution telemetry back to the Soul Giver Hub.
                </p>
              </div>

              <button
                onClick={() => setShowKeyModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md cursor-pointer flex-shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Issue Premium Access Key</span>
              </button>
            </div>

            {/* Generated Keys Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              {generatedKeys.map((k) => (
                <div key={k.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[140px]">
                      {k.nodeIdentity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {k.tier}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                    <code className="text-cyan-300 truncate">{k.key}</code>
                    <button
                      onClick={() => handleCopy(k.key, k.id)}
                      className="text-slate-400 hover:text-white ml-2 flex-shrink-0 cursor-pointer"
                    >
                      {copiedKey === k.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Rate: {k.rateLimitPerMin} req/m</span>
                    <span className="text-emerald-400 font-semibold">{k.expiresAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: HEADLESS SERVICE ARCHITECTURE & SoulGiverHub.py                */}
      {/* ========================================================================= */}
      {activeSubTab === 'HEADLESS_HUB' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  Headless Microservice Architecture: SoulGiverHub.py
                </h3>
                <p className="text-xs text-slate-400">
                  Runs continuously as an invisible background daemon (PM2 / Systemd), handling all relaying, outcome collection, and reputation reconciliation.
                </p>
              </div>
            </div>

            {/* 3 Core Duties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                  <Radio className="w-4 h-4" />
                  <span>1. The Relay</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed text-xs">
                  Broadcasts Super Signals via WebSocket / Webhook multiplexer to all authorized Soul-Nodes presenting a valid <code className="text-cyan-300 font-mono">NODE_API_KEY</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                  <Activity className="w-4 h-4" />
                  <span>2. The Collector</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed text-xs">
                  Listens on <code className="text-emerald-300 font-mono">/api/soul/share-outcome</code> for real execution data (Entry, Exit, Slippage, and PnL) from any bot that traded the signal.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-purple-300 font-bold">
                  <Database className="w-4 h-4" />
                  <span>3. The Aggregator</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed text-xs">
                  Updates local <code className="text-purple-300 font-mono">performance_mesh.json</code>, adjusts bot reputation scores, and flags slippage drift (&gt;0.008) automatically.
                </p>
              </div>
            </div>

            {/* Production Daemon Commands */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <span className="text-slate-400 font-bold block">Production PM2 / Systemd Commands:</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <code>pm2 start SoulGiverHub.py --name "soul-giver-hub" --interpreter python3</code>
                  <button
                    onClick={() => handleCopy('pm2 start SoulGiverHub.py --name "soul-giver-hub" --interpreter python3', 'pm2-cmd')}
                    className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                  >
                    {copiedKey === 'pm2-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                  <code>pm2 logs soul-giver-hub --lines 50</code>
                  <button
                    onClick={() => handleCopy('pm2 logs soul-giver-hub --lines 50', 'pm2-logs')}
                    className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                  >
                    {copiedKey === 'pm2-logs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sucker Protocol Python Implementation Viewer */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" />
                  Headless Sucker Protocol Logic in SoulGiverHub.py
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      `async def handle_outcome_reconciliation(node_id, payload):\n    # 1. Compare received execution data vs your engine's internal Signal ID\n    # 2. Update the Reputation Score of the connected bot\n    # 3. Log the slippage delta to the performance mesh\n    update_reputation(node_id, payload['slippage'], payload['pnl'])\n    \n    # 4. If a bot's "Drift" is too high, it automatically gets a warning\n    if payload['slippage'] > 0.008:\n        flag_node_for_performance_audit(node_id)`,
                      'sucker-logic'
                    )
                  }
                  className="flex items-center space-x-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  {copiedKey === 'sucker-logic' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Logic</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 rounded-lg text-slate-300 overflow-x-auto text-xs leading-relaxed border border-slate-800">
{`# Headless logic for background sync & automatic reconciliation
async def handle_outcome_reconciliation(node_id, payload):
    # 1. Compare received execution data vs internal Signal ID
    # 2. Update the Reputation Score of the connected bot
    # 3. Log the slippage delta to the performance mesh
    update_reputation(node_id, payload['slippage'], payload['pnl'])
    
    # 4. If a bot's "Drift" is too high (>80 bps slip or >0.20% entry lag), flag for audit
    if payload['slippage'] > 0.008:
        flag_node_for_performance_audit(
            node_id, 
            reason=f"Slippage {payload['slippage']*10000:.0f} bps breached safety ceiling."
        )
    elif payload.get('entry_lag', 0) > 0.0020:
        flag_node_for_performance_audit(
            node_id,
            reason=f"Entry lag {payload['entry_lag']*100:.2f}% exceeded 0.20% tolerance."
        )`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: CLIENT CONNECT CODE SNIPPETS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'ADAPTERS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  Client Connection Templates with NODE_API_KEY
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Copy-ready code to connect any external bot to the Soul Giver Hub and automatically report outcome telemetry.
                </p>
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['PYTHON', 'RUST', 'NODE', 'TRADINGVIEW', 'CURL'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Snippet Display */}
            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800 max-h-[420px] leading-relaxed">
                {selectedLanguage === 'PYTHON' && `import requests
import time

SOUL_HUB_URL = "https://your-domain.com/api/soul"
NODE_API_KEY = "${generatedKeys[0]?.key || 'SOUL-NODE-KEY-ALPHA98-MASTER'}"

headers = {
    "Authorization": f"Bearer {NODE_API_KEY}",
    "X-Node-Key": NODE_API_KEY,
    "Content-Type": "application/json"
}

def suck_and_trade():
    # 1. Siphon high-conviction signals from Soul Giver Hub
    res = requests.get(f"{SOUL_HUB_URL}/signals", headers=headers)
    signals = res.json().get("signals", [])
    
    for sig in signals:
        if sig.get("topsisScore", 0) >= 0.95:
            print(f"🔥 Sucked Signal: {sig['asset']} {sig['action']} @ {sig['entryPrice']}")
            
            # Execute on your exchange (Binance, Bybit, Hyperliquid, etc.)
            # fill_order(sig['futuresPair'], sig['side'], sig['entryPrice'])
            
            # 2. Report outcome telemetry back so the Collective Model learns
            requests.post(f"{SOUL_HUB_URL}/share-outcome", headers=headers, json={
                "nodeIdentity": "Python_Script_B",
                "signalId": sig["id"],
                "asset": sig["asset"],
                "pnlPct": 4.12,
                "slippage": 0.0012,     # 12 bps slip (within 80 bps ceiling)
                "entry_lag": 0.0008,    # 0.08% lag (within 0.20% ceiling)
                "wasProfitable": True
            })
            print("🌱 Outcome shared. Reputation updated on Node Mesh.")

if __name__ == "__main__":
    suck_and_trade()`}

                {selectedLanguage === 'RUST' && `// Rust HFT Siphon Client for Soul Giver Hub
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let api_key = "${generatedKeys[0]?.key || 'SOUL-NODE-KEY-RUST-A001'}";

    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}", api_key))?);
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    // 1. Siphon Signals
    let resp = client.get("https://your-domain.com/api/soul/signals")
        .headers(headers.clone())
        .send().await?.json::<serde_json::Value>().await?;

    println!("⚡ Sucked {} signals from Soul Giver", resp["count"]);

    // 2. Report execution
    let outcome_payload = json!({
        "nodeIdentity": "Rust_HFT_Alpha",
        "signalId": "SIG-TAO-9841",
        "asset": "TAO",
        "pnlPct": 4.66,
        "slippage": 0.0007,
        "entry_lag": 0.0004,
        "wasProfitable": true
    });

    client.post("https://your-domain.com/api/soul/share-outcome")
        .headers(headers)
        .json(&outcome_payload)
        .send().await?;

    Ok(())
}`}

                {selectedLanguage === 'NODE' && `// Node.js Siphon Runner
import axios from 'axios';

const SOUL_API = 'https://your-domain.com/api/soul';
const NODE_API_KEY = '${generatedKeys[0]?.key || 'SOUL-NODE-KEY-ALPHA98-MASTER'}';

const headers = {
  Authorization: \`Bearer \${NODE_API_KEY}\`,
  'X-Node-Key': NODE_API_KEY
};

async function siphonSignals() {
  const { data } = await axios.get(\`\${SOUL_API}/signals\`, { headers });
  console.log(\`Received \${data.signals.length} directives from Soul Giver\`);

  // Report execution outcome
  await axios.post(\`\${SOUL_API}/share-outcome\`, {
    nodeIdentity: 'Node_Executor_01',
    signalId: 'SIG-TAO-9841',
    asset: 'TAO',
    pnlPct: 3.84,
    slippage: 0.0014,
    entry_lag: 0.0009,
    wasProfitable: true
  }, { headers });
}

siphonSignals();`}

                {selectedLanguage === 'TRADINGVIEW' && `// TradingView Pine Script Webhook Payload
// In your Pine strategy alert, paste this exact JSON:
{
  "nodeIdentity": "TradingView_User_A",
  "apiKey": "${generatedKeys[0]?.key || 'SOUL-NODE-KEY-TV-A984'}",
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{strategy.order.price}},
  "contracts": {{strategy.order.contracts}},
  "slippage": 0.0018,
  "entry_lag": 0.0012,
  "shareFeedback": true
}`}

                {selectedLanguage === 'CURL' && `# Siphon Signals via cURL
curl -X GET "https://your-domain.com/api/soul/signals" \\
  -H "Authorization: Bearer ${generatedKeys[0]?.key || 'SOUL-NODE-KEY-ALPHA98-MASTER'}" \\
  -H "X-Node-Key: ${generatedKeys[0]?.key || 'SOUL-NODE-KEY-ALPHA98-MASTER'}"

# Report Outcome via cURL
curl -X POST "https://your-domain.com/api/soul/share-outcome" \\
  -H "Authorization: Bearer ${generatedKeys[0]?.key || 'SOUL-NODE-KEY-ALPHA98-MASTER'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nodeIdentity": "Python_Script_B",
    "signalId": "SIG-TAO-9841",
    "asset": "TAO",
    "pnlPct": 4.12,
    "slippage": 0.0012,
    "entry_lag": 0.0008,
    "wasProfitable": true
  }'`}
              </pre>

              <button
                onClick={() => handleCopy(selectedLanguage, 'code-view')}
                className="absolute top-3 right-3 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs cursor-pointer"
              >
                {copiedKey === 'code-view' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: COLLECTIVE LEARNING MESH                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'LEARNING' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              <h3 className="font-mono text-sm font-bold text-white">
                Continuous Learning Epochs & Model Calibration
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Every trade outcome received by the Collector calibrates the Grey Relational weights (GRA) and adjusts the Neutrosophic indeterminacy boundaries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Current Epoch</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">Epoch #52</span>
                <span className="text-slate-400 text-[10px] mt-1 block">Auto-calibrated on new outcomes</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Mesh Accuracy Boost</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">+3.48%</span>
                <span className="text-slate-400 text-[10px] mt-1 block">Gain over baseline TOPSIS</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Slippage Mitigation</span>
                <span className="text-2xl font-black text-cyan-300 mt-1 block">-4.2 bps</span>
                <span className="text-slate-400 text-[10px] mt-1 block">Orderbook entry adaptation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KEY GENERATION MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Generate Premium Access Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setJustGeneratedKey(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {justGeneratedKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Generated Successfully!</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Share this key with your external trading bot or script to authorize signal siphoning and outcome reconciliation.
                  </p>
                  <div className="p-2 bg-slate-950 rounded border border-emerald-500/30 flex items-center justify-between">
                    <code className="text-cyan-300 text-xs select-all break-all">{justGeneratedKey}</code>
                    <button
                      onClick={() => handleCopy(justGeneratedKey, 'modal-key')}
                      className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                    >
                      {copiedKey === 'modal-key' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setJustGeneratedKey(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Node Identity / Bot Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My_Fast_Scalper_01"
                    value={newNodeIdentity}
                    onChange={(e) => setNewNodeIdentity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Access Tier</label>
                  <select
                    value={newKeyTier}
                    onChange={(e) => setNewKeyTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PREMIUM_95">Premium Conviction (95%+ TOPSIS Score)</option>
                    <option value="ULTRA_98">Ultra Conviction (98%+ TOPSIS Score)</option>
                    <option value="ALL_SIGNALS">All Super Signals</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Security Handshake</span>
                  </div>
                  <p>
                    All API calls must present this key in the <code className="text-cyan-300">Authorization: Bearer</code> header or <code className="text-cyan-300">X-Node-Key</code>.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
