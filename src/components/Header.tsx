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
  TrendingUp,
  Globe,
} from 'lucide-react';
import { MarketState, PipelineStats, LiveMarketTelemetry } from '../types';

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
  liveMarketTelemetry?: LiveMarketTelemetry;
  isSyncingMarket?: boolean;
  onSyncLiveMarket?: () => void;
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
  liveMarketTelemetry,
  isSyncingMarket = false,
  onSyncLiveMarket,
}) => {
  const isConfused = marketState === 'CONFUSED_CONFLICT';
  const btcPrice = liveMarketTelemetry?.samplePrices?.BTC || 78480;
  const ethPrice = liveMarketTelemetry?.samplePrices?.ETH || 2419;
  const solPrice = liveMarketTelemetry?.samplePrices?.SOL || 101.4;
  const taoPrice = liveMarketTelemetry?.samplePrices?.TAO || 221.5;

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
                  ALPHA SIGNALS <span className="text-cyan-400">PRO</span>
                </h1>
                
                {/* Status Indicator */}
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>SCANNER ACTIVE</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">20 Exchanges</span>
                </div>

                {isConfused && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                    <AlertTriangle className="w-3 h-3 mr-1" /> STANDING BY (CHOPPY)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Real-time cryptocurrency trade signals with 95%+ confidence threshold
              </p>
            </div>
          </div>

          {/* Live Binance Feed Strip & Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Market Price Ticker Pill */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold border-r border-slate-800 pr-2">
                <Globe className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>BINANCE L1</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">BTC</span>
                  <span className="text-emerald-400 font-bold">${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">ETH</span>
                  <span className="text-emerald-400 font-bold">${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">SOL</span>
                  <span className="text-cyan-300 font-bold">${solPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">TAO</span>
                  <span className="text-purple-300 font-bold">${taoPrice.toFixed(1)}</span>
                </div>
              </div>
              {onSyncLiveMarket && (
                <button
                  onClick={onSyncLiveMarket}
                  disabled={isSyncingMarket}
                  className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                  title="Force Live Market Re-Sync"
                >
                  <RotateCw className={`w-3 h-3 ${isSyncingMarket ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              )}
            </div>

            {/* Quick Win Rate Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 text-[10px] block">VERIFIED WIN RATE</span>
                <span className="text-sm font-bold text-emerald-400">
                  {stats.successRatePct.toFixed(1)}% <span className="text-slate-500 text-[11px] font-normal">({stats.successfulSignals}W / {stats.failedSignals}L)</span>
                </span>
              </div>
            </div>

            {/* Run / Pause Toggle */}
            <button
              onClick={onToggleRunning}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${
                isRunning
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE SCANNER</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START SCANNER</span>
                </>
              )}
            </button>

            {/* Gemini AI Assistant */}
            <button
              onClick={onOpenAiAudit}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>ASK AI</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
