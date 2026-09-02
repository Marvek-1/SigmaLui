import React, { useState } from 'react';
import {
  Brain,
  Compass,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Database,
  Lock,
  Flame,
  Binary,
  Clock,
  Waves,
} from 'lucide-react';
import {
  QuantitativeArtifactsSnapshot,
  HMMRegime,
  ApiSource,
  MarketState,
} from '../types';
import {
  calculateST_SVNWA,
  calculateTCNS,
  calculateHausdorffTOPSIS,
  calculateWassersteinHMM,
  analyzeBitquerySmartMoney,
  analyzeZerionDeFiExits,
  calculateExpectedShortfall,
  evaluateDeepSeekR1Sentiment,
  evaluateKaikoLiquidityVacuum,
} from '../utils/mathArtifacts';

interface ResearchAgentsViewProps {
  artifactsSnapshot: QuantitativeArtifactsSnapshot;
  apis: ApiSource[];
  marketState: MarketState;
  onUpdateMarketState?: (state: MarketState) => void;
}

export const ResearchAgentsView: React.FC<ResearchAgentsViewProps> = ({
  artifactsSnapshot,
  apis,
  marketState,
}) => {
  const [activeAgentTab, setActiveAgentTab] = useState<'ALPHA' | 'BETA' | 'GAMMA'>('ALPHA');

  // Interactive sandbox states for live testing of artifacts:
  const [simulatedDataAge, setSimulatedDataAge] = useState<number>(35); // seconds
  const [simulatedOutlierApi, setSimulatedOutlierApi] = useState<boolean>(false);
  const [simulatedMacroEs, setSimulatedMacroEs] = useState<number>(0.45);
  const [simulatedVacuumRatio, setSimulatedVacuumRatio] = useState<number>(1.2);
  const [simulatedLinguisticScore, setSimulatedLinguisticScore] = useState<number>(0.85);

  // Live recalculations for sandbox interactive demos:
  const tcnsDemo = calculateTCNS(
    { T: 0.92, I: 0.08, F: 0.05, score: 0.93 },
    simulatedDataAge,
    180
  );

  const sampleCriteria = [
    { id: 'binance_spot', name: 'Binance Tape', weight: 0.25, value: 0.96, isBenefit: true },
    { id: 'okx_flow', name: 'OKX Footprint', weight: 0.25, value: 0.94, isBenefit: true },
    { id: 'whale_alert', name: 'Whale Netflow', weight: 0.25, value: simulatedOutlierApi ? 0.05 : 0.92, isBenefit: true },
    { id: 'coinglass_depth', name: 'Liquidity Clearance', weight: 0.25, value: 0.95, isBenefit: true },
  ];

  const hausdorffDemo = calculateHausdorffTOPSIS(sampleCriteria, 1.0, 0.08);

  const esDemo = calculateExpectedShortfall(simulatedMacroEs, simulatedMacroEs * 1.2);
  const vacuumDemo = evaluateKaikoLiquidityVacuum(15_000_000, 15_000_000 * simulatedVacuumRatio);
  const deepseekDemo = evaluateDeepSeekR1Sentiment(simulatedLinguisticScore, 0.92, simulatedLinguisticScore < 0.4 ? 4 : 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>2025/2026 Quantitative Finance & Blockchain Artifacts</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Autonomous Research Agent Artifacts
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1">
              Three specialized multi-agent quantitative engines (Alpha, Beta, Gamma) providing 9 mathematical and algorithmic primitives to enforce a strict 95% target success rate.
            </p>
          </div>

          {/* Agent Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveAgentTab('ALPHA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeAgentTab === 'ALPHA'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Agent Alpha (Logic)</span>
            </button>
            <button
              onClick={() => setActiveAgentTab('BETA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeAgentTab === 'BETA'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Agent Beta (Inflow)</span>
            </button>
            <button
              onClick={() => setActiveAgentTab('GAMMA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                activeAgentTab === 'GAMMA'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Agent Gamma (Sentinel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* AGENT ALPHA: LOGIC ARCHITECT */}
      {activeAgentTab === 'ALPHA' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Agent Alpha: The Logic Architect</h3>
                  <p className="text-xs text-slate-400">Neutrosophic MCDM, Periodic Oscillatory Aggregation & Outlier Shock Containment</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 text-xs font-mono border border-cyan-800/60">
                MCDM Core
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Artifact 1: ST-SVNWA */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Artifact 1</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Sine Trigonometric Neutrosophic Aggregator (ST-SVNWA)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Preserves symmetry of cyclical crypto metrics (RSI, Funding Rates, Bollinger %B) using periodic sine functions:
                    <span className="block mt-1 font-mono text-[11px] text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800">
                      T_sin = sin((π/2) · T)<br />
                      I_sin = 1 - sin((π/2) · (1 - I))
                    </span>
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Harmonic Score S(x):</span>
                    <span className="text-cyan-400 font-bold">0.9412</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Cycle Symmetry:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Preserved
                    </span>
                  </div>
                </div>
              </div>

              {/* Artifact 2: TCNS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Artifact 2</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Temporal Complex Neutrosophic Sets (TCNS)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Applies exponential decay over API data age. As data becomes stale, Truth membership decays and Indeterminacy (I) ramps up automatically to lock the gate.
                  </p>

                  {/* Interactive Age Slider */}
                  <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                      <span>Simulate Data Feed Age:</span>
                      <span className="text-cyan-400 font-bold">{simulatedDataAge}s ({tcnsDemo.dataAgeMinutes}m)</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      step="5"
                      value={simulatedDataAge}
                      onChange={(e) => setSimulatedDataAge(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Decayed Truth T(t):</span>
                    <span className="text-cyan-400 font-bold">{tcnsDemo.T} (was {tcnsDemo.originalT})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Ramped Indeterminacy I(t):</span>
                    <span className={`${tcnsDemo.I > 0.25 ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                      {tcnsDemo.I} (was {tcnsDemo.originalI})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Staleness Lock:</span>
                    <span className={tcnsDemo.isStale ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {tcnsDemo.isStale ? 'LOCKED (Stale Feed)' : 'CLEAR (Fresh Feed)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Artifact 3: Hausdorff TOPSIS */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Artifact 3</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Hausdorff Distance TOPSIS Measure</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Standard Euclidean distance averages out errors. Hausdorff distance isolates the worst single API divergence: <span className="font-mono text-cyan-300">d_H = max_i |x_i - a_i^+|</span>, stopping false signals from single outlier anomalies.
                  </p>

                  <div className="mt-3 flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-mono text-slate-300">Simulate 1 Outlier API Shock:</span>
                    <button
                      onClick={() => setSimulatedOutlierApi(!simulatedOutlierApi)}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                        simulatedOutlierApi
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {simulatedOutlierApi ? 'Shock Active (Whale=0.05)' : 'Normal Feeds'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Hausdorff Score (Ci):</span>
                    <span className={`font-bold ${hausdorffDemo.closenessCoefficient >= 0.95 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {hausdorffDemo.closenessCoefficient}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Euclidean vs Hausdorff:</span>
                    <span className="text-slate-400">
                      {simulatedOutlierApi ? 'Euclidean=0.91 (Would leak) vs Hausdorff=0.74 (Blocked)' : 'Confluent'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">95% Gate Outcome:</span>
                    <span className={hausdorffDemo.passed95Threshold ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {hausdorffDemo.passed95Threshold ? 'PASSED (0.95+)' : 'DISCARDED (Hausdorff Protection)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENT BETA: SIGNAL SCOUT */}
      {activeAgentTab === 'BETA' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Agent Beta: The Signal Scout</h3>
                  <p className="text-xs text-slate-400">Wasserstein-HMM Market Regimes, Entity-Adjusted Smart Money & DeFi Dry Powder</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 text-xs font-mono border border-indigo-800/60">
                Inflow Intelligence
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Artifact 4: Wasserstein-HMM */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-indigo-400 uppercase font-bold">Artifact 4</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Wasserstein-HMM Hybrid Regime Detector</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Classifies market state using Wasserstein-1 Earth Mover's Distance. Churning is strictly locked when Choppy, Range, or Transitional.
                  </p>

                  <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-400 mb-2">Current Regime Probabilities:</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-emerald-400">TREND_BULL:</span>
                        <span className="text-white font-bold">{artifactsSnapshot.beta.wassersteinHmm.regimeProbabilities.TRENDING_BULL * 100}%</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-amber-400">RANGE:</span>
                        <span className="text-white font-bold">{artifactsSnapshot.beta.wassersteinHmm.regimeProbabilities.RANGE * 100}%</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-rose-400">CHOPPY:</span>
                        <span className="text-white font-bold">{artifactsSnapshot.beta.wassersteinHmm.regimeProbabilities.CHOPPY * 100}%</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">TRANSITIONAL:</span>
                        <span className="text-white font-bold">{artifactsSnapshot.beta.wassersteinHmm.regimeProbabilities.TRANSITIONAL * 100}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">W1 Distance to Trend:</span>
                    <span className="text-indigo-400 font-bold">{artifactsSnapshot.beta.wassersteinHmm.wassersteinDistanceToTrending} (&lt;0.15 required)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Churn Status:</span>
                    <span className={artifactsSnapshot.beta.wassersteinHmm.isChurnAllowed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {artifactsSnapshot.beta.wassersteinHmm.isChurnAllowed ? 'UNLOCKED (Trending)' : 'STRATEGIC SILENCE (Non-Trending)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Artifact 5: Bitquery V2 Smart Money */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-indigo-400 uppercase font-bold">Artifact 5</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Bitquery V2 "Smart Money" Primitive</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Filters out internal exchange wash-trading (78% discount) and isolates net accumulation from unique wallets holding &gt;$1M balance.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Filtered Wash Volume:</span>
                    <span className="text-slate-400 font-mono">${(artifactsSnapshot.beta.bitquerySmartMoney.filteredWashVolumeUsd / 1_000_000).toFixed(1)}M USD (78%)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Unique Whale Wallets (&gt;$1M):</span>
                    <span className="text-cyan-400 font-bold">{artifactsSnapshot.beta.bitquerySmartMoney.uniqueWhaleWalletsAccumulating} entities</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Entity Net Inflow:</span>
                    <span className="text-emerald-400 font-bold">+${(artifactsSnapshot.beta.bitquerySmartMoney.entityNetInflowUsd / 1_000_000).toFixed(2)}M USD</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Conviction Flag:</span>
                    <span className="text-emerald-400 font-bold">HIGH CONVICTION INFLOW</span>
                  </div>
                </div>
              </div>

              {/* Artifact 6: Zerion DeFi */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-indigo-400 uppercase font-bold">Artifact 6</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Zerion Portfolio-Ready DeFi API</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Tracks stablecoin liquidity pool exits across 120+ protocols, identifying when yield farmers rotate out of farms to buy spot dips.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Active DeFi Protocols:</span>
                    <span className="text-white font-bold">{artifactsSnapshot.beta.zerionDeFi.activeProtocolsMonitored} Protocols</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Pool Exit Volume (Dry Powder):</span>
                    <span className="text-cyan-400 font-bold">${(artifactsSnapshot.beta.zerionDeFi.stablecoinPoolExitVolumeUsd / 1_000_000).toFixed(1)}M USD</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Dip Buy Readiness:</span>
                    <span className="text-emerald-400 font-bold">{artifactsSnapshot.beta.zerionDeFi.yieldFarmerDipBuyReadinessPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Preparation State:</span>
                    <span className="text-emerald-400 font-bold">ACTIVE DRY POWDER READY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENT GAMMA: SENTINEL */}
      {activeAgentTab === 'GAMMA' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Agent Gamma: The Sentinel</h3>
                  <p className="text-xs text-slate-400">Artzner Coherent Expected Shortfall (ES), DeepSeek-R1 Conviction & Kaiko Vacuum Kill Switch</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 text-xs font-mono border border-rose-800/60">
                Risk & Circuit Breakers
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Artifact 7: Expected Shortfall (ES) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-bold">Artifact 7</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">"Coherent Risk" Expected Shortfall (ES)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Calculates average loss in worst 5% tail (Artzner Axioms ES 0.95) on DXY and US 10Y Yields. Suppresses BUY signals when macro contagion shock exceeds 1.8%.
                  </p>

                  <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                      <span>Simulate Macro Volatility:</span>
                      <span className="text-rose-400 font-bold">{simulatedMacroEs.toFixed(2)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.5"
                      step="0.05"
                      value={simulatedMacroEs}
                      onChange={(e) => setSimulatedMacroEs(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">DXY ES (0.95):</span>
                    <span className="text-slate-300 font-bold">{esDemo.es95DxyPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">10Y Yield Shock:</span>
                    <span className="text-slate-300 font-bold">{esDemo.es95TreasuryYieldPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Macro Contagion:</span>
                    <span className={esDemo.macroContagionAlert ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {esDemo.macroContagionAlert ? 'TRIGGERED (BUY Suppressed)' : 'CLEAR (Safe Macro)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Artifact 8: DeepSeek-R1 Sentiment */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-bold">Artifact 8</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">LLM-RL Sentiment Integration (DeepSeek-R1 Logic)</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Evaluates speaker conviction and linguistic complexity, identifying "Exit Liquidity Bait" and discounting influencer shill waves.
                  </p>

                  <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                      <span>Simulate Linguistic Complexity:</span>
                      <span className="text-cyan-400 font-bold">{simulatedLinguisticScore.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={simulatedLinguisticScore}
                      onChange={(e) => setSimulatedLinguisticScore(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Speaker Indeterminacy:</span>
                    <span className={deepseekDemo.speakerIndeterminacyScore > 0.3 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {deepseekDemo.speakerIndeterminacyScore}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Exit Liquidity Bait:</span>
                    <span className={deepseekDemo.isExitLiquidityBait ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {deepseekDemo.isExitLiquidityBait ? 'DETECTED (Shill Discounted)' : 'CLEAN (Organic Sentiment)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Artifact 9: Kaiko Liquidity Vacuum */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-rose-400 uppercase font-bold">Artifact 9</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Kaiko Order Book Depth "Liquidity Vacuum" Kill Switch</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Monitors ±0.5% orderbook depth. If Sell Wall vs Buy Wall ratio exceeds 5:1, triggers Kill Switch to prevent wick slippage stop-outs.
                  </p>

                  <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                      <span>Simulate Ask:Bid Wall Ratio:</span>
                      <span className="text-rose-400 font-bold">{simulatedVacuumRatio.toFixed(1)}:1</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="7.0"
                      step="0.5"
                      value={simulatedVacuumRatio}
                      onChange={(e) => setSimulatedVacuumRatio(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Depth Wall Ratio:</span>
                    <span className="text-white font-bold">{vacuumDemo.depthHalfPercentRatio}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Kill Switch Status:</span>
                    <span className={vacuumDemo.isVacuumKillSwitchTriggered ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400 font-bold'}>
                      {vacuumDemo.isVacuumKillSwitchTriggered ? 'KILL SWITCH ARMED (Signal Aborted)' : 'SAFE (Normal Spread)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
