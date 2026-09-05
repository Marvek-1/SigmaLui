import React, { useState, useEffect } from 'react';
import { SuperSignal } from '../types';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Key,
  DollarSign,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface BybitBalance {
  totalEquity: number;
  marginBalance: number;
  availableBalance: number;
  unrealizedPnl: number;
  usdtBalance: number;
  accountType: string;
  updatedAt: string;
}

interface BybitPosition {
  symbol: string;
  side: 'Buy' | 'Sell';
  size: number;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  leverage: number;
  unrealisedPnl: number;
  pnlPct: number;
  takeProfit?: number;
  stopLoss?: number;
  updatedTime: string;
}

interface BybitOrder {
  orderId: string;
  orderLinkId: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Limit' | 'Market';
  price: number;
  qty: number;
  takeProfit?: number;
  stopLoss?: number;
  status: string;
  createdTime: string;
}

interface BybitTestnetTerminalProps {
  signals: SuperSignal[];
}

export const BybitTestnetTerminal: React.FC<BybitTestnetTerminalProps> = ({ signals }) => {
  const [balance, setBalance] = useState<BybitBalance | null>(null);
  const [positions, setPositions] = useState<BybitPosition[]>([]);
  const [orders, setOrders] = useState<BybitOrder[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [autoTrade, setAutoTrade] = useState<boolean>(false);
  const [notionalUsd, setNotionalUsd] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState<string>('');
  const [inputSecret, setInputSecret] = useState<string>('');
  const [executionMessage, setExecutionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchBybitData = async () => {
    setIsLoading(true);
    try {
      // 1. Status & Balance
      const statusRes = await fetch('/api/bybit/status');
      if (statusRes.ok) {
        const data = await statusRes.json();
        setIsConnected(data.isConnected);
        setLastError(data.lastError);
        if (data.balance) setBalance(data.balance);
        if (data.config) {
          setAutoTrade(data.config.autoTradeEnabled);
          setNotionalUsd(data.config.notionalUsd);
        }
      }

      // 2. Open Positions
      const posRes = await fetch('/api/bybit/positions');
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData.positions || []);
      }

      // 3. Orders
      const orderRes = await fetch('/api/bybit/orders');
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.orders || []);
      }
    } catch (err: any) {
      console.error('Failed to sync Bybit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBybitData();
    const interval = setInterval(fetchBybitData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoTrade = async () => {
    const newState = !autoTrade;
    setAutoTrade(newState);
    try {
      await fetch('/api/bybit/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoTradeEnabled: newState, notionalUsd }),
      });
      setExecutionMessage({
        text: `Auto-Trade ${newState ? 'ENABLED' : 'DISABLED'} for signals >= 94% conviction`,
        isError: false,
      });
    } catch (err: any) {
      setAutoTrade(!newState);
      setExecutionMessage({ text: 'Failed to update auto-trade config', isError: true });
    }
  };

  const handleExecuteManualSignal = async (signal: SuperSignal) => {
    setIsExecuting(signal.id);
    setExecutionMessage(null);
    try {
      const res = await fetch('/api/bybit/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: signal.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setExecutionMessage({
          text: `Order submitted for ${signal.asset}! Order ID: ${data.order?.orderId}`,
          isError: false,
        });
        fetchBybitData();
      } else {
        setExecutionMessage({
          text: `Execution failed: ${data.reason || data.error}`,
          isError: true,
        });
      }
    } catch (err: any) {
      setExecutionMessage({ text: `Network error: ${err?.message}`, isError: true });
    } finally {
      setIsExecuting(null);
    }
  };

  const handleClosePosition = async (pos: BybitPosition) => {
    if (!confirm(`Close ${pos.symbol} position of size ${pos.size} at market?`)) return;
    try {
      const res = await fetch('/api/bybit/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: pos.symbol, side: pos.side, size: pos.size }),
      });
      const data = await res.json();
      if (data.ok) {
        setExecutionMessage({ text: `Closed ${pos.symbol} position successfully`, isError: false });
        fetchBybitData();
      } else {
        setExecutionMessage({ text: `Close failed: ${data.reason}`, isError: true });
      }
    } catch (err: any) {
      setExecutionMessage({ text: `Close error: ${err?.message}`, isError: true });
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim() || !inputSecret.trim()) return;

    try {
      const res = await fetch('/api/bybit/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim(), apiSecret: inputSecret.trim() }),
      });
      if (res.ok) {
        setShowKeyModal(false);
        setInputKey('');
        setInputSecret('');
        setExecutionMessage({ text: 'Bybit API keys updated. Reconnecting...', isError: false });
        setTimeout(fetchBybitData, 1500);
      }
    } catch (err: any) {
      alert(`Error saving keys: ${err?.message}`);
    }
  };

  const highConvictionSignals = signals.filter((s) => s.topsisScore >= 0.94);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Environment Header */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Bybit V5 Unified Testnet
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isConnected ? 'ONLINE & SYNCHRONIZED' : 'TESTNET AUTH PENDING'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              Bybit Demo Execution Terminal
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Trades high-conviction Super Signals directly on Bybit USDT Linear Perpetuals with atomic Take-Profit and Stop-Loss brackets on the official Bybit Testnet sandbox.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBybitData}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs font-mono rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              <Key className="w-4 h-4" />
              API Keys
            </button>
            <a
              href="https://testnet.bybit.com/en/user/assets/home/tradingaccount"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 text-xs font-mono rounded-xl transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Bybit Portal
            </a>
          </div>
        </div>

        {/* Status Error Alert if any */}
        {lastError && !isConnected && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{lastError} (Generate or verify keys at testnet.bybit.com $\rightarrow$ API Management).</span>
          </div>
        )}

        {/* Execution Flash Message */}
        {executionMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl flex items-center gap-3 text-xs font-mono border ${
              executionMessage.isError
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {executionMessage.isError ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{executionMessage.text}</span>
          </div>
        )}
      </div>

      {/* KPI Account Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>TOTAL TESTNET EQUITY</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 tracking-tight font-mono">
            ${balance ? balance.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,004.40'}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            USDT Collateral: ${balance ? balance.usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,000.00'}
          </div>
        </div>

        {/* Margin Balance */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>MARGIN BALANCE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
            ${balance ? balance.marginBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,004.40'}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            Available: ${balance ? balance.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '100,004.40'}
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>UNREALIZED PnL</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div
            className={`text-2xl font-black tracking-tight font-mono ${
              (balance?.unrealizedPnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(balance?.unrealizedPnl || 0) >= 0 ? '+' : ''}
            ${(balance?.unrealizedPnl || 0).toFixed(2)} USD
          </div>
          <div className="text-xs text-slate-500 mt-2 font-mono">
            Active Open Positions: {positions.length}
          </div>
        </div>

        {/* Execution Mode & Auto-Trade */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AUTO-TRADE SWITCH</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-slate-200 font-mono">
              {autoTrade ? 'AUTO DISPATCH' : 'MANUAL ONLY'}
            </span>
            <button
              onClick={handleToggleAutoTrade}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                autoTrade
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {autoTrade ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-2">
            Size: ${notionalUsd} USD / trade (Score $\ge$ 94%)
          </div>
        </div>
      </div>

      {/* Main Grid: Open Positions & Live Signal Trigger Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Open Bybit Positions Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Open Bybit Testnet Positions ({positions.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Linear USDT Contracts</span>
          </div>

          {positions.length === 0 ? (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm font-mono">Zero open positions on Bybit Testnet</p>
              <p className="text-slate-600 text-xs font-mono mt-1">
                Trigger a Super Signal below or toggle Auto-Trade to automatically enter high-conviction setups.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Entry</th>
                    <th className="pb-3">Mark</th>
                    <th className="pb-3">Liq Price</th>
                    <th className="pb-3">Unrealized PnL</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {positions.map((pos) => (
                    <tr key={`${pos.symbol}-${pos.side}`} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 font-bold text-slate-100 flex items-center gap-1.5">
                        {pos.symbol}
                        <span className="text-[10px] text-slate-500 font-normal">{pos.leverage}x</span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            pos.side === 'Buy'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pos.side === 'Buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-3.5">{pos.size}</td>
                      <td className="py-3.5">${pos.entryPrice.toLocaleString()}</td>
                      <td className="py-3.5 text-slate-100">${pos.markPrice.toLocaleString()}</td>
                      <td className="py-3.5 text-amber-400/90 font-mono">
                        {pos.liqPrice > 0 ? `$${pos.liqPrice.toLocaleString()}` : '--'}
                      </td>
                      <td className="py-3.5 font-bold">
                        <span className={pos.unrealisedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {pos.unrealisedPnl >= 0 ? '+' : ''}
                          ${pos.unrealisedPnl.toFixed(2)} ({pos.pnlPct}%)
                        </span>
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => handleClosePosition(pos)}
                          className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] rounded font-mono transition"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Instant Manual Signal Execution Matrix */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Live Super Signals
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {highConvictionSignals.length} Directives
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono mb-3">
            Click to dispatch an instant Bybit Testnet bracket order with mathematical TP/SL protections.
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {highConvictionSignals.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                Awaiting Gate 3 high-conviction signal ($\ge 94\%$)...
              </div>
            ) : (
              highConvictionSignals.map((sig) => {
                const tier = sig.tier || sig.decisionTrace?.tier || 'HIGH_CONFLUENCE';
                const trace = sig.decisionTrace;
                const quorum = trace?.crossVenue.quorum || (sig.crossVenueTriangulated ? '3/3' : '1/3');
                const tVal = trace?.neutrosophic.T ?? 0.90;
                const iVal = trace?.neutrosophic.I ?? (sig.indeterminacy ?? 0.08);
                const fVal = trace?.neutrosophic.F ?? 0.02;
                const mrpeVal = trace?.grey.mrpe ?? (sig.greyResidualError ?? 0.01);

                return (
                  <div
                    key={sig.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 rounded-xl transition flex flex-col gap-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-100 font-mono">{sig.asset}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            sig.action === 'STRONG_BUY' || sig.action === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : sig.action === 'NO_TRADE'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {sig.action === 'STRONG_BUY' || sig.action === 'BUY'
                            ? 'BUY / LONG'
                            : sig.action === 'NO_TRADE'
                            ? 'NO TRADE'
                            : 'SELL / SHORT'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            tier === 'APEX_SOVEREIGN'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : tier === 'HIGH_CONFLUENCE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : tier === 'ALPHA_PRIME'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                          }`}
                        >
                          {tier}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {((sig.idealCloseness ?? sig.topsisScore)).toFixed(4)} Closeness
                      </div>
                    </div>

                    {/* DecisionTrace Telemetry Row */}
                    <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-slate-400">
                      <span>(T: {tVal.toFixed(2)}, I: {iVal.toFixed(2)}, F: {fVal.toFixed(2)})</span>
                      <span className="text-amber-400/90 font-bold">Quorum: {quorum}</span>
                      <span>GM(1,1) MRPE: {(mrpeVal * 100).toFixed(2)}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                      <div>
                        <span className="block text-[9px] text-slate-500">ENTRY</span>
                        <span className="text-slate-200 font-bold">${sig.entryPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-emerald-500">TP (TARGET)</span>
                        <span className="text-emerald-400 font-bold">${sig.target1.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-rose-500">SL (STOP)</span>
                        <span className="text-rose-400 font-bold">${sig.stopLoss.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteManualSignal(sig)}
                      disabled={isExecuting === sig.id}
                      className="w-full mt-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isExecuting === sig.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          Test Dispatch on Bybit (${notionalUsd})
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Bybit Testnet Order History Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Recent Bybit Testnet Order Log ({orders.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Session Execution Audit Trail</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 text-center text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
            No orders submitted yet in this session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Side</th>
                  <th className="pb-3">Qty</th>
                  <th className="pb-3">Entry</th>
                  <th className="pb-3">TP</th>
                  <th className="pb-3">SL</th>
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 text-slate-500">{ord.createdTime.slice(11, 19)}</td>
                    <td className="py-2.5 font-bold text-slate-100">{ord.symbol}</td>
                    <td className="py-2.5">
                      <span className={ord.side === 'Buy' ? 'text-emerald-400' : 'text-rose-400'}>
                        {ord.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5">{ord.qty}</td>
                    <td className="py-2.5">${ord.price.toLocaleString()}</td>
                    <td className="py-2.5 text-emerald-400">${ord.takeProfit?.toLocaleString() || '--'}</td>
                    <td className="py-2.5 text-rose-400">${ord.stopLoss?.toLocaleString() || '--'}</td>
                    <td className="py-2.5 text-slate-400 font-mono">{ord.orderId}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: API Key Setup */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Bybit Testnet API Credentials
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4">
              Enter your Bybit Testnet API Key & Secret created at{' '}
              <a
                href="https://testnet.bybit.com/app/user/api-management"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline"
              >
                testnet.bybit.com/app/user/api-management
              </a>
              .
            </p>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">API Key</label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="e.g. nVoMdX3eI6SuqPyfKT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">API Secret</label>
                <input
                  type="password"
                  value={inputSecret}
                  onChange={(e) => setInputSecret(e.target.value)}
                  placeholder="e.g. vFdhPdd684lF0EwF3uSe9TDn9zB3x10dKpir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold rounded-xl transition shadow-lg shadow-amber-500/20"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
