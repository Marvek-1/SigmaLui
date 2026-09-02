import React, { useState, useMemo } from 'react';
import { CryptoFuturesPair, FuturesSector, SuperSignal, SilentDiscardLog } from '../types';
import { pipelineEngine } from '../utils/dataEngine';
import { calculateSqueezePressure } from '../utils/futuresUniverse';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Scale,
  ShieldAlert,
  Play,
  RotateCw,
  Coins,
} from 'lucide-react';

interface FuturesUniverseViewProps {
  pairs: CryptoFuturesPair[];
  onRefresh: () => void;
  onAuditPair?: (pairSymbol: string) => void;
}

export const FuturesUniverseView: React.FC<FuturesUniverseViewProps> = ({
  pairs,
  onRefresh,
  onAuditPair,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyMonitored, setOnlyMonitored] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'openInterestUsd' | 'fundingRate' | 'volume24hUsd' | 'priceChange24h'>('openInterestUsd');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Add custom pair state
  const [isAddingPair, setIsAddingPair] = useState<boolean>(false);
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [customSector, setCustomSector] = useState<FuturesSector>('Custom');
  const [customPrice, setCustomPrice] = useState<number>(10.0);

  // Audit modal state
  const [auditResult, setAuditResult] = useState<{
    pairSymbol: string;
    signal: SuperSignal | null;
    silentLog: SilentDiscardLog | null;
  } | null>(null);

  const sectors: (FuturesSector | 'ALL')[] = [
    'ALL',
    'Mega Cap',
    'Layer 1/2',
    'AI & Compute',
    'DeFi & RWA',
    'Meme & Momentum',
    'Infrastructure & DePIN',
    'Custom',
  ];

  const filteredPairs = useMemo(() => {
    return pairs
      .filter((p) => {
        if (selectedSector !== 'ALL' && p.sector !== selectedSector) return false;
        if (onlyMonitored && !p.monitoredInChurner) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            p.symbol.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.pair.toLowerCase().includes(q) ||
            p.sector.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] || 0;
        const valB = b[sortField] || 0;
        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [pairs, selectedSector, onlyMonitored, searchQuery, sortField, sortAsc]);

  const handleToggleMonitoring = (symbol: string) => {
    pipelineEngine.togglePairMonitoring(symbol);
    onRefresh();
  };

  const handleToggleAll = (enable: boolean) => {
    pipelineEngine.setAllPairsMonitoring(enable);
    onRefresh();
  };

  const handleCreateCustomPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;
    pipelineEngine.addCustomFuturesPair(customSymbol.trim(), customSector, Number(customPrice));
    setCustomSymbol('');
    setIsAddingPair(false);
    onRefresh();
  };

  const handleRunAudit = (symbol: string) => {
    const res = pipelineEngine.runAuditOnSpecificPair(symbol);
    setAuditResult({
      pairSymbol: symbol,
      signal: res.newSignal,
      silentLog: res.silentLog,
    });
    if (onAuditPair) onAuditPair(symbol);
  };

  // Aggregated futures stats
  const totalMonitored = pairs.filter((p) => p.monitoredInChurner).length;
  const totalOI = pairs.reduce((acc, p) => acc + p.openInterestUsd, 0);
  const avgFunding = pairs.reduce((acc, p) => acc + p.fundingRate, 0) / (pairs.length || 1);

  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner & Aggregated Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-mono">
                CRYPTO FUTURES UNIVERSE MONITOR
              </h2>
              <span className="px-2 py-0.5 text-xs rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                {totalMonitored} / {pairs.length} Active in Churner
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Continuous real-time tracking of crypto perpetual futures contracts. Computes basis spread, funding rate velocity, open interest divergence, and liquidation squeeze metrics across all sectors before feeding into the GM(1,1) Lookahead and Hausdorff TOPSIS decision matrix.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Total Futures OI</span>
              <span className="text-sm font-bold text-cyan-300">
                ${(totalOI / 1e9).toFixed(2)}B
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Avg 8h Funding</span>
              <span className={`text-sm font-bold ${avgFunding >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {avgFunding >= 0 ? `+${(avgFunding * 100).toFixed(4)}%` : `${(avgFunding * 100).toFixed(4)}%`}
              </span>
            </div>

            <button
              onClick={() => setIsAddingPair(!isAddingPair)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom PERP</span>
            </button>
          </div>
        </div>

        {/* Add Custom Pair Form Modal / Drawer */}
        {isAddingPair && (
          <form
            onSubmit={handleCreateCustomPair}
            className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 p-3 rounded-lg flex flex-wrap items-end gap-3 font-mono text-xs"
          >
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Pair Symbol (e.g. INJ, TIA, RENDER)</label>
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                placeholder="TOKEN"
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white w-32 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Sector</label>
              <select
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value as FuturesSector)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
              >
                {sectors.filter((s) => s !== 'ALL').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Approx Base Price ($)</label>
              <input
                type="number"
                step="any"
                value={customPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white w-28 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors"
            >
              Inject Into Universe
            </button>

            <button
              type="button"
              onClick={() => setIsAddingPair(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search futures pair..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all ${
                selectedSector === sector
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={onlyMonitored}
              onChange={(e) => setOnlyMonitored(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Active Only</span>
          </label>

          <button
            onClick={() => handleToggleAll(true)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
          >
            Monitor All
          </button>

          <button
            onClick={() => handleToggleAll(false)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
          >
            Mute All
          </button>
        </div>
      </div>

      {/* Futures Table Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto shadow-lg">
        <table className="w-full text-left font-mono text-xs divide-y divide-slate-800/80">
          <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase">
            <tr>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Contract / Pair</th>
              <th className="py-3 px-3">Sector</th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('priceChange24h'); setSortAsc(!sortAsc); }}>
                Mark Price / 24h
              </th>
              <th className="py-3 px-3">Basis Spread</th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('fundingRate'); setSortAsc(!sortAsc); }}>
                8h Funding Rate
              </th>
              <th className="py-3 px-3 cursor-pointer" onClick={() => { setSortField('openInterestUsd'); setSortAsc(!sortAsc); }}>
                Open Interest
              </th>
              <th className="py-3 px-3">Long/Short Ratio</th>
              <th className="py-3 px-3">Squeeze Index</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredPairs.map((pair) => {
              const squeeze = calculateSqueezePressure(pair);
              return (
                <tr
                  key={pair.pair}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Monitored Toggle */}
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggleMonitoring(pair.symbol)}
                      title={pair.monitoredInChurner ? 'Click to exclude from churner' : 'Click to include in churner'}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                        pair.monitoredInChurner
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {pair.monitoredInChurner ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </td>

                  {/* Pair Name & Leverage */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        {pair.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center space-x-1">
                          <span>{pair.pair}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {pair.maxLeverage}x
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{pair.name}</span>
                      </div>
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap">
                      {pair.sector}
                    </span>
                  </td>

                  {/* Mark Price */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">
                      ${pair.markPrice.toLocaleString(undefined, { minimumFractionDigits: pair.markPrice < 1 ? 4 : 2 })}
                    </div>
                    <div className={`text-[10px] flex items-center ${pair.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
                    </div>
                  </td>

                  {/* Basis */}
                  <td className="py-2.5 px-3">
                    <div className={`text-xs ${pair.basisBps >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pair.basisBps >= 0 ? '+' : ''}{pair.basisBps.toFixed(1)} bps
                    </div>
                    <div className="text-[9px] text-slate-500">Idx: ${pair.indexPrice.toLocaleString(undefined, { minimumFractionDigits: pair.indexPrice < 1 ? 4 : 2 })}</div>
                  </td>

                  {/* 8h Funding Rate */}
                  <td className="py-2.5 px-3">
                    <div className={`font-semibold ${pair.fundingRate > 0.0002 ? 'text-amber-400' : pair.fundingRate > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pair.fundingRate >= 0 ? '+' : ''}{(pair.fundingRate * 100).toFixed(4)}%
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {(pair.fundingRate * 3 * 365 * 100).toFixed(1)}% APR
                    </div>
                  </td>

                  {/* Open Interest */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-cyan-300">
                      ${(pair.openInterestUsd / 1e6).toFixed(1)}M
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Vol: ${(pair.volume24hUsd / 1e6).toFixed(1)}M
                    </div>
                  </td>

                  {/* Long / Short Ratio */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-semibold ${pair.topTraderRatio > 1.2 ? 'text-emerald-400' : pair.topTraderRatio < 0.9 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {pair.topTraderRatio.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500">Top Accounts</div>
                  </td>

                  {/* Squeeze Risk */}
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      squeeze.squeezeCategory === 'EXTREME'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : squeeze.squeezeCategory === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {squeeze.squeezeScore > 60 ? `⚡ Squeeze (${squeeze.squeezeScore})` : `Stable (${squeeze.squeezeScore})`}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleRunAudit(pair.symbol)}
                      className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[10px] font-semibold transition-all inline-flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3" />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Audit Result Modal / Banner */}
      {auditResult && (
        <div className="bg-slate-900 border border-cyan-500/50 rounded-xl p-4 shadow-xl font-mono text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">
                IMMEDIATE COMPUTATIONAL AUDIT RESULT: {auditResult.pairSymbol}
              </span>
            </div>
            <button
              onClick={() => setAuditResult(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕ Close
            </button>
          </div>

          {auditResult.signal ? (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-emerald-300 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SUPER SIGNAL EMITTED (TOPSIS Ci: {auditResult.signal.topsisScore.toFixed(4)})</span>
              </div>
              <p className="text-xs text-slate-300">{auditResult.signal.explanation}</p>
              <div className="flex flex-wrap gap-3 pt-2 text-[11px]">
                <span>Entry: ${auditResult.signal.entryPrice}</span>
                <span>Target 1: ${auditResult.signal.target1}</span>
                <span>Target 2: ${auditResult.signal.target2}</span>
                <span>Stop Loss: ${auditResult.signal.stopLoss}</span>
                <span>R:R: {auditResult.signal.riskRewardRatio}x</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg text-amber-300 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>STRATEGIC SILENCE TRIGGERED ({auditResult.silentLog?.gateFailed})</span>
              </div>
              <p className="text-xs text-slate-300">{auditResult.silentLog?.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
