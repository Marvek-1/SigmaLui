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

export type BybitCandleTimeframe =
  | '1'
  | '3'
  | '5'
  | '15'
  | '30'
  | '60'
  | '120'
  | '240'
  | '360'
  | '720'
  | 'D'
  | 'W'
  | 'M';

export type BybitInterval = BybitCandleTimeframe;

export interface BybitOHLCVCandle {
  startTime: number;
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export type BybitCandle = BybitOHLCVCandle;

export interface KDJIndicator {
  period: number;
  kSmoothing?: number;
  dSmoothing?: number;
  k: number;
  d: number;
  j: number;
  previousK: number;
  previousD: number;
  cross:
    | 'GOLDEN_CROSS'
    | 'DEATH_CROSS'
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';
  signal:
    | 'GOLDEN_CROSS'
    | 'DEATH_CROSS'
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';
  zone:
    | 'OVERSOLD'
    | 'OVERBOUGHT'
    | 'NEUTRAL';
}

export type KDJResult = KDJIndicator;

export interface RSIIndicator {
  period: number;
  value: number;
  previous: number;
  state:
    | 'OVERSOLD'
    | 'OVERBOUGHT'
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';
}

export type RSIResult = RSIIndicator;

export interface MACDIndicator {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  macd: number;
  signal: number;
  histogram: number;
  previousMacd: number;
  previousSignal: number;
  previousHistogram: number;
  cross:
    | 'BULLISH_CROSS'
    | 'BEARISH_CROSS'
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';
  state:
    | 'BULLISH_CROSS'
    | 'BEARISH_CROSS'
    | 'BULLISH'
    | 'BEARISH'
    | 'NEUTRAL';
}

export type MACDResult = MACDIndicator;

export interface BollingerIndicator {
  period: number;
  standardDeviations: number;
  deviation?: number;
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
  position:
    | 'ABOVE_UPPER'
    | 'NEAR_UPPER'
    | 'MIDDLE'
    | 'NEAR_LOWER'
    | 'BELOW_LOWER';
  state:
    | 'ABOVE_UPPER'
    | 'NEAR_UPPER'
    | 'MIDDLE'
    | 'NEAR_LOWER'
    | 'BELOW_LOWER';
}

export type BollingerResult = BollingerIndicator;

export interface MarketIndicatorSnapshot {
  symbol: string;
  timeframe: BybitCandleTimeframe;
  candleCount: number;

  latestCandle: BybitOHLCVCandle;
  latest?: BybitCandle;
  closedCandlesOnly?: true;

  kdj: KDJIndicator;
  rsi: RSIIndicator;
  macd: MACDIndicator;
  bollinger: BollingerIndicator;

  generatedAt: string;
  source: 'BYBIT_V5';
}

export type MarketAnalysisSnapshot = MarketIndicatorSnapshot;

export interface MultiTimeframeAnalysis {
  symbol: string;

  timeframes: Partial<
    Record<BybitCandleTimeframe, MarketIndicatorSnapshot>
  >;

  generatedAt: string;
}

function roundTA(value: number, digits = 8): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const cleanKey = (val?: string) => (val ? val.trim().replace(/^["']|["']$/g, '').trim() : '');

function roundIndicator(value: number, decimals = 6): number {
  if (!Number.isFinite(value)) return 0;

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function simpleMovingAverage(values: number[]): number {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateEMA(values: number[], period: number): number[] {
  if (period <= 0) {
    throw new Error('EMA period must be greater than zero');
  }

  if (values.length < period) {
    throw new Error(
      `Not enough data for EMA(${period}). Received ${values.length} values`
    );
  }

  const multiplier = 2 / (period + 1);

  const result: number[] = new Array(values.length).fill(NaN);

  // Seed the EMA with an SMA of the first `period` observations.
  const seed = simpleMovingAverage(values.slice(0, period));

  result[period - 1] = seed;

  let previous = seed;

  for (let i = period; i < values.length; i++) {
    const current =
      (values[i] - previous) * multiplier + previous;

    result[i] = current;
    previous = current;
  }

  return result;
}

function calculateRSISeries(
  closes: number[],
  period = 14
): number[] {
  if (closes.length < period + 1) {
    throw new Error(
      `Not enough candles for RSI(${period}). ` +
      `Need at least ${period + 1}, received ${closes.length}`
    );
  }

  const result: number[] =
    new Array(closes.length).fill(NaN);

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1];

    if (delta >= 0) {
      gainSum += delta;
    } else {
      lossSum += Math.abs(delta);
    }
  }

  let averageGain = gainSum / period;
  let averageLoss = lossSum / period;

  const firstRs =
    averageLoss === 0
      ? Infinity
      : averageGain / averageLoss;

  result[period] =
    averageLoss === 0
      ? 100
      : 100 - 100 / (1 + firstRs);

  // Wilder smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];

    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    averageGain =
      (averageGain * (period - 1) + gain) / period;

    averageLoss =
      (averageLoss * (period - 1) + loss) / period;

    if (averageLoss === 0) {
      result[i] = 100;
      continue;
    }

    const rs = averageGain / averageLoss;

    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}

function calculateKDJSeries(
  candles: BybitOHLCVCandle[],
  period = 9,
  kSmoothing = 3,
  dSmoothing = 3
): Array<{ k: number; d: number; j: number }> {
  if (candles.length < period) {
    throw new Error(
      `Not enough candles for KDJ(${period}). ` +
      `Received ${candles.length}`
    );
  }

  let previousK = 50;
  let previousD = 50;

  const result: Array<{
    k: number;
    d: number;
    j: number;
  }> = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push({
        k: NaN,
        d: NaN,
        j: NaN,
      });

      continue;
    }

    const window = candles.slice(
      i - period + 1,
      i + 1
    );

    const highestHigh = Math.max(
      ...window.map(candle => candle.high)
    );

    const lowestLow = Math.min(
      ...window.map(candle => candle.low)
    );

    const denominator = highestHigh - lowestLow;

    const rsv =
      denominator === 0
        ? 50
        : ((candles[i].close - lowestLow) /
            denominator) *
          100;

    /*
     * Standard KDJ smoothing:
     * K = previousK * (kSmooth - 1) / kSmooth
     *     + RSV / kSmooth
     *
     * D = previousD * (dSmooth - 1) / dSmooth
     *     + K / dSmooth
     */

    const k =
      previousK * ((kSmoothing - 1) / kSmoothing) +
      rsv / kSmoothing;

    const d =
      previousD * ((dSmoothing - 1) / dSmoothing) +
      k / dSmoothing;

    const j = 3 * k - 2 * d;

    result.push({ k, d, j });

    previousK = k;
    previousD = d;
  }

  return result;
}

function standardDeviation(values: number[]): number {
  if (!values.length) return 0;

  const mean = simpleMovingAverage(values);

  const variance =
    values.reduce((sum, value) => {
      const diff = value - mean;
      return sum + diff * diff;
    }, 0) / values.length;

  return Math.sqrt(variance);
}

export class BybitTestnetService {
  private config: BybitTestnetConfig;
  private recentOrders: BybitOrderResult[] = [];
  private lastKnownBalance: BybitWalletBalance | null = null;
  private isConnected: boolean = false;
  private lastError: string | null = null;
  private instrumentFilters: Map<string, InstrumentFilter> = new Map();
  private lastInstrumentFetch: number = 0;
  private marketAnalysisCache: Map<
    string,
    {
      expiresAt: number;
      snapshot: MarketIndicatorSnapshot;
    }
  > = new Map();

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
   * Fetches real-time markPrice for a linear symbol directly from Bybit
   */
  public async getMarkPrice(symbol: string): Promise<number | null> {
    try {
      const res = await fetch(`${this.config.baseUrl}/v5/market/tickers?category=linear&symbol=${symbol}`);
      if (res.ok) {
        const json = await res.json();
        const item = json.result?.list?.[0];
        const mark = parseFloat(item?.markPrice || item?.lastPrice || '0');
        if (mark > 0) return mark;
      }
    } catch (err) {
      console.warn(`[BybitTestnetService] Failed to fetch live mark price for ${symbol}:`, err);
    }
    return null;
  }

  /**
   * Dispatches an order with atomic TP/SL bracket from a SigmaLui SuperSignal.
   * Dynamically anchors execution price, sizing, and brackets to Bybit's live mark price
   * to eliminate cross-venue basis discrepancies (e.g. Binance vs Bybit Testnet basis).
   */
  public async executeSignal(signal: SuperSignal): Promise<{ ok: boolean; order?: BybitOrderResult; reason?: string }> {
    const symbol = `${signal.asset.toUpperCase()}USDT`;
    const side: 'Buy' | 'Sell' = signal.action === 'STRONG_BUY' || signal.action === 'BUY' ? 'Buy' : 'Sell';

    // 0. Bybit Fractal Technical Confirmation Gate (5m KDJ + 1h RSI/MACD + 4h RSI/MACD)
    try {
      const technicals = await this.getFractalMarketAnalysis(symbol);
      const m5 = technicals.timeframes['5m'];
      const h1 = technicals.timeframes['1h'];
      const h4 = technicals.timeframes['4h'];

      if (m5 && h1 && h4) {
        const longConfirmation =
          (h1.macd.state === 'BULLISH' || h1.macd.state === 'BULLISH_CROSS') &&
          h1.rsi.value >= 50 &&
          (m5.kdj.signal === 'GOLDEN_CROSS' || m5.kdj.signal === 'BULLISH') &&
          h4.rsi.value >= 45 &&
          h4.macd.state !== 'BEARISH_CROSS';

        const shortConfirmation =
          (h1.macd.state === 'BEARISH' || h1.macd.state === 'BEARISH_CROSS') &&
          h1.rsi.value <= 50 &&
          (m5.kdj.signal === 'DEATH_CROSS' || m5.kdj.signal === 'BEARISH') &&
          h4.rsi.value <= 55 &&
          h4.macd.state !== 'BULLISH_CROSS';

        if (side === 'Buy' && !longConfirmation) {
          return {
            ok: false,
            reason:
              `Bybit technical confirmation rejected LONG ${symbol}: ` +
              `5m KDJ=${m5.kdj.signal}, ` +
              `1h RSI=${h1.rsi.value}, ` +
              `1h MACD=${h1.macd.state}, ` +
              `4h MACD=${h4.macd.state}`,
          };
        }

        if (side === 'Sell' && !shortConfirmation) {
          return {
            ok: false,
            reason:
              `Bybit technical confirmation rejected SHORT ${symbol}: ` +
              `5m KDJ=${m5.kdj.signal}, ` +
              `1h RSI=${h1.rsi.value}, ` +
              `1h MACD=${h1.macd.state}, ` +
              `4h MACD=${h4.macd.state}`,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[BybitTestnetService] Fractal technical confirmation check skipped for ${symbol}:`, err?.message);
    }

    // 1. Fetch Bybit's real-time mark price for exact on-venue anchoring
    const bybitLivePrice = await this.getMarkPrice(symbol);
    const executionPrice = bybitLivePrice && bybitLivePrice > 0 ? bybitLivePrice : signal.entryPrice;

    if (!executionPrice || executionPrice <= 0) {
      return { ok: false, reason: `Invalid entry price for ${symbol}` };
    }

    await this.loadInstrumentFilters();

    const filter = this.instrumentFilters.get(symbol);
    const qtyStepStr = filter?.qtyStep || (executionPrice > 1000 ? '0.001' : executionPrice > 100 ? '0.01' : executionPrice > 10 ? '0.1' : '1');
    const minQtyStr = filter?.minOrderQty || qtyStepStr;
    const tickSizeStr = filter?.tickSize || (executionPrice > 1000 ? '0.10' : executionPrice > 10 ? '0.01' : '0.0001');

    // 2. Compute signal risk/reward percentages relative to signal entry price
    const signalRefPrice = signal.entryPrice > 0 ? signal.entryPrice : executionPrice;
    let targetPct: number;
    let stopPct: number;

    if (side === 'Buy') {
      targetPct = signal.target1 > signalRefPrice ? (signal.target1 - signalRefPrice) / signalRefPrice : 0.024;
      stopPct = signal.stopLoss < signalRefPrice ? (signalRefPrice - signal.stopLoss) / signalRefPrice : 0.012;
    } else {
      targetPct = signal.target1 < signalRefPrice ? (signalRefPrice - signal.target1) / signalRefPrice : 0.024;
      stopPct = signal.stopLoss > signalRefPrice ? (signal.stopLoss - signalRefPrice) / signalRefPrice : 0.012;
    }

    // Bound stop and target to sane risk parameters (0.2% to 15% stop, 0.4% to 30% target)
    stopPct = Math.max(0.002, Math.min(0.15, stopPct));
    targetPct = Math.max(0.004, Math.min(0.30, targetPct));

    // 3. Anchor TP/SL strictly to Bybit's actual market price at execution time
    const rawTarget = side === 'Buy' ? executionPrice * (1 + targetPct) : executionPrice * (1 - targetPct);
    const rawStop = side === 'Buy' ? executionPrice * (1 - stopPct) : executionPrice * (1 + stopPct);

    // Directional quantization: stop rounds toward entry (strictly minimizes dollar loss)
    const tpStr = this.quantizeBracket(rawTarget, side, false, tickSizeStr);
    const slStr = this.quantizeBracket(rawStop, side, true, tickSizeStr);
    const finalTp = parseFloat(tpStr);
    const finalSl = parseFloat(slStr);

    // 4. Mathematical Invariant Verification: Prevent any inverted TP/SL submission to Bybit
    if (side === 'Buy') {
      if (finalSl >= executionPrice) {
        return {
          ok: false,
          reason: `Safety Invariant: Buy stop loss ($${finalSl}) must be lower than Bybit mark price ($${executionPrice})`,
        };
      }
      if (finalTp <= executionPrice) {
        return {
          ok: false,
          reason: `Safety Invariant: Buy take profit ($${finalTp}) must be higher than Bybit mark price ($${executionPrice})`,
        };
      }
    } else {
      if (finalSl <= executionPrice) {
        return {
          ok: false,
          reason: `Safety Invariant: Sell stop loss ($${finalSl}) must be higher than Bybit mark price ($${executionPrice})`,
        };
      }
      if (finalTp >= executionPrice) {
        return {
          ok: false,
          reason: `Safety Invariant: Sell take profit ($${finalTp}) must be lower than Bybit mark price ($${executionPrice})`,
        };
      }
    }

    // 5. Size position using Bybit's actual contract mark price
    const rawQty = this.config.notionalUsd / executionPrice;
    const { qtyStr, isRefused, reason: refusalReason } = this.quantizeQty(rawQty, qtyStepStr, minQtyStr);

    if (isRefused) {
      return { ok: false, reason: refusalReason };
    }

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
        price: executionPrice,
        qty: parseFloat(qtyStr),
        takeProfit: finalTp,
        stopLoss: finalSl,
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

  /**
   * Retrieves real OHLCV candles directly from Bybit V5.
   *
   * Bybit returns candles newest -> oldest.
   * This function converts them to oldest -> newest,
   * which is required for technical indicator calculations.
   */
  public async getKlines(
    symbol: string,
    timeframe: BybitCandleTimeframe = '60',
    limit = 300,
    closedCandlesOnly = true
  ): Promise<BybitOHLCVCandle[]> {
    const normalizedSymbol = symbol
      .trim()
      .toUpperCase();

    const safeLimit = Math.max(
      20,
      Math.min(1000, Math.floor(limit))
    );

    /*
     * Request one extra candle because the newest candle
     * is normally the still-forming/live candle.
     */
    const requestLimit =
      closedCandlesOnly
        ? Math.min(1000, safeLimit + 1)
        : safeLimit;

    const qs = new URLSearchParams({
      category: 'linear',
      symbol: normalizedSymbol,
      interval: timeframe,
      limit: String(requestLimit),
    });

    const url =
      `${this.config.baseUrl}/v5/market/kline?${qs.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Bybit Kline HTTP ${response.status}: ` +
          `${response.statusText}`
        );
      }

      const json = await response.json();

      if (json.retCode !== 0) {
        throw new Error(
          `Bybit Kline Error (${json.retCode}): ` +
          `${json.retMsg}`
        );
      }

      if (!Array.isArray(json.result?.list)) {
        throw new Error(
          `Invalid Bybit Kline response for ${normalizedSymbol}`
        );
      }

      const candles: BybitOHLCVCandle[] =
        json.result.list
          .map((row: string[]) => {
            const startTime = Number(row[0]);

            return {
              startTime,
              openTime: new Date(startTime).toISOString(),
              open: Number(row[1]),
              high: Number(row[2]),
              low: Number(row[3]),
              close: Number(row[4]),
              volume: Number(row[5]),
              turnover: Number(row[6]),
            };
          })
          .filter((candle: BybitOHLCVCandle) => {
            return (
              Number.isFinite(candle.startTime) &&
              Number.isFinite(candle.open) &&
              Number.isFinite(candle.high) &&
              Number.isFinite(candle.low) &&
              Number.isFinite(candle.close) &&
              candle.open > 0 &&
              candle.high > 0 &&
              candle.low > 0 &&
              candle.close > 0
            );
          })
          .sort(
            (
              a: BybitOHLCVCandle,
              b: BybitOHLCVCandle
            ) => a.startTime - b.startTime
          );

      /*
       * Bybit's newest candle is usually still forming.
       *
       * Strategies should normally evaluate completed
       * candles so indicators do not repaint while an
       * order decision is being made.
       */
      if (closedCandlesOnly && candles.length > 1) {
        candles.pop();
      }

      return candles.slice(-safeLimit);
    } catch (err: any) {
      console.error(
        `[BybitTestnetService] Kline fetch failed ` +
          `${normalizedSymbol} ${timeframe}:`,
        err
      );

      throw err;
    }
  }

  public calculateRSI(
    candles: BybitOHLCVCandle[],
    period = 14
  ): RSIIndicator {
    const closes = candles.map(c => c.close);

    const series = calculateRSISeries(
      closes,
      period
    );

    const validValues = series.filter(
      value => Number.isFinite(value)
    );

    if (validValues.length < 2) {
      throw new Error(
        `Unable to calculate stable RSI(${period})`
      );
    }

    const value =
      validValues[validValues.length - 1];

    const previous =
      validValues[validValues.length - 2];

    let state: RSIIndicator['state'];

    if (value >= 70) {
      state = 'OVERBOUGHT';
    } else if (value <= 30) {
      state = 'OVERSOLD';
    } else if (value > 55) {
      state = 'BULLISH';
    } else if (value < 45) {
      state = 'BEARISH';
    } else {
      state = 'NEUTRAL';
    }

    return {
      period,
      value: roundIndicator(value),
      previous: roundIndicator(previous),
      state,
    };
  }

  public calculateKDJ(
    candles: BybitOHLCVCandle[],
    period = 9,
    kSmoothing = 3,
    dSmoothing = 3
  ): KDJIndicator {
    const series = calculateKDJSeries(
      candles,
      period,
      kSmoothing,
      dSmoothing
    ).filter(
      value =>
        Number.isFinite(value.k) &&
        Number.isFinite(value.d)
    );

    if (series.length < 2) {
      throw new Error(
        `Unable to calculate stable KDJ(${period},` +
          `${kSmoothing},${dSmoothing})`
      );
    }

    const current =
      series[series.length - 1];

    const previous =
      series[series.length - 2];

    let cross: KDJIndicator['cross'];

    if (
      previous.k <= previous.d &&
      current.k > current.d
    ) {
      cross = 'GOLDEN_CROSS';
    } else if (
      previous.k >= previous.d &&
      current.k < current.d
    ) {
      cross = 'DEATH_CROSS';
    } else if (current.k > current.d) {
      cross = 'BULLISH';
    } else if (current.k < current.d) {
      cross = 'BEARISH';
    } else {
      cross = 'NEUTRAL';
    }

    let zone: KDJIndicator['zone'];

    if (current.k >= 80 && current.d >= 80) {
      zone = 'OVERBOUGHT';
    } else if (
      current.k <= 20 &&
      current.d <= 20
    ) {
      zone = 'OVERSOLD';
    } else {
      zone = 'NEUTRAL';
    }

    return {
      period,
      kSmoothing,
      dSmoothing,

      k: roundIndicator(current.k),
      d: roundIndicator(current.d),
      j: roundIndicator(current.j),

      previousK: roundIndicator(previous.k),
      previousD: roundIndicator(previous.d),

      cross,
      signal: cross,
      zone,
    };
  }

  public calculateMACD(
    candles: BybitOHLCVCandle[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): MACDIndicator {
    const closes =
      candles.map(candle => candle.close);

    if (
      closes.length <
      slowPeriod + signalPeriod + 2
    ) {
      throw new Error(
        `Not enough candles for MACD(` +
          `${fastPeriod},${slowPeriod},${signalPeriod}). ` +
          `Received ${closes.length}`
      );
    }

    const fastEma =
      calculateEMA(closes, fastPeriod);

    const slowEma =
      calculateEMA(closes, slowPeriod);

    const macdSeries: number[] = [];
    const sourceIndexes: number[] = [];

    for (
      let i = slowPeriod - 1;
      i < closes.length;
      i++
    ) {
      if (
        Number.isFinite(fastEma[i]) &&
        Number.isFinite(slowEma[i])
      ) {
        macdSeries.push(
          fastEma[i] - slowEma[i]
        );

        sourceIndexes.push(i);
      }
    }

    const signalSeries =
      calculateEMA(
        macdSeries,
        signalPeriod
      );

    const completed: Array<{
      macd: number;
      signal: number;
      histogram: number;
    }> = [];

    for (
      let i = 0;
      i < macdSeries.length;
      i++
    ) {
      if (!Number.isFinite(signalSeries[i])) {
        continue;
      }

      completed.push({
        macd: macdSeries[i],
        signal: signalSeries[i],
        histogram:
          macdSeries[i] - signalSeries[i],
      });
    }

    if (completed.length < 2) {
      throw new Error(
        'Unable to calculate stable MACD'
      );
    }

    const current =
      completed[completed.length - 1];

    const previous =
      completed[completed.length - 2];

    let cross: MACDIndicator['cross'];

    if (
      previous.macd <= previous.signal &&
      current.macd > current.signal
    ) {
      cross = 'BULLISH_CROSS';
    } else if (
      previous.macd >= previous.signal &&
      current.macd < current.signal
    ) {
      cross = 'BEARISH_CROSS';
    } else if (current.macd > current.signal) {
      cross = 'BULLISH';
    } else if (current.macd < current.signal) {
      cross = 'BEARISH';
    } else {
      cross = 'NEUTRAL';
    }

    return {
      fastPeriod,
      slowPeriod,
      signalPeriod,

      macd: roundIndicator(current.macd),
      signal: roundIndicator(current.signal),
      histogram:
        roundIndicator(current.histogram),

      previousMacd:
        roundIndicator(previous.macd),

      previousSignal:
        roundIndicator(previous.signal),

      previousHistogram:
        roundIndicator(previous.histogram),

      cross,
      state: cross,
    };
  }

  public calculateBollingerBands(
    candles: BybitOHLCVCandle[],
    period = 20,
    standardDeviations = 2
  ): BollingerIndicator {
    if (candles.length < period) {
      throw new Error(
        `Not enough candles for Bollinger(${period}). ` +
          `Received ${candles.length}`
      );
    }

    const closes =
      candles.map(candle => candle.close);

    const window =
      closes.slice(-period);

    const middle =
      simpleMovingAverage(window);

    const std =
      standardDeviation(window);

    const upper =
      middle + standardDeviations * std;

    const lower =
      middle - standardDeviations * std;

    const currentClose =
      closes[closes.length - 1];

    const width =
      upper - lower;

    const bandwidth =
      middle !== 0
        ? width / middle
        : 0;

    const percentB =
      width !== 0
        ? (currentClose - lower) / width
        : 0.5;

    let position:
      BollingerIndicator['position'];

    if (currentClose > upper) {
      position = 'ABOVE_UPPER';
    } else if (percentB >= 0.8) {
      position = 'NEAR_UPPER';
    } else if (currentClose < lower) {
      position = 'BELOW_LOWER';
    } else if (percentB <= 0.2) {
      position = 'NEAR_LOWER';
    } else {
      position = 'MIDDLE';
    }

    return {
      period,
      standardDeviations,
      deviation: standardDeviations,

      upper: roundIndicator(upper),
      middle: roundIndicator(middle),
      lower: roundIndicator(lower),

      bandwidth:
        roundIndicator(bandwidth),

      percentB:
        roundIndicator(percentB),

      position,
      state: position,
    };
  }

  /**
   * Fetches real Bybit OHLCV data and calculates
   * KDJ, RSI, MACD and Bollinger Bands.
   */
  public async getMarketIndicators(
    symbol: string,
    timeframe: BybitCandleTimeframe = '60',
    candleLimit = 300,
    useCache = true
  ): Promise<MarketIndicatorSnapshot> {
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const cacheKey =
      `${normalizedSymbol}:${timeframe}`;

    const now = Date.now();

    const cached =
      this.marketAnalysisCache.get(cacheKey);

    /*
     * Very short cache prevents duplicate Bybit
     * requests when dashboard + strategy engine
     * request the same market simultaneously.
     */
    if (
      useCache &&
      cached &&
      cached.expiresAt > now
    ) {
      return cached.snapshot;
    }

    const candles =
      await this.getKlines(
        normalizedSymbol,
        timeframe,
        Math.max(100, candleLimit),
        true
      );

    if (candles.length < 50) {
      throw new Error(
        `Insufficient closed candle history for ` +
          `${normalizedSymbol} ${timeframe}. ` +
          `Received ${candles.length}`
      );
    }

    const latestCandle =
      candles[candles.length - 1];

    const snapshot: MarketIndicatorSnapshot = {
      symbol: normalizedSymbol,
      timeframe,
      candleCount: candles.length,

      latestCandle,
      latest: latestCandle,
      closedCandlesOnly: true,

      kdj:
        this.calculateKDJ(
          candles,
          9,
          3,
          3
        ),

      rsi:
        this.calculateRSI(
          candles,
          14
        ),

      macd:
        this.calculateMACD(
          candles,
          12,
          26,
          9
        ),

      bollinger:
        this.calculateBollingerBands(
          candles,
          20,
          2
        ),

      generatedAt:
        new Date().toISOString(),

      source: 'BYBIT_V5',
    };

    this.marketAnalysisCache.set(
      cacheKey,
      {
        expiresAt: now + 5_000,
        snapshot,
      }
    );

    return snapshot;
  }

  public async getMultiTimeframeAnalysis(
    symbol: string,
    timeframes: BybitCandleTimeframe[] = [
      '5',
      '15',
      '60',
      '240',
      'D',
    ],
    candleLimit = 300
  ): Promise<MultiTimeframeAnalysis> {
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const results =
      await Promise.allSettled(
        timeframes.map(timeframe =>
          this.getMarketIndicators(
            normalizedSymbol,
            timeframe,
            candleLimit
          )
        )
      );

    const analysis:
      MultiTimeframeAnalysis = {
        symbol: normalizedSymbol,
        timeframes: {},
        generatedAt:
          new Date().toISOString(),
      };

    results.forEach((result, index) => {
      const timeframe = timeframes[index];

      if (result.status === 'fulfilled') {
        analysis.timeframes[timeframe] =
          result.value;
      } else {
        console.warn(
          `[BybitTestnetService] ` +
            `${normalizedSymbol} ${timeframe} ` +
            `analysis failed:`,
          result.reason
        );
      }
    });

    return analysis;
  }

  public calculateBollinger(
    candles: BybitOHLCVCandle[],
    period = 20,
    deviation = 2
  ): BollingerIndicator {
    return this.calculateBollingerBands(candles, period, deviation);
  }

  public async getMarketAnalysis(
    symbol: string,
    timeframe: BybitInterval = '15',
    history = 300
  ): Promise<MarketAnalysisSnapshot> {
    return this.getMarketIndicators(symbol, timeframe, history);
  }

  public async getFractalMarketAnalysis(symbol: string) {
    const normalizedSymbol = symbol.trim().toUpperCase();

    const [m5, h1, h4] = await Promise.all([
      this.getMarketAnalysis(normalizedSymbol, '5', 300),
      this.getMarketAnalysis(normalizedSymbol, '60', 300),
      this.getMarketAnalysis(normalizedSymbol, '240', 300),
    ]);

    return {
      symbol: normalizedSymbol,
      source: 'BYBIT_V5' as const,
      timeframes: {
        '5m': m5,
        '1h': h1,
        '4h': h4,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  public async getMarketHistory(
    symbol: string,
    timeframe: BybitCandleTimeframe = '60',
    limit = 300
  ): Promise<{
    symbol: string;
    timeframe: BybitCandleTimeframe;
    candleCount: number;
    candles: BybitOHLCVCandle[];
    source: 'BYBIT_V5';
    generatedAt: string;
  }> {
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const candles =
      await this.getKlines(
        normalizedSymbol,
        timeframe,
        limit,
        true
      );

    return {
      symbol: normalizedSymbol,
      timeframe,
      candleCount: candles.length,
      candles,
      source: 'BYBIT_V5',
      generatedAt:
        new Date().toISOString(),
    };
  }

  public getStatus() {
    return {
      isConnected: this.isConnected,
      lastError: this.lastError,
      config: this.getConfig(),
      balance: this.lastKnownBalance,
      recentOrdersCount: this.recentOrders.length,

      marketAnalysis: {
        enabled: true,
        source: 'BYBIT_V5',
        defaultCandleHistory: 300,

        indicators: {
          kdj: {
            period: 9,
            kSmoothing: 3,
            dSmoothing: 3,
          },

          rsi: {
            period: 14,
          },

          macd: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
          },

          bollinger: {
            period: 20,
            standardDeviations: 2,
          },
        },

        supportedTimeframes: [
          '1',
          '3',
          '5',
          '15',
          '30',
          '60',
          '120',
          '240',
          '360',
          '720',
          'D',
          'W',
          'M',
        ],
      },
    };
  }
}

export const bybitTestnetService = new BybitTestnetService();
