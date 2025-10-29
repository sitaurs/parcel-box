#!/bin/bash

# ============================================
# Smart Parcel VPS Setup Script
# Ubuntu 20.04/22.04
# ============================================

set -e  # Exit on error

echo "================================================"
echo "  Smart Parcel IoT - VPS Setup Script"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get VPS IP
echo -e "${YELLOW}Enter your VPS Public IP:${NC}"
read VPS_IP

if [ -z "$VPS_IP" ]; then
    echo -e "${RED}Error: VPS IP is required!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Using VPS IP: $VPS_IP${NC}"
echo ""

# Update system
echo -e "${YELLOW}[1/10] Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo -e "${YELLOW}[2/10] Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo -e "${YELLOW}[3/10] Installing PM2...${NC}"
sudo npm install -g pm2

# Install Nginx
echo -e "${YELLOW}[4/10] Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Mosquitto
echo -e "${YELLOW}[5/10] Installing Mosquitto MQTT...${NC}"
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto

# Configure Mosquitto
echo -e "${YELLOW}[6/10] Configuring Mosquitto...${NC}"
sudo mosquitto_passwd -c /etc/mosquitto/passwd smartbox <<EOF
engganngodinginginmcu
engganngodinginginmcu
EOF

# Create mosquitto config
sudo tee /etc/mosquitto/mosquitto.conf > /dev/null <<EOF
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF

sudo systemctl restart mosquitto

# Setup firewall
echo -e "${YELLOW}[7/10] Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 1883/tcp
echo "y" | sudo ufw enable

# Create project directory
echo -e "${YELLOW}[8/10] Creating project directory...${NC}"
sudo mkdir -p /var/www/smartparcel
sudo chown -R $USER:$USER /var/www/smartparcel

# Generate secrets
echo -e "${YELLOW}[9/10] Generating security keys...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_TOKEN=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# Create backend .env
cat > /tmp/backend.env <<EOF
PORT=8080
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
API_TOKEN=$API_TOKEN
CORS_ORIGIN=*
DATABASE_URL=file:./prisma/db.sqlite
STORAGE_DIR=./storage
BAILEYS_DATA_DIR=./wa-session
DEFAULT_PHONE=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@smartparcel.com
MQTT_ENABLED=true
MQTT_HOST=$VPS_IP
MQTT_PORT=1883
MQTT_USER=smartbox
MQTT_PASS=engganngodinginginmcu
EOF

# Create WhatsApp .env
cat > /tmp/wa.env <<EOF
PORT=3001
NODE_ENV=production
SESSION_DIR=./wa-session
BACKEND_URL=http://localhost:8080
EOF

# Configure Nginx
echo -e "${YELLOW}[10/10] Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/smartparcel > /dev/null <<EOF
server {
    listen 80;
    server_name $VPS_IP;

    client_max_body_size 10M;

    location / {
        root /var/www/smartparcel/pwa/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /wa/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /storage/ {
        alias /var/www/smartparcel/backend/storage/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/smartparcel /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Upload your project files to: /var/www/smartparcel/"
echo "   - backend/"
echo "   - wa/"
echo "   - pwa/dist/"
echo ""
echo "2. Copy environment files:"
echo "   sudo cp /tmp/backend.env /var/www/smartparcel/backend/.env"
echo "   sudo cp /tmp/wa.env /var/www/smartparcel/wa/.env"
echo ""
echo "3. Install backend dependencies:"
echo "   cd /var/www/smartparcel/backend"
echo "   npm install --production"
echo "   npx prisma migrate deploy"
echo "   npx prisma generate"
echo ""
echo "4. Start services with PM2:"
echo "   pm2 start npm --name smartparcel-backend -- start"
echo "   cd ../wa"
echo "   npm install --production"
echo "   pm2 start npm --name smartparcel-whatsapp -- start"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo -e "${YELLOW}Generated Security Keys:${NC}"
echo "API_TOKEN: $API_TOKEN"
echo "JWT_SECRET: $JWT_SECRET"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "PWA: http://$VPS_IP"
echo "API: http://$VPS_IP:8080/api/v1"
echo "MQTT: mqtt://$VPS_IP:1883"
echo ""
echo -e "${GREEN}Done!${NC}"
