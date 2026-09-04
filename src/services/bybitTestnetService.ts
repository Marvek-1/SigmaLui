/**
 * =============================================================================
 * Bybit V5 Unified Trading Account (UTA) Testnet Execution Engine
 * =============================================================================
 * Connects SigmaLui multi-criteria Super Signals to Bybit Testnet V5 API
 * (https://api-testnet.bybit.com) for demo execution with atomic TP/SL brackets.
 * =============================================================================
 */

import crypto from 'crypto';
import { SuperSignal } from '../types';

export interface BybitWalletBalance {
  totalEquity: number;
  marginBalance: number;
  availableBalance: number;
  unrealizedPnl: number;
  usdtBalance: number;
  accountType: string;
  updatedAt: string;
}

export interface BybitPosition {
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

export interface BybitOrderResult {
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

export interface BybitTestnetConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  autoTradeEnabled: boolean;
  notionalUsd: number;
  minTopsisScore: number;
  maxLeverage: number;
}

const cleanKey = (val?: string) => (val ? val.trim().replace(/^["']|["']$/g, '').trim() : '');

export class BybitTestnetService {
  private config: BybitTestnetConfig;
  private recentOrders: BybitOrderResult[] = [];
  private lastKnownBalance: BybitWalletBalance | null = null;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor() {
    this.config = {
      apiKey: cleanKey(process.env.BYBIT_TESTNET_API_KEY || process.env.BYBIT_API_KEY),
      apiSecret: cleanKey(process.env.BYBIT_TESTNET_API_SECRET || process.env.BYBIT_API_SECRET || process.env.BYBIT_API_SECRETS),
      baseUrl: cleanKey(process.env.BYBIT_TESTNET_BASE_URL) || 'https://api-testnet.bybit.com',
      autoTradeEnabled: process.env.BYBIT_TESTNET_AUTO_TRADE === 'true',
      notionalUsd: parseFloat(process.env.BYBIT_TESTNET_NOTIONAL_USD || '100.0'),
      minTopsisScore: 0.9400,
      maxLeverage: 10,
    };
  }

  public updateConfig(updates: Partial<BybitTestnetConfig>) {
    if (updates.apiKey !== undefined) updates.apiKey = cleanKey(updates.apiKey);
    if (updates.apiSecret !== undefined) updates.apiSecret = cleanKey(updates.apiSecret);
    if (updates.baseUrl !== undefined) updates.baseUrl = cleanKey(updates.baseUrl);
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): Omit<BybitTestnetConfig, 'apiSecret'> & { hasSecret: boolean } {
    return {
      apiKey: this.config.apiKey ? `${this.config.apiKey.slice(0, 4)}...${this.config.apiKey.slice(-4)}` : '',
      hasSecret: Boolean(this.config.apiSecret),
      baseUrl: this.config.baseUrl,
      autoTradeEnabled: this.config.autoTradeEnabled,
      notionalUsd: this.config.notionalUsd,
      minTopsisScore: this.config.minTopsisScore,
      maxLeverage: this.config.maxLeverage,
    };
  }

  /**
   * Generates Bybit V5 HMAC-SHA256 signature
   * Signature = HMAC_SHA256(secret, timestamp + apiKey + recvWindow + (queryString or body))
   */
  private generateSignature(timestamp: string, payload: string = ''): string {
    const recvWindow = '5000';
    const signPayload = `${timestamp}${this.config.apiKey}${recvWindow}${payload}`;
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(signPayload)
      .digest('hex');
  }

  private async requestV5<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    paramsOrBody: Record<string, any> = {}
  ): Promise<{ ok: boolean; data?: T; retCode?: number; retMsg?: string; error?: string }> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      this.lastError = 'Bybit Testnet API key or secret missing';
      return { ok: false, error: this.lastError };
    }

    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    let url = `${this.config.baseUrl}${endpoint}`;
    let bodyStr = '';
    let queryString = '';

    if (method === 'GET') {
      const qs = new URLSearchParams();
      Object.entries(paramsOrBody).forEach(([k, v]) => {
        if (v !== undefined && v !== null) qs.append(k, String(v));
      });
      queryString = qs.toString();
      if (queryString) url += `?${queryString}`;
    } else {
      bodyStr = JSON.stringify(paramsOrBody);
    }

    const signature = this.generateSignature(timestamp, method === 'GET' ? queryString : bodyStr);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': this.config.apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'X-BAPI-RECV-WINDOW': recvWindow,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? bodyStr : undefined,
      });

      const text = await response.text();
      if (!text || !text.trim()) {
        this.lastError = `Bybit Testnet returned empty response (HTTP ${response.status})`;
        return { ok: false, error: this.lastError };
      }

      const json = JSON.parse(text);
      if (json.retCode === 0) {
        this.isConnected = true;
        this.lastError = null;
        return { ok: true, data: json.result as T, retCode: json.retCode, retMsg: json.retMsg };
      } else {
        this.lastError = `Bybit V5 Error (${json.retCode}): ${json.retMsg}`;
        if (json.retCode === 10003) {
          this.isConnected = false;
        }
        return { ok: false, retCode: json.retCode, retMsg: json.retMsg, error: this.lastError };
      }
    } catch (err: any) {
      this.lastError = `Network error connecting to Bybit Testnet: ${err?.message}`;
      this.isConnected = false;
      return { ok: false, error: this.lastError };
    }
  }

  /**
   * Fetches Unified Trading Account wallet balance
   */
  public async getWalletBalance(): Promise<BybitWalletBalance | null> {
    const res = await this.requestV5<any>('/v5/account/wallet-balance', 'GET', { accountType: 'UNIFIED' });
    if (!res.ok || !res.data?.list?.[0]) {
      return this.lastKnownBalance;
    }

    const acc = res.data.list[0];
    const usdtCoin = (acc.coin || []).find((c: any) => c.coin === 'USDT');

    const balance: BybitWalletBalance = {
      totalEquity: parseFloat(acc.totalEquity || '0'),
      marginBalance: parseFloat(acc.totalMarginBalance || '0'),
      availableBalance: parseFloat(acc.totalAvailableBalance || '0'),
      unrealizedPnl: parseFloat(acc.totalPerpUPL || '0'),
      usdtBalance: parseFloat(usdtCoin?.walletBalance || '0'),
      accountType: acc.accountType || 'UNIFIED',
      updatedAt: new Date().toISOString(),
    };

    this.lastKnownBalance = balance;
    return balance;
  }

  /**
   * Fetches live open linear positions
   */
  public async getOpenPositions(): Promise<BybitPosition[]> {
    const res = await this.requestV5<any>('/v5/position/list', 'GET', {
      category: 'linear',
      settleCoin: 'USDT',
    });

    if (!res.ok || !res.data?.list) {
      return [];
    }

    return res.data.list
      .filter((p: any) => parseFloat(p.size || '0') > 0)
      .map((p: any) => {
        const size = parseFloat(p.size);
        const entryPrice = parseFloat(p.avgPrice || '0');
        const markPrice = parseFloat(p.markPrice || '0');
        const unrealisedPnl = parseFloat(p.unrealisedPnl || '0');
        const initialMargin = (size * entryPrice) / (parseFloat(p.leverage || '1') || 1);
        const pnlPct = initialMargin > 0 ? (unrealisedPnl / initialMargin) * 100 : 0;

        return {
          symbol: p.symbol,
          side: p.side as 'Buy' | 'Sell',
          size,
          entryPrice,
          markPrice,
          liqPrice: parseFloat(p.liqPrice || '0'),
          leverage: parseFloat(p.leverage || '10'),
          unrealisedPnl,
          pnlPct: Number(pnlPct.toFixed(2)),
          takeProfit: p.takeProfit ? parseFloat(p.takeProfit) : undefined,
          stopLoss: p.stopLoss ? parseFloat(p.stopLoss) : undefined,
          updatedTime: new Date(parseInt(p.updatedTime || '0')).toISOString(),
        };
      });
  }

  /**
   * Dispatches an order with atomic TP/SL bracket from a SigmaLui SuperSignal
   */
  public async executeSignal(signal: SuperSignal): Promise<{ ok: boolean; order?: BybitOrderResult; reason?: string }> {
    const symbol = `${signal.asset.toUpperCase()}USDT`;
    const side: 'Buy' | 'Sell' = signal.action === 'STRONG_BUY' || signal.action === 'BUY' ? 'Buy' : 'Sell';
    const markPrice = signal.entryPrice;

    if (!markPrice || markPrice <= 0) {
      return { ok: false, reason: `Invalid entry price for ${symbol}` };
    }

    // Calculate contract quantity from notional USD
    let qty = this.config.notionalUsd / markPrice;
    // Format precision based on price scale
    let qtyStr: string;
    if (markPrice > 1000) {
      qtyStr = qty.toFixed(3); // e.g. BTC, ETH
    } else if (markPrice > 10) {
      qtyStr = qty.toFixed(2); // e.g. SOL, TAO
    } else if (markPrice > 1) {
      qtyStr = qty.toFixed(1); // e.g. NEAR, ADA
    } else {
      qtyStr = Math.round(qty).toString(); // e.g. DOGE
    }

    if (parseFloat(qtyStr) <= 0) {
      qtyStr = markPrice > 1000 ? '0.001' : '1';
    }

    const payload: Record<string, any> = {
      category: 'linear',
      symbol,
      side,
      orderType: 'Market',
      qty: qtyStr,
      timeInForce: 'IOC',
      positionIdx: 0, // One-Way Mode
      takeProfit: signal.target1.toString(),
      stopLoss: signal.stopLoss.toString(),
      tpTriggerBy: 'MarkPrice',
      slTriggerBy: 'MarkPrice',
      tpslMode: 'Full',
      orderLinkId: `SIG-${signal.asset}-${Date.now()}`.slice(0, 36),
    };

    const res = await this.requestV5<any>('/v5/order/create', 'POST', payload);

    if (res.ok && res.data) {
      const orderRes: BybitOrderResult = {
        orderId: res.data.orderId,
        orderLinkId: res.data.orderLinkId || payload.orderLinkId,
        symbol,
        side,
        orderType: 'Market',
        price: markPrice,
        qty: parseFloat(qtyStr),
        takeProfit: signal.target1,
        stopLoss: signal.stopLoss,
        status: 'SUBMITTED',
        createdTime: new Date().toISOString(),
      };

      this.recentOrders.unshift(orderRes);
      if (this.recentOrders.length > 50) this.recentOrders.pop();

      return { ok: true, order: orderRes };
    }

    return { ok: false, reason: res.error || res.retMsg || 'Failed to place Bybit order' };
  }

  /**
   * Closes an open position at Market
   */
  public async closePosition(symbol: string, side: 'Buy' | 'Sell', size: number): Promise<{ ok: boolean; reason?: string }> {
    const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
    const payload = {
      category: 'linear',
      symbol,
      side: closeSide,
      orderType: 'Market',
      qty: size.toString(),
      reduceOnly: true,
      timeInForce: 'IOC',
      positionIdx: 0,
    };

    const res = await this.requestV5<any>('/v5/order/create', 'POST', payload);
    return { ok: res.ok, reason: res.error || res.retMsg };
  }

  public getRecentOrders(): BybitOrderResult[] {
    return this.recentOrders;
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      lastError: this.lastError,
      config: this.getConfig(),
      balance: this.lastKnownBalance,
      recentOrdersCount: this.recentOrders.length,
    };
  }
}

export const bybitTestnetService = new BybitTestnetService();
