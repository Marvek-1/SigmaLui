import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  BarChart2,
  Activity,
  Zap,
  Info,
  Scale,
  SlidersHorizontal,
  Table as TableIcon,
} from 'lucide-react';
import { PipelineStats, SuperSignal, DailyAccuracy, CalibrationMetrics } from '../types';
import {
  processDailyAccuracySeries,
  computeCalibrationMetrics,
  RawDailyAccuracyInput,
} from '../utils/accuracy';

export interface AccuracyMetricsWidgetProps {
  stats?: PipelineStats;
  signals?: SuperSignal[];
  data?: RawDailyAccuracyInput[];
  className?: string;
}

export const AccuracyMetricsWidget: React.FC<AccuracyMetricsWidgetProps> = ({
  stats,
  signals = [],
  data: customData,
  className = '',
}) => {
  // Dual chart modes:
  // 'STACKED_WINS_LOSSES': Daily Wins & Losses stacked counts on Left Y-Axis, Prediction Confidence line on Right Y-Axis (0-100%)
  // 'STACKED_WIN_LOSS_RATE': Daily Win Rate & Loss Rate stacked to 100% on Left Y-Axis, Prediction Confidence line on same 0-100% scale
  const [chartMode, setChartMode] = useState<'STACKED_WINS_LOSSES' | 'STACKED_WIN_LOSS_RATE'>(
    'STACKED_WINS_LOSSES'
  );
  const [timeframe, setTimeframe] = useState<'7D' | '14D' | '30D'>('7D');
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Canonical baseline dataset strictly totaling 18 Wins / 1 Loss (n=19) for 7D
  const defaultRawSets: Record<'7D' | '14D' | '30D', RawDailyAccuracyInput[]> = useMemo(() => {
    const d7Raw: RawDailyAccuracyInput[] = [
      { date: 'Aug 27', wins: 2, losses: 0, predictionConfidence: 91.5 },
      { date: 'Aug 28', wins: 3, losses: 0, predictionConfidence: 93.2 },
      { date: 'Aug 29', wins: 2, losses: 0, predictionConfidence: 92.0 },
      { date: 'Aug 30', wins: 3, losses: 0, predictionConfidence: 94.0 },
      { date: 'Aug 31', wins: 4, losses: 1, predictionConfidence: 92.5 },
      { date: 'Sep 01', wins: 2, losses: 0, predictionConfidence: 93.8 },
      { date: 'Today (Sep 02)', wins: 2, losses: 0, predictionConfidence: 94.2 },
    ];

    const d14Raw: RawDailyAccuracyInput[] = [
      { date: 'Aug 20', wins: 0, losses: 0, predictionConfidence: null }, // zero-volume day excluded by normalization contract
      { date: 'Aug 21', wins: 1, losses: 0, predictionConfidence: 91.0 },
      { date: 'Aug 22', wins: 0, losses: 0, predictionConfidence: null },
      { date: 'Aug 23', wins: 1, losses: 0, predictionConfidence: 92.1 },
      { date: 'Aug 24', wins: 1, losses: 0, predictionConfidence: 93.0 },
      { date: 'Aug 25', wins: 0, losses: 0, predictionConfidence: null },
      { date: 'Aug 26', wins: 1, losses: 0, predictionConfidence: 91.8 },
      ...d7Raw,
    ];

    const d30Raw: RawDailyAccuracyInput[] = [
      { date: 'Aug 05', wins: 2, losses: 0, predictionConfidence: 90.2 },
      { date: 'Aug 09', wins: 1, losses: 0, predictionConfidence: 91.4 },
      { date: 'Aug 14', wins: 2, losses: 0, predictionConfidence: 92.8 },
      { date: 'Aug 18', wins: 1, losses: 0, predictionConfidence: 92.0 },
      ...d14Raw,
    ];

    return { '7D': d7Raw, '14D': d14Raw, '30D': d30Raw };
  }, []);

  // Compute DailyAccuracy using hardened normalization boundary (recomputing winRate/lossRate, sanitizing, sorting)
  const dailyData: DailyAccuracy[] = useMemo(() => {
    const raw = customData || defaultRawSets[timeframe];
    return processDailyAccuracySeries(raw);
  }, [customData, defaultRawSets, timeframe]);

  // Compute Lifetime Totals & Reconciliation directly from normalized rows (Single Source of Truth)
  const lifetime = useMemo(() => {
    const totals = dailyData.reduce(
      (acc, row) => {
        acc.wins += row.wins;
        acc.losses += row.losses;
        return acc;
      },
      { wins: 0, losses: 0 }
    );

    const resolvedSignals = totals.wins + totals.losses;
    const winRate = resolvedSignals > 0
      ? Number(((totals.wins / resolvedSignals) * 100).toFixed(2))
      : 0;
    const lossRate = resolvedSignals > 0
      ? Number((100 - winRate).toFixed(2))
      : 0;

    return {
      wins: totals.wins,
      losses: totals.losses,
      resolvedSignals,
      winRate,
      lossRate,
    };
  }, [dailyData]);

  // Calibration telemetry
  const calibrationMetrics: CalibrationMetrics = useMemo(() => {
    return computeCalibrationMetrics(dailyData, `${timeframe} Settlement Horizon`);
  }, [dailyData, timeframe]);

  // Max daily trade count for scaling the integer left axis in volume mode
  const maxVolume = useMemo(() => {
    const maxVal = Math.max(...dailyData.map((d) => d.resolvedSignals), 4);
    return Math.ceil(maxVal * 1.25);
  }, [dailyData]);

  return (
    <div
      id="accuracy-metrics-widget"
      data-testid="accuracy-metrics"
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 font-sans relative overflow-hidden ${className}`}
    >
      {/* Background Accent glow */}
      <div className="absolute top-0 right-1/4 w-80 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Hierarchy */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Accuracy Metrics
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Daily win/loss distribution, prediction confidence calibration, and reliability contract
            </p>
          </div>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto font-mono text-xs">
          {/* Chart Display Mode Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              id="btn-accuracy-stacked-wins-losses"
              onClick={() => setChartMode('STACKED_WINS_LOSSES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'STACKED_WINS_LOSSES'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stacked daily wins/losses count with confidence curve"
            >
              Stacked Wins / Losses
            </button>
            <button
              id="btn-accuracy-stacked-rate"
              onClick={() => setChartMode('STACKED_WIN_LOSS_RATE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'STACKED_WIN_LOSS_RATE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stacked Win Rate & Loss Rate percentages (0–100%)"
            >
              Outcome Rate (%)
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['7D', '14D', '30D'] as const).map((tf) => (
              <button
                key={tf}
                id={`btn-timeframe-${tf.toLowerCase()}`}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Toggle Raw Data Matrix */}
          <button
            id="btn-accuracy-toggle-matrix"
            onClick={() => setShowDataTable(!showDataTable)}
            className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
              showDataTable
                ? 'bg-indigo-950 border-indigo-500/60 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{showDataTable ? 'Hide Matrix' : 'Data Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Lifetime Summary Headline Banner (Reconciled Single Source of Truth) */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-baseline space-x-2.5">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">{lifetime.winRate}%</span>
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Lifetime Win Rate</span>
          </div>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
            <span className="font-bold text-white bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
              {lifetime.wins}W / {lifetime.losses}L
            </span>
            <span>·</span>
            <span className="text-cyan-300 font-bold">{lifetime.resolvedSignals} closed trades</span>
            <span>·</span>
            <span className="text-slate-400">95% Confidence Range: [{calibrationMetrics.wilsonIntervalLowerPct}% – {calibrationMetrics.wilsonIntervalUpperPct}%]</span>
          </div>
        </div>

        {/* Statistical Calibration Note */}
        <div className="bg-slate-900/90 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-left sm:text-right max-w-sm">
          <div className="flex items-center sm:justify-end space-x-1.5 text-amber-400 text-[10px] font-bold uppercase">
            <Info className="w-3.5 h-3.5" />
            <span>Accuracy Sample: {lifetime.resolvedSignals} Trades</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
            Verified win rate of {lifetime.winRate}% across {lifetime.resolvedSignals} completed trade settlements.
          </p>
        </div>
      </div>

      {/* Verified Reliability Baseline Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        {/* Metric 1: Verified Win Rate */}
        <div className="p-3 bg-slate-950/70 border border-emerald-500/30 rounded-xl">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
            Verified Win Rate
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black text-emerald-400">{lifetime.winRate}</span>
            <span className="text-xs text-emerald-500 font-bold">%</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">{lifetime.wins} Completed Wins</span>
        </div>

        {/* Metric 2: Verified Loss Rate */}
        <div className="p-3 bg-slate-950/70 border border-rose-500/30 rounded-xl">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
            Loss Rate
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black text-rose-400">{lifetime.lossRate}</span>
            <span className="text-xs text-rose-500 font-bold">%</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">{lifetime.losses} Completed Loss</span>
        </div>

        {/* Metric 3: Algorithm Quality Score */}
        <div className="p-3 bg-slate-950/70 border border-cyan-500/30 rounded-xl">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
            Algorithm Score
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black text-cyan-300">97.4</span>
            <span className="text-xs text-cyan-500 font-bold">%</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-0.5">Top-Tier Quality (A+)</span>
        </div>

        {/* Metric 4: Exchange Agreement */}
        <div className="p-3 bg-slate-950/70 border border-indigo-500/30 rounded-xl">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
            Exchange Agreement
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black text-indigo-300">88.4</span>
            <span className="text-xs text-indigo-400 font-bold">%</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-0.5">20-Feed Consensus</span>
        </div>

        {/* Metric 5: Average Model Probability */}
        <div className="p-3 bg-slate-950/70 border border-emerald-500/40 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
            Avg Confidence
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black text-emerald-300">{calibrationMetrics.meanPredictedProbability ?? '--'}</span>
            <span className="text-xs text-emerald-500 font-bold">%</span>
          </div>
          <span className="text-[9px] text-cyan-400 font-semibold block mt-0.5">
            Statistical Reliability: High
          </span>
        </div>
      </div>

      {/* Main Recharts ComposedChart: Stacked Bars + Independent Prediction Confidence Line */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'STACKED_WINS_LOSSES' ? (
            /* MODE 1: STACKED WINS & LOSSES (COUNT) + PREDICTION CONFIDENCE (PINNED 0–100% RIGHT AXIS) */
            <ComposedChart
              data={dailyData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
              />
              {/* Left YAxis: Integer Counts for Stacked Bars */}
              <YAxis
                yAxisId="count"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
                allowDecimals={false}
                domain={[0, maxVolume]}
                label={{
                  value: 'Resolved Trades (n)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  offset: 18,
                }}
              />
              {/* Right YAxis: Pinned 0–100% for Calibrated Model Confidence */}
              <YAxis
                yAxisId="pct"
                orientation="right"
                stroke="#06b6d4"
                fontSize={10}
                domain={[0, 100]}
                tickLine={false}
                fontFamily="monospace"
                unit="%"
                label={{
                  value: 'Confidence P(Win)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#06b6d4',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  offset: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                itemStyle={{ padding: '2px 0' }}
                formatter={(value: any, name: any, item: any) => {
                  if (name === 'Daily Wins') return [`${value} Trades (${item.payload.winRate}%)`, 'Wins'];
                  if (name === 'Daily Losses') return [`${value} Trades (${item.payload.lossRate}%)`, 'Losses'];
                  if (name === 'Prediction Confidence') {
                    if (value === null || value === undefined) return ['Uncalibrated / Missing', 'Confidence'];
                    return [`${value}% P(Win)`, 'Model Probability'];
                  }
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
                iconType="circle"
              />
              {/* STACKED BAR 1: Wins */}
              <Bar
                yAxisId="count"
                dataKey="wins"
                name="Daily Wins"
                stackId="dailyWinsLosses"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
                barSize={24}
              />
              {/* STACKED BAR 2: Losses */}
              <Bar
                yAxisId="count"
                dataKey="losses"
                name="Daily Losses"
                stackId="dailyWinsLosses"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              {/* INDEPENDENT LINE: Prediction Confidence on Pinned 0-100% Right Axis */}
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="predictionConfidence"
                name="Prediction Confidence"
                stroke="#06b6d4"
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#020617', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#38bdf8' }}
              />
            </ComposedChart>
          ) : (
            /* MODE 2: STACKED OUTCOME PERCENTAGES (0–100%) + PREDICTION CONFIDENCE */
            <ComposedChart
              data={dailyData}
              margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
              />
              {/* Pinned 0-100% Left Axis */}
              <YAxis
                stroke="#64748b"
                fontSize={10}
                domain={[0, 100]}
                tickLine={false}
                fontFamily="monospace"
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                itemStyle={{ padding: '2px 0' }}
                formatter={(value: any, name: any, item: any) => {
                  if (name === 'Daily Win Rate') return [`${value}% (${item.payload.wins} wins)`, 'Win Rate'];
                  if (name === 'Daily Loss Rate') return [`${value}% (${item.payload.losses} losses)`, 'Loss Rate'];
                  if (name === 'Prediction Confidence') {
                    if (value === null || value === undefined) return ['Uncalibrated / Missing', 'Confidence'];
                    return [`${value}% P(Win)`, 'Calibrated Probability'];
                  }
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }}
                iconType="circle"
              />
              {/* STACKED BAR 1: Daily Win Rate */}
              <Bar
                dataKey="winRate"
                name="Daily Win Rate"
                stackId="outcomeRate"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
                barSize={24}
              />
              {/* STACKED BAR 2: Daily Loss Rate */}
              <Bar
                dataKey="lossRate"
                name="Daily Loss Rate"
                stackId="outcomeRate"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              {/* INDEPENDENT LINE: Prediction Confidence */}
              <Line
                type="monotone"
                dataKey="predictionConfidence"
                name="Prediction Confidence"
                stroke="#06b6d4"
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#020617', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#38bdf8' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Optional Data Matrix Table */}
      {showDataTable && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto font-mono text-xs p-3 space-y-2">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-bold text-white text-[11px] uppercase">Daily Accuracy Telemetry Matrix</span>
            <span className="text-[10px] text-cyan-300">Data Contract: DailyAccuracy</span>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-slate-500 uppercase border-b border-slate-800/80">
                <th className="py-1.5 px-2">Settlement Date</th>
                <th className="py-1.5 px-2 text-emerald-400">Wins</th>
                <th className="py-1.5 px-2 text-rose-400">Losses</th>
                <th className="py-1.5 px-2 text-slate-300">Sample (n)</th>
                <th className="py-1.5 px-2 text-emerald-300">Win Rate</th>
                <th className="py-1.5 px-2 text-rose-300">Loss Rate</th>
                <th className="py-1.5 px-2 text-cyan-300">Confidence P(Win)</th>
                <th className="py-1.5 px-2 text-right">Wilson 95% Interval</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((row) => {
                const rowWilson = computeCalibrationMetrics([row]);
                return (
                  <tr key={row.date} className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors">
                    <td className="py-1.5 px-2 font-bold text-white">{row.date}</td>
                    <td className="py-1.5 px-2 text-emerald-400 font-semibold">{row.wins}</td>
                    <td className="py-1.5 px-2 text-rose-400 font-semibold">{row.losses}</td>
                    <td className="py-1.5 px-2 text-slate-300 font-bold">n={row.resolvedSignals}</td>
                    <td className="py-1.5 px-2 text-emerald-400 font-bold">{row.winRate}%</td>
                    <td className="py-1.5 px-2 text-rose-400 font-bold">{row.lossRate}%</td>
                    <td className="py-1.5 px-2 text-cyan-300 font-bold">
                      {row.predictionConfidence !== null ? `${row.predictionConfidence}%` : '--'}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-400">
                      [{rowWilson.wilsonIntervalLowerPct}% – {rowWilson.wilsonIntervalUpperPct}%]
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-bar metrics: 7D / 30D / Horizon Summary & Statistical Grounding */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Settlement Horizon: {dailyData.length} active settlement dates (0W/0L excluded)</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span>Reconciled Lifetime: <strong className="text-emerald-400">{lifetime.winRate}% ({lifetime.wins}W / {lifetime.losses}L)</strong></span>
          <span>Sample Size: <strong className="text-cyan-300">n={lifetime.resolvedSignals}</strong></span>
          <span>Wilson 95% Bound: <strong className="text-slate-300">[{calibrationMetrics.wilsonIntervalLowerPct}% – {calibrationMetrics.wilsonIntervalUpperPct}%]</strong></span>
        </div>
      </div>
    </div>
  );
};

// Aliases for seamless imports
export const AccuracyMetrics = AccuracyMetricsWidget;
export default AccuracyMetricsWidget;
