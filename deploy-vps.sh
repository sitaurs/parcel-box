#!/bin/bash

# Smart Parcel VPS Deployment Script
# Run this on VPS after git pull: bash deploy-vps.sh

set -e  # Exit on error

echo "🚀 Smart Parcel - VPS Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/ubuntu/smartparcel"
cd $PROJECT_DIR

echo -e "${BLUE}📦 Step 1: Git Pull${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

echo -e "${BLUE}🔧 Step 2: Backend Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend
echo "Installing dependencies..."
npm install --production
echo "Building TypeScript..."
npm run build

if [ -f "dist/index.js" ]; then
  echo -e "${GREEN}✅ Backend build successful${NC}"
else
  echo -e "${RED}❌ Backend build failed${NC}"
  exit 1
fi
cd ..
echo ""

echo -e "${BLUE}📱 Step 3: WhatsApp Service Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd wa
echo "Installing dependencies..."
npm install --production
echo "Building TypeScript..."
npm run build

if [ -f "dist/index.js" ]; then
  echo -e "${GREEN}✅ WhatsApp build successful${NC}"
else
  echo -e "${RED}❌ WhatsApp build failed${NC}"
  exit 1
fi
cd ..
echo ""

echo -e "${BLUE}🗂️  Step 4: Check Data Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check and fix events.json if corrupted
if ! jq empty backend/data/events.json 2>/dev/null; then
  echo -e "${YELLOW}⚠️  events.json is corrupted, fixing...${NC}"
  BACKUP="backend/data/events.json.backup.$(date +%Y%m%d_%H%M%S)"
  cp backend/data/events.json "$BACKUP"
  echo "[]" > backend/data/events.json
  echo -e "${GREEN}✅ events.json fixed, backup saved to $BACKUP${NC}"
else
  echo -e "${GREEN}✅ events.json is valid${NC}"
fi

# Check other data files
for file in users.json devices.json packages.json notifications.json; do
  if [ -f "backend/data/$file" ]; then
    if jq empty "backend/data/$file" 2>/dev/null; then
      echo -e "${GREEN}✅ $file is valid${NC}"
    else
      echo -e "${YELLOW}⚠️  $file is corrupted, creating empty array${NC}"
      echo "[]" > "backend/data/$file"
    fi
  else
    echo -e "${YELLOW}⚠️  $file not found, creating...${NC}"
    echo "[]" > "backend/data/$file"
  fi
done
echo ""

echo -e "${BLUE}🔄 Step 5: Restart Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart smartparcel-backend
echo -e "${GREEN}✅ Backend restarted${NC}"

pm2 restart smartparcel-whatsapp
echo -e "${GREEN}✅ WhatsApp restarted${NC}"

pm2 save
echo -e "${GREEN}✅ PM2 configuration saved${NC}"
echo ""

echo -e "${BLUE}⏳ Waiting for services to stabilize...${NC}"
sleep 5
echo ""

echo -e "${BLUE}📊 Step 6: Service Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo ""

echo -e "${BLUE}🏥 Step 7: Health Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check backend health
echo -n "Backend API: "
if curl -s http://localhost:8080/api/v1/auth/health | grep -q "ok"; then
  echo -e "${GREEN}✅ Healthy${NC}"
else
  echo -e "${RED}❌ Not responding${NC}"
fi

# Check WhatsApp health
echo -n "WhatsApp Service: "
if curl -s http://localhost:3001/health | grep -q "ok"; then
  echo -e "${GREEN}✅ Healthy${NC}"
else
  echo -e "${YELLOW}⚠️  Not responding (may be starting)${NC}"
fi
echo ""

echo -e "${BLUE}📝 Step 8: Recent Logs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend logs:"
pm2 logs smartparcel-backend --lines 10 --nostream
echo ""
echo "WhatsApp logs:"
pm2 logs smartparcel-whatsapp --lines 10 --nostream
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Access your app at:"
echo "   http://13.213.57.228:8080"
echo ""
echo "📊 Monitor with:"
echo "   pm2 monit"
echo ""
echo "📝 View logs:"
echo "   pm2 logs"
