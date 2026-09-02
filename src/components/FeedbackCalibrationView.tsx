import React from 'react';
import { ApiSource, GraVerificationRecord, PipelineStats } from '../types';
import {
  RotateCcw,
  ShieldCheck,
  Award,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
} from 'lucide-react';

interface FeedbackCalibrationViewProps {
  apis: ApiSource[];
  graRecords: GraVerificationRecord[];
  stats: PipelineStats;
  resolutionRho: number;
  onTriggerCalibration?: () => void;
}

export const FeedbackCalibrationView: React.FC<FeedbackCalibrationViewProps> = ({
  apis,
  graRecords,
  stats,
  resolutionRho,
  onTriggerCalibration,
}) => {
  // Sort APIs by reliability score
  const sortedApis = [...apis].sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-bold text-white">
              The Validator: Grey Relational Analysis (GRA) Self-Correction Loop
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracks real-world outcomes. If a signal misses targets, GRA mathematically isolates which API supplied the "False Truth" and auto-penalizes its N-AHP weight.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase">7-Day Shadow Accuracy</span>
            <span className="text-lg font-bold text-emerald-400">
              {stats.successRatePct.toFixed(1)}% ({stats.successfulSignals}/{stats.successfulSignals + stats.failedSignals})
            </span>
          </div>

          {onTriggerCalibration && (
            <button
              onClick={onTriggerCalibration}
              className="px-3 py-2 rounded-lg bg-pink-600/20 text-pink-300 border border-pink-500/40 hover:bg-pink-600/30 text-xs font-bold transition-all cursor-pointer"
            >
              RUN GRA AUDIT
            </button>
          )}
        </div>
      </div>

      {/* 2-Column: API Reliability Leaderboard & Live GRA Verification Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: API Reliability Rankings & Penalty Counts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase">
              API Reliability &amp; Weight Calibration Rankings
            </h4>
            <span className="text-[11px] text-slate-500">
              Resolution (ρ): {resolutionRho.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
            {sortedApis.map((api, idx) => (
              <div key={api.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-5 text-slate-500 font-bold text-[10px]">{idx + 1}.</span>
                  <div>
                    <span className="text-slate-200 font-semibold block">{api.name}</span>
                    <span className="text-[10px] text-slate-500">{api.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="text-emerald-400 font-bold block">
                      {(api.reliabilityScore * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      GRA: {api.graScore.toFixed(3)}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        api.penaltyCount > 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {api.penaltyCount > 0 ? `-${api.penaltyCount} Penalties` : 'Zero Faults'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Wt: {(api.currentWeight * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: GRA Verification Audit Logs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase">
              Temporal Outcome Verification Logs
            </h4>
            <span className="text-[11px] text-pink-400 font-bold">
              {graRecords.length} Audited Cycles
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {graRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No GRA verification cycles recorded yet. Signals are being actively shadowed.
              </div>
            ) : (
              graRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{rec.asset}</span>
                      <span className="text-slate-500 text-[11px]">[{rec.signalId}]</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {rec.outcome} ({rec.actualPriceDeltaPct > 0 ? `+${rec.actualPriceDeltaPct}%` : `${rec.actualPriceDeltaPct}%`})
                      </span>
                    </div>

                    <span className="text-slate-500 text-[11px]">{rec.timestamp}</span>
                  </div>

                  {/* API Evaluation Sub-Grid */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {rec.apiEvaluations.slice(0, 4).map((evalItem) => (
                      <div
                        key={evalItem.apiId}
                        className={`p-1.5 rounded flex items-center justify-between ${
                          evalItem.wasFalseTruth
                            ? 'bg-rose-950/40 border border-rose-900/40 text-rose-300'
                            : 'bg-slate-900/80 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-1">{evalItem.apiName.split(' ')[0]}</span>
                        <span className="font-bold">
                          {evalItem.wasFalseTruth ? 'FALSE TRUTH' : `γ=${evalItem.greyRelationalGrade.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
