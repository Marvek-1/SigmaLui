# Hostinger VPS Persistent Production Engine Deployment Guide

This package pivots the SigmaLui architecture from a static/serverless demo into a **24/7/365 Persistent, High-Availability Trading Engine** designed specifically for your **Hostinger VPS** and direct local integration with **Scaffs**.

---

## 1. Architecture Overview

```
                          ┌────────────────────────┐
                          │ Binance Futures Stream │
                          │ wss://fstream.binance  │
                          └───────────┬────────────┘
                                      │ Real-time Ticks (BTC, ETH, SOL, BNB, XRP)
                                      ▼
                      ┌─────────────────────────────────┐
                      │    engine/live_engine.py        │
                      │  - Real GM(1,1) Forecasting     │
                      │  - Real TOPSIS Multi-Criteria   │
                      │  - Fail-Closed Governance       │
                      │  - HMAC Provenance Signing      │
                      └───────────────┬─────────────────┘
                                      │ IPC Pub/Sub (signals:live)
                                      ▼
                      ┌─────────────────────────────────┐
                      │    Local Redis Database         │
                      │    127.0.0.1:6379 (Internal)   │
                      └───────────────┬─────────────────┘
                                      │ Local Loopback (Zero Latency)
                                      ▼
                      ┌─────────────────────────────────┐
                      │    gateway/scaffs_bridge.py     │
                      │  - Temporal Freshness Filter    │
                      │  - Price Geometry Guard (TP/SL) │
                      │  - Provenance Verifier          │
                      └───────────────┬─────────────────┘
                                      │
                                      ▼
                      ┌─────────────────────────────────┐
                      │       Scaffs Trading Agent      │
                      │  /home/idona/MoStar/scaffs      │
                      │  signal_queue.py / Spool        │
                      └─────────────────────────────────┘
```

### Why this is fundamentally different from Vercel:
1. **Real Market Feeds**: Subscribes directly to `fstream.binance.com` WebSockets. GM(1,1) and TOPSIS run on real live orderbook and tick data.
2. **Zero Serverless Timeouts**: Runs under PM2 or Docker, keeping persistent connections alive 24/7.
3. **Total Network Security**: Redis and the Scaffs Bridge run strictly on `127.0.0.1`. No public open ports, no external API exposure, and no keys exposed over the internet.
4. **Zero-Latency Local IPC**: Signals move between the engine and Scaffs via in-memory Redis channels in sub-millisecond time.

---

## 2. Directory Structure on Hostinger VPS

```
/var/www/sigmalui/
├── Dockerfile                # Production Node 22 multi-stage image for Web UI & APIs
├── Dockerfile.engine         # Python 3.11 image for Binance Market Engine & Scaffs Bridge
├── docker-compose.yml        # Turnkey 4-service production stack (Redis, Engine, Gateway, Web)
├── ecosystem.config.cjs      # PM2 supervisor configuration for all 3 runtime services
├── setup_vps.sh              # One-click Ubuntu automated bootstrap script
├── VPS_DEPLOYMENT_GUIDE.md   # This operational documentation
├── engine/
│   └── live_engine.py        # Real Binance WS stream, GM(1,1) & TOPSIS churner
├── gateway/
│   └── scaffs_bridge.py      # Direct local bridge to Scaffs signal_queue
└── data/
    ├── redis/                # Persistent Redis storage
    └── logs/                 # Rolling process logs
```

---

## 3. Quickstart (One-Click Setup)

SSH into your Hostinger VPS and execute:

```bash
# 1. Navigate to your deployment folder (or clone from git)
cd /var/www/sigmalui

# 2. Make setup script executable and run it
chmod +x setup_vps.sh
./setup_vps.sh
```

The script automatically:
* Installs `redis-server`, `python3-pip`, and `pm2`
* Configures Redis to bind **strictly to `127.0.0.1`** and enables it on boot
* Installs `websocket-client`, `redis`, and `requests` Python packages
* Prepares log directories in `./data/logs`

---

## 4. Launching the Services

Choose between **PM2 (Native)** or **Docker Compose**:

### Option A: PM2 Process Manager (Recommended for Hostinger)

```bash
# 1. Start both the Market Engine and Scaffs Gateway Bridge
pm2 start ecosystem.config.cjs

# 2. Save process list so it automatically restarts if the VPS ever reboots
pm2 save
pm2 startup

# 3. Monitor live streaming logs in real time
pm2 logs
```

### Option B: Docker Compose

```bash
# Build and run Redis, Market Engine, and Gateway in the background
docker compose up -d

# View live stream output
docker compose logs -f
```

---

## 5. Verification & Health Checks

### Check 1: Real Binance Ticks
Run `pm2 logs market-engine` (or `docker compose logs -f market-engine`). You should see:
```text
[LiveEngine] Successfully connected to Binance Futures WebSocket stream!
[LiveEngine] Subscribed live ticker feeds: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, TAOUSDT
[LiveEngine] ⚡ [EMITTED] BUY BTC @ 64120.50 | TP1=64633.46 | SL=63864.02 | Conviction=92.4%
```

### Check 2: Redis IPC Channel
In another terminal, test that Redis is receiving live signals:
```bash
redis-cli psubscribe "signals:*"
```
You will see JSON payloads with real Binance prices and GM(1,1) forecasting data emitted every time market volatility triggers a conviction score $\ge 0.90$.

### Check 3: Scaffs Bridge Reception
Run `pm2 logs scaffs-gateway`. In safe `paper` mode (the default), it logs:
```text
[ScaffsBridge] 🎯 [DISPATCH to Scaffs] BUY BTC @ 64120.50 | TP=64633.46 | SL=63864.02 | Conviction=92.4% | Mode=PAPER
[ScaffsBridge]    [PAPER] Simulated fill recorded for Scaffs testing.
```

When you are ready for real trade execution in Scaffs:
1. Open `ecosystem.config.cjs`
2. Change `--mode paper` to `--mode live` on line 32
3. Run `pm2 restart scaffs-gateway`

---

## 6. Security Hardening Checklist

* **Firewall (UFW)**: Keep all internal ports closed.
  ```bash
  sudo ufw default deny incoming
  sudo ufw allow 22/tcp    # SSH
  sudo ufw enable
  ```
* **Redis Local-Only**: Verify with `sudo netstat -plnt | grep 6379`. It must listen on `127.0.0.1:6379`, **never** `0.0.0.0:6379`.
* **Binance API Keys**: Your Binance trading keys remain exclusively inside Scaffs (`/home/idona/MoStar/scaffs/.env`) on the VPS. The market engine only reads public WebSocket market data and never requires Binance API keys or withdrawal permissions.
