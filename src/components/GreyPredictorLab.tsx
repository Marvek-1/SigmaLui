import React, { useState } from 'react';
import {
  AssetDataFeed,
} from '../types';
import { calculateGM11 } from '../utils/mathGrey';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';

interface GreyPredictorLabProps {
  assets: AssetDataFeed[];
  resolutionRho: number;
  onUpdateRho: (rho: number) => void;
}

export const GreyPredictorLab: React.FC<GreyPredictorLabProps> = ({
  assets,
  resolutionRho,
  onUpdateRho,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [selectedStream, setSelectedStream] = useState<'price' | 'rsi' | 'whale' | 'social'>('price');

  const currentAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  let rawData = currentAsset.priceHistory;
  let unit = 'USD';
  if (selectedStream === 'rsi') {
    rawData = currentAsset.rsiHistory;
    unit = 'pts';
  } else if (selectedStream === 'whale') {
    rawData = currentAsset.whaleFlowHistory;
    unit = 'flow';
  } else if (selectedStream === 'social') {
    rawData = currentAsset.socialHistory;
    unit = 'sentiment';
  }

  // Calculate GM(1,1) model
  const greyModel = calculateGM11(rawData);

  // Prepare chart dataset
  const chartData = [
    ...rawData.map((val, idx) => ({
      step: `t-${rawData.length - 1 - idx}`,
      raw: val,
      fitted: Number(greyModel.predictedSequence[idx].toFixed(2)),
      forecast: null as number | null,
      ago: greyModel.agoSequence[idx],
    })),
    {
      step: 't+1 (Lookahead)',
      raw: null as number | null,
      fitted: null as number | null,
      forecast: Number(greyModel.lookaheadForecast[0].toFixed(2)),
      ago: null as number | null,
    },
    {
      step: 't+2 (Lookahead)',
      raw: null as number | null,
      fitted: null as number | null,
      forecast: Number(greyModel.lookaheadForecast[1].toFixed(2)),
      ago: null as number | null,
    },
    {
      step: 't+3 (Lookahead)',
      raw: null as number | null,
      fitted: null as number | null,
      forecast: Number(greyModel.lookaheadForecast[2].toFixed(2)),
      ago: null as number | null,
    },
  ];

  return (
    <div className="space-y-5 font-mono">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        {/* Asset Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Target Asset:</span>
          <div className="flex items-center space-x-1">
            {assets.map((a) => (
              <button
                key={a.symbol}
                onClick={() => setSelectedSymbol(a.symbol)}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                  selectedSymbol === a.symbol
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Stream Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Data Stream:</span>
          <select
            aria-label="Target data stream"
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value as any)}
            className="bg-slate-950 text-xs text-cyan-300 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="price">Spot Price ({currentAsset.markPrice})</option>
            <option value="rsi">RSI Lookahead Series</option>
            <option value="whale">Whale Netflow Inflow</option>
            <option value="social">Social Galaxy Score</option>
          </select>
        </div>

        {/* Resolution Coefficient Rho Slider */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400">Resolution Coef (ρ):</span>
          <input
            type="range"
            aria-label="Resolution coefficient rho"
            min="0.1"
            max="1.0"
            step="0.05"
            value={resolutionRho}
            onChange={(e) => onUpdateRho(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs text-cyan-400 font-bold w-8">{resolutionRho.toFixed(2)}</span>
        </div>
      </div>

      {/* Differential Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Differential Equation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] uppercase block">Differential Equation</span>
          <span className="text-sm font-bold text-cyan-300 my-1 font-mono">
            {greyModel.formulaStr}
          </span>
          <span className="text-[10px] text-slate-500">
            Development Coef a={greyModel.a.toFixed(4)}
          </span>
        </div>

        {/* Residual Error (Gate 1) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] uppercase block">Residual Error (MRPE)</span>
          <div className="flex items-baseline space-x-2 my-1">
            <span
              className={`text-lg font-bold ${
                greyModel.isStable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {(greyModel.meanRelativeError * 100).toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-400">
              {greyModel.isStable ? 'PASSED (<5%)' : 'NOISY (>5%)'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Gate 1: Noise Reduction Ceiling</span>
        </div>

        {/* 3-Step Lookahead Window */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] uppercase block">3-Interval Forecast</span>
          <div className="flex items-center justify-between text-xs my-1 font-bold text-slate-200">
            <span>t+1: {greyModel.lookaheadForecast[0].toFixed(1)}</span>
            <span>t+2: {greyModel.lookaheadForecast[1].toFixed(1)}</span>
            <span className="text-cyan-400">t+3: {greyModel.lookaheadForecast[2].toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-emerald-400">
            Forecast Momentum: {greyModel.momentumDelta > 0 ? `+${greyModel.momentumDelta.toFixed(2)}%` : `${greyModel.momentumDelta.toFixed(2)}%`}
          </span>
        </div>

        {/* AGO Smoothing Depth */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] uppercase block">1-AGO Smoothing</span>
          <span className="text-sm font-bold text-purple-300 my-1">
            Σ x^(0)(i) = {greyModel.agoSequence[greyModel.agoSequence.length - 1].toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500">Inverse AGO fitted accurately</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Temporal Grey Look-Ahead Trajectory & AGO Fit ({selectedSymbol})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Units: <span className="text-cyan-300">{unit}</span>
          </span>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="step" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              
              {/* Actual Raw line */}
              <Line
                type="monotone"
                dataKey="raw"
                name="Actual Raw Data (x0)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#38bdf8' }}
                connectNulls={false}
              />
              
              {/* Fitted Historical line */}
              <Line
                type="monotone"
                dataKey="fitted"
                name="GM(1,1) Fitted Sequence"
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#a855f7' }}
                connectNulls={false}
              />

              {/* Lookahead Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Look-Ahead Window (t+1..3)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
