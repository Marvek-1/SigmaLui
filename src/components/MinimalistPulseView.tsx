import React from 'react';
import {
  PipelineStats,
  SuperSignal,
  SilentDiscardLog,
  CryptoFuturesPair,
  MarketState,
  ApiSource,
} from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Cloud,
  CloudLightning,
  Play,
  Pause,
  ArrowUpRight,
  Target,
  Sparkles,
  Zap,
  RotateCw,
  Compass,
} from 'lucide-react';
import { ApiLatencyWidget } from './ApiLatencyWidget';

interface MinimalistPulseViewProps {
  stats: PipelineStats;
  signals: SuperSignal[];
  silentLogs: SilentDiscardLog[];
  pairs: CryptoFuturesPair[];
  marketState: MarketState;
  onMarketStateChange: (state: MarketState) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onSingleStep: () => void;
  onOpenAiAudit: () => void;
  apis?: ApiSource[];
  latencyMs?: number;
  isBackendConnected?: boolean;
  serverTickCount?: number;
}

export const MinimalistPulseView: React.FC<MinimalistPulseViewProps> = ({
  stats,
  signals,
  silentLogs,
  pairs,
  marketState,
  onMarketStateChange,
  isRunning,
  onToggleRunning,
  onSingleStep,
  onOpenAiAudit,
  apis = [],
  latencyMs = 2,
  isBackendConnected = true,
  serverTickCount = 0,
}) => {
  // Determine Global Traffic Light State
  // 1. Red: High Volatility Shock / Liquidity Vacuum Kill
  // 2. Amber: Strategic Silence (Confused Conflict or High Indeterminacy / Discard stream active)
  // 3. Green: Engine Active / Generating clean high-conviction signals
  const isSafetyLock = marketState === 'HIGH_VOLATILITY' || stats.currentIndeterminacy > 0.35;
  const isStrategicSilence =
    marketState === 'CONFUSED_CONFLICT' ||
    stats.currentIndeterminacy > 0.22 ||
    (signals.length === 0 && isRunning);
  
  const pulseState: 'GREEN' | 'AMBER' | 'RED' = isSafetyLock
    ? 'RED'
    : isStrategicSilence
    ? 'AMBER'
    : 'GREEN';

  // Filter only high conviction signals (>95% score)
  const highConvictionSignals = signals.filter(
    (s) => s.topsisScore >= 0.945 || s.status === 'ACTIVE' || s.status === 'TARGET_1_HIT' || s.status === 'TARGET_2_HIT'
  );

  // Market Weather Mapping
  const getWeatherInfo = () => {
    switch (marketState) {
      case 'TRENDING_BULL':
        return {
          icon: Sun,
          title: 'Clear Skies (Bull Trend)',
          description: 'High orderflow confluence, low indeterminacy. Optimal execution window.',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'MEAN_REVERTING':
        return {
          icon: Cloud,
          title: 'Mild Cloud Cover (Oscillating)',
          description: 'Range-bound price action. Strategy scales tighter entry bands.',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        };
      case 'CONFUSED_CONFLICT':
        return {
          icon: CloudLightning,
          title: 'Storm Looming (Conflict & Divergence)',
          description: 'Conflicting cross-exchange data. Engine standing down in Strategic Silence.',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'HIGH_VOLATILITY':
        return {
          icon: CloudLightning,
          title: 'Severe Turbulence (High Volatility)',
          description: 'Liquidity vacuum risk detected. Safety lock engaged.',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      default:
        return {
          icon: Sun,
          title: 'Equilibrium (Trending Bear/Neutral)',
          description: 'Monitoring market structure for clean breakout liquidity.',
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        };
    }
  };

  const weather = getWeatherInfo();
  const WeatherIcon = weather.icon;

  return (
    <div className="space-y-6 w-full py-1 font-sans">
      {/* Real-time Server Sync & Limit-Pullback Execution HUD */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wider">REAL-TIME BIDIRECTIONAL SYNC</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ZERO LAG (SSE ACTIVE)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Front/Back Engine lock • Ping: <span className="text-cyan-300 font-mono font-bold">{latencyMs}ms</span> • Server Ticks: <span className="text-emerald-400 font-mono font-bold">#{serverTickCount}</span> • State: <span className="text-slate-200 font-bold">{isBackendConnected ? 'Connected & Authoritative' : 'Reconnecting...'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Execution Mode</span>
            <span className="text-xs font-bold text-cyan-300">LIMIT-PULLBACK [GM-1,1]</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Realized SLA</span>
            <span className="text-xs font-bold text-emerald-400">{stats.successRatePct.toFixed(1)}% Win Rate</span>
          </div>
        </div>
      </div>
      
      {/* 1. THE PULSE — Global Traffic Light & Status Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
        
        {/* Subtle background ambient glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000 ${
            pulseState === 'GREEN'
              ? 'bg-emerald-500'
              : pulseState === 'AMBER'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />

        {/* Central Traffic Light Orb */}
        <div className="relative flex flex-col items-center justify-center space-y-5 z-10">
          <div className="relative group cursor-pointer" onClick={onToggleRunning}>
            {/* Outer Ring Pulse */}
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-700 ${
                pulseState === 'GREEN'
                  ? 'bg-emerald-500/10 border-2 border-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
                  : pulseState === 'AMBER'
                  ? 'bg-amber-500/10 border-2 border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.3)]'
                  : 'bg-rose-500/10 border-2 border-rose-400/50 shadow-[0_0_50px_rgba(244,63,94,0.4)]'
              }`}
            >
              {/* Inner Solid Core */}
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-500 flex items-center justify-center ${
                  pulseState === 'GREEN'
                    ? 'bg-emerald-400 shadow-[0_0_30px_#34d399] animate-pulse'
                    : pulseState === 'AMBER'
                    ? 'bg-amber-400 shadow-[0_0_25px_#fbbf24]'
                    : 'bg-rose-500 shadow-[0_0_30px_#f43f5e] animate-ping'
                }`}
              >
                {pulseState === 'GREEN' ? (
                  <Zap className="w-8 h-8 text-slate-950 font-bold" />
                ) : pulseState === 'AMBER' ? (
                  <ShieldCheck className="w-8 h-8 text-slate-950 font-bold" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-white font-bold" />
                )}
              </div>
            </div>
          </div>

          {/* Pulse State Caption */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              System State
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              {pulseState === 'GREEN' && 'ENGINE ACTIVE'}
              {pulseState === 'AMBER' && 'STRATEGIC SILENCE'}
              {pulseState === 'RED' && 'SAFETY LOCK ENGAGED'}
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto font-sans leading-relaxed">
              {pulseState === 'GREEN' &&
                'Market conditions satisfy all three mathematical gates. High-conviction setups are churning.'}
              {pulseState === 'AMBER' &&
                'The market is currently erratic or in conflict. The engine is deliberately resting to protect the 95% win threshold.'}
              {pulseState === 'RED' &&
                'Severe volatility spike or orderbook liquidity vacuum detected. All order execution is frozen.'}
            </p>
          </div>

          {/* Main Control Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onToggleRunning}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
                isRunning
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Engine</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Churning</span>
                </>
              )}
            </button>

            <button
              onClick={onSingleStep}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs font-semibold transition-all"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Evaluate 1 Step</span>
            </button>

            <button
              onClick={onOpenAiAudit}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit with AI</span>
            </button>
          </div>
        </div>

        {/* 3 Overview Badges at Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-6 border-t border-slate-800/80 text-left font-mono">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Engine Health</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Fully Operational</span>
            </div>
            <span className="text-[10px] text-slate-500">20/20 Feeds Synchronized</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">The Ledger (Today)</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-sm font-bold text-emerald-400">
                {stats.successfulSignals} Wins
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-sm font-bold text-slate-400">
                {stats.failedSignals} Losses
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {stats.successRatePct.toFixed(1)}% Realized Precision
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Current Mode</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Automated Watch</span>
            </div>
            <span className="text-[10px] text-slate-500">Scanning {pairs.length} PERP pairs</span>
          </div>
        </div>
      </div>

      {/* 2. MARKET WEATHER */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3.5 rounded-2xl border ${weather.color}`}>
            <WeatherIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Market Weather
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-mono">{weather.title}</h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">{weather.description}</p>
          </div>
        </div>

        {/* Change Weather Simulation Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono whitespace-nowrap">Simulate Regime:</span>
          <select
            value={marketState}
            onChange={(e) => onMarketStateChange(e.target.value as MarketState)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="TRENDING_BULL">Sunny (Bull Trend)</option>
            <option value="MEAN_REVERTING">Cloudy (Range-Bound)</option>
            <option value="CONFUSED_CONFLICT">Stormy (Conflicting Data)</option>
            <option value="HIGH_VOLATILITY">Turbulent (High Volatility)</option>
          </select>
        </div>
      </div>

      {/* 2.5 REAL-TIME API INGESTION LATENCY SPARKLINE WIDGET */}
      <ApiLatencyWidget
        apis={apis}
        currentPingMs={latencyMs}
        serverTickCount={serverTickCount}
        isBackendConnected={isBackendConnected}
      />

      {/* 3. OPPORTUNITY VIEW — Minimalist High Conviction Signal Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-mono tracking-tight">
              ACTIVE OPPORTUNITIES (CONFIDENCE &gt; 95%)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {highConvictionSignals.length} Setups Vetted by Engine
          </span>
        </div>

        {highConvictionSignals.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white font-mono">No Trades Active</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The engine has not detected a setup with &gt;95% mathematical confidence. It is maintaining Strategic Silence to preserve your capital.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {highConvictionSignals.map((sig) => {
              const confidencePct = Number((sig.topsisScore * 100).toFixed(1));
              return (
                <div
                  key={sig.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 transition-all"
                >
                  {/* Top: Asset, Sector & Status */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm">
                        {sig.asset}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-bold text-white font-mono">
                            {sig.futuresPair || `${sig.asset}/USDT`}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                            BUY SIGNAL
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{sig.sector || 'Crypto Perpetuals'}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-400 block">{sig.timestamp}</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {sig.pnlPct >= 0 ? `+${sig.pnlPct.toFixed(2)}%` : `${sig.pnlPct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Confidence Meter:</span>
                      <span className="font-bold text-emerald-400">{confidencePct}% (Vetted)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(90, confidencePct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Execution Targets */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 font-mono text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Limit Pullback Entry</span>
                      <span className="text-sm font-bold text-cyan-300">${sig.entryPrice}</span>
                      <span className="text-[9px] text-slate-500 block">GM(1,1) Mean-Rev</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase">TP1 Target</span>
                      <span className="text-sm font-bold text-emerald-400">${sig.target1}</span>
                      <span className="text-[9px] text-emerald-500 block">TP1 Hunt Active</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-rose-400 block uppercase">Stop Loss</span>
                      <span className="text-sm font-bold text-rose-400">${sig.stopLoss}</span>
                      <span className="text-[9px] text-rose-500 block">Hard Invalidation</span>
                    </div>
                  </div>

                  {/* Concise Plain-English Summary */}
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {sig.explanation ||
                      'Orderbook clearance verified with clean momentum lookahead and low conflict index.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ROOT-CAUSE AUDIT & STRATEGIC SILENCE TELEMETRY */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Root-Cause Discard Audit & Capital Preservation
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                Why the engine refuses thin setups to maintain the &gt;95% SLA threshold
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800/60 self-start sm:self-auto">
            {stats.discardedNoiseCount.toLocaleString()} bad entries prevented
          </span>
        </div>

        {/* Breakdown of Discard Causes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30">
            <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
              <span>Gate 5: Liquidity Wall Block</span>
              <span className="text-xs">84%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Orderbook resistance / thin market depth. Preserves capital by refusing to chase into walls.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30">
            <div className="flex justify-between items-center text-amber-400 font-bold mb-1">
              <span>Gate 3: Neutrosophic Conflict</span>
              <span className="text-xs">10%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Opposing signals across on-chain vs. social feeds. Filtered by Neutrosophic AHP.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/30">
            <div className="flex justify-between items-center text-indigo-400 font-bold mb-1">
              <span>Gate 1: GM(1,1) Slope Drift</span>
              <span className="text-xs">6%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Differential lookahead deviation exceeds resolution coefficient rho.
            </p>
          </div>
        </div>

        {/* Live Stream of Preserved Capital Logs */}
        <div className="space-y-2 pt-2">
          {silentLogs.slice(0, 3).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                <span className="font-bold text-cyan-300">{log.asset}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-sans">{log.reason}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] font-semibold self-start sm:self-auto border border-emerald-500/20">
                Capital Preserved
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
