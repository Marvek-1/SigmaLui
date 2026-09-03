#!/usr/bin/env bash
# =============================================================================
# Hostinger VPS Quickstart & Setup Script
# Configures Redis, Python runtime, PM2 daemon, and directory structure.
# =============================================================================

set -e

echo "============================================================================="
echo " 🚀 Setting up Hostinger VPS Quantitative Engine & Scaffs Local Bridge"
echo "============================================================================="

# 1. Update and install core system dependencies
echo "[1/5] Updating APT repositories and installing core packages..."
sudo apt-get update -y
sudo apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    redis-server \
    ufw

# 2. Configure Redis security (bind strictly to 127.0.0.1)
echo "[2/5] Hardening Redis server (local loopback only)..."
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf || true
sudo systemctl enable redis-server
sudo systemctl restart redis-server

# Verify Redis
if redis-cli ping | grep -q PONG; then
    echo "  -> Redis is active and responding (PONG)."
else
    echo "  -> [WARNING] Redis did not respond to ping. Please check 'sudo systemctl status redis-server'."
fi

# 3. Install Python dependencies
echo "[3/5] Installing Python requirements for Binance stream & Grey Math..."
pip3 install --upgrade pip
pip3 install websocket-client redis requests

# 4. Install Node & PM2 (if not already installed)
echo "[4/5] Checking PM2 process supervisor..."
if ! command -v pm2 &> /dev/null; then
    echo "  -> Installing PM2 globally via npm..."
    if ! command -v npm &> /dev/null; then
        sudo apt-get install -y nodejs npm
    fi
    sudo npm install -g pm2
fi

# 5. Build Web Dashboard Frontend & Backend Server Bundle
echo "[5/6] Installing Node dependencies and compiling production bundle..."
if [ -f "package.json" ]; then
    npm install
    npm run build
fi

# 6. Create log and data directories
echo "[6/6] Creating runtime directories..."
mkdir -p data/redis data/logs

echo "============================================================================="
echo " ✅ Hostinger VPS Setup Complete!"
echo "============================================================================="
echo ""
echo "To launch via PM2 (All 3 services: Market Engine + Scaffs Bridge + Web UI):"
echo "  pm2 start ecosystem.config.cjs"
echo "  pm2 save"
echo "  pm2 logs"
echo ""
echo "Or launch via Docker Compose:"
echo "  docker compose up -d --build"
echo "  docker compose logs -f"
echo "============================================================================="
