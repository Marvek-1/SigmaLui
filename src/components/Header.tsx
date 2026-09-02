import React from 'react';
import {
  Activity,
  Zap,
  ShieldCheck,
  Radio,
  Sliders,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  Cpu,
  Database,
  Menu,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { MarketState, PipelineStats } from '../types';

interface HeaderProps {
  stats: PipelineStats;
  marketState: MarketState;
  onMarketStateChange: (state: MarketState) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onSingleStep: () => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  onOpenAiAudit: () => void;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  latencyMs?: number;
  isBackendConnected?: boolean;
  serverTickCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  marketState,
  onMarketStateChange,
  isRunning,
  onToggleRunning,
  onSingleStep,
  simulationSpeed,
  onSpeedChange,
  onOpenAiAudit,
  onToggleSidebar,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  latencyMs = 2,
  isBackendConnected = true,
  serverTickCount = 0,
}) => {
  const isConfused = marketState === 'CONFUSED_CONFLICT';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner / Pulse */}
      <div className="w-full px-3 py-3 sm:px-5 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Pipeline Badge */}
          <div className="flex items-center space-x-3">
            {/* Sidebar toggle buttons */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm"
                title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeft className="w-4 h-4 text-cyan-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>
            )}

            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="md:hidden flex items-center justify-center p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer shadow-sm"
                title="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 text-cyan-400" />
              </button>
            )}

            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-bold text-lg">
              <Cpu className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight font-mono">
                  SIGNAL CHURNER <span className="text-cyan-400">GM(1,1)</span>
                </h1>
                
                {/* Real-time Backend Sync Badge */}
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-950 border border-emerald-500/40 text-emerald-300 shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>SSE SYNC</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-300">{latencyMs}ms</span>
                  {serverTickCount > 0 && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-[10px]">#{serverTickCount}</span>
                    </>
                  )}
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                  v5.9.2 PROD
                </span>

                {isConfused && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-mono">
                    <AlertTriangle className="w-3 h-3 mr-1" /> STRATEGIC SILENCE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Autonomous Real-Time MCDM Engine</span>
                <span className="text-slate-600">•</span>
                <span>Zero-Lag Front/Back Synchronization</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {/* Accuracy Rate */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase flex items-center justify-between">
                95% Success Gate
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-base font-bold ${stats.successRatePct >= 95 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {stats.successRatePct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">
                  ({stats.successfulSignals}/{stats.successfulSignals + stats.failedSignals})
                </span>
              </div>
            </div>

            {/* Indeterminacy Index */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase flex items-center justify-between">
                Conflict Indeterminacy (I)
                <Radio className={`w-3 h-3 ${stats.currentIndeterminacy > 0.28 ? 'text-amber-400' : 'text-cyan-400'}`} />
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-base font-bold ${stats.currentIndeterminacy > 0.28 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {stats.currentIndeterminacy.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {stats.currentIndeterminacy > 0.28 ? 'CONFUSED' : 'STABLE'}
                </span>
              </div>
            </div>

            {/* Noise Discards */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase flex items-center justify-between">
                Noise Filtered
                <Zap className="w-3 h-3 text-indigo-400" />
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-base font-bold text-slate-200">
                  {stats.discardedNoiseCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">ticks</span>
              </div>
            </div>

            {/* In-Memory Redis Lake */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
              <span className="text-slate-400 text-[10px] uppercase flex items-center justify-between">
                Redis TimeSeries
                <Database className="w-3 h-3 text-cyan-400" />
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-base font-bold text-cyan-400">
                  {stats.avgLatencyMs.toFixed(1)}ms
                </span>
                <span className="text-[10px] text-slate-500">20 APIs</span>
              </div>
            </div>
          </div>

          {/* Execution Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Market State Selector */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              <span className="text-[11px] text-slate-400 font-mono px-2">Market State:</span>
              <select
                aria-label="Market state regime"
                value={marketState}
                onChange={(e) => onMarketStateChange(e.target.value as MarketState)}
                className="bg-slate-900 text-xs font-mono font-medium text-cyan-300 border border-slate-700/80 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="TRENDING_BULL">Trending Bull (Confluent)</option>
                <option value="TRENDING_BEAR">Trending Bear</option>
                <option value="MEAN_REVERTING">Mean-Reverting (Oscillating)</option>
                <option value="CONFUSED_CONFLICT">Confused Conflict (Whale Dump vs Vol Surge)</option>
                <option value="HIGH_VOLATILITY">High Volatility Shock</option>
              </select>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                    simulationSpeed === speed
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Run / Pause Toggle */}
            <button
              onClick={onToggleRunning}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shadow-sm ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE CHURN</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>START 24/7</span>
                </>
              )}
            </button>

            {/* Manual Single Step */}
            <button
              onClick={onSingleStep}
              title="Execute 1 manual MCDM tick"
              className="p-1.5 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Gemini AI Macro Auditor */}
            <button
              onClick={onOpenAiAudit}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>AI QUANT AUDIT</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
