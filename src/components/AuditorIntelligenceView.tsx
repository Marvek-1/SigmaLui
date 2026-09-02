import React, { useState } from 'react';
import {
  PipelineStats,
  SuperSignal,
  SilentDiscardLog,
  ApiSource,
  AssetDataFeed,
  GraVerificationRecord,
} from '../types';
import { SoakTestConsole } from './SoakTestConsole';
import { VerificationDashboard } from './VerificationDashboard';
import { SignalChurnerFeed } from './SignalChurnerFeed';
import { ResearchAgentsView } from './ResearchAgentsView';
import { FeedbackCalibrationView } from './FeedbackCalibrationView';
import { pipelineEngine } from '../utils/dataEngine';
import {
  ShieldCheck,
  Radio,
  BrainCircuit,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';

interface AuditorIntelligenceViewProps {
  stats: PipelineStats;
  signals: SuperSignal[];
  silentLogs: SilentDiscardLog[];
  apis: ApiSource[];
  assets: AssetDataFeed[];
  graRecords: GraVerificationRecord[];
  resolutionRho: number;
  onTriggerCalibration: () => void;
  onOpenAiAudit: () => void;
  activeSubTab?: AuditorSubTab;
  onSubTabChange?: (subTab: AuditorSubTab) => void;
}

export type AuditorSubTab =
  | 'SOAK_TEST'
  | 'VERIFICATION'
  | 'DISCARD_STREAM'
  | 'RESEARCH_AGENTS'
  | 'FEEDBACK_CALIBRATION';

export const AuditorIntelligenceView: React.FC<AuditorIntelligenceViewProps> = ({
  stats,
  signals,
  silentLogs,
  apis,
  assets,
  graRecords,
  resolutionRho,
  onTriggerCalibration,
  onOpenAiAudit,
  activeSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<AuditorSubTab>('SOAK_TEST');
  const subTab = activeSubTab !== undefined ? activeSubTab : internalSubTab;

  const handleSetSubTab = (tab: AuditorSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Sub-navigation Bar for Auditor */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-2 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleSetSubTab('SOAK_TEST')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'SOAK_TEST'
                ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-cyan-400" />
            <span>48h Soak Test & 5 Positions TP1 Hunt</span>
          </button>

          <button
            onClick={() => handleSetSubTab('VERIFICATION')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'VERIFICATION'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SLA & Stress Verification ({stats.successRatePct.toFixed(1)}%)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('DISCARD_STREAM')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'DISCARD_STREAM'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Signal & Discard Telemetry ({silentLogs.length} Discards)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('RESEARCH_AGENTS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'RESEARCH_AGENTS'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>Research Agents (Macro / On-Chain)</span>
          </button>

          <button
            onClick={() => handleSetSubTab('FEEDBACK_CALIBRATION')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              subTab === 'FEEDBACK_CALIBRATION'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-pink-400" />
            <span>GRA Self-Correction & Feedback</span>
          </button>
        </div>

        <button
          onClick={onOpenAiAudit}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Launch AI Agent Audit</span>
        </button>
      </div>

      {/* Sub-view Content */}
      <div>
        {subTab === 'SOAK_TEST' && (
          <SoakTestConsole
            stats={stats}
            signals={signals}
            silentLogs={silentLogs}
            apis={apis}
            pairs={assets}
            graRecords={graRecords}
            onTriggerCalibration={onTriggerCalibration}
            onOpenAiAudit={onOpenAiAudit}
          />
        )}

        {subTab === 'VERIFICATION' && (
          <VerificationDashboard
            stats={stats}
            signals={signals}
            silentLogs={silentLogs}
            apis={apis}
            pairs={assets}
            graRecords={graRecords}
          />
        )}

        {subTab === 'DISCARD_STREAM' && (
          <SignalChurnerFeed signals={signals} silentLogs={silentLogs} />
        )}

        {subTab === 'RESEARCH_AGENTS' && (
          <ResearchAgentsView
            artifactsSnapshot={pipelineEngine.getArtifactsSnapshot()}
            apis={apis}
            marketState={pipelineEngine.getMarketState()}
          />
        )}

        {subTab === 'FEEDBACK_CALIBRATION' && (
          <FeedbackCalibrationView
            apis={apis}
            graRecords={graRecords}
            stats={stats}
            resolutionRho={resolutionRho}
            onTriggerCalibration={onTriggerCalibration}
          />
        )}
      </div>
    </div>
  );
};
