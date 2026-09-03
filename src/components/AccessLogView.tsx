import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Terminal,
  Copy,
  Check,
  UserX,
  UserCheck,
  Clock,
  Radio,
  Zap,
  CheckCircle2,
  ExternalLink,
  Ban,
  Activity,
  Layers,
  Cpu,
  FileText,
  AlertOctagon,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AccessLogEntry, AccessLogSummary } from '../types';

export const AccessLogView: React.FC = () => {
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [summary, setSummary] = useState<AccessLogSummary | null>(null);
  const [bannedIps, setBannedIps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AUTHORIZED' | 'AUTH_FAILURE' | 'SECURITY_BREACH' | 'EXPIRED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRawIps, setShowRawIps] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('AUTH_FAILURE_FORGED_KEY');
  const [simNodeName, setSimNodeName] = useState<string>('Rogue_HFT_Scanner');
  const [simTier, setSimTier] = useState<'PREMIUM_95' | 'ULTRA_98'>('PREMIUM_95');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [manualIpToBan, setManualIpToBan] = useState<string>('');

  const fetchAccessLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/soul/access-log');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setSummary(json.summary || null);
        setBannedIps(json.bannedIps || []);
      }
    } catch {
      // Keep existing state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessLogs();
    const interval = setInterval(fetchAccessLogs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const res = await fetch('/api/soul/access-log/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          nodeName: simNodeName,
          tier: simTier,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastActionMessage(`Simulation Executed: ${data.entry.actionTaken}`);
        await fetchAccessLogs();
        setSimulationModalOpen(false);

        if (selectedScenario === 'AUTHORIZED_HANDSHAKE') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }
    } catch {
      setLastActionMessage('Simulation failed to dispatch.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleBanIp = async (ip: string) => {
    try {
      const res = await fetch('/api/soul/access-log/ban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        setLastActionMessage(`IP address ${ip} successfully quarantined and banned at firewall.`);
        await fetchAccessLogs();
      }
    } catch {
      // ignore
    }
  };

  const handleUnbanIp = async (ip: string) => {
    try {
      const res = await fetch('/api/soul/access-log/unban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        setLastActionMessage(`IP address ${ip} unbanned from firewall.`);
        await fetchAccessLogs();
      }
    } catch {
      // ignore
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(key);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'AUTHORIZED' && log.status !== 'AUTHORIZED') return false;
    if (filterStatus === 'AUTH_FAILURE' && log.eventType !== 'AUTH_FAILURE' && log.status !== 'REJECTED') return false;
    if (filterStatus === 'SECURITY_BREACH' && log.status !== 'SECURITY_BREACH') return false;
    if (filterStatus === 'EXPIRED' && log.status !== 'EXPIRED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.nodeName.toLowerCase().includes(q) ||
        log.nodeId.toLowerCase().includes(q) ||
        log.ipAddress.toLowerCase().includes(q) ||
        log.ipRaw.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const authorizedCount = logs.filter((l) => l.status === 'AUTHORIZED').length;
  const authFailureCount = logs.filter((l) => l.status === 'REJECTED' || l.eventType === 'AUTH_FAILURE').length;
  const breachCount = logs.filter((l) => l.status === 'SECURITY_BREACH').length;
  const expiredCount = logs.filter((l) => l.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      {/* 1. HERO SECURITY BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Multi-Tenant Security Firewall
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Enforcement
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Access Log & Handshake Audit Trail
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Real-time cryptographic authentication telemetry for external bots and consumer systems connecting to Port 8443.
              Tracking <strong className="text-cyan-300">handshake successes</strong>, intercepting <strong className="text-amber-300">authentication failures</strong>, and enforcing automated IP bans for <strong className="text-rose-400">fingerprint mismatches</strong>.
            </p>
          </div>

          {/* Action trigger: Simulate Connection */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setSimulationModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Handshake Event</span>
            </button>
            <button
              onClick={fetchAccessLogs}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center justify-center space-x-2"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Audit</span>
            </button>
          </div>
        </div>

        {lastActionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-cyan-800/80 text-xs text-cyan-200 font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{lastActionMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Handshakes */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Total Handshakes
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {logs.length}
            </span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Logged Sessions</span>
        </div>

        {/* Authorized Relays */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Authorized
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {authorizedCount}
            </span>
            <span className="text-xs text-emerald-300 font-mono font-bold">
              {logs.length ? Math.round((authorizedCount / logs.length) * 100) : 100}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Active Verified Bots</span>
        </div>

        {/* Auth Failures */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Auth Failures
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {authFailureCount}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-mono">
              Blocked
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Invalid Key / Token</span>
        </div>

        {/* Security Breaches */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/40 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Breaches
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {breachCount}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
              Quarantined
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Stolen Key Attempts</span>
        </div>

        {/* Banned IPs */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Ban className="w-3 h-3 text-rose-400" />
            Firewall Bans
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-300 font-mono">
              {bannedIps.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">IPs</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Permanent Blacklist</span>
        </div>

        {/* Avg Latency */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Handshake Speed
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {summary?.avgHandshakeLatencyMs ?? 15}ms
            </span>
            <span className="text-xs text-emerald-400 font-mono">Sub-20ms</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">Fast Auth Cycle</span>
        </div>
      </div>

      {/* 3. HARDENED SECURITY POSTURE PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              1. Rate-Limit Enforcement
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              HTTP 429 Armed
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Tier quotas are enforced per node: <strong className="text-slate-200">120 req/min</strong> for Premium 95, and <strong className="text-slate-200">300 req/min</strong> for Ultra 98. Aggressive pollers are throttled automatically.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              2. IP Fingerprinting
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Anti-Theft Active
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Keys are cryptographically bound to the node's ASN and origin IP. If a key is leaked and attempted from an unauthorized server, the key is revoked and the origin IP is auto-banned.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              3. Encrypted Challenge
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 font-bold">
              Non-Sniffable
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The handshake uses a challenge-response nonce verification, ensuring keys cannot be passively sniffed or replayed across public endpoints or middleboxes.
          </p>
        </div>
      </div>

      {/* 4. ACCESS LOG FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilterStatus('AUTHORIZED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              filterStatus === 'AUTHORIZED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-emerald-400/70 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Authorized ({authorizedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('AUTH_FAILURE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              filterStatus === 'AUTH_FAILURE'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'text-amber-400/70 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Auth Failures ({authFailureCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('SECURITY_BREACH')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              filterStatus === 'SECURITY_BREACH'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'text-rose-400/70 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Breaches ({breachCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('EXPIRED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
              filterStatus === 'EXPIRED'
                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                : 'text-purple-400/70 hover:text-purple-300'
            }`}
          >
            <span>Expired ({expiredCount})</span>
          </button>
        </div>

        {/* Search & IP Mask Toggle */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bot, IP, endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <button
            onClick={() => setShowRawIps(!showRawIps)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center space-x-1 cursor-pointer whitespace-nowrap"
            title={showRawIps ? 'Mask sensitive IPs' : 'Reveal raw IPs for audit'}
          >
            {showRawIps ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showRawIps ? 'Mask IPs' : 'Reveal IPs'}</span>
          </button>
        </div>
      </div>

      {/* 5. ACCESS TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Timestamp / Node ID</th>
                <th className="py-3.5 px-4 font-bold">Node Name</th>
                <th className="py-3.5 px-4 font-bold">Event / Status</th>
                <th className="py-3.5 px-4 font-bold">IP Address</th>
                <th className="py-3.5 px-4 font-bold">Node Tier</th>
                <th className="py-3.5 px-4 font-bold">Endpoint & Latency</th>
                <th className="py-3.5 px-4 font-bold">Quota / Action Taken</th>
                <th className="py-3.5 px-4 font-bold text-right">Firewall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No access log entries match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isAuth = log.status === 'AUTHORIZED';
                  const isFailure = log.eventType === 'AUTH_FAILURE' || log.status === 'REJECTED';
                  const isBreach = log.status === 'SECURITY_BREACH';
                  const isExpired = log.status === 'EXPIRED';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBreach ? 'bg-rose-950/20' : isFailure ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Timestamp & ID */}
                      <td className="py-3 px-4">
                        <div className="text-white font-bold">{log.timestamp}</div>
                        <div className="text-[10px] text-slate-500">{log.nodeId}</div>
                      </td>

                      {/* Node Name & Agent */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-bold flex items-center space-x-1.5">
                          <span>{log.nodeName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={log.userAgent}>
                          {log.userAgent}
                        </div>
                      </td>

                      {/* Event Type & Status Badge */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          {isAuth && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                              AUTHORIZED
                            </span>
                          )}
                          {isFailure && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 w-max">
                              <AlertTriangle className="w-2.5 h-2.5 mr-1 text-amber-400" />
                              AUTH_FAILURE
                            </span>
                          )}
                          {isBreach && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 w-max animate-pulse">
                              <ShieldAlert className="w-2.5 h-2.5 mr-1 text-rose-400" />
                              SECURITY_BREACH
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 w-max">
                              EXPIRED
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{log.eventType}</span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-mono ${log.isBanned ? 'text-rose-400 line-through' : 'text-slate-300'}`}>
                            {showRawIps ? log.ipRaw : log.ipAddress}
                          </span>
                          {log.isBanned && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-950 text-rose-300 border border-rose-800">
                              BANNED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Node Tier */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            log.nodeTier === 'ULTRA_98'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : log.nodeTier === 'PREMIUM_95'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {log.nodeTier}
                        </span>
                      </td>

                      {/* Endpoint & Latency */}
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-mono text-[11px] truncate max-w-[160px]" title={log.endpoint}>
                          {log.endpoint}
                        </div>
                        <div className="text-[10px] text-cyan-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{log.latencyMs}ms latency</span>
                        </div>
                      </td>

                      {/* Quota / Action Detail */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-400 text-[10px]">
                          Quota: <span className="text-slate-200">{log.rateLimitQuota}</span>
                        </div>
                        <div
                          className={`text-[11px] leading-tight mt-0.5 ${
                            isBreach ? 'text-rose-300' : isFailure ? 'text-amber-300' : 'text-slate-300'
                          }`}
                        >
                          {log.actionTaken}
                        </div>
                        {log.failureReason && (
                          <div className="text-[10px] text-amber-400/80 italic mt-0.5">
                            Reason: {log.failureReason}
                          </div>
                        )}
                      </td>

                      {/* Firewall Control */}
                      <td className="py-3 px-4 text-right">
                        {log.isBanned || bannedIps.includes(log.ipRaw) ? (
                          <button
                            onClick={() => handleUnbanIp(log.ipRaw)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 cursor-pointer"
                            title="Unban IP"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanIp(log.ipRaw)}
                            className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-[10px] text-rose-300 border border-rose-800 cursor-pointer flex items-center space-x-1 ml-auto"
                            title="Ban IP at firewall level"
                          >
                            <Ban className="w-2.5 h-2.5" />
                            <span>Ban IP</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. BANNED IP QUARANTINE LIST & MANUAL IP BLOCK */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Ban className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Firewall Quarantine & Blacklisted IPs ({bannedIps.length})
            </h3>
          </div>

          {/* Manual Ban Input */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <input
              type="text"
              placeholder="e.g. 194.26.29.112"
              value={manualIpToBan}
              onChange={(e) => setManualIpToBan(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() => {
                if (manualIpToBan.trim()) {
                  handleBanIp(manualIpToBan.trim());
                  setManualIpToBan('');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
            >
              <Ban className="w-3 h-3" />
              <span>Blacklist IP</span>
            </button>
          </div>
        </div>

        {/* Banned IP tags */}
        <div className="flex flex-wrap gap-2">
          {bannedIps.length === 0 ? (
            <span className="text-xs text-slate-500 font-mono">No active firewall bans.</span>
          ) : (
            bannedIps.map((ip) => (
              <div
                key={ip}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-rose-900/60 text-xs font-mono flex items-center space-x-2 text-rose-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{ip}</span>
                <button
                  onClick={() => handleUnbanIp(ip)}
                  className="text-slate-400 hover:text-white cursor-pointer ml-1 text-xs"
                  title="Remove from blacklist"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. DEVELOPER CLI & AUDIT VERIFICATION COMMANDS */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 font-mono text-xs text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Security Audit CLI Query:</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                copyText(
                  'curl -X GET http://localhost:3000/api/soul/access-log -H "Authorization: Bearer ADMIN_MASTER_KEY"',
                  'audit'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedCurl === 'audit' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl === 'audit' ? 'Copied CLI' : 'cURL Audit'}</span>
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify({ summary, logs }, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `access-audit-${Date.now()}.json`;
                a.click();
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-xs text-cyan-300 font-mono flex items-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <code>curl -X GET http://localhost:3000/api/soul/access-log -H &quot;Authorization: Bearer ADMIN_MASTER_KEY&quot;</code>
        </pre>
      </div>

      {/* 8. SIMULATION MODAL */}
      {simulationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-mono">
                  Simulate Handshake Event
                </h3>
              </div>
              <button
                onClick={() => setSimulationModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Test your security posture and verify that unauthorized scraper bots or stolen keys are intercepted and quarantined by the firewall.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Scenario to Trigger:</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="AUTHORIZED_HANDSHAKE">Authorized Handshake (Valid Token & Challenge)</option>
                  <option value="AUTH_FAILURE_FORGED_KEY">Auth Failure: Missing / Forged Token Header</option>
                  <option value="IP_FINGERPRINT_BREACH">Security Breach: Stolen Key from Mismatched IP</option>
                  <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded: Flood &gt; Quota Threshold</option>
                  <option value="TOKEN_EXPIRED">Token Expired: TTL 7-day Lifecycle Ended</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Simulated Bot Identity:</label>
                <input
                  type="text"
                  value={simNodeName}
                  onChange={(e) => setSimNodeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Subscription Tier:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimTier('PREMIUM_95')}
                    className={`py-2 px-3 rounded-xl border font-bold cursor-pointer text-center ${
                      simTier === 'PREMIUM_95'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Premium 95 (120 req/m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTier('ULTRA_98')}
                    className={`py-2 px-3 rounded-xl border font-bold cursor-pointer text-center ${
                      simTier === 'ULTRA_98'
                        ? 'bg-purple-950 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Ultra 98 (300 req/m)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSimulationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer flex items-center space-x-2"
              >
                <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Dispatch Simulation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
