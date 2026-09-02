import React, { useState } from 'react';
import { AssetDataFeed } from '../types';
import { evaluateFractalConfluence, analyzeLiquidityHeatmap } from '../utils/fractalLiquidity';
import {
  Layers,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

interface FractalLiquidityViewProps {
  assets: AssetDataFeed[];
  marketState: string;
}

export const FractalLiquidityView: React.FC<FractalLiquidityViewProps> = ({
  assets,
  marketState,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const asset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  const fractal = evaluateFractalConfluence(0.9782, 'LONG', marketState, 0.0182);
  const liquidity = analyzeLiquidityHeatmap(asset.markPrice, marketState, asset.symbol);

  return (
    <div className="space-y-6 font-mono">
      {/* Asset Selector */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">Target Asset for Deep Layer:</span>
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
                {a.symbol} (${a.markPrice.toLocaleString()})
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Regime: <span className="text-cyan-400 font-bold">{marketState}</span>
        </div>
      </div>

      {/* Grid: Fractal Confluence (Left) & Liquidity Heatmap (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* A. Fractal Confluence Layer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Super Skill A: Fractal Confluence (5m, 1H, 4H)
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded border ${
                fractal.isConfluent
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {fractal.isConfluent ? '3-TF CONFLUENCE PASS' : 'TF MISMATCH DETECTED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The MCDM decision pipeline runs simultaneously across three timeframes. A Super Signal is ONLY emitted if TOPSIS Closeness Coefficient $C_i &gt; 0.95$ on all three tiers. This prevents buying a 5-minute pump that is an ongoing 4-hour dump.
          </p>

          {/* 3-Timeframe Cards */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* 5m */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">5m Execution</span>
              <span className="text-base font-bold text-cyan-400 block">
                Ci: {fractal.tf5m.ci.toFixed(4)}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                Dir: {fractal.tf5m.direction}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Noise: {(fractal.tf5m.greyError * 100).toFixed(1)}%
              </span>
            </div>

            {/* 1H */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">1H Trend Structure</span>
              <span
                className={`text-base font-bold block ${
                  fractal.tf1h.ci >= 0.95 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                Ci: {fractal.tf1h.ci.toFixed(4)}
              </span>
              <span
                className={`text-[10px] font-semibold block ${
                  fractal.tf1h.direction === 'LONG' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                Dir: {fractal.tf1h.direction}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Noise: {(fractal.tf1h.greyError * 100).toFixed(1)}%
              </span>
            </div>

            {/* 4H */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">4H Macro Anchor</span>
              <span
                className={`text-base font-bold block ${
                  fractal.tf4h.ci >= 0.95 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                Ci: {fractal.tf4h.ci.toFixed(4)}
              </span>
              <span
                className={`text-[10px] font-semibold block ${
                  fractal.tf4h.direction === 'LONG' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                Dir: {fractal.tf4h.direction}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Noise: {(fractal.tf4h.greyError * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Aggregate Fractal Alignment Score:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {(fractal.confluenceScore * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* B. Liquidity Heatmap Layer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Super Skill B: Coinglass Liquidity Heatmap
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold rounded border ${
                liquidity.hasClearPathToUpside
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {liquidity.hasClearPathToUpside ? 'CLEAR PATH TO UPSIDE' : 'LIQUIDITY WALL DETECTED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Even with perfect mathematical scores, a dense sell wall 0.5% above price will suppress the breakout. The TOPSIS Ideal Solution demands a minimum <strong>0.80% clear path</strong> before heavy resistance.
          </p>

          {/* Clearance Gauge */}
          <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Closest Overhead Ask Wall</span>
              <span className="text-sm font-bold text-white">
                +{liquidity.closestOverheadWallDistancePct.toFixed(2)}% above entry
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase">Upside Clearance Status</span>
              <span
                className={`font-bold ${
                  liquidity.hasClearPathToUpside ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {liquidity.hasClearPathToUpside ? 'OPEN CHANNEL' : 'TRAPPED (<0.8%)'}
              </span>
            </div>
          </div>

          {/* Visual Orderbook Depth & Liquidity Clusters */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-500 uppercase border-b border-slate-800/80 pb-1">
              <span>Price Level</span>
              <span>Liquidity Volume (USD)</span>
              <span>Offset</span>
            </div>

            {liquidity.levels.map((lvl, idx) => {
              const isOverhead = lvl.type === 'ASK_WALL';
              const maxVol = 80000000;
              const barWidth = Math.min(100, (lvl.volumeUsd / maxVol) * 100);

              return (
                <div key={idx} className="relative flex items-center justify-between py-1 text-xs px-2 rounded bg-slate-950/60 overflow-hidden">
                  {/* Volume Depth Bar Background */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 opacity-15 ${
                      isOverhead ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>

                  <span className={`font-mono font-bold ${isOverhead ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${lvl.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>

                  <span className="text-slate-300 font-mono">
                    ${(lvl.volumeUsd / 1000000).toFixed(1)}M
                  </span>

                  <span className={`text-[11px] font-mono ${isOverhead ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isOverhead ? `+${lvl.distancePct}%` : `-${lvl.distancePct}%`}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
