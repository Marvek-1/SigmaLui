# Vercel Deployment Guide

This project is configured for one-click or automated deployment to **Vercel** with full-stack support (Vite React frontend + Serverless Express `/api` backend).

---

## 1. Fast Track: Deploy with GitHub & Vercel

1. **Export to GitHub**:
   - In Google AI Studio, click the **Settings / Export** menu in the top right.
   - Choose **Export to GitHub** (or download as ZIP and push to your GitHub repo).

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"** &rarr; **"Import Git Repository"**.
   - Select your exported repository.

3. **Configure Project Settings** (Vercel auto-detects `vercel.json`):
   - **Framework Preset**: `Vite` (or `Other`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API Key for AI quantitative audits.
     - `NODE_ENV`: `production`

4. **Click Deploy**:
   - Vercel builds the static bundle to `dist/` and mounts `/api` as high-speed serverless endpoints.

---

## 2. Command-Line Deployment (Vercel CLI)

If you have the [Vercel CLI](https://vercel.com/docs/cli) installed locally:

```bash
# 1. Login to Vercel
vercel login

# 2. Deploy Preview
vercel

# 3. Deploy to Production
vercel --prod
```

---

## 3. Architecture on Vercel

* **Frontend UI**: Compiled via Vite and served globally through Vercel Edge CDN (`/dist`).
* **Serverless Backend**: Express router bundled via `/api/index.ts` providing all REST and JSON endpoints:
  - `GET /api/soul/performance-audit` &mdash; Perfect Foresight Benchmark & Strategy Audit
  - `POST /api/soul/execute-parameter-optimization` &mdash; Strategic Calibration (TOPSIS liquidity weighting)
  - `GET /api/soul/siphon/super-signal` &mdash; External bot super signal feed
  - `POST /api/soul/share-outcome` &mdash; External node execution feedback & PnL reporting
  - `POST /api/soul/generate-key` &mdash; Machine-to-machine node provisioning
  - `POST /api/audit-gemini` &mdash; Quantitative MCDM & Gemini AI Audits
* **Companion Python Node**: `SoulGiverHub.py` can be pointed to your Vercel deployment URL by updating the target host to `https://your-app.vercel.app`.
