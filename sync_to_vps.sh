#!/usr/bin/env bash
set -e
echo "==> Syncing updated SigmaLui files to VPS /docker/sigmalui..."
rsync -avz --exclude '.git' --exclude 'node_modules' --exclude 'data' \
  server.ts Dockerfile package.json vite.config.ts engine src dist sigmalui_bot_connector.py sigmalui_bot_connector.mjs \
  root@31.97.180.251:/docker/sigmalui/

echo "==> Rebuilding and restarting sigmalui-web-dashboard container..."
ssh -o BatchMode=yes root@31.97.180.251 "bash --noprofile --norc -c 'cd /docker/sigmalui && docker compose build web-dashboard && docker stop sigmalui-web-dashboard || true && docker rm sigmalui-web-dashboard || true && docker compose up -d web-dashboard'"

echo "==> Verifying container status..."
ssh -o BatchMode=yes root@31.97.180.251 "bash --noprofile --norc -c 'docker ps --filter name=sigmalui-web-dashboard'"
