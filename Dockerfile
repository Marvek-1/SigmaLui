# =============================================================================
# Multi-Stage Dockerfile for SigmaLui Web Dashboard & Fullstack API Server
# Builds Vite React frontend and bundles server.ts into dist/server.cjs
# =============================================================================

# --- Stage 1: Build Frontend and Server Bundle ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json ./
# Install all dependencies including devDependencies for build
RUN npm install

# Copy application source code
COPY . .

# Run production build (vite build + esbuild server.ts -> dist/server.cjs)
RUN npm run build

# --- Stage 2: Production Minimal Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built distribution artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/engine ./engine

# Port 3000 is exposed for Web UI and REST/SSE Governance APIs
EXPOSE 3000

# Start compiled CommonJS server (serves both React SPA and Express APIs)
CMD ["node", "dist/server.cjs"]
