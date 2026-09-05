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

export interface InstrumentFilter {
  minOrderQty: string;
  qtyStep: string;
  maxOrderQty?: string;
  minNotionalValue?: string;
  tickSize: string;
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
  private instrumentFilters: Map<string, InstrumentFilter> = new Map();
  private lastInstrumentFetch: number = 0;

  constructor() {
    this.config = {
      apiKey: cleanKey(process.env.BYBIT_TESTNET_API_KEY || process.env.BYBIT_API_KEY),
      apiSecret: cleanKey(process.env.BYBIT_TESTNET_API_SECRET || process.env.BYBIT_API_SECRET || process.env.BYBIT_API_SECRETS),
      baseUrl: cleanKey(process.env.BYBIT_TESTNET_BASE_URL) || 'https://api-demo-testnet.bybit.com',
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
    paramsOrBody: Record<string, any> = {},
    hasRetriedAlternativeHost: boolean = false
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
        // If API key is invalid (10003), attempt auto-failover between api-demo-testnet and api-testnet
        if (json.retCode === 10003 && !hasRetriedAlternativeHost) {
          const altHost = this.config.baseUrl.includes('api-demo-testnet')
            ? 'https://api-testnet.bybit.com'
            : 'https://api-demo-testnet.bybit.com';
          const prevHost = this.config.baseUrl;
          this.config.baseUrl = altHost;
          const retryRes = await this.requestV5<T>(endpoint, method, paramsOrBody, true);
          if (retryRes.ok) {
            return retryRes;
          }
          // If alt host also failed, restore original
          this.config.baseUrl = prevHost;
        }

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
   * Loads and caches Bybit linear instrument specifications (lotSizeFilter and priceFilter)
   */
  public async loadInstrumentFilters(): Promise<void> {
    const now = Date.now();
    if (this.instrumentFilters.size > 0 && now - this.lastInstrumentFetch < 3600000) {
      return;
    }

    try {
      const url = `${this.config.baseUrl}/v5/market/instruments-info?category=linear&limit=1000`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.retCode === 0 && Array.isArray(json.result?.list)) {
          for (const item of json.result.list) {
            if (item.symbol && item.lotSizeFilter) {
              this.instrumentFilters.set(item.symbol, {
                minOrderQty: item.lotSizeFilter.minOrderQty || '0.001',
                qtyStep: item.lotSizeFilter.qtyStep || '0.001',
                maxOrderQty: item.lotSizeFilter.maxOrderQty,
                minNotionalValue: item.lotSizeFilter.minNotionalValue || '5',
                tickSize: item.priceFilter?.tickSize || '0.01',
              });
            }
          }
          this.lastInstrumentFetch = now;
        }
      }
    } catch (err) {
      console.warn('[BybitTestnetService] Failed to load instrument filters:', err);
    }
  }

  private quantizeQty(
    val: number,
    stepStr: string,
    minQtyStr?: string
  ): { qtyStr: string; isRefused: boolean; reason?: string } {
    const step = parseFloat(stepStr) || 0.001;
    const minQty = minQtyStr ? parseFloat(minQtyStr) : step;
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;

    // Strict floor to never exceed requested notional
    const stepped = Math.floor((val + 1e-12) / step) * step;

    if (stepped <= 0 || stepped < minQty) {
      return {
        qtyStr: '0',
        isRefused: true,
        reason: `Refused: notional yields ${val.toFixed(4)}, which falls below minimum contract step ${minQtyStr || stepStr}`,
      };
    }

    return {
      qtyStr: stepped.toFixed(decimals),
      isRefused: false,
    };
  }

  /**
   * Quantizes TP/SL brackets conservatively so quantization NEVER widens risk:
   * - Stop loss rounds TOWARD entry (strictly tightens stop, reducing max dollar risk)
   * - Take profit rounds AWAY from entry (ensures full profit target capture)
   */
  private quantizeBracket(
    price: number,
    side: 'Buy' | 'Sell',
    isStopLoss: boolean,
    tickSizeStr: string
  ): string {
    const tick = parseFloat(tickSizeStr) || 0.01;
    const decimals = tickSizeStr.includes('.') ? tickSizeStr.split('.')[1].length : 2;

    let stepped: number;
    if (side === 'Buy') {
      // Long position: Stop is below entry, TP is above entry
      if (isStopLoss) {
        // Round UP toward entry (tighter stop, less risk)
        stepped = Math.ceil((price - 1e-12) / tick) * tick;
      } else {
        // Round UP away from entry (full target)
        stepped = Math.ceil((price - 1e-12) / tick) * tick;
      }
    } else {
      // Short position: Stop is above entry, TP is below entry
      if (isStopLoss) {
        // Round DOWN toward entry (tighter stop, less risk)
        stepped = Math.floor((price + 1e-12) / tick) * tick;
      } else {
        // Round DOWN away from entry (full target)
        stepped = Math.floor((price + 1e-12) / tick) * tick;
      }
    }
    return stepped.toFixed(decimals);
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

    await this.loadInstrumentFilters();

    const filter = this.instrumentFilters.get(symbol);
    const qtyStepStr = filter?.qtyStep || (markPrice > 1000 ? '0.001' : markPrice > 100 ? '0.01' : markPrice > 10 ? '0.1' : '1');
    const minQtyStr = filter?.minOrderQty || qtyStepStr;
    const tickSizeStr = filter?.tickSize || (markPrice > 1000 ? '0.10' : markPrice > 10 ? '0.01' : '0.0001');

    // Calculate contract quantity from notional USD and quantize strictly to Bybit step
    const rawQty = this.config.notionalUsd / markPrice;
    const { qtyStr, isRefused, reason: refusalReason } = this.quantizeQty(rawQty, qtyStepStr, minQtyStr);

    if (isRefused) {
      return { ok: false, reason: refusalReason };
    }

    // Directional quantization for TP/SL: Stop is rounded toward entry (safest risk boundary)
    const tpStr = this.quantizeBracket(signal.target1, side, false, tickSizeStr);
    const slStr = this.quantizeBracket(signal.stopLoss, side, true, tickSizeStr);

    const payload: Record<string, any> = {
      category: 'linear',
      symbol,
      side,
      orderType: 'Market',
      qty: qtyStr,
      timeInForce: 'IOC',
      positionIdx: 0, // One-Way Mode
      takeProfit: tpStr,
      stopLoss: slStr,
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
        takeProfit: parseFloat(tpStr),
        stopLoss: parseFloat(slStr),
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
    await this.loadInstrumentFilters();
    const filter = this.instrumentFilters.get(symbol);
    const qtyStepStr = filter?.qtyStep || '0.001';
    const { qtyStr } = this.quantizeQty(size, qtyStepStr);

    const closeSide = side === 'Buy' ? 'Sell' : 'Buy';
    const payload = {
      category: 'linear',
      symbol,
      side: closeSide,
      orderType: 'Market',
      qty: qtyStr,
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
