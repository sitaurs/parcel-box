#!/bin/bash

# ============================================
# Quick Fix VPS Setup
# ============================================

set -e

echo "================================================"
echo "  Smart Parcel - Quick Fix VPS"
echo "================================================"
echo ""

# 1. Install PM2
echo "[1/4] Installing PM2..."
npm install -g pm2

# 2. Create .env if not exists
echo "[2/4] Setting up .env..."
if [ ! -f .env ]; then
    cp .env.production .env
fi

# 3. Fix DATABASE_URL in .env if missing
echo "[3/4] Fixing DATABASE_URL..."
if ! grep -q "DATABASE_URL" .env; then
    echo "DATABASE_URL=file:./prisma/db.sqlite" >> .env
fi

# 4. Run Prisma migrations
echo "[4/4] Running Prisma migrations..."
npx prisma migrate deploy
npx prisma generate

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Now start services with:"
echo "  pm2 start npm --name smartparcel-backend -- start"
echo "  pm2 save"
echo ""
