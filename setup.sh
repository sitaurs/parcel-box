#!/bin/bash

# Smart Parcel Box - Automated Setup Script
# This script automates the installation process for Linux/Mac

set -e  # Exit on error

echo "╔════════════════════════════════════════════╗"
echo "║  Smart Parcel Box - Automated Setup       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js installation
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 20.x first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version $NODE_VERSION is too old. Please upgrade to 20.x${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Setup Backend
echo -e "${YELLOW}=== Setting up Backend ===${NC}"
cd backend

echo "Installing dependencies..."
npm install

echo "Copying .env.example to .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists, skipping...${NC}"
fi

echo "Generating VAPID keys..."
echo -e "${YELLOW}Run this command and add to .env:${NC}"
echo "  npx web-push generate-vapid-keys"
echo ""

echo "Setting up database..."
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Setup PWA
echo -e "${YELLOW}=== Setting up PWA ===${NC}"
cd ../pwa

echo "Installing dependencies..."
npm install

echo -e "${GREEN}✓ PWA setup complete${NC}"
echo ""

# Final instructions
echo "╔════════════════════════════════════════════╗"
echo "║  Setup Complete!                           ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Edit backend/.env with your configuration:"
echo "   - Set API_TOKEN (used by ESP32-CAM)"
echo "   - Add VAPID keys for Web Push"
echo "   - Configure other settings"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. In a new terminal, start the PWA:"
echo "   cd pwa"
echo "   npm run dev"
echo ""
echo "4. Configure and upload ESP32-CAM firmware:"
echo "   - Edit firmware/include/config.h"
echo "   - Set WiFi credentials and server IP"
echo "   - Upload with PlatformIO"
echo ""
echo -e "${YELLOW}For detailed instructions, see:${NC}"
echo "  - QUICKSTART.md"
echo "  - INSTALLATION.md"
echo "  - README.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
