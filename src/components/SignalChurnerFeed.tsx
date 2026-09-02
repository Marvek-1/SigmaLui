import React, { useState } from 'react';
import {
  SuperSignal,
  SilentDiscardLog,
} from '../types';
import {
  TrendingUp,
  Target,
  Shield,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Sliders,
  VolumeX,
  Sparkles,
  Zap,
  BarChart3,
} from 'lucide-react';

interface SignalChurnerFeedProps {
  signals: SuperSignal[];
  silentLogs: SilentDiscardLog[];
  onSelectSignalForLab?: (signal: SuperSignal) => void;
}

export const SignalChurnerFeed: React.FC<SignalChurnerFeedProps> = ({
  signals,
  silentLogs,
  onSelectSignalForLab,
}) => {
  const [activeTab, setActiveTab] = useState<'SUPER_SIGNALS' | 'STRATEGIC_SILENCE'>('SUPER_SIGNALS');
  const [filterGate, setFilterGate] = useState<string>('ALL');

  const filteredLogs = silentLogs.filter((log) => {
    if (filterGate === 'ALL') return true;
    return log.gateFailed === filterGate;
  });

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('SUPER_SIGNALS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTab === 'SUPER_SIGNALS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>SUPER SIGNALS ({signals.length})</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-900/60 text-cyan-200">
              Ci &gt; 0.95
            </span>
          </button>

          <button
            onClick={() => setActiveTab('STRATEGIC_SILENCE')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTab === 'STRATEGIC_SILENCE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <VolumeX className="w-4 h-4 text-amber-400" />
            <span>STRATEGIC SILENCE & NOISE LOGS ({silentLogs.length})</span>
          </button>
        </div>

        {activeTab === 'STRATEGIC_SILENCE' && (
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter noise discard by gate"
              value={filterGate}
              onChange={(e) => setFilterGate(e.target.value)}
              className="bg-slate-950 text-xs font-mono text-slate-300 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Discard Gates</option>
              <option value="GATE_1_GREY_NOISE">Gate 1: Grey Noise (MRPE &gt; 5%)</option>
              <option value="GATE_2_CONFUSED_INDETERMINACY">Gate 2: Confused (I &gt; 0.28)</option>
              <option value="GATE_3_TOPSIS_BELOW_95">Gate 3: TOPSIS Ci &lt; 0.95</option>
              <option value="GATE_4_FRACTAL_MISMATCH">Gate 4: Fractal Mismatch</option>
              <option value="GATE_5_LIQUIDITY_WALL_BLOCK">Gate 5: Liquidity Wall Block</option>
            </select>
          </div>
        )}
      </div>

      {/* SUPER SIGNALS VIEW */}
      {activeTab === 'SUPER_SIGNALS' && (
        <div className="space-y-3">
          {signals.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
              <VolumeX className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-mono">The Engine is currently SILENT.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                All incoming asset ticks failed either the GM(1,1) 5% noise ceiling, Neutrosophic conflict limit, or TOPSIS 0.9500 gate. Silence protects the 95% success rate.
              </p>
            </div>
          ) : (
            signals.map((sig) => (
              <div
                key={sig.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-xl p-4 shadow-lg hover:shadow-cyan-950/20"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center font-bold text-emerald-400 font-mono">
                      <span className="text-xs">{sig.asset}</span>
                      <span className="text-[8px] text-emerald-500">PERP</span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-white font-mono">{sig.futuresPair || `${sig.asset}USDT.P`}</span>
                        {sig.sector && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            {sig.sector}
                          </span>
                        )}
                        {sig.maxLeverage && (
                          <span className="px-1.5 py-0.2 text-[10px] rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                            {sig.maxLeverage}x
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                          {sig.action}
                        </span>
                        <span className="text-xs text-slate-400 font-mono flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {sig.timestamp}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center space-x-2">
                        <span>{sig.timeframe}</span>
                        <span>•</span>
                        <span>R:R {sig.riskRewardRatio}x</span>
                        {sig.fundingRate !== undefined && (
                          <>
                            <span>•</span>
                            <span className={sig.fundingRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              8h Funding: {(sig.fundingRate * 100).toFixed(4)}%
                            </span>
                          </>
                        )}
                        {sig.openInterestUsd && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-300">
                              OI: ${(sig.openInterestUsd / 1e6).toFixed(1)}M
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & PnL */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 block uppercase">Current PnL</span>
                      <span
                        className={`text-sm font-bold ${
                          sig.pnlPct > 0
                            ? 'text-emerald-400'
                            : sig.pnlPct < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {sig.pnlPct > 0 ? `+${sig.pnlPct.toFixed(2)}%` : `${sig.pnlPct.toFixed(2)}%`}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                        sig.status === 'TARGET_2_HIT'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : sig.status === 'TARGET_1_HIT'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : sig.status === 'ACTIVE'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {sig.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Trade Setup Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 font-mono text-xs">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
                    <span className="text-slate-500 text-[10px] uppercase block">Entry Price</span>
                    <span className="text-slate-200 font-bold text-sm">
                      ${sig.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-emerald-950/60 rounded-lg p-2">
                    <span className="text-emerald-400 text-[10px] uppercase block">Target 1 (+2.4%)</span>
                    <span className="text-emerald-300 font-bold text-sm">
                      ${sig.target1.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-emerald-900/60 rounded-lg p-2">
                    <span className="text-emerald-400 text-[10px] uppercase block">Target 2 (+5.2%)</span>
                    <span className="text-emerald-300 font-bold text-sm">
                      ${sig.target2.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-rose-950/60 rounded-lg p-2">
                    <span className="text-rose-400 text-[10px] uppercase block">Stop Loss (-1.2%)</span>
                    <span className="text-rose-300 font-bold text-sm">
                      ${sig.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Mathematical Triple-Gate Verification Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  {/* Gate 1: Grey Error */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-slate-500">GM(1,1) Error:</span>
                    <span className="text-emerald-400 font-semibold">
                      {(sig.greyResidualError * 100).toFixed(2)}%
                    </span>
                    <span className="text-[9px] text-slate-500">(&lt;5% noise gate)</span>
                  </div>

                  {/* Gate 2: Neutrosophic Indeterminacy */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-slate-500">Indeterminacy (I):</span>
                    <span className="text-cyan-400 font-semibold">{sig.indeterminacy.toFixed(3)}</span>
                    <span className="text-[9px] text-slate-500">(&lt;0.15 gate)</span>
                  </div>

                  {/* Gate 3: TOPSIS Ci */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 border border-cyan-900/60 text-slate-300">
                    <span className="text-slate-500">TOPSIS Score (Ci):</span>
                    <span className="text-cyan-300 font-bold">{sig.topsisScore.toFixed(4)}</span>
                    <span className="text-[9px] text-emerald-400 font-bold">(&gt;0.95 PASS)</span>
                  </div>

                  {/* Liquidity Clearance */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-slate-500">Liquidity Clear:</span>
                    <span className="text-indigo-400 font-semibold">+{sig.liquidityClearancePct}%</span>
                  </div>

                  {/* Fractal Score */}
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-slate-500">Fractal Confluence:</span>
                    <span className="text-emerald-400 font-semibold">5m+1H+4H ALIGNED</span>
                  </div>
                </div>

                {/* Algorithmic Rationale */}
                <div className="mt-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-900">
                  <span className="text-cyan-400 font-mono font-semibold">Algorithmic Rationale: </span>
                  {sig.explanation}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STRATEGIC SILENCE & NOISE LOGS VIEW */}
      {activeTab === 'STRATEGIC_SILENCE' && (
        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-300 text-xs">
            <span className="font-bold">Why Strategic Silence is Key to 95%: </span>
            Over 90% of intraday trading opportunities are false breakouts, noisy mean-reversions, or API conflict traps. When an asset fails any gate, the engine stays completely silent, protecting equity.
          </div>

          <div className="divide-y divide-slate-800/80 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No discarded ticks in current filter.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                      <span className="font-bold text-white px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                        {log.asset}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.gateFailed === 'GATE_1_GREY_NOISE'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : log.gateFailed === 'GATE_2_CONFUSED_INDETERMINACY'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : log.gateFailed === 'GATE_3_TOPSIS_BELOW_95'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : log.gateFailed === 'GATE_4_FRACTAL_MISMATCH'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                        }`}
                      >
                        {log.gateFailed.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-semibold">
                      ACTION: SILENT DISCARD
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{log.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
