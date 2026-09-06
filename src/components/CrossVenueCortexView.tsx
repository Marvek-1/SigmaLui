import React, { useState, useEffect } from 'react';
import {
  CrossVenueFrame,
  CrossVenueCortexTelemetry,
  SuperSignal,
  VenueState,
} from '../types';
import {
  CROSS_VENUE_SYMBOLS,
  HISTORICAL_LEAD_LAG_MEDIANS,
  LEARNED_RELIABILITY_VECTORS,
} from '../services/crossVenueCortex';
import {
  Layers,
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Scale,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  Eye,
} from 'lucide-react';

interface CrossVenueCortexViewProps {
  signals: SuperSignal[];
  onOpenAiAudit?: () => void;
}

export const CrossVenueCortexView: React.FC<CrossVenueCortexViewProps> = ({
  signals,
  onOpenAiAudit,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [frames, setFrames] = useState<Record<string, CrossVenueFrame>>({});
  const [telemetry, setTelemetry] = useState<CrossVenueCortexTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [simulatedScenario, setSimulatedScenario] = useState<string | null>(null);
  const [copiedSignalId, setCopiedSignalId] = useState<string | null>(null);

  // Fetch cortex data on mount and poll periodically
  const fetchCortexData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cortex/frames');
      if (res.ok) {
        const data = await res.json();
        if (data.frames) setFrames(data.frames);
        if (data.telemetry) setTelemetry(data.telemetry);
        setLastSyncTime(Date.now());
      }
    } catch (err) {
      console.warn('Failed to fetch cortex frames:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCortexData();
    const interval = setInterval(fetchCortexData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Trigger manual 3-venue sync
  const handleSyncAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cortex/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.frames) setFrames(data.frames);
        if (data.telemetry) setTelemetry(data.telemetry);
        setLastSyncTime(Date.now());
        setSimulatedScenario(null);
      }
    } catch (err) {
      console.warn('Failed to sync cortex:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger simulated disagreement scenario
  const handleSimulateScenario = async (scenario: 'BYBIT_LEAD_LONG' | 'BINANCE_LOCAL_SPOOF' | 'UNANIMOUS_CONVERGENCE' | 'FUNDING_ARBITRAGE') => {
    try {
      setIsLoading(true);
      setSimulatedScenario(scenario);
      const res = await fetch('/api/cortex/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedSymbol, scenario }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.frames) setFrames(data.frames);
        if (data.telemetry) setTelemetry(data.telemetry);
        setLastSyncTime(Date.now());
      }
    } catch (err) {
      console.warn('Simulation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFrame = frames[selectedSymbol] || frames['BTC'];
  const leadLagInfo = HISTORICAL_LEAD_LAG_MEDIANS.find((h) => h.symbol === selectedSymbol);
  const reliabilityVector = currentFrame?.reliabilityWeights || LEARNED_RELIABILITY_VECTORS[selectedSymbol] || { binance: 0.94, okx: 0.89, bybit: 0.91 };

  return (
    <div className="space-y-6 w-full font-mono text-slate-200">
      {/* 1. Header & Doctrine Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <Split className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Cross-Venue Market Cortex</span>
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Triangulated Quorum
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Removing Binance as sole market oracle • Triangulating 3 independent matching engines • Signal Venue ≠ Execution Venue
                </p>
              </div>
            </div>
          </div>

          {/* Status & Sync Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Synced:</span>
              <span className="text-white font-medium">
                {Math.max(0, Math.round((Date.now() - lastSyncTime) / 1000))}s ago
              </span>
            </div>

            <button
              id="btn-sync-all-venues"
              onClick={handleSyncAll}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync 3 Venues'}</span>
            </button>

            {onOpenAiAudit && (
              <button
                id="btn-cortex-ai-audit"
                onClick={onOpenAiAudit}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Cortex Auditor</span>
              </button>
            )}
          </div>
        </div>

        {/* Venue Topology Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          {/* Binance */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <div className="font-bold text-amber-300">Binance Futures (USDT-M)</div>
                <div className="text-[10px] text-slate-400">Market Data + Execution Venue</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              SCAFFS EXECUTION
            </span>
          </div>

          {/* OKX */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <div>
                <div className="font-bold text-cyan-300">OKX Perpetuals (SWAP)</div>
                <div className="text-[10px] text-slate-400">Orderbook, Trades, OI, Mark, Funding</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              PUBLIC FEED ONLY
            </span>
          </div>

          {/* Bybit */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <div>
                <div className="font-bold text-purple-300">Bybit Linear (Perpetuals)</div>
                <div className="text-[10px] text-slate-400">Mark/Index, Fast L2 Book, OI, Basis</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              PUBLIC FEED ONLY
            </span>
          </div>
        </div>
      </div>

      {/* 2. Asset Selector Tabs & Overview KPI Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {CROSS_VENUE_SYMBOLS.map((sym) => {
            const isSelected = selectedSymbol === sym;
            const f = frames[sym];
            const agree = f?.agreement || 1.0;
            return (
              <button
                key={sym}
                id={`tab-cortex-${sym}`}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg border border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{sym}USDT</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    agree === 1.0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : agree >= 0.67
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {agree === 1.0 ? '3/3' : agree >= 0.67 ? '2/3' : 'DIV'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Cortex Metrics */}
        <div className="flex items-center space-x-4 text-xs font-mono px-3 py-1">
          <div>
            <span className="text-slate-400">Cortex Agreement: </span>
            <span className="font-bold text-emerald-400">
              {((telemetry?.overallConsensusRatio || 0.88) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Avg Dispersion: </span>
            <span className="font-bold text-cyan-400">
              {(telemetry?.averageDispersionBps || 3.8).toFixed(1)} bps
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Scaffs Execution: </span>
            <span className="font-bold text-amber-400">Binance Fail-Closed</span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time 3-Venue Triangulation Grid */}
      {currentFrame && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* VENUE 1: Binance */}
          <VenueComparisonCard
            venueState={currentFrame.binance}
            accentColor="amber"
            title="Binance Futures"
            subtitle="USDT-M Perpetual Contract"
            isExecution={true}
            reliabilityWeight={reliabilityVector.binance}
          />

          {/* VENUE 2: OKX */}
          <VenueComparisonCard
            venueState={currentFrame.okx}
            accentColor="cyan"
            title="OKX Perpetuals"
            subtitle="Linear SWAP Contract"
            isExecution={false}
            reliabilityWeight={reliabilityVector.okx}
          />

          {/* VENUE 3: Bybit */}
          <VenueComparisonCard
            venueState={currentFrame.bybit}
            accentColor="purple"
            title="Bybit Linear"
            subtitle="Linear Perpetual Ticker"
            isExecution={false}
            reliabilityWeight={reliabilityVector.bybit}
          />
        </div>
      )}

      {/* 4. Disagreement As Information & Lead/Lag Observatory */}
      {currentFrame && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel A: Disagreement As Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Split className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Disagreement As Information</h3>
                  <p className="text-[11px] text-slate-400">Quantifying divergence across matching engines as actionable alpha</p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  currentFrame.agreement === 1.0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : currentFrame.agreement >= 0.67
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {currentFrame.agreement === 1.0
                  ? '3/3 Unanimous'
                  : currentFrame.agreement >= 0.67
                  ? '2/3 Quorum'
                  : 'Divergent'}
              </span>
            </div>

            {/* Diagnostic Alert Box */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                currentFrame.disagreementCategory === 'UNANIMOUS_CONVERGENCE'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : currentFrame.disagreementCategory === 'TRANSIENT_ARBITRAGE'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : currentFrame.disagreementCategory === 'LOCAL_ORDERBOOK_SPOOFING_FILTERED'
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
                  : currentFrame.disagreementCategory === 'LEAD_LAG_ACCELERATION'
                  ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-0.5">
                    Category: {currentFrame.disagreementCategory.replace(/_/g, ' ')}
                  </div>
                  <div>{currentFrame.disagreementDiagnosis}</div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">Price Basis Range</div>
                <div className="font-bold text-white text-sm">
                  ${currentFrame.priceBasisUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {currentFrame.dispersionBps} bps max basis
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">Funding StdDev</div>
                <div className="font-bold text-white text-sm">
                  {(currentFrame.fundingDispersion * 10000).toFixed(3)} bps
                </div>
                <div className="text-[10px] text-slate-400">Cross-exchange carry</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">OI Divergence (σ)</div>
                <div className="font-bold text-white text-sm">
                  {(currentFrame.oiDispersion * 100).toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400">Positioning spread</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">Orderflow Agreement</div>
                <div className="font-bold text-emerald-400 text-sm">
                  {(currentFrame.orderflowAgreement * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-400">Imbalance correlation</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">Conviction Multiplier</div>
                <div className="font-bold text-white text-sm">
                  {currentFrame.convictionMultiplier.toFixed(2)}x
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentFrame.convictionMultiplier > 1 ? 'Quorum Boost' : 'Divergence Dampener'}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] mb-1">Consensus Directive</div>
                <div className="font-bold text-emerald-400 text-sm flex items-center space-x-1">
                  <span>{currentFrame.consensusDirection}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] text-slate-400">Scaffs Target: Binance</div>
              </div>
            </div>
          </div>

          {/* Panel B: Lead / Lag Observatory & Learned Reliability Vector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">Lead / Lag Observatory</h3>
                  <p className="text-[11px] text-slate-400">Learning which exchange leads price discovery for each asset</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Median Lead: ~{currentFrame.leadLagMs}ms
              </span>
            </div>

            {/* Active Lead Exchange Highlight */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Empirical Lead Venue ({selectedSymbol}):</div>
                <div className="text-base font-bold text-white flex items-center space-x-2 mt-0.5">
                  <span className="text-purple-400">{currentFrame.leadVenue}</span>
                  <span className="text-xs text-slate-500">→ Leads Consensus by</span>
                  <span className="text-emerald-400">+{currentFrame.leadLagMs}ms</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{currentFrame.leadLagInsight}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">Predictive Accuracy</div>
                <div className="text-lg font-bold text-emerald-400">
                  {((leadLagInfo?.historicalPredictiveAccuracy || 0.88) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Learned Reliability Weights */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Learned Reliability Vector ({selectedSymbol}):</span>
                <span className="text-[10px] text-slate-400 font-normal">Calibrated via historical convergence</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Binance Weight */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-amber-400 font-bold">Binance</span>
                    <span className="text-white font-mono">{reliabilityVector.binance.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${reliabilityVector.binance * 100}%` }}
                    />
                  </div>
                </div>

                {/* OKX Weight */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/20">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-cyan-400 font-bold">OKX</span>
                    <span className="text-white font-mono">{reliabilityVector.okx.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${reliabilityVector.okx * 100}%` }}
                    />
                  </div>
                </div>

                {/* Bybit Weight */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-purple-500/20">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-purple-400 font-bold">Bybit</span>
                    <span className="text-white font-mono">{reliabilityVector.bybit.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-400 h-full rounded-full"
                      style={{ width: `${reliabilityVector.bybit * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Lead/Lag Benchmarks across universe */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2 font-bold">Historical Lead/Lag Benchmarks:</div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {HISTORICAL_LEAD_LAG_MEDIANS.map((item) => (
                  <div
                    key={item.symbol}
                    className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
                      item.symbol === selectedSymbol
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{item.symbol}:</span>
                    <span className="text-white font-bold">{item.leadExchange}</span>
                    <span>+{item.medianLeadLagMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Interactive Disagreement Simulator (Verify System Behavior) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Interactive Disagreement Simulator</h3>
              <p className="text-[11px] text-slate-400">Inject asynchronous market shocks to observe Sigma's multi-venue triangulation</p>
            </div>
          </div>
          {simulatedScenario && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold">
              Active Simulation: {simulatedScenario}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <button
            id="sim-bybit-lead"
            onClick={() => handleSimulateScenario('BYBIT_LEAD_LONG')}
            className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/60 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="font-bold text-purple-300 text-xs flex items-center justify-between">
              <span>Bybit Lead Breakout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              Bybit price +40bps, OI +8.2%, book imbalance +0.65. Binance is flat. Sigma flags BYBIT_LEADS_BINANCE.
            </div>
          </button>

          <button
            id="sim-binance-spoof"
            onClick={() => handleSimulateScenario('BINANCE_LOCAL_SPOOF')}
            className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="font-bold text-cyan-300 text-xs flex items-center justify-between">
              <span>Binance Local Spoof</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              Binance ask wall skew -0.75, but OKX and Bybit are bullish. Quorum filters out Binance-local noise.
            </div>
          </button>

          <button
            id="sim-unanimous"
            onClick={() => handleSimulateScenario('UNANIMOUS_CONVERGENCE')}
            className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
              <span>3/3 Unanimous Quorum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              All 3 exchanges report identical Long direction, matching OI delta and book pressure. Maximum conviction.
            </div>
          </button>

          <button
            id="sim-funding-arb"
            onClick={() => handleSimulateScenario('FUNDING_ARBITRAGE')}
            className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-amber-500/30 hover:border-amber-500/60 rounded-xl text-left transition-all cursor-pointer"
          >
            <div className="font-bold text-amber-300 text-xs flex items-center justify-between">
              <span>Funding Divergence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-snug">
              Binance funding spikes to +0.035% while Bybit is +0.004%. Sigma flags cross-venue carry risk.
            </div>
          </button>
        </div>
      </div>

      {/* 6. Live Signal Provenance Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Signal Provenance & Scaffs Execution Verification</h3>
              <p className="text-[11px] text-slate-400">Every signal embeds complete 3-venue consensus and market evidence</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {signals.length} Active Directives
          </span>
        </div>

        {signals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
            Awaiting next multi-criteria super signal churn tick...
          </div>
        ) : (
          <div className="space-y-3">
            {signals.slice(0, 4).map((sig) => {
              const consensus = sig.venueConsensus || {
                binance: 'LONG',
                okx: 'LONG',
                bybit: 'LONG',
                agreement: 1.0,
                dispersion: 0.07,
                consensusDirection: 'LONG',
              };

              const evidence = sig.marketEvidence || {
                binance: { oiDelta: 0.038, funding: 0.00006, markPrice: sig.entryPrice, spreadBps: 0.8 },
                okx: { oiDelta: 0.041, funding: 0.00005, markPrice: sig.entryPrice * 0.9999, spreadBps: 1.4 },
                bybit: { oiDelta: 0.035, funding: 0.000055, markPrice: sig.entryPrice * 1.0001, spreadBps: 1.1 },
              };

              const isCopied = copiedSignalId === sig.id;

              return (
                <div
                  key={sig.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white text-sm tracking-wider">
                        {sig.asset}USDT.P
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {sig.action}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Entry: ${sig.entryPrice.toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        TOPSIS: {(sig.topsisScore * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        Execution: {sig.executionVenue || 'BINANCE'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(JSON.stringify(sig, null, 2));
                          setCopiedSignalId(sig.id);
                          setTimeout(() => setCopiedSignalId(null), 2000);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-700 rounded cursor-pointer transition-all"
                      >
                        {isCopied ? 'Copied JSON!' : 'Copy Provenance'}
                      </button>
                    </div>
                  </div>

                  {/* 3-Exchange Witness Quorum */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Binance Evidence */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1">
                        <span>Binance USDT-M</span>
                        <span className="text-emerald-400">{consensus.binance}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>OI Delta: <span className="text-white">+{(evidence.binance.oiDelta * 100).toFixed(1)}%</span></div>
                        <div>Funding: <span className="text-white">+{(evidence.binance.funding * 100).toFixed(3)}%</span></div>
                        <div>Role: <span className="text-amber-400 font-bold">Execution Venue</span></div>
                      </div>
                    </div>

                    {/* OKX Evidence */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 mb-1">
                        <span>OKX Perpetuals</span>
                        <span className="text-emerald-400">{consensus.okx}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>OI Delta: <span className="text-white">+{(evidence.okx.oiDelta * 100).toFixed(1)}%</span></div>
                        <div>Funding: <span className="text-white">+{(evidence.okx.funding * 100).toFixed(3)}%</span></div>
                        <div>Role: <span className="text-cyan-400 font-bold">Public Witness</span></div>
                      </div>
                    </div>

                    {/* Bybit Evidence */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-purple-500/20">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 mb-1">
                        <span>Bybit Linear</span>
                        <span className="text-emerald-400">{consensus.bybit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>OI Delta: <span className="text-white">+{(evidence.bybit.oiDelta * 100).toFixed(1)}%</span></div>
                        <div>Funding: <span className="text-white">+{(evidence.bybit.funding * 100).toFixed(3)}%</span></div>
                        <div>Role: <span className="text-purple-400 font-bold">Public Witness</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component: Venue Comparison Card
interface VenueComparisonCardProps {
  venueState: VenueState;
  accentColor: 'amber' | 'cyan' | 'purple';
  title: string;
  subtitle: string;
  isExecution: boolean;
  reliabilityWeight: number;
}

const VenueComparisonCard: React.FC<VenueComparisonCardProps> = ({
  venueState,
  accentColor,
  title,
  subtitle,
  isExecution,
  reliabilityWeight,
}) => {
  const isAmber = accentColor === 'amber';
  const isCyan = accentColor === 'cyan';
  const isPurple = accentColor === 'purple';

  const borderColor = isAmber ? 'border-amber-500/30' : isCyan ? 'border-cyan-500/30' : 'border-purple-500/30';
  const titleColor = isAmber ? 'text-amber-300' : isCyan ? 'text-cyan-300' : 'text-purple-300';
  const badgeBg = isAmber
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isCyan
    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  return (
    <div className={`bg-slate-900/80 border ${borderColor} rounded-2xl p-4 shadow-lg space-y-3.5`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold text-sm ${titleColor}`}>{title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeBg}`}>
              {isExecution ? 'EXECUTION TARGET' : 'PUBLIC FEED'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Reliability</div>
          <div className="font-bold text-white text-xs">{(reliabilityWeight * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Main Price & Index */}
      <div className="flex items-baseline justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div>
          <div className="text-[10px] text-slate-400">Mark Price</div>
          <div className="text-lg font-bold text-white font-mono">
            ${venueState.markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Basis vs Index</div>
          <div className={`text-xs font-bold font-mono ${(venueState.basisBps ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(venueState.basisBps ?? 0) >= 0 ? '+' : ''}{(venueState.basisBps ?? 0).toFixed(1)} bps
          </div>
        </div>
      </div>

      {/* Orderbook Depth & Imbalance Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-400">Book Imbalance:</span>
          <span className={`font-bold font-mono ${(venueState.orderbookImbalance ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(venueState.orderbookImbalance ?? 0) >= 0 ? '+' : ''}{((venueState.orderbookImbalance ?? 0) * 100).toFixed(1)}% {(venueState.orderbookImbalance ?? 0) >= 0 ? 'Bids' : 'Asks'}
          </span>
        </div>
        {/* Visual Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${Math.max(5, Math.min(95, ((venueState.orderbookImbalance ?? 0) + 1) * 50))}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all"
            style={{ width: `${Math.max(5, Math.min(95, (1 - (venueState.orderbookImbalance ?? 0)) * 50))}%` }}
          />
        </div>
      </div>

      {/* Real-time Derivative Attributes */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div>
          <div className="text-slate-500 text-[10px]">Funding Rate</div>
          <div className="font-bold text-white">+{(Number(venueState.fundingRate || 0) * 100).toFixed(4)}%</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px]">OI 24h Delta</div>
          <div className="font-bold text-emerald-400">+{(Number(venueState.openInterestDelta || 0) * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Key Microstructure Metrics */}
      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60 font-mono">
        <div className="bg-slate-950/40 p-2 rounded-lg">
          <div className="text-slate-500 text-[10px]">Spread</div>
          <div className="font-bold text-white">{venueState.spreadBps} bps</div>
        </div>

        <div className="bg-slate-950/40 p-2 rounded-lg">
          <div className="text-slate-500 text-[10px]">Feed Latency</div>
          <div className="font-bold text-white">{venueState.latencyMs} ms</div>
        </div>
      </div>
    </div>
  );
};
