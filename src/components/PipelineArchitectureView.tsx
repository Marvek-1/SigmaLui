import React, { useState } from 'react';
import {
  DownloadCloud,
  Database,
  SlidersHorizontal,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ApiSource, PipelineStats } from '../types';

interface PipelineArchitectureViewProps {
  apis: ApiSource[];
  stats: PipelineStats;
}

export const PipelineArchitectureView: React.FC<PipelineArchitectureViewProps> = ({
  apis,
  stats,
}) => {
  const [selectedService, setSelectedService] = useState<string>('alchemist');

  const services = [
    {
      id: 'harvester',
      step: '1',
      name: 'The Harvester',
      subtext: 'Ingestion Layer',
      icon: DownloadCloud,
      color: 'from-cyan-500 to-blue-600',
      badge: '20+ APIs (24/7 Async)',
      description:
        'Continuous high-frequency non-blocking aiohttp ingestor pulling Technicals, On-Chain flows, Social velocity, and Orderbook L2 depth.',
      telemetry: {
        'Active Ingestors': '20 feeds',
        'Average Latency': `${stats.avgLatencyMs.toFixed(1)}ms`,
        'Ingestion Rate': '120 packets/sec',
        'Payload Format': 'Normalized Timeseries JSON',
      },
    },
    {
      id: 'redis',
      step: '2',
      name: 'Redis Lake',
      subtext: 'In-Memory Cache',
      icon: Database,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Sub-Millisecond Read',
      description:
        'Local RAM-backed TimeSeries structure preventing sequential API latency bottlenecks and maintaining continuous sliding 5-point AGO windows.',
      telemetry: {
        'Memory Footprint': `${(stats.redisMemoryKb / 1024).toFixed(2)} MB`,
        'Read Latency': '0.4ms',
        'Window Depth': '5-10 ticks per asset',
        'Buffer Status': 'SYNCHRONIZED',
      },
    },
    {
      id: 'alchemist',
      step: '3',
      name: 'The Alchemist',
      subtext: 'Grey GM(1,1) + N-AHP',
      icon: SlidersHorizontal,
      color: 'from-indigo-500 to-purple-600',
      badge: 'Lookahead & Conflict Engine',
      description:
        'Computes 1-AGO smoothed differential equations to forecast 3 intervals forward while Neutrosophic AHP quantifies (Truth, Indeterminacy, Falsity).',
      telemetry: {
        'Grey Lookahead Window': 't+1, t+2, t+3 intervals',
        'Noise Ceiling Gate': 'MRPE < 5.0%',
        'Conflict Indeterminacy (I)': stats.currentIndeterminacy.toFixed(3),
        'Market State': stats.currentIndeterminacy > 0.28 ? 'Confused / Penalty Applied' : 'Resolved Consensus',
      },
    },
    {
      id: 'judge',
      step: '4',
      name: 'The Judge',
      subtext: 'TOPSIS 95% Gate',
      icon: Scale,
      color: 'from-purple-500 to-pink-600',
      badge: 'Ci > 0.95 Decision Gate',
      description:
        'Ranks assets against the Perfect Trade profile. If Indeterminacy is elevated, the Ideal Solution is mathematically pushed farther away to maintain Silence.',
      telemetry: {
        'Closeness Threshold (Ci)': '> 0.9500',
        'Fractal Validation': '5m + 1H + 4H Simultaneous',
        'Liquidity Wall Clearance': '> 0.80% overhead path',
        'Total Emitted Signals': `${stats.signalsEmitted}`,
      },
    },
    {
      id: 'validator',
      step: '5',
      name: 'The Validator',
      subtext: 'Temporal Feedback (GRA)',
      icon: RotateCcw,
      color: 'from-pink-500 to-rose-600',
      badge: 'Self-Correcting Super Skill',
      description:
        'Tracks trade outcomes and applies Grey Relational Analysis (GRA) to calculate relational grades, pinpointing "False Truth" APIs and auto-penalizing weights.',
      telemetry: {
        'Resolution Coef (rho)': `${stats.resolutionRho.toFixed(2)}`,
        'Success Rate (Gate Target)': `${stats.successRatePct.toFixed(1)}%`,
        'GRA Penalty Cycles': `${stats.failedSignals + 3}`,
        'Learning Status': 'Active Autonomous Calibration',
      },
    },
  ];

  const currentActive = services.find((s) => s.id === selectedService) || services[2];

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {services.map((srv, idx) => {
          const Icon = srv.icon;
          const isSelected = selectedService === srv.id;

          return (
            <div
              key={srv.id}
              onClick={() => setSelectedService(srv.id)}
              className={`relative cursor-pointer rounded-xl p-4 transition-all border ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                  {srv.step}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-900/40">
                  {srv.badge}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center space-x-2 my-2">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${srv.color} flex items-center justify-center text-white shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white font-mono leading-tight">{srv.name}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{srv.subtext}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {srv.description}
              </p>

              {/* Arrow Connector on desktop */}
              {idx < 4 && (
                <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Microservice Deep Dive Inspector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentActive.color} flex items-center justify-center text-white shadow-md`}
            >
              <currentActive.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-mono">{currentActive.name}</h2>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-cyan-300">
                  Step {currentActive.step} of 5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{currentActive.subtext}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">ONLINE & RUNNING</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          {/* Architecture Rationale */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider">
              Mathematical & Operational Responsibility
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {currentActive.description}
            </p>

            {currentActive.id === 'alchemist' && (
              <div className="p-3 bg-slate-950/80 border border-indigo-900/40 rounded-lg space-y-2 text-xs font-mono">
                <div className="text-indigo-300 font-bold">Grey GM(1,1) Differential Form:</div>
                <div className="text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800">
                  dx^(1)/dt + a*x^(1) = b &nbsp;|&nbsp; 1-AGO Smoothing: x^(1)(k) = Σ x^(0)(i)
                </div>
                <div className="text-slate-400 text-[11px]">
                  Deneutrosophication: S(x) = (2 + T - I - F) / 3. When Indeterminacy I &gt; 0.30, the TOPSIS Ideal Solution is pushed away by factor (1 + 2.5*I).
                </div>
              </div>
            )}

            {currentActive.id === 'validator' && (
              <div className="p-3 bg-slate-950/80 border border-rose-900/40 rounded-lg space-y-2 text-xs font-mono">
                <div className="text-rose-300 font-bold">Grey Relational Grade Formula:</div>
                <div className="text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800">
                  ξ_i(k) = [Δ_min + ρ*Δ_max] / [|x_0(k) - x_i(k)| + ρ*Δ_max]
                </div>
                <div className="text-slate-400 text-[11px]">
                  APIs with relational grade &lt; 0.68 are identified as "False Truths" during market regime shifts and penalized in N-AHP weights.
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Key-Value Grid */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 font-mono">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Microservice Telemetry
            </h4>
            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              {Object.entries(currentActive.telemetry).map(([key, val]) => (
                <div key={key} className="pt-2 flex items-center justify-between">
                  <span className="text-slate-500">{key}:</span>
                  <span className="font-bold text-slate-200">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
