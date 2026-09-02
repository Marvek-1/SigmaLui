import React, { useState } from 'react';
import { ApiSource, AssetDataFeed, PipelineStats } from '../types';
import { ApiHarvesterGrid } from './ApiHarvesterGrid';
import { PipelineArchitectureView } from './PipelineArchitectureView';
import { Gate1PythonEngine } from './Gate1PythonEngine';
import { NeutrosophicConsensusView } from './NeutrosophicConsensusView';
import { GreyPredictorLab } from './GreyPredictorLab';
import {
  Server,
  Workflow,
  Code,
  Scale,
  LineChart,
  ShieldCheck,
} from 'lucide-react';

interface EngineDiagnosticsViewProps {
  apis: ApiSource[];
  assets: AssetDataFeed[];
  stats: PipelineStats;
  resolutionRho: number;
  onUpdateRho: (rho: number) => void;
  activeSubTab?: DiagnosticsSubTab;
  onSubTabChange?: (subTab: DiagnosticsSubTab) => void;
}

type DiagnosticsSubTab =
  | 'APIS'
  | 'ARCHITECTURE'
  | 'GATE1_PYTHON'
  | 'NEUTROSOPHIC_CONSENSUS'
  | 'GREY_LAB';

export const EngineDiagnosticsView: React.FC<EngineDiagnosticsViewProps> = ({
  apis,
  assets,
  stats,
  resolutionRho,
  onUpdateRho,
  activeSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<DiagnosticsSubTab>('APIS');
  const subTab = activeSubTab !== undefined ? activeSubTab : internalSubTab;

  const handleSetSubTab = (tab: DiagnosticsSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  return (
    <div className="space-y-4 w-full font-mono text-xs">
      {/* Sub-navigation for Settings / Engine Core */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleSetSubTab('APIS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'APIS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>20 Ingestion APIs ({apis.filter((a) => a.status === 'ONLINE').length}/20 Online)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('ARCHITECTURE')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'ARCHITECTURE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Workflow className="w-4 h-4 text-cyan-400" />
            <span>Microservices Architecture</span>
          </button>

          <button
            onClick={() => handleSetSubTab('GATE1_PYTHON')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'GATE1_PYTHON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-amber-400" />
            <span>Gate 1 (GM 1,1 Python Core)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('NEUTROSOPHIC_CONSENSUS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'NEUTROSOPHIC_CONSENSUS'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Neutrosophic Consensus & TOPSIS</span>
          </button>

          <button
            onClick={() => handleSetSubTab('GREY_LAB')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'GREY_LAB'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LineChart className="w-4 h-4 text-indigo-400" />
            <span>Grey Predictor Lab</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Core Mathematical Services</span>
        </div>
      </div>

      {/* Sub-view Content */}
      <div>
        {subTab === 'APIS' && <ApiHarvesterGrid apis={apis} />}
        {subTab === 'ARCHITECTURE' && (
          <PipelineArchitectureView apis={apis} stats={stats} />
        )}
        {subTab === 'GATE1_PYTHON' && <Gate1PythonEngine />}
        {subTab === 'NEUTROSOPHIC_CONSENSUS' && (
          <NeutrosophicConsensusView apis={apis} />
        )}
        {subTab === 'GREY_LAB' && (
          <GreyPredictorLab
            assets={assets}
            resolutionRho={resolutionRho}
            onUpdateRho={onUpdateRho}
          />
        )}
      </div>
    </div>
  );
};
