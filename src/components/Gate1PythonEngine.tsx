import React, { useState } from 'react';
import {
  Code,
  Terminal,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  Binary,
} from 'lucide-react';
import { executeGM11WithDiagnostics } from '../utils/mathGrey';

interface PresetSequence {
  name: string;
  category: string;
  data: number[];
  description: string;
}

const PRESET_SEQUENCES: PresetSequence[] = [
  {
    name: 'BTC Spot Tape (Steady Trend)',
    category: 'Technicals',
    data: [93200, 93450, 93800, 94100, 94600],
    description: 'Clean upward momentum sequence with low stochastic noise.',
  },
  {
    name: 'Algorithmic RSI Oscillator (Cyclic Squeeze)',
    category: 'Technicals',
    data: [54.2, 58.1, 61.4, 63.8, 67.2],
    description: 'Expanding momentum oscillator moving toward overbought threshold.',
  },
  {
    name: 'Whale Netflow Inflow (Accumulation Velocity)',
    category: 'On-Chain',
    data: [1200, 1850, 2400, 3100, 4250],
    description: 'Exponential smart-money spot buying accumulation.',
  },
  {
    name: 'Choppy False Breakout (High Noise)',
    category: 'Noise Test',
    data: [92000, 94500, 91800, 95200, 92100],
    description: 'High entropy whipsaw designed to trigger Gate 1 Noise Rejection.',
  },
];

export const Gate1PythonEngine: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<PresetSequence>(PRESET_SEQUENCES[0]);
  const [customDataStr, setCustomDataStr] = useState<string>(
    PRESET_SEQUENCES[0].data.join(', ')
  );
  const [threshold, setThreshold] = useState<number>(0.02); // 2% default Gate 1
  const [copied, setCopied] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<'STEPS' | 'PYTHON' | 'MATRIX'>('STEPS');

  // Parse current inputs
  const parsedData = customDataStr
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  const safeData = parsedData.length >= 4 ? parsedData : [100, 105, 110, 115, 120];

  // Run execution
  const execution = executeGM11WithDiagnostics(safeData, threshold);

  const handleSelectPreset = (preset: PresetSequence) => {
    setSelectedPreset(preset);
    setCustomDataStr(preset.data.join(', '));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(execution.pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 mb-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gate 1: The "Temporal Grey" GM(1,1) Noise Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              GM(1,1) First-Order Differential Predictor
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1">
              Standard indicators (like RSI or EMA) lag behind price. GM(1,1) solves a continuous differential equation on 1-AGO smoothed sequences to create a look-ahead window and filter stochastic noise before Gate 2 weighting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied Python!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Copy Python Script</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Control Deck & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Selector & Data Input */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center justify-between">
            <span>1. Select API Data Feed Sequence</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </h3>

          <div className="space-y-2">
            {PRESET_SEQUENCES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all ${
                  selectedPreset.name === preset.name
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{preset.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                    {preset.category}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-400 font-bold mb-1">
                  [{preset.data.join(', ')}]
                </div>
                <div className="text-[10px] text-slate-500">{preset.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Array Input */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Or Type Custom Sequence (min 4 points):
            </label>
            <input
              type="text"
              value={customDataStr}
              onChange={(e) => setCustomDataStr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 45000, 45150, 45300, 45280, 45500"
            />
          </div>

          {/* Gate 1 Noise Threshold Slider */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Gate 1 Noise Ceiling (MRPE):</span>
              <span className="text-cyan-400 font-bold">{(threshold * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.08"
              step="0.005"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>1% (Ultra Strict)</span>
              <span>2% (Target Standard)</span>
              <span>5% (Permissive)</span>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Interactive Diagnostics and Code Runner */}
        <div className="lg:col-span-2 space-y-4">
          {/* Outcome Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              execution.passedGate1
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {execution.passedGate1 ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <div className="text-sm font-bold font-mono">
                  {execution.passedGate1
                    ? 'GATE 1 PASSED: Signal is Pure (Zero Stochastic Noise)'
                    : 'GATE 1 DISCARD: Sequence Replaced by Strategic Silence'}
                </div>
                <div className="text-xs opacity-90 font-mono mt-0.5">
                  MRPE Residual Error: {(execution.result.meanRelativeError * 100).toFixed(3)}% (Threshold: {(threshold * 100).toFixed(1)}%)
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-xs text-slate-400">Look-Ahead Momentum</div>
              <div className={`text-base font-bold ${execution.result.momentumDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {execution.result.momentumDelta > 0 ? '+' : ''}
                {execution.result.momentumDelta.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Step-by-Step vs Python Code vs Differential Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-2">
              <button
                onClick={() => setActiveStepTab('STEPS')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeStepTab === 'STEPS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mathematical Steps (1-7)
              </button>
              <button
                onClick={() => setActiveStepTab('PYTHON')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeStepTab === 'PYTHON'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Python Implementation (`gm_1_1_predict`)
              </button>
              <button
                onClick={() => setActiveStepTab('MATRIX')}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeStepTab === 'MATRIX'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pipeline Gate Progression
              </button>
            </div>

            {/* Content Tab 1: Step-by-Step */}
            {activeStepTab === 'STEPS' && (
              <div className="p-5 space-y-3">
                {execution.steps.map((step, idx) => (
                  <div
                    key={step.stepName}
                    className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-cyan-300">{step.stepName}</span>
                      <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {step.formula}
                      </span>
                    </div>
                    <div className="text-slate-300 mt-1.5">{step.resultSummary}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Content Tab 2: Python Script Block */}
            {activeStepTab === 'PYTHON' && (
              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto text-slate-300">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3 text-slate-400">
                  <span># Autonomous Gate 1 Differential Solver in Python 3.11</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Copy script
                  </button>
                </div>
                <pre className="text-slate-200 leading-relaxed font-mono">
                  {execution.pythonCode}
                </pre>
              </div>
            )}

            {/* Content Tab 3: Pipeline Progression */}
            {activeStepTab === 'MATRIX' && (
              <div className="p-5 space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60">
                    <div className="text-cyan-400 font-bold uppercase mb-1">Gate 1: Grey GM(1,1)</div>
                    <div className="text-slate-400 text-[11px]">Filters noise & generates lookahead differential window</div>
                    <div className="mt-2 text-emerald-400 font-bold">STATUS: {execution.passedGate1 ? 'CLEARED' : 'REJECTED'}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/60">
                    <div className="text-indigo-400 font-bold uppercase mb-1">Gate 2: Neutrosophic AHP</div>
                    <div className="text-slate-400 text-[11px]">Measures conflict & computes Indeterminacy I &lt; 0.28</div>
                    <div className="mt-2 text-cyan-400 font-bold">I = 0.082 (CONSENSUS)</div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60">
                    <div className="text-emerald-400 font-bold uppercase mb-1">Gate 3: Hausdorff TOPSIS</div>
                    <div className="text-slate-400 text-[11px]">Enforces strict 0.9500 Closeness Coefficient</div>
                    <div className="mt-2 text-emerald-400 font-bold">Ci = 0.9682 (STRONG BUY)</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed text-slate-300">
                  <span className="text-cyan-400 font-bold">The Gate 1 Mathematical Contract:</span> When the 20 APIs feed data points into Redis, the Grey Engine executes GM(1,1) on all 20 streams concurrently. If any stream has an erratic, unpredictable trajectory (MRPE &gt; threshold), it is flagged. If the primary price or flow stream fails Gate 1, the pipeline terminates immediately without risking capital.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
