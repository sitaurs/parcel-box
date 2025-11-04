#!/bin/bash

# Script to fix VPS issues
# Run this on VPS: bash fix-vps-issues.sh

echo "🔧 Fixing VPS Issues..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to project directory
cd /home/ubuntu/smartparcel

echo ""
echo "📦 Problem 1: WhatsApp Service - Missing dist/index.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Fix WhatsApp service
cd wa
echo "✅ Installing dependencies..."
npm install

echo "✅ Building TypeScript..."
npm run build

if [ -f "dist/index.js" ]; then
  echo "✅ dist/index.js created successfully!"
else
  echo "❌ Failed to create dist/index.js"
  echo "Trying manual build..."
  npx tsc
fi

cd ..

echo ""
echo "📄 Problem 2: Backend - events.json Corrupted"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup corrupted events.json
BACKUP_FILE="backend/data/events.json.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backing up corrupted file to: $BACKUP_FILE"
cp backend/data/events.json "$BACKUP_FILE"

# Fix events.json - create new empty array
echo "✅ Creating fresh events.json..."
echo "[]" > backend/data/events.json

echo ""
echo "🔄 Restarting Services..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Restart PM2 services
pm2 restart smartparcel-backend
pm2 restart smartparcel-whatsapp

echo ""
echo "⏳ Waiting 3 seconds for services to start..."
sleep 3

echo ""
echo "📊 Service Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status

echo ""
echo "📝 Recent Logs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend logs:"
pm2 logs smartparcel-backend --lines 5 --nostream

echo ""
echo "WhatsApp logs:"
pm2 logs smartparcel-whatsapp --lines 5 --nostream

echo ""
echo "✅ Fix completed!"
echo ""
echo "💡 If WhatsApp still fails, try:"
echo "   cd /home/ubuntu/smartparcel/wa"
echo "   npm run build"
echo "   pm2 restart smartparcel-whatsapp"
