import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  X,
  ShieldCheck,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { ApiSource, MarketState, SuperSignal } from '../types';

interface AiAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SuperSignal | null;
  marketState: MarketState;
  indeterminacy: number;
  apis: ApiSource[];
  resolutionRho: number;
}

export const AiAuditorModal: React.FC<AiAuditorModalProps> = ({
  isOpen,
  onClose,
  signal,
  marketState,
  indeterminacy,
  apis,
  resolutionRho,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal,
          marketState,
          indeterminacy,
          apis,
          resolutionRho,
        }),
      });

      const data = await res.json();
      if (data.auditReport) {
        setAuditReport(data.auditReport);
        setReportSource(data.source || 'gemini-3.7-flash');
        setFallbackNotice(data.fallbackNotice || null);
      } else {
        throw new Error(data.message || 'Failed to generate audit');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with Gemini Auditor endpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (auditReport) {
      navigator.clipboard.writeText(auditReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto font-mono">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  Gemini AI Quantitative Risk &amp; Architecture Auditor
                </h3>
                {reportSource && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    {reportSource === 'gemini-3.7-flash' ? 'Gemini 3.7 Flash' : 'MCDM Deterministic Engine'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Server-Side Telemetry &amp; MCDM Consensus Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Context Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Current Regime</span>
              <span className="text-cyan-300 font-bold">{marketState}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Indeterminacy (I)</span>
              <span className="text-slate-200 font-bold">{indeterminacy.toFixed(3)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Active Signal</span>
              <span className="text-emerald-400 font-bold">{signal?.asset || 'BTC (Benchmark)'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">GRA Coef (ρ)</span>
              <span className="text-purple-300 font-bold">{resolutionRho.toFixed(2)}</span>
            </div>
          </div>

          {/* Fallback Notification if applicable */}
          {fallbackNotice && (
            <div className="p-2.5 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-300 flex items-center space-x-2 text-[11px]">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {/* Action Trigger */}
          {!auditReport && !loading && (
            <div className="p-6 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3">
              <Cpu className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
              <p className="text-slate-300 font-medium">
                Ready to execute deep mathematical inspection on GM(1,1), Neutrosophic AHP conflict matrix, and Coinglass liquidity barriers.
              </p>
              <button
                onClick={runAudit}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                GENERATE QUANTITATIVE AUDIT REPORT
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-10 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-300 font-medium">
                Auditing Grey Model differential parameters, TOPSIS distance vectors, and GRA feedback grades...
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Audit Error:</span>
                <span className="text-[11px]">{error}</span>
              </div>
            </div>
          )}

          {/* Rendered Audit Report */}
          {auditReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold text-xs uppercase flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" />
                  Forensic Quantitative Audit Report
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={runAudit}
                    disabled={loading}
                    className="px-2.5 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[11px] font-semibold transition-colors cursor-pointer border border-indigo-700/50"
                  >
                    Re-Audit
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 text-slate-300 leading-relaxed font-sans text-xs max-h-[50vh] overflow-y-auto">
                <div className="prose prose-invert prose-xs max-w-none space-y-3">
                  <Markdown>{auditReport}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target Accuracy: 95.0% Guaranteed by Strategic Silence</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
