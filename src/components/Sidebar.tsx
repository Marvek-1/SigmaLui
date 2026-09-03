import React, { useState } from 'react';
import {
  Activity,
  Compass,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Zap,
  Target,
  FileText,
  Coins,
  Layers,
  Radio,
  BrainCircuit,
  RotateCcw,
  Server,
  Workflow,
  Code,
  Scale,
  LineChart,
  Sparkles,
  Play,
  Pause,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Plug,
  Share2,
} from 'lucide-react';
import { MarketState, PipelineStats } from '../types';

export type NavTab = 'DASHBOARD' | 'SIGNAL_PORT' | 'SOUL_ADAPTER' | 'MARKET' | 'AUDITOR' | 'SETTINGS';
export type MarketSubTab = 'UNIVERSE' | 'ORDERBOOK_DEPTH';
export type AuditorSubTab =
  | 'SOAK_TEST'
  | 'VERIFICATION'
  | 'DISCARD_STREAM'
  | 'RESEARCH_AGENTS'
  | 'FEEDBACK_CALIBRATION';
export type SettingsSubTab =
  | 'APIS'
  | 'ARCHITECTURE'
  | 'GATE1_PYTHON'
  | 'NEUTROSOPHIC_CONSENSUS'
  | 'GREY_LAB';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeMarketSubTab: MarketSubTab;
  onSelectMarketSubTab: (subTab: MarketSubTab) => void;
  activeAuditorSubTab: AuditorSubTab;
  onSelectAuditorSubTab: (subTab: AuditorSubTab) => void;
  activeSettingsSubTab: SettingsSubTab;
  onSelectSettingsSubTab: (subTab: SettingsSubTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  stats: PipelineStats;
  marketState: MarketState;
  signalsCount: number;
  discardsCount: number;
  perpsCount: number;
  onlineApisCount: number;
  isRunning: boolean;
  onToggleRunning: () => void;
  onOpenAiAudit: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeMarketSubTab,
  onSelectMarketSubTab,
  activeAuditorSubTab,
  onSelectAuditorSubTab,
  activeSettingsSubTab,
  onSelectSettingsSubTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  stats,
  marketState,
  signalsCount,
  discardsCount,
  perpsCount,
  onlineApisCount,
  isRunning,
  onToggleRunning,
  onOpenAiAudit,
}) => {
  // State for collapsible accordion sections in expanded mode with localStorage persistence
  const [openSections, setOpenSections] = useState<Record<NavTab, boolean>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ai_studio_sidebar_open_sections');
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch {}
    return {
      DASHBOARD: true,
      MARKET: true,
      AUDITOR: true,
      SETTINGS: false,
    };
  });

  const toggleSection = (section: NavTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSections((prev) => {
      const next = {
        ...prev,
        [section]: !prev[section],
      };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_studio_sidebar_open_sections', JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  // Determine Traffic light status for mini badge
  const isSafetyLock = marketState === 'HIGH_VOLATILITY' || stats.currentIndeterminacy > 0.35;
  const isStrategicSilence =
    marketState === 'CONFUSED_CONFLICT' ||
    stats.currentIndeterminacy > 0.22 ||
    (signalsCount === 0 && isRunning);

  const pulseColor = isSafetyLock
    ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
    : isStrategicSilence
    ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
    : 'bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse';

  const navGroups = [
    {
      id: 'DASHBOARD' as const,
      label: 'Live Signals',
      sublabel: 'Trades & Performance',
      icon: Activity,
      badge: `${stats.successRatePct.toFixed(1)}% Win Rate`,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      items: [
        {
          id: 'PULSE',
          label: 'Overview & Status',
          icon: Zap,
          onClick: () => onSelectTab('DASHBOARD'),
          isActive: activeTab === 'DASHBOARD',
        },
        {
          id: 'SIGNALS',
          label: 'Active Trade Signals',
          icon: Target,
          badge: `${signalsCount}`,
          onClick: () => onSelectTab('DASHBOARD'),
          isActive: activeTab === 'DASHBOARD',
        },
        {
          id: 'LEDGER',
          label: 'Daily Win/Loss History',
          icon: FileText,
          badge: `${stats.successfulSignals}W / ${stats.failedSignals}L`,
          onClick: () => onSelectTab('DASHBOARD'),
          isActive: activeTab === 'DASHBOARD',
        },
      ],
    },
    {
      id: 'SIGNAL_PORT' as const,
      label: 'Super Signal Port',
      sublabel: 'Port 8443 Siphon & Progress Radar',
      icon: Radio,
      badge: 'Port 8443 Live',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      items: [
        {
          id: 'ACTIVE_SIPHON_APPS',
          label: 'External App Monitor',
          icon: Activity,
          badge: '5 Apps Sucking',
          onClick: () => onSelectTab('SIGNAL_PORT'),
          isActive: activeTab === 'SIGNAL_PORT',
        },
        {
          id: 'TRADE_EFFICACY_RADAR',
          label: 'Signal Trade Efficacy',
          icon: Target,
          badge: '85.6% Win Rate',
          onClick: () => onSelectTab('SIGNAL_PORT'),
          isActive: activeTab === 'SIGNAL_PORT',
        },
        {
          id: 'SIPHON_HUB_CODES',
          label: 'Port Hub & Code Snippets',
          icon: Code,
          badge: 'Python/Rust/cURL',
          onClick: () => onSelectTab('SIGNAL_PORT'),
          isActive: activeTab === 'SIGNAL_PORT',
        },
      ],
    },
    {
      id: 'SOUL_ADAPTER' as const,
      label: 'Soul Giver Adapter',
      sublabel: 'Trading Adapter & Learning Mesh',
      icon: Flame,
      badge: 'Active Hub',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      items: [
        {
          id: 'PLUG_ADAPTERS',
          label: 'Plug & Play Adapters',
          icon: Plug,
          badge: 'Webhooks & APIs',
          onClick: () => onSelectTab('SOUL_ADAPTER'),
          isActive: activeTab === 'SOUL_ADAPTER',
        },
        {
          id: 'COLLECTIVE_GROWTH',
          label: 'Collective Data Sharing',
          icon: Share2,
          badge: 'Growth Loop',
          onClick: () => onSelectTab('SOUL_ADAPTER'),
          isActive: activeTab === 'SOUL_ADAPTER',
        },
      ],
    },
    {
      id: 'MARKET' as const,
      label: 'Market Radar',
      sublabel: 'Watchlist & Depth',
      icon: Compass,
      badge: `${perpsCount} Coins`,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
      items: [
        {
          id: 'UNIVERSE' as MarketSubTab,
          label: '30+ Crypto Watchlist',
          icon: Coins,
          badge: `${perpsCount}`,
          onClick: () => {
            onSelectTab('MARKET');
            onSelectMarketSubTab('UNIVERSE');
          },
          isActive: activeTab === 'MARKET' && activeMarketSubTab === 'UNIVERSE',
        },
        {
          id: 'ORDERBOOK_DEPTH' as MarketSubTab,
          label: 'Orderbook Depth & Spread',
          icon: Layers,
          badge: 'Live Depth',
          onClick: () => {
            onSelectTab('MARKET');
            onSelectMarketSubTab('ORDERBOOK_DEPTH');
          },
          isActive: activeTab === 'MARKET' && activeMarketSubTab === 'ORDERBOOK_DEPTH',
        },
      ],
    },
    {
      id: 'AUDITOR' as const,
      label: 'Trade Tracker & Audit',
      sublabel: 'Accuracy & Safety Logs',
      icon: ShieldCheck,
      badge: `${discardsCount} Filtered`,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      items: [
        {
          id: 'SOAK_TEST' as AuditorSubTab,
          label: 'Live Trade Tracker',
          icon: Target,
          badge: '5 Tracked',
          onClick: () => {
            onSelectTab('AUDITOR');
            onSelectAuditorSubTab('SOAK_TEST');
          },
          isActive: activeTab === 'AUDITOR' && activeAuditorSubTab === 'SOAK_TEST',
        },
        {
          id: 'VERIFICATION' as AuditorSubTab,
          label: 'Win Rate Verification',
          icon: ShieldCheck,
          badge: `${stats.successRatePct.toFixed(1)}%`,
          onClick: () => {
            onSelectTab('AUDITOR');
            onSelectAuditorSubTab('VERIFICATION');
          },
          isActive: activeTab === 'AUDITOR' && activeAuditorSubTab === 'VERIFICATION',
        },
        {
          id: 'DISCARD_STREAM' as AuditorSubTab,
          label: 'Blocked Risky Trades',
          icon: Radio,
          badge: `${discardsCount}`,
          onClick: () => {
            onSelectTab('AUDITOR');
            onSelectAuditorSubTab('DISCARD_STREAM');
          },
          isActive: activeTab === 'AUDITOR' && activeAuditorSubTab === 'DISCARD_STREAM',
        },
        {
          id: 'RESEARCH_AGENTS' as AuditorSubTab,
          label: 'AI Research Agents',
          icon: BrainCircuit,
          badge: '4 Agents',
          onClick: () => {
            onSelectTab('AUDITOR');
            onSelectAuditorSubTab('RESEARCH_AGENTS');
          },
          isActive: activeTab === 'AUDITOR' && activeAuditorSubTab === 'RESEARCH_AGENTS',
        },
        {
          id: 'FEEDBACK_CALIBRATION' as AuditorSubTab,
          label: 'Model Auto-Calibration',
          icon: RotateCcw,
          badge: 'Active',
          onClick: () => {
            onSelectTab('AUDITOR');
            onSelectAuditorSubTab('FEEDBACK_CALIBRATION');
          },
          isActive: activeTab === 'AUDITOR' && activeAuditorSubTab === 'FEEDBACK_CALIBRATION',
        },
      ],
    },
    {
      id: 'SETTINGS' as const,
      label: 'System & Feeds',
      sublabel: 'Exchanges & Engine',
      icon: Settings,
      badge: `${onlineApisCount}/20 Online`,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
      items: [
        {
          id: 'APIS' as SettingsSubTab,
          label: '20 Exchange Feeds',
          icon: Server,
          badge: `${onlineApisCount}/20`,
          onClick: () => {
            onSelectTab('SETTINGS');
            onSelectSettingsSubTab('APIS');
          },
          isActive: activeTab === 'SETTINGS' && activeSettingsSubTab === 'APIS',
        },
        {
          id: 'ARCHITECTURE' as SettingsSubTab,
          label: 'System Flowchart',
          icon: Workflow,
          onClick: () => {
            onSelectTab('SETTINGS');
            onSelectSettingsSubTab('ARCHITECTURE');
          },
          isActive: activeTab === 'SETTINGS' && activeSettingsSubTab === 'ARCHITECTURE',
        },
        {
          id: 'GATE1_PYTHON' as SettingsSubTab,
          label: 'Prediction Engine',
          icon: Code,
          badge: 'Active',
          onClick: () => {
            onSelectTab('SETTINGS');
            onSelectSettingsSubTab('GATE1_PYTHON');
          },
          isActive: activeTab === 'SETTINGS' && activeSettingsSubTab === 'GATE1_PYTHON',
        },
        {
          id: 'NEUTROSOPHIC_CONSENSUS' as SettingsSubTab,
          label: 'Multi-Exchange Consensus',
          icon: Scale,
          badge: 'Consensus',
          onClick: () => {
            onSelectTab('SETTINGS');
            onSelectSettingsSubTab('NEUTROSOPHIC_CONSENSUS');
          },
          isActive: activeTab === 'SETTINGS' && activeSettingsSubTab === 'NEUTROSOPHIC_CONSENSUS',
        },
        {
          id: 'GREY_LAB' as SettingsSubTab,
          label: 'Algorithm Sandbox',
          icon: LineChart,
          onClick: () => {
            onSelectTab('SETTINGS');
            onSelectSettingsSubTab('GREY_LAB');
          },
          isActive: activeTab === 'SETTINGS' && activeSettingsSubTab === 'GREY_LAB',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-950/95 border-r border-slate-800/80 text-slate-200 font-mono select-none">
      
      {/* 1. Sidebar Top Header & Traffic Light Mini Badge */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className={`w-3.5 h-3.5 rounded-full ${pulseColor} shrink-0`} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                EXECUTION CORE
              </span>
              <span className="text-[10px] text-slate-400">
                {isSafetyLock ? 'SAFETY LOCK' : isStrategicSilence ? 'STRATEGIC SILENCE' : 'ACTIVE CHURN'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className={`w-4 h-4 rounded-full ${pulseColor}`} title="Engine Traffic Light" />
          </div>
        )}

        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Navigation Section with Collapsible Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3 custom-scrollbar">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isGroupActive = activeTab === group.id;
          const isGroupOpen = openSections[group.id];

          if (isCollapsed) {
            // Collapsed icon-only mode
            return (
              <div key={group.id} className="relative group/mini flex justify-center py-1">
                <button
                  onClick={() => onSelectTab(group.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isGroupActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title={`${group.label} (${group.badge})`}
                >
                  <GroupIcon className="w-5 h-5" />
                </button>

                {/* Floating tooltip on hover in collapsed mode */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden group-hover/mini:block bg-slate-900 border border-slate-700 shadow-xl rounded-xl p-2.5 w-52 text-left pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{group.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-bold ${group.badgeColor}`}>
                      {group.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{group.sublabel}</span>
                </div>
              </div>
            );
          }

          // Expanded mode with Collapsible Tabs / Sub-items
          return (
            <div key={group.id} className="rounded-xl bg-slate-900/40 border border-slate-800/60 overflow-hidden">
              {/* Group Header Tab */}
              <div
                onClick={() => onSelectTab(group.id)}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all ${
                  isGroupActive
                    ? 'bg-cyan-950/40 text-cyan-300 border-l-4 border-cyan-400'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <GroupIcon className={`w-4 h-4 shrink-0 ${isGroupActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <span className="text-xs font-bold block truncate">{group.label}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-bold hidden sm:inline-block ${group.badgeColor}`}>
                    {group.badge}
                  </span>
                  <button
                    onClick={(e) => toggleSection(group.id, e)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title={isGroupOpen ? 'Collapse sub-tabs' : 'Expand sub-tabs'}
                  >
                    {isGroupOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Sub-items */}
              {isGroupOpen && (
                <div className="py-1 px-1.5 space-y-0.5 bg-slate-950/60 border-t border-slate-800/40">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = item.isActive;

                    return (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                          isItemActive
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isItemActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ml-1.5 ${
                              isItemActive
                                ? 'bg-cyan-950 text-cyan-200 border border-cyan-800'
                                : 'bg-slate-800/80 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Sidebar Bottom Quick Control Dock */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2">
        {!isCollapsed ? (
          <>
            {/* Quick Engine Running State Toggle */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="text-slate-300 font-bold">{isRunning ? 'Engine Churning' : 'Engine Paused'}</span>
              </div>
              <button
                onClick={onToggleRunning}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRunning
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }`}
                title={isRunning ? 'Pause execution' : 'Resume execution'}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            </div>

            {/* AI Auditor Trigger Button */}
            <button
              onClick={onOpenAiAudit}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Quant Audit</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={onToggleRunning}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-slate-900 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
              title={isRunning ? 'Pause Engine' : 'Resume Engine'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={onOpenAiAudit}
              className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition-all cursor-pointer"
              title="Launch AI Quant Audit"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 sticky top-[73px] h-[calc(100vh-73px)] z-30 ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
