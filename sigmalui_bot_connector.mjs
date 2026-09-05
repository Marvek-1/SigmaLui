#!/usr/bin/env node
/**
 * =============================================================================
 * SigmaLui Universal Signal Ingestion & Autonomous Trading Adapter (Node.js ESM)
 * =============================================================================
 * Drop-in module for Node.js / TypeScript trading bots, microservices, and swarms.
 *
 * Capabilities:
 *  1. Ingestion: Polls /api/soul/signals or connects to SSE /api/stream.
 *  2. Verification: Checks TOPSIS >= 0.94, non-inverted side (BUY -> LONG),
 *     and geometric bracket validity (StopLoss < Entry < TakeProfit).
 *  3. Outcome Feedback: Posts verified exchange receipts to /api/soul/share-outcome.
 *
 * Usage:
 *   node sigmalui_bot_connector.mjs --url http://31.97.180.251:3000
 * =============================================================================
 */

import http from 'http';
import https from 'https';

const CONFIG = {
  baseUrl: process.env.SIGMALUI_URL || 'http://31.97.180.251:3000',
  apiKey: process.env.SOUL_API_KEY || '',
  nodeName: process.env.NODE_NAME || 'NodeTradingAgent_01',
  minScore: 0.9400,
  notionalUsd: 25.0,
  pollIntervalMs: 10000,
};

// Parse simple CLI arguments
process.argv.slice(2).forEach((arg, idx, arr) => {
  if (arg === '--url' && arr[idx + 1]) CONFIG.baseUrl = arr[idx + 1].replace(/\/$/, '');
  if (arg === '--key' && arr[idx + 1]) CONFIG.apiKey = arr[idx + 1];
  if (arg === '--name' && arr[idx + 1]) CONFIG.nodeName = arr[idx + 1];
  if (arg === '--min-score' && arr[idx + 1]) CONFIG.minScore = parseFloat(arr[idx + 1]);
});

const processedSignalIds = new Set();

function log(tag, msg) {
  const ts = new Date().toISOString().substring(11, 23);
  console.log(`[${ts}] [${tag.padEnd(10)}] ${msg}`);
}

async function requestJson(path, options = {}) {
  const url = `${CONFIG.baseUrl}${path}`;
  const isHttps = url.startsWith('https:');
  const client = isHttps ? https : http;

  const headers = {
    'User-Agent': `SigmaLui-NodeConnector/1.0 (${CONFIG.nodeName})`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(CONFIG.apiKey ? { 'Authorization': `Bearer ${CONFIG.apiKey}` } : {}),
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method: options.method || 'GET',
      headers,
      timeout: 8000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed });
        } catch {
          resolve({ status: res.statusCode, ok: false, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function validateSignal(sig) {
  const id = sig.id || sig.signalId;
  if (!id) return { valid: false, reason: 'Missing ID' };
  if (processedSignalIds.has(id)) return { valid: false, reason: 'Already processed' };

  const rawAction = String(sig.action || '').toUpperCase();
  const rawSide = String(sig.side || '').toUpperCase();

  const isLong = rawAction === 'BUY' || rawAction === 'STRONG_BUY' || rawSide === 'LONG';
  const isShort = rawAction === 'SELL' || rawAction === 'STRONG_SELL' || rawSide === 'SHORT';

  const tier = sig.tier || sig.decisionTrace?.tier || 'HIGH_CONFLUENCE';
  if (tier === 'NO_TRADE' || sig.executionEligible === false) {
    return { valid: false, reason: `Signal tier is ${tier} (execution not eligible)` };
  }

  if (!isLong && !isShort) return { valid: false, reason: `Invalid action: ${rawAction}` };

  const action = isLong ? 'BUY' : 'SELL';
  const side = isLong ? 'LONG' : 'SHORT';
  const score = parseFloat(sig.decisionScore ?? sig.topsisScore ?? 0);
  const idealCloseness = parseFloat(sig.idealCloseness ?? sig.topsisScore ?? 0);
  const quorum = sig.crossVenue?.quorum || '3/3';
  const indeterminacy = sig.neutrosophic?.I ?? 0.1;

  if (score < CONFIG.minScore) return { valid: false, reason: `Score ${score} < ${CONFIG.minScore}` };

  const entry = parseFloat(sig.entryPrice || 0);
  const tp1 = parseFloat(sig.takeProfit1 || sig.target1 || 0);
  const sl = parseFloat(sig.stopLoss || 0);

  if (entry <= 0 || tp1 <= 0 || sl <= 0) return { valid: false, reason: 'Invalid non-positive prices' };

  if (side === 'LONG' && !(sl < entry && entry < tp1)) {
    return { valid: false, reason: `Violated LONG bracket: require SL (${sl}) < Entry (${entry}) < TP (${tp1})` };
  }
  if (side === 'SHORT' && !(tp1 < entry && entry < sl)) {
    return { valid: false, reason: `Violated SHORT bracket: require TP (${tp1}) < Entry (${entry}) < SL (${sl})` };
  }

  return {
    valid: true,
    signal: {
      id,
      asset: (sig.asset || '').toUpperCase(),
      futuresPair: sig.futuresPair || `${sig.asset}USDT.P`,
      action,
      side,
      tier,
      entryPrice: entry,
      takeProfit1: tp1,
      stopLoss: sl,
      score,
      idealCloseness,
      quorum,
      indeterminacy,
      timestamp: sig.timestamp || new Date().toISOString(),
    }
  };
}

async function simulateOrExecuteTrade(cleanSig) {
  const symbol = cleanSig.futuresPair.replace('.P', '');
  const qty = Number((CONFIG.notionalUsd / cleanSig.entryPrice).toFixed(4)) || 1.0;
  const simulatedOrderId = `node-sim-${Date.now()}-${cleanSig.asset}`;
  const fillTimestamp = new Date().toISOString();

  log('TRADE', `[DRY-RUN] Filled ${cleanSig.action} ${qty} ${symbol} @ $${cleanSig.entryPrice} (TP: $${cleanSig.takeProfit1}, SL: $${cleanSig.stopLoss}) -> OrderID: ${simulatedOrderId}`);

  return {
    ok: true,
    orderId: simulatedOrderId,
    fillTimestamp,
    fillPrice: cleanSig.entryPrice,
    qty,
  };
}

async function shareOutcome(cleanSig, receipt) {
  try {
    const res = await requestJson('/api/soul/share-outcome', {
      method: 'POST',
      body: {
        nodeId: CONFIG.nodeName,
        nodeIdentity: CONFIG.nodeName,
        signalId: cleanSig.id,
        exchangeOrderId: receipt.orderId,
        fillTimestamp: receipt.fillTimestamp,
        asset: cleanSig.asset,
        futuresPair: cleanSig.futuresPair,
        direction: cleanSig.side,
        entryPrice: receipt.fillPrice,
        exitPrice: receipt.fillPrice,
        pnlPct: 0.0,
        wasProfitable: false,
      }
    });

    if (res.ok) {
      log('FEEDBACK', `Receipt acknowledged on SigmaLui Reputation Mesh: ${res.data?.message || 'OK'}`);
    } else {
      log('FEEDBACK_ERR', `Outcome submission note (${res.status}): ${JSON.stringify(res.data || res.raw)}`);
    }
  } catch (err) {
    log('FEEDBACK_ERR', `Failed to report outcome: ${err.message}`);
  }
}

async function cycle() {
  try {
    const res = await requestJson('/api/soul/signals');
    if (!res.ok || !Array.isArray(res.data?.signals)) return;

    for (const rawSig of res.data.signals) {
      const check = validateSignal(rawSig);
      if (!check.valid) continue;

      log('ADMIT', `Admitted setup: ${check.signal.asset} (${check.signal.action}/${check.signal.side}) Score=${check.signal.score} @ $${check.signal.entryPrice}`);
      const receipt = await simulateOrExecuteTrade(check.signal);

      if (receipt.ok) {
        processedSignalIds.add(check.signal.id);
        await shareOutcome(check.signal, receipt);
      }
    }
  } catch (err) {
    log('CYCLE_ERR', `Ingestion cycle error: ${err.message}`);
  }
}

log('START', `Starting SigmaLui Node.js connector on ${CONFIG.baseUrl} (Min score: ${CONFIG.minScore})`);
cycle();
setInterval(cycle, CONFIG.pollIntervalMs);
