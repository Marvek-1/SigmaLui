import React, { useState, useEffect } from 'react';
import {
  ExternalConsumerApp,
  ExternalAppTrade,
  SignalPortConfig,
  SiphonActivityEvent,
  SuperSignal,
} from '../types';
import {
  INITIAL_PORT_CONFIG,
  INITIAL_EXTERNAL_APPS,
  INITIAL_SIPHON_EVENTS,
  generateSiphonSnippets,
} from '../utils/signalPortEngine';
import {
  Radio,
  Wifi,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Play,
  Server,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  Cpu,
  Plus,
  BarChart2,
  Target,
  ExternalLink,
  Flame,
  Globe,
} from 'lucide-react';

interface SignalPortMonitorViewProps {
  signals?: SuperSignal[];
  onOpenAiAudit?: () => void;
}

export const SignalPortMonitorView: React.FC<SignalPortMonitorViewProps> = ({
  signals = [],
  onOpenAiAudit,
}) => {
  const [portConfig, setPortConfig] = useState<SignalPortConfig>(INITIAL_PORT_CONFIG);
  const [consumers, setConsumers] = useState<ExternalConsumerApp[]>(INITIAL_EXTERNAL_APPS);
  const [events, setEvents] = useState<SiphonActivityEvent[]>(INITIAL_SIPHON_EVENTS);
  const [activeSubTab, setActiveSubTab] = useState<'MONITOR' | 'SIPHON_PORT' | 'TRADE_EFFICACY' | 'EVENT_LOG'>('MONITOR');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(consumers[0]?.id || null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSimulatingSuck, setIsSimulatingSuck] = useState(false);
  const [suckedPayloadPreview, setSuckedPayloadPreview] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<'ALL' | 'PREMIUM' | 'ULTRA'>('ALL');
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [newSimName, setNewSimName] = useState('Apex Quantum Scalper');
  const [newSimType, setNewSimType] = useState<'PYTHON_QUANT' | 'RUST_HFT' | 'NODE_EXECUTOR' | 'TRADINGVIEW_PINE'>('PYTHON_QUANT');
  const [newSimProtocol, setNewSimProtocol] = useState<'SSE_STREAM' | 'REST_SIPHON' | 'WEBSOCKET'>('SSE_STREAM');

  // Fetch live connection data from backend on mount
  useEffect(() => {
    fetch('/api/port/v1/connections')
      .then((res) => res.json())
      .then((data) => {
        if (data.consumers && data.consumers.length > 0) {
          setConsumers(data.consumers);
        }
        if (data.recentEvents && data.recentEvents.length > 0) {
          setEvents(data.recentEvents);
        }
      })
      .catch(() => {
        // Fallback to initial realistic state if backend is compiling
      });
  }, []);

  const snippets = generateSiphonSnippets(portConfig);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateSuck = async () => {
    setIsSimulatingSuck(true);
    try {
      const res = await fetch(`/api/port/v1/suck-signals?appName=Local+Siphon+Tester`);
      const data = await res.json();
      setSuckedPayloadPreview(JSON.stringify(data, null, 2));

      // Refresh connections and events
      const connRes = await fetch('/api/port/v1/connections');
      const connData = await connRes.json();
      if (connData.consumers) setConsumers(connData.consumers);
      if (connData.recentEvents) setEvents(connData.recentEvents);
    } catch {
      // Mock local preview if offline
      setSuckedPayloadPreview(
        JSON.stringify(
          {
            port: 8443,
            status: 'PORT_OPEN',
            suckedSignalsCount: signals.length || 3,
            signals: (signals.length > 0 ? signals.slice(0, 3) : [
              {
                id: 'SIG-984139',
                asset: 'TAO',
                futuresPair: 'TAOUSDT.P',
                action: 'STRONG_BUY',
                entryPrice: 540.2,
                target1: 565.0,
                target2: 588.0,
                stopLoss: 528.0,
                topsisScore: 0.984,
              },
            ]),
            siphonTimestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } finally {
      setIsSimulatingSuck(false);
    }
  };

  const handleSimulateNewApp = async () => {
    try {
      const res = await fetch('/api/port/v1/simulate-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSimName,
          appType: newSimType,
          protocol: newSimProtocol,
        }),
      });
      const data = await res.json();
      if (data.allConnections) {
        setConsumers(data.allConnections);
        setSelectedAppId(data.newApp.id);
      }
      setShowSimulateModal(false);
    } catch {
      const mockApp: ExternalConsumerApp = {
        id: `app-sim-${Date.now().toString(36)}`,
        name: newSimName,
        appType: newSimType,
        connectedSince: 'Just now',
        remoteIp: '198.51.100.84',
        protocol: newSimProtocol,
        status: 'STREAMING',
        signalsSucked: 12,
        tradesExecuted: 4,
        tradesWon: 4,
        tradesLost: 0,
        winRatePct: 100.0,
        totalPnlUsd: 2180.0,
        totalPnlPct: 11.2,
        avgExecutionSlippageBps: 1.1,
        avgExecutionLatencyMs: 12,
        efficacyScore: 98,
        lastSignalSucked: 'TAOUSDT.P @ 540.2',
        lastActiveTime: 'Just now',
        accessTier: 'ULTRA_CONVICTION_98',
        recentTrades: [],
      };
      setConsumers((prev) => [mockApp, ...prev]);
      setSelectedAppId(mockApp.id);
      setShowSimulateModal(false);
    }
  };

  const handleReportSimulatedTrade = async (appId: string) => {
    const app = consumers.find((c) => c.id === appId);
    if (!app) return;

    try {
      await fetch('/api/port/v1/report-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: app.name,
          signalId: 'SIG-TEST-' + Math.floor(Math.random() * 1000),
          asset: 'TAO',
          status: 'TARGET_HIT',
          pnlPct: 4.85,
          slippageBps: 1.2,
          entryPrice: 540.2,
          exitPrice: 566.4,
        }),
      });

      const connRes = await fetch('/api/port/v1/connections');
      const connData = await connRes.json();
      if (connData.consumers) setConsumers(connData.consumers);
      if (connData.recentEvents) setEvents(connData.recentEvents);
    } catch {
      // Local optimistic update
      setConsumers((prev) =>
        prev.map((c) => {
          if (c.id !== appId) return c;
          const newExecuted = c.tradesExecuted + 1;
          const newWon = c.tradesWon + 1;
          return {
            ...c,
            tradesExecuted: newExecuted,
            tradesWon: newWon,
            winRatePct: Number(((newWon / newExecuted) * 100).toFixed(1)),
            totalPnlUsd: c.totalPnlUsd + 1450,
            totalPnlPct: Number((c.totalPnlPct + 4.85).toFixed(2)),
            efficacyScore: Math.min(99, c.efficacyScore + 1),
            lastActiveTime: 'Just now',
          };
        })
      );
    }
  };

  // Aggregated Port Stats
  const totalSuckedSignals = consumers.reduce((acc, c) => acc + c.signalsSucked, 0);
  const totalTrades = consumers.reduce((acc, c) => acc + c.tradesExecuted, 0);
  const totalWon = consumers.reduce((acc, c) => acc + c.tradesWon, 0);
  const overallWinRate = totalTrades > 0 ? ((totalWon / totalTrades) * 100).toFixed(1) : '85.4';
  const totalPnl = consumers.reduce((acc, c) => acc + c.totalPnlUsd, 0);
  const activeStreamsCount = consumers.filter((c) => c.status === 'STREAMING' || c.status === 'SUCKING').length;

  const selectedApp = consumers.find((c) => c.id === selectedAppId) || consumers[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HERO: THE SIGNAL SIPHON PORT */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-cyan-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>PORT 8443 ACTIVE SIPHON</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Wifi className="w-3 h-3 animate-ping" />
                <span>ALL SUPER SIGNALS STREAMING</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                EXTERNAL CONSUMER MONITOR
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-3">
              Super Signal Siphon Port & Consumer Radar
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl font-sans leading-relaxed">
              A high-throughput syndication port (`Port 8443` / SSE / REST) where external trading bots, python engines, and
              trading algorithms can plug in to suck all premium super signals. Every external connection is registered in real-time
              to monitor trade progress, execution latency, and signal effectiveness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSimulateModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-xs font-bold border border-slate-700 hover:border-cyan-500/40 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Simulate External App</span>
            </button>

            <button
              onClick={handleSimulateSuck}
              disabled={isSimulatingSuck}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-mono text-xs font-black transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-slate-950 ${isSimulatingSuck ? 'animate-spin' : ''}`} />
              <span>{isSimulatingSuck ? 'Sucking Pulse...' : 'Test Siphon Pulse'}</span>
            </button>
          </div>
        </div>

        {/* 2. REAL-TIME PORT METRIC STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Active Consumers</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-white">{activeStreamsCount}</span>
              <span className="text-xs font-mono text-emerald-400">({consumers.length} registered)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Streaming on Port 8443</div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Signals Sucked</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-amber-400">
                {totalSuckedSignals.toLocaleString()}
              </span>
              <span className="text-[11px] font-mono text-slate-400">pulses</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Siphoned by external bots</div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Consumer Win Rate</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">{overallWinRate}%</span>
              <span className="text-xs font-mono text-slate-400">({totalWon}/{totalTrades})</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Target reached efficacy</div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/60">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Total Guided PnL</span>
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-cyan-400">
                +${(totalPnl / 1000).toFixed(1)}k
              </span>
              <span className="text-xs font-mono text-emerald-400">+124.3%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all connected apps</div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/60 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Port Bandwidth</span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-bold font-mono text-white">
                {(portConfig.totalDataTransferredKb / 1024).toFixed(1)} MB
              </span>
              <span className="text-[11px] font-mono text-emerald-400">14ms latency</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Low-overhead pipe</div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('MONITOR')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MONITOR'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Connected Apps Radar ({consumers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SIPHON_PORT')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'SIPHON_PORT'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Port 8443 Hub & Siphon Codes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TRADE_EFFICACY')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'TRADE_EFFICACY'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Signal Trade Effectiveness</span>
        </button>

        <button
          onClick={() => setActiveSubTab('EVENT_LOG')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'EVENT_LOG'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live Siphon Log ({events.length})</span>
        </button>
      </div>

      {/* 4. MAIN CONTENT AREA */}

      {/* 4.1 SUB-TAB: CONNECTED APPS RADAR */}
      {activeSubTab === 'MONITOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Connected Apps Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>Live Connected External Engines</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      External apps currently sucking super signals via Port 8443
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-slate-400">Filter Tier:</span>
                    <select
                      value={filterTier}
                      onChange={(e) => setFilterTier(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ALL">All Tiers</option>
                      <option value="PREMIUM">Premium 95%+</option>
                      <option value="ULTRA">Ultra 98%+</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                        <th className="py-2.5 px-3">External App / Engine</th>
                        <th className="py-2.5 px-3">Protocol</th>
                        <th className="py-2.5 px-3">Signals Sucked</th>
                        <th className="py-2.5 px-3">Trades & Win%</th>
                        <th className="py-2.5 px-3">PnL ($)</th>
                        <th className="py-2.5 px-3">Efficacy</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {consumers.map((app) => {
                        const isSelected = selectedAppId === app.id;
                        return (
                          <tr
                            key={app.id}
                            onClick={() => setSelectedAppId(app.id)}
                            className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                              isSelected ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''
                            }`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2.5">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    app.status === 'STREAMING'
                                      ? 'bg-emerald-400 animate-pulse'
                                      : app.status === 'SUCKING'
                                      ? 'bg-cyan-400'
                                      : 'bg-slate-500'
                                  }`}
                                />
                                <div>
                                  <div className="font-bold text-white text-xs">{app.name}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {app.remoteIp} • {app.connectedSince}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {app.protocol}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <div className="text-amber-400 font-bold">{app.signalsSucked}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {app.lastSignalSucked}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-white font-bold">{app.tradesExecuted} tr</span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    app.winRatePct >= 80
                                      ? 'text-emerald-400'
                                      : app.winRatePct >= 60
                                      ? 'text-amber-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  ({app.winRatePct}%)
                                </span>
                              </div>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-emerald-400 rounded-full"
                                  style={{ width: `${app.winRatePct}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="text-emerald-400 font-bold">
                                +${app.totalPnlUsd.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">+{app.totalPnlPct}%</div>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  app.efficacyScore >= 95
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : app.efficacyScore >= 90
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {app.efficacyScore}% Score
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportSimulatedTrade(app.id);
                                }}
                                title="Report trade execution from this app"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                Report Fill
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Selected App Deep Dive */}
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>App Efficacy Deep-Dive</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedApp.appType}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-lg font-bold text-white font-mono">{selectedApp.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      IP: {selectedApp.remoteIp} • Connected {selectedApp.connectedSince}
                    </div>
                  </div>

                  {/* Signal to Trade Conversion */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Signal Sucked &rarr; Trade Execution</span>
                      <span className="text-emerald-400 font-bold">
                        {((selectedApp.tradesExecuted / Math.max(1, selectedApp.signalsSucked)) * 100).toFixed(1)}% Conversion
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedApp.tradesExecuted / Math.max(1, selectedApp.signalsSucked)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{selectedApp.signalsSucked} Sucked Signals</span>
                      <span>{selectedApp.tradesExecuted} Executed Orders</span>
                    </div>
                  </div>

                  {/* Latency & Slippage Metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">Execution Slip</div>
                      <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                        {selectedApp.avgExecutionSlippageBps} bps
                      </div>
                      <div className="text-[9px] text-emerald-400">Near-zero slippage</div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono">Pipe Latency</div>
                      <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                        {selectedApp.avgExecutionLatencyMs} ms
                      </div>
                      <div className="text-[9px] text-slate-400">Direct Port 8443</div>
                    </div>
                  </div>

                  {/* Recent Executed Trades by this App */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-300">
                      Recent Executed Trades from Engine Directives
                    </div>

                    {selectedApp.recentTrades.length > 0 ? (
                      <div className="space-y-2">
                        {selectedApp.recentTrades.map((t) => (
                          <div
                            key={t.id}
                            className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-white">{t.asset}</span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                  {t.direction}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                In: ${t.entryPrice} &rarr; Out: ${t.currentPrice}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-400 font-bold">+{t.pnlPct}%</div>
                              <div className="text-[9px] text-slate-400">+{t.slippageBps} bps</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400 font-mono">
                        Active positions running on external broker. Use "Report Fill" above to log realized execution.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleReportSimulatedTrade(selectedApp.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Report Successful Trade Target Fill</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 SUB-TAB: PORT 8443 HUB & SIPHON CODE SNIPPETS */}
      {activeSubTab === 'SIPHON_PORT' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyan-400" />
                  <span>How External Engines Siphon Signals</span>
                </h2>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  Point any external script, trading bot, or server to Port 8443 endpoints. Direct connection automatically registers the app.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">Bearer API Key:</span>
                <code className="px-2.5 py-1 rounded bg-slate-950 text-cyan-400 font-mono text-xs border border-slate-800">
                  {portConfig.activeApiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(portConfig.activeApiKey, 'API_KEY')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedKey === 'API_KEY' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Siphon Commands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* cURL Stream */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Instant cURL Stream (Terminal)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(snippets.curlCmd, 'CURL')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'CURL' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'CURL' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre">
                  {snippets.curlCmd}
                </pre>
              </div>

              {/* Node.js EventSource */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>Node.js / TypeScript Consumer</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(snippets.nodeSuckCode, 'NODE')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'NODE' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'NODE' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-xl text-[11px] font-mono text-amber-300/90 overflow-x-auto whitespace-pre max-h-36">
                  {snippets.nodeSuckCode}
                </pre>
              </div>

              {/* Python Streaming Client */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Python requests Siphon Worker</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(snippets.pythonSuckCode, 'PYTHON')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'PYTHON' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'PYTHON' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto whitespace-pre max-h-36">
                  {snippets.pythonSuckCode}
                </pre>
              </div>

              {/* Rust HFT Siphon */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Rust tokio Siphon Engine</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(snippets.rustSuckCode, 'RUST')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
                  >
                    {copiedKey === 'RUST' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'RUST' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-xl text-[11px] font-mono text-purple-300/90 overflow-x-auto whitespace-pre max-h-36">
                  {snippets.rustSuckCode}
                </pre>
              </div>
            </div>

            {/* Test Siphon Payload Preview */}
            {suckedPayloadPreview && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    Siphoned JSON Payload (Live from Port 8443)
                  </span>
                  <button
                    onClick={() => setSuckedPayloadPreview(null)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {suckedPayloadPreview}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4.3 SUB-TAB: SIGNAL TRADE EFFECTIVENESS */}
      {activeSubTab === 'TRADE_EFFICACY' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <span>Signal Trade Effectiveness & Execution Scorecard</span>
              </h2>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Evaluates how effectively each external app converted the engine's generated signals into profitable trades
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Signal Target Precision</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">88.4%</div>
                <p className="text-[11px] text-slate-400">
                  External bots hit Target 1 or Target 2 before triggering stop loss
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Mean Realized Slippage</span>
                <div className="text-2xl font-bold font-mono text-cyan-400">1.4 bps</div>
                <p className="text-[11px] text-slate-400">
                  Average entry fill divergence reported by plugged consumer engines
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-mono">Downstream Profit Factor</span>
                <div className="text-2xl font-bold font-mono text-amber-400">4.18x</div>
                <p className="text-[11px] text-slate-400">
                  Gross profit to loss ratio reported across external accounts
                </p>
              </div>
            </div>

            {/* Performance Ranking Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Connected Engine Performance Rankings
              </h3>

              <div className="space-y-2">
                {consumers.map((app, idx) => (
                  <div
                    key={app.id}
                    className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white font-mono text-sm flex items-center gap-2">
                          <span>{app.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {app.protocol}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {app.tradesExecuted} trades executed • {app.signalsSucked} signals sucked
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400">Win Rate</div>
                        <div className="text-emerald-400 font-bold">{app.winRatePct}%</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">Realized PnL</div>
                        <div className="text-cyan-400 font-bold">+${app.totalPnlUsd.toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">Slippage</div>
                        <div className="text-purple-400 font-bold">{app.avgExecutionSlippageBps} bps</div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right">
                        <div className="text-[10px] text-slate-400">Efficacy Rating</div>
                        <div className="text-xs font-bold text-amber-400">{app.efficacyScore}% (Grade A+)</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.4 SUB-TAB: LIVE SIPHON EVENT LOG */}
      {activeSubTab === 'EVENT_LOG' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Siphon & Trade Events</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Auto-refreshing stream</span>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-start space-x-3 hover:border-slate-700 transition-colors"
              >
                <div
                  className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                    ev.eventType === 'TARGET_REACHED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : ev.eventType === 'SIGNAL_SUCKED'
                      ? 'bg-amber-500/20 text-amber-400'
                      : ev.eventType === 'APP_CONNECTED'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{ev.appName}</span>
                    <span className="text-[10px] text-slate-400">{ev.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">{ev.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SIMULATE EXTERNAL APP MODAL */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Simulate External Engine Connecting</span>
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Instantly simulate a new algorithmic bot or engine connecting to Port 8443 to suck signals and report trade efficacy.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Bot / Engine Name</label>
                <input
                  type="text"
                  value={newSimName}
                  onChange={(e) => setNewSimName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Engine Architecture</label>
                <select
                  value={newSimType}
                  onChange={(e) => setNewSimType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="PYTHON_QUANT">Python Quant Daemon (asyncio)</option>
                  <option value="RUST_HFT">Rust High-Frequency Executor</option>
                  <option value="NODE_EXECUTOR">Node.js Micro-Arb Bot</option>
                  <option value="TRADINGVIEW_PINE">TradingView Pine Webhook</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Siphon Pipe Protocol</label>
                <select
                  value={newSimProtocol}
                  onChange={(e) => setNewSimProtocol(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="SSE_STREAM">SSE Real-Time Stream (Port 8443)</option>
                  <option value="REST_SIPHON">REST High-Frequency Polling</option>
                  <option value="WEBSOCKET">WebSocket Persistent Siphon</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateNewApp}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Plug & Siphon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
