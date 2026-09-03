import React, { useState, useMemo } from 'react';
import { CryptoFuturesPair, FuturesSector } from '../types';
import { analyzeLiquidityHeatmap } from '../utils/fractalLiquidity';
import {
  Flame,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Maximize2,
  Info,
} from 'lucide-react';

interface LiquidityHeatmapProps {
  assets: CryptoFuturesPair[];
  marketState?: string;
}

export const LiquidityHeatmap: React.FC<LiquidityHeatmapProps> = ({
  assets = [],
  marketState = 'TRENDING_BULL',
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>(
    assets[0]?.symbol || 'BTC'
  );
  const [viewMode, setViewMode] = useState<'HEATMAP_GRID' | 'DEPTH_PRESSURE'>('HEATMAP_GRID');

  // Extract unique sectors
  const sectors = useMemo(() => {
    const s = Array.from(new Set(assets.map((a) => a.sector || 'Mega Cap')));
    return ['ALL', ...s];
  }, [assets]);

  // Filter assets by selected sector
  const filteredAssets = useMemo(() => {
    if (selectedSector === 'ALL') return assets;
    return assets.filter((a) => a.sector === selectedSector);
  }, [assets, selectedSector]);

  // Selected asset detail
  const activeAsset = useMemo(() => {
    return assets.find((a) => a.symbol === selectedAssetSymbol) || assets[0] || null;
  }, [assets, selectedAssetSymbol]);

  // Compute liquidity analysis for all assets
  const assetLiquidityData = useMemo(() => {
    return filteredAssets.map((asset) => {
      const analysis = analyzeLiquidityHeatmap(asset.markPrice, marketState, asset.symbol);
      const askVolume = analysis.levels
        .filter((l) => l.type === 'ASK_WALL')
        .reduce((sum, l) => sum + l.volumeUsd, 0);
      const bidVolume = analysis.levels
        .filter((l) => l.type === 'BID_WALL')
        .reduce((sum, l) => sum + l.volumeUsd, 0);
      
      const totalVolume = askVolume + bidVolume || 1;
      const bidPressurePct = Math.round((bidVolume / totalVolume) * 100);
      const askPressurePct = 100 - bidPressurePct;
      
      // Depth Heat Intensity: 0 to 1 based on volume vs market cap and distance
      const depthIntensity = Math.min(1, Math.max(0.1, asset.volume24hUsd / 2000000000));

      return {
        asset,
        analysis,
        askVolume,
        bidVolume,
        bidPressurePct,
        askPressurePct,
        depthIntensity,
      };
    });
  }, [filteredAssets, marketState]);

  // Orderbook depth analysis for active selected asset
  const activeAnalysis = useMemo(() => {
    if (!activeAsset) return null;
    return analyzeLiquidityHeatmap(activeAsset.markPrice, marketState, activeAsset.symbol);
  }, [activeAsset, marketState]);

  // Helper color for orderbook pressure
  const getPressureColor = (bidPct: number) => {
    if (bidPct >= 65) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (bidPct >= 52) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (bidPct >= 48) return 'text-slate-300 bg-slate-800 border-slate-700';
    if (bidPct >= 35) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getHeatIntensityBg = (bidPct: number, intensity: number) => {
    // Return subtle gradient based on bid dominance and volume density
    if (bidPct >= 55) {
      return `rgba(16, 185, 129, ${Math.min(0.25, 0.08 + intensity * 0.15)})`;
    } else if (bidPct <= 45) {
      return `rgba(244, 63, 94, ${Math.min(0.25, 0.08 + intensity * 0.15)})`;
    }
    return `rgba(6, 182, 212, ${Math.min(0.2, 0.06 + intensity * 0.1)})`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/3 w-80 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Market Liquidity Depth & Orderbook Heatmap
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                GATE 5 MULTI-CLASS DEPTH
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Real-time bid/ask orderbook clustering, liquidation pools, and wall distance across futures sectors
            </p>
          </div>
        </div>

        {/* View Mode & Global Metric Chips */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto font-mono text-xs">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('HEATMAP_GRID')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'HEATMAP_GRID'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Heatmap Matrix
            </button>
            <button
              onClick={() => setViewMode('DEPTH_PRESSURE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'DEPTH_PRESSURE'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Depth Pressure Gauge
            </button>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Monitored Pairs</span>
            <span className="text-xs font-bold text-cyan-300">{assets.length} Active Feeds</span>
          </div>
        </div>
      </div>

      {/* Sector Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Asset Class Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                selectedSector === sec
                  ? 'bg-indigo-950 border-indigo-500/60 text-indigo-300 font-bold shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Main Heatmap Matrix View */}
      {viewMode === 'HEATMAP_GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {assetLiquidityData.map(({ asset, analysis, bidPressurePct, askPressurePct, depthIntensity }) => {
            const isSelected = selectedAssetSymbol === asset.symbol;
            const pressureStyle = getPressureColor(bidPressurePct);
            const dynamicBg = getHeatIntensityBg(bidPressurePct, depthIntensity);

            return (
              <div
                key={asset.symbol}
                onClick={() => setSelectedAssetSymbol(asset.symbol)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
                style={{ backgroundColor: dynamicBg }}
              >
                {/* Header: Asset & Sector */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white font-mono text-xs">
                        {asset.symbol}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-xs font-mono">{asset.pair}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {asset.maxLeverage}x
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block">{asset.sector || 'Perpetual'}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-white">${asset.markPrice.toLocaleString()}</span>
                      <span
                        className={`text-[10px] block font-semibold ${
                          asset.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {asset.priceChange24h >= 0 ? `+${asset.priceChange24h}%` : `${asset.priceChange24h}%`}
                      </span>
                    </div>
                  </div>

                  {/* Liquidity Orderbook Pressure Bar */}
                  <div className="space-y-1 font-mono text-[11px] mb-3">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-400 font-bold">Bids: {bidPressurePct}%</span>
                      <span className="text-rose-400 font-bold">Asks: {askPressurePct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${bidPressurePct}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{ width: `${askPressurePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Depth Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">Ask Wall</span>
                      <span className="font-bold text-rose-300">
                        +{analysis.closestOverheadWallDistancePct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">Bid Support</span>
                      <span className="font-bold text-emerald-300">
                        -{analysis.closestSupportWallDistancePct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upside Clearance Status */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-slate-400">Path Clearance:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold border ${
                      analysis.hasClearPathToUpside
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {analysis.hasClearPathToUpside ? 'CLEAR TO UPSIDE' : 'RESISTANCE WALL'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Depth Pressure Gauge View for Active Asset */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
          {/* Left: Asset Selector List */}
          <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 max-h-96 overflow-y-auto">
            <span className="text-[11px] text-slate-400 uppercase font-bold block px-1">
              Select Pair for Full Depth Analysis:
            </span>
            {filteredAssets.map((a) => {
              const isSelected = selectedAssetSymbol === a.symbol;
              return (
                <button
                  key={a.symbol}
                  onClick={() => setSelectedAssetSymbol(a.symbol)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-xs">{a.symbol}</span>
                    <span className="text-[10px] text-slate-500">{a.sector}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-white">${a.markPrice.toLocaleString()}</span>
                    <span
                      className={`text-[10px] block ${
                        a.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {a.priceChange24h >= 0 ? `+${a.priceChange24h}%` : `${a.priceChange24h}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Depth Ladder & Level Inspection */}
          {activeAsset && activeAnalysis && (
            <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-sm">
                    {activeAsset.symbol}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeAsset.pair} Depth Inspection</h4>
                    <span className="text-xs text-slate-400">
                      Mark: <span className="text-cyan-300 font-bold">${activeAsset.markPrice.toLocaleString()}</span> | 24h Vol: ${(activeAsset.volume24hUsd / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Liquidity Score:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {(activeAnalysis.liquidityScore * 100).toFixed(0)} / 100
                  </span>
                </div>
              </div>

              {/* Orderbook Depth Levels Ladder */}
              <div className="space-y-1.5 text-xs">
                <div className="grid grid-cols-4 text-slate-500 text-[10px] uppercase font-bold px-2">
                  <span>Level Type</span>
                  <span>Price Target</span>
                  <span>Volume (USD)</span>
                  <span className="text-right">Distance (%)</span>
                </div>

                {activeAnalysis.levels.map((lvl, idx) => {
                  const isAsk = lvl.type === 'ASK_WALL';
                  const isBid = lvl.type === 'BID_WALL';
                  const isPool = lvl.type === 'LIQUIDATION_POOL';

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-4 items-center p-2 rounded-lg border text-xs font-mono transition-all ${
                        isAsk
                          ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                          : isBid
                          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                          : 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                      }`}
                    >
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        {isAsk && <ArrowUpRight className="w-3 h-3 text-rose-400" />}
                        {isBid && <ArrowDownRight className="w-3 h-3 text-emerald-400" />}
                        {isPool && <Layers className="w-3 h-3 text-purple-400" />}
                        {lvl.type}
                      </span>
                      <span className="font-bold text-white">${lvl.price.toLocaleString()}</span>
                      <span>${(lvl.volumeUsd / 1000000).toFixed(2)}M</span>
                      <span className="text-right font-bold">
                        {isAsk ? `+${lvl.distancePct}%` : isBid ? `-${lvl.distancePct}%` : `${lvl.distancePct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
