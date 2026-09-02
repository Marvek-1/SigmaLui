import React, { useState } from 'react';
import { ApiSource } from '../types';
import {
  DownloadCloud,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Server,
  Zap,
} from 'lucide-react';

interface ApiHarvesterGridProps {
  apis: ApiSource[];
}

export const ApiHarvesterGrid: React.FC<ApiHarvesterGridProps> = ({ apis }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'Technicals',
    'On-Chain & Whale',
    'Social & Sentiment',
    'Orderflow & Liquidity',
  ];

  const filteredApis = apis.filter((api) => {
    if (selectedCategory === 'ALL') return true;
    return api.category === selectedCategory;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat} ({cat === 'ALL' ? apis.length : apis.filter((a) => a.category === cat).length})
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            20/20 Ingestors Online
          </span>
          <span>Async aiohttp / WS Pipeline</span>
        </div>
      </div>

      {/* 20 API Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredApis.map((api) => (
          <div
            key={api.id}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-bold text-white truncate max-w-[170px]" title={api.name}>
                  {api.name}
                </h4>
                <span className="text-[10px] text-slate-500">{api.category}</span>
              </div>

              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  api.signalDirection === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : api.signalDirection === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {api.signalDirection}
              </span>
            </div>

            {/* Current Value & Latency */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 flex items-baseline justify-between">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Current Stream</span>
                <span className="text-sm font-bold text-cyan-300">
                  {typeof api.currentValue === 'number'
                    ? api.currentValue.toLocaleString()
                    : api.currentValue}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">{api.unit}</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block">Ping</span>
                <span className="text-xs font-bold text-slate-300">{api.latencyMs}ms</span>
              </div>
            </div>

            {/* Footer metrics */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>Reliability: <strong className="text-emerald-400">{(api.reliabilityScore * 100).toFixed(0)}%</strong></span>
              <span>Weight: <strong className="text-purple-300">{(api.currentWeight * 100).toFixed(1)}%</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
