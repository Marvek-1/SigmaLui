import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Terminal,
  Activity,
} from 'lucide-react';
import { pipelineEngine } from '../utils/dataEngine';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorTimestamp: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorTimestamp: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorTimestamp: new Date().toLocaleTimeString(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Global ErrorBoundary] Caught exception in UI tree:', error, errorInfo);
    this.setState({
      errorInfo,
      errorTimestamp: new Date().toLocaleTimeString(),
    });
  }

  private handleResetEngineState = () => {
    try {
      // Clear transient app storage if any corrupted key exists
      const keysToClear = [
        'ai_studio_active_tab',
        'ai_studio_market_subtab',
        'ai_studio_auditor_subtab',
        'ai_studio_settings_subtab',
      ];
      keysToClear.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });

      // Reset data engine to clean initialized state
      if (pipelineEngine && typeof pipelineEngine.resetToDefaults === 'function') {
        pipelineEngine.resetToDefaults();
      }
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to reset engine safely:', e);
    }

    // Reset error state to re-mount children cleanly
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorTimestamp: null,
      copied: false,
    });
  };

  private handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    const errorText = `[Antigravity System Error Report]
Timestamp: ${this.state.errorTimestamp || new Date().toISOString()}
Error: ${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Unknown error'}
Stack:
${this.state.error?.stack || 'No stack trace'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack'}
`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected runtime exception halted the execution loop.';
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-rose-500 selection:text-white">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      SAFETY CATCH ENGAGED
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {this.state.errorTimestamp}
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-white font-mono tracking-tight mt-1">
                    System Error Encountered
                  </h1>
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-1 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Isolated Execution</span>
              </div>
            </div>

            {/* Error Description Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {this.state.error?.name || 'Runtime Exception'}
                </span>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white bg-slate-900 px-2 py-1 rounded border border-slate-800 transition-colors cursor-pointer"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Log</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-rose-200/90 break-words leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {/* Stack trace detail (Collapsible / Monospace) */}
            {errorStack && (
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-mono">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Telemetry Diagnostic Stack:</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 max-h-36 overflow-y-auto whitespace-pre-wrap leading-tight select-all">
                  {errorStack}
                </div>
              </div>
            )}

            {/* Actions: Reset Engine State & Reload */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={this.handleHardReload}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetEngineState}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-mono text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Engine State & Resume</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
