import React from 'react';
import { ApiSource } from '../types';
import { calculateNeutrosophicConsensus } from '../utils/mathNeutrosophic';
import {
  Scale,
  Radio,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface NeutrosophicConsensusViewProps {
  apis: ApiSource[];
}

export const NeutrosophicConsensusView: React.FC<NeutrosophicConsensusViewProps> = ({
  apis,
}) => {
  const consensus = calculateNeutrosophicConsensus(apis);
  const { overallTriple, isConfusedState, idealSolutionDistancePenalty, matrixRows, conflictSpread } =
    consensus;

  return (
    <div className="space-y-5 font-mono">
      {/* Top Warning / Status Banner */}
      {isConfusedState ? (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 flex items-start space-x-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-amber-300">
                MARKET REGIME: CONFUSED CONFLICT (Indeterminacy I={overallTriple.I})
              </h4>
              <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                PROTECTION ACTIVE
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              Disagreement detected between Technicals (e.g. Volume surge) and On-Chain / Whale flows (e.g. Exchange dump).
              The <strong>TOPSIS Ideal Solution</strong> is automatically penalized by{' '}
              <strong>{idealSolutionDistancePenalty.toFixed(2)}x</strong>, making it mathematically impossible for any signal to hit the 0.95 score. The app remains <strong>SILENT</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start space-x-3 text-slate-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-white">
              Neutrosophic Consensus: Stable Alignment (Indeterminacy I={overallTriple.I})
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Low conflict spread between data streams. Ideal Solution offset is at baseline (1.00x). Triple-Gate 2 is OPEN.
            </p>
          </div>
        </div>
      )}

      {/* Neutrosophic Macro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Truth Membership T */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] uppercase block">Truth Membership (T)</span>
          <span className="text-xl font-bold text-emerald-400 my-1 block">
            {overallTriple.T.toFixed(3)}
          </span>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${overallTriple.T * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Indeterminacy Membership I */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] uppercase block">Indeterminacy (I)</span>
          <div className="flex items-baseline space-x-2 my-1">
            <span
              className={`text-xl font-bold ${
                overallTriple.I > 0.28 ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {overallTriple.I.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-400">
              {overallTriple.I > 0.3 ? 'Confused (>0.30)' : 'Resolved (<0.15)'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                overallTriple.I > 0.28 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${overallTriple.I * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Falsity Membership F */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] uppercase block">Falsity Membership (F)</span>
          <span className="text-xl font-bold text-rose-400 my-1 block">
            {overallTriple.F.toFixed(3)}
          </span>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full"
              style={{ width: `${overallTriple.F * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Deneutrosophicated Score S(x) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-500 text-[10px] uppercase block">
            Deneutrosophication S(x)
          </span>
          <span className="text-xl font-bold text-purple-300 my-1 block">
            {overallTriple.score.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500">Formula: (2 + T - I - F) / 3</span>
        </div>
      </div>

      {/* 20-API Neutrosophic Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Neutrosophic Multi-Criteria Matrix &amp; Dynamic Weights
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            TOPSIS Distance Penalty Offset:{' '}
            <span className="text-amber-400 font-bold">
              {idealSolutionDistancePenalty.toFixed(3)}x
            </span>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[11px] uppercase">
                <th className="pb-2 pl-2">Criterion / Data Source</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Direction</th>
                <th className="pb-2 text-emerald-400">Truth (T)</th>
                <th className="pb-2 text-cyan-400">Indeterminacy (I)</th>
                <th className="pb-2 text-rose-400">Falsity (F)</th>
                <th className="pb-2 text-purple-300">Score S(x)</th>
                <th className="pb-2 pr-2 text-right">N-AHP Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {matrixRows.map((row) => {
                const api = apis.find((a) => a.id === row.criterionId);
                return (
                  <tr key={row.criterionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pl-2 font-medium text-slate-200">{row.criterionName}</td>
                    <td className="py-2.5 text-slate-400 text-[11px]">{row.category}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          api?.signalDirection === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : api?.signalDirection === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {api?.signalDirection}
                      </span>
                    </td>
                    <td className="py-2.5 text-emerald-400 font-semibold">{row.T.toFixed(3)}</td>
                    <td className="py-2.5 text-cyan-400 font-semibold">{row.I.toFixed(3)}</td>
                    <td className="py-2.5 text-rose-400 font-semibold">{row.F.toFixed(3)}</td>
                    <td className="py-2.5 text-purple-300 font-semibold">{row.deneutrosophicatedScore.toFixed(3)}</td>
                    <td className="py-2.5 pr-2 text-right font-bold text-slate-300">
                      {(row.calculatedWeight * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
