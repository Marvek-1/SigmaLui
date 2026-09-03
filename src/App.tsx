import React, { useState, useEffect, useCallback } from 'react';
import {
  pipelineEngine,
} from './utils/dataEngine';
import {
  realtimeSync,
  SyncState,
} from './services/realtimeSync';
import {
  MarketState,
  SuperSignal,
  SilentDiscardLog,
  PipelineStats,
  ApiSource,
  AssetDataFeed,
  GraVerificationRecord,
  LiveMarketTelemetry,
} from './types';
import { Header } from './components/Header';
import { MinimalistPulseView } from './components/MinimalistPulseView';
import { SignalPortMonitorView } from './components/SignalPortMonitorView';
import { SoulGiverAdapterHub } from './components/SoulGiverAdapterHub';
import { MarketRadarView } from './components/MarketRadarView';
import { AuditorIntelligenceView } from './components/AuditorIntelligenceView';
import { EngineDiagnosticsView } from './components/EngineDiagnosticsView';
import {
  Sidebar,
  NavTab,
  MarketSubTab,
  AuditorSubTab,
  SettingsSubTab,
} from './components/Sidebar';
import { AiAuditorModal } from './components/AiAuditorModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import confetti from 'canvas-confetti';
import {
  Activity,
  Compass,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export default function App() {
  // Local storage tab persistence
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_studio_active_tab') as NavTab;
        if (saved && ['DASHBOARD', 'SIGNAL_PORT', 'SOUL_ADAPTER', 'MARKET', 'AUDITOR', 'SETTINGS'].includes(saved)) {
          return saved;
        }
      }
    } catch {}
    return 'DASHBOARD';
  });

  const [activeMarketSubTab, setActiveMarketSubTab] = useState<MarketSubTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_studio_market_subtab') as MarketSubTab;
        if (saved && ['UNIVERSE', 'ORDERBOOK_DEPTH'].includes(saved)) {
          return saved;
        }
      }
    } catch {}
    return 'UNIVERSE';
  });

  const [activeAuditorSubTab, setActiveAuditorSubTab] = useState<AuditorSubTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_studio_auditor_subtab') as AuditorSubTab;
        if (
          saved &&
          ['SOAK_TEST', 'VERIFICATION', 'DISCARD_STREAM', 'RESEARCH_AGENTS', 'FEEDBACK_CALIBRATION'].includes(saved)
        ) {
          return saved;
        }
      }
    } catch {}
    return 'SOAK_TEST';
  });

  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SettingsSubTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_studio_settings_subtab') as SettingsSubTab;
        if (
          saved &&
          ['APIS', 'ARCHITECTURE', 'GATE1_PYTHON', 'NEUTROSOPHIC_CONSENSUS', 'GREY_LAB'].includes(saved)
        ) {
          return saved;
        }
      }
    } catch {}
    return 'APIS';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('ai_studio_sidebar_collapsed') === 'true';
      }
    } catch {}
    return false;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Synchronize preferred tabs to localStorage
  const handleSelectTab = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_studio_active_tab', tab);
      }
    } catch {}
  }, []);

  const handleSelectMarketSubTab = useCallback((sub: MarketSubTab) => {
    setActiveMarketSubTab(sub);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_studio_market_subtab', sub);
      }
    } catch {}
  }, []);

  const handleSelectAuditorSubTab = useCallback((sub: AuditorSubTab) => {
    setActiveAuditorSubTab(sub);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_studio_auditor_subtab', sub);
      }
    } catch {}
  }, []);

  const handleSelectSettingsSubTab = useCallback((sub: SettingsSubTab) => {
    setActiveSettingsSubTab(sub);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_studio_settings_subtab', sub);
      }
    } catch {}
  }, []);

  const handleToggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_studio_sidebar_collapsed', String(next));
        }
      } catch {}
      return next;
    });
  }, []);

  const [marketState, setMarketState] = useState<MarketState>(pipelineEngine.getMarketState());
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [resolutionRho, setResolutionRho] = useState<number>(pipelineEngine.getResolutionRho());

  // Real-time backend telemetry
  const [latencyMs, setLatencyMs] = useState<number>(2);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [serverTickCount, setServerTickCount] = useState<number>(0);

  // Engine state snapshot
  const [stats, setStats] = useState<PipelineStats>({ ...pipelineEngine.getStats() });
  const [apis, setApis] = useState<ApiSource[]>([...pipelineEngine.getApis()]);
  const [assets, setAssets] = useState<AssetDataFeed[]>([...pipelineEngine.getAssets()]);
  const [signals, setSignals] = useState<SuperSignal[]>([...pipelineEngine.getEmittedSignals()]);
  const [silentLogs, setSilentLogs] = useState<SilentDiscardLog[]>([...pipelineEngine.getSilentLogs()]);
  const [graRecords, setGraRecords] = useState<GraVerificationRecord[]>([
    ...pipelineEngine.getGraRecords(),
  ]);
  const [liveMarketTelemetry, setLiveMarketTelemetry] = useState<LiveMarketTelemetry | undefined>(undefined);
  const [isSyncingMarket, setIsSyncingMarket] = useState<boolean>(false);

  // AI Auditor Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Sync state from local fallback
  const refreshEngineSnapshot = useCallback(() => {
    setStats({ ...pipelineEngine.getStats() });
    setApis([...pipelineEngine.getApis()]);
    setAssets([...pipelineEngine.getAssets()]);
    setSignals([...pipelineEngine.getEmittedSignals()]);
    setSilentLogs([...pipelineEngine.getSilentLogs()]);
    setGraRecords([...pipelineEngine.getGraRecords()]);
  }, []);

  // 1. Subscribe to Authoritative Zero-Lag Server-Sent Events (SSE)
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((syncState: SyncState, newSignal?: SuperSignal) => {
      if (syncState.stats) setStats(syncState.stats);
      if (syncState.apis) setApis(syncState.apis);
      if (syncState.assets) setAssets(syncState.assets);
      if (syncState.signals) setSignals(syncState.signals);
      if (syncState.silentLogs) setSilentLogs(syncState.silentLogs);
      if (syncState.graRecords) setGraRecords(syncState.graRecords);
      if (syncState.marketState) setMarketState(syncState.marketState);
      if (syncState.liveMarketTelemetry) setLiveMarketTelemetry(syncState.liveMarketTelemetry);
      if (typeof syncState.resolutionRho === 'number') setResolutionRho(syncState.resolutionRho);
      if (typeof syncState.isRunning === 'boolean') setIsRunning(syncState.isRunning);
      if (typeof syncState.simulationSpeed === 'number') setSimulationSpeed(syncState.simulationSpeed);
      if (typeof syncState.serverTickCount === 'number') setServerTickCount(syncState.serverTickCount);
      if (typeof syncState.latencyMs === 'number') setLatencyMs(syncState.latencyMs);
      setIsBackendConnected(syncState.isBackendConnected);

      if (newSignal) {
        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.8 },
            colors: ['#06b6d4', '#10b981', '#6366f1'],
          });
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  // Force Live Market Re-sync
  const handleSyncLiveMarket = async () => {
    setIsSyncingMarket(true);
    try {
      await realtimeSync.syncLiveMarket();
    } finally {
      setIsSyncingMarket(false);
    }
  };

  // Handle Toggle Running
  const handleToggleRunning = async () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    await realtimeSync.sendControl('TOGGLE_RUNNING', nextRunning);
  };

  // Handle Speed Change
  const handleSpeedChange = async (speed: number) => {
    setSimulationSpeed(speed);
    await realtimeSync.sendControl('SET_SPEED', speed);
  };

  // Handle Market State Change
  const handleMarketStateChange = async (newState: MarketState) => {
    setMarketState(newState);
    pipelineEngine.setMarketState(newState);
    await realtimeSync.sendControl('SET_MARKET_STATE', newState);
    refreshEngineSnapshot();
  };

  // Handle Manual Single Step
  const handleSingleStep = async () => {
    await realtimeSync.sendControl('SINGLE_STEP');
  };

  // Handle Rho Change
  const handleUpdateRho = async (rho: number) => {
    setResolutionRho(rho);
    pipelineEngine.setResolutionRho(rho);
    await realtimeSync.sendControl('SET_RHO', rho);
  };

  // Trigger manual GRA calibration test
  const handleTriggerGraAudit = async () => {
    await realtimeSync.sendControl('TRIGGER_GRA');
    refreshEngineSnapshot();
  };

  const navItems = [
    {
      id: 'DASHBOARD' as const,
      label: 'Dashboard (Pulse)',
      icon: Activity,
      badge: `${stats.successRatePct.toFixed(1)}% SLA`,
    },
    {
      id: 'MARKET' as const,
      label: 'Market (Radar)',
      icon: Compass,
      badge: `${assets.length} PERPs`,
    },
    {
      id: 'AUDITOR' as const,
      label: 'Auditor (Insights)',
      icon: ShieldCheck,
      badge: `${silentLogs.length} Discards`,
    },
    {
      id: 'SETTINGS' as const,
      label: 'Settings (Core)',
      icon: Settings,
      badge: `${apis.filter((a) => a.status === 'ONLINE').length}/20 Online`,
    },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Executive Header Bar */}
        <Header
          stats={stats}
          marketState={marketState}
          onMarketStateChange={handleMarketStateChange}
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onSingleStep={handleSingleStep}
          simulationSpeed={simulationSpeed}
          onSpeedChange={handleSpeedChange}
          onOpenAiAudit={() => setIsAiModalOpen(true)}
          onToggleSidebar={handleToggleSidebarCollapsed}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          latencyMs={latencyMs}
          isBackendConnected={isBackendConnected}
          serverTickCount={serverTickCount}
          liveMarketTelemetry={liveMarketTelemetry}
          isSyncingMarket={isSyncingMarket}
          onSyncLiveMarket={handleSyncLiveMarket}
        />

        {/* Main Workspace Frame with Collapsible Sidebar and Main Canvas */}
        <div className="flex flex-1 relative">
          {/* Collapsible Sidebar with Nested Accordion Tabs */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              handleSelectTab(tab);
              setIsMobileSidebarOpen(false);
            }}
            activeMarketSubTab={activeMarketSubTab}
            onSelectMarketSubTab={(sub) => {
              handleSelectMarketSubTab(sub);
              setIsMobileSidebarOpen(false);
            }}
            activeAuditorSubTab={activeAuditorSubTab}
            onSelectAuditorSubTab={(sub) => {
              handleSelectAuditorSubTab(sub);
              setIsMobileSidebarOpen(false);
            }}
            activeSettingsSubTab={activeSettingsSubTab}
            onSelectSettingsSubTab={(sub) => {
              handleSelectSettingsSubTab(sub);
              setIsMobileSidebarOpen(false);
            }}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            stats={stats}
            marketState={marketState}
            signalsCount={signals.length}
            discardsCount={silentLogs.length}
            perpsCount={assets.length}
            onlineApisCount={apis.filter((a) => a.status === 'ONLINE').length}
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            onOpenAiAudit={() => {
              setIsAiModalOpen(true);
              setIsMobileSidebarOpen(false);
            }}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Main Workspace Canvas */}
            <main className="flex-1 w-full px-3 py-4 sm:px-5 lg:px-6">
              {/* Layer 1: The Command Center */}
              {activeTab === 'DASHBOARD' && (
                <MinimalistPulseView
                  stats={stats}
                  signals={signals}
                  silentLogs={silentLogs}
                  pairs={assets}
                  marketState={marketState}
                  onMarketStateChange={handleMarketStateChange}
                  isRunning={isRunning}
                  onToggleRunning={handleToggleRunning}
                  onSingleStep={handleSingleStep}
                  onOpenAiAudit={() => setIsAiModalOpen(true)}
                  onNavigateToSoulAdapter={() => handleSelectTab('SOUL_ADAPTER')}
                  onNavigateToSignalPort={() => handleSelectTab('SIGNAL_PORT')}
                  apis={apis}
                  latencyMs={latencyMs}
                  isBackendConnected={isBackendConnected}
                  serverTickCount={serverTickCount}
                />
              )}

              {/* Layer 1.2: The Super Signal Siphon Port & External Consumer Radar */}
              {activeTab === 'SIGNAL_PORT' && (
                <SignalPortMonitorView
                  signals={signals}
                  onOpenAiAudit={() => setIsAiModalOpen(true)}
                />
              )}

              {/* Layer 1.5: The Soul Giver Universal Adapter & Learning Mesh */}
              {activeTab === 'SOUL_ADAPTER' && (
                <SoulGiverAdapterHub
                  signals={signals}
                  marketState={marketState}
                  onOpenAiAudit={() => setIsAiModalOpen(true)}
                />
              )}

              {/* Layer 2: The Market Radar */}
              {activeTab === 'MARKET' && (
                <MarketRadarView
                  assets={assets}
                  marketState={marketState}
                  onRefresh={refreshEngineSnapshot}
                  onAuditPair={() => refreshEngineSnapshot()}
                  activeSubTab={activeMarketSubTab}
                  onSubTabChange={handleSelectMarketSubTab}
                />
              )}

              {/* Layer 3: The Audit & Intelligence Layer */}
              {activeTab === 'AUDITOR' && (
                <AuditorIntelligenceView
                  stats={stats}
                  signals={signals}
                  silentLogs={silentLogs}
                  apis={apis}
                  assets={assets}
                  graRecords={graRecords}
                  resolutionRho={resolutionRho}
                  onTriggerCalibration={handleTriggerGraAudit}
                  onOpenAiAudit={() => setIsAiModalOpen(true)}
                  activeSubTab={activeAuditorSubTab}
                  onSubTabChange={handleSelectAuditorSubTab}
                />
              )}

              {/* Layer 4: The Engine Room / Core Diagnostics */}
              {activeTab === 'SETTINGS' && (
                <EngineDiagnosticsView
                  apis={apis}
                  assets={assets}
                  stats={stats}
                  resolutionRho={resolutionRho}
                  onUpdateRho={handleUpdateRho}
                  activeSubTab={activeSettingsSubTab}
                  onSubTabChange={handleSelectSettingsSubTab}
                />
              )}
            </main>
          </div>
        </div>

        {/* Gemini AI Auditor Modal */}
        <AiAuditorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          signal={signals[0] || null}
          marketState={marketState}
          indeterminacy={stats.currentIndeterminacy}
          apis={apis}
          resolutionRho={resolutionRho}
        />
      </div>
    </ErrorBoundary>
  );
}
