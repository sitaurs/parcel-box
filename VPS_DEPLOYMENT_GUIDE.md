# 🚀 VPS DEPLOYMENT GUIDE - Smart Parcel IoT

## 📋 Prerequisites

Sebelum deploy, pastikan Anda punya:
- ✅ VPS Ubuntu 20.04/22.04
- ✅ Root access atau sudo privileges
- ✅ IP Public VPS (misal: `13.213.57.228`)
- ✅ Domain (opsional, recommended untuk HTTPS)

---

## 🎯 QUICK START (30 Menit)

### **IP VPS Anda:** `_____________` ← **ISI INI DULU!**

---

## 📝 STEP 1: Setup VPS Ubuntu

### 1.1 SSH ke VPS

```bash
ssh root@YOUR_VPS_IP
# Atau jika pakai user lain:
ssh username@YOUR_VPS_IP
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js 18 LTS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v18.x.x
npm -v   # Should show 9.x.x
```

### 1.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.5 Install Nginx (Web Server)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.6 Install Mosquitto MQTT Broker

```bash
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

### 1.7 Configure Mosquitto

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd smartbox
# Enter password: engganngodinginginmcu

# Edit config
sudo nano /etc/mosquitto/mosquitto.conf
```

**Add these lines:**
```conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
```

**Restart:**
```bash
sudo systemctl restart mosquitto
```

### 1.8 Setup Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Backend ports
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp

# Allow MQTT
sudo ufw allow 1883/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## 📝 STEP 2: Deploy Backend

### 2.1 Create Directory

```bash
sudo mkdir -p /var/www/smartparcel
sudo chown -R $USER:$USER /var/www/smartparcel
cd /var/www/smartparcel
```

### 2.2 Clone/Upload Project

**Option A: Via Git (Recommended)**
```bash
# If you have git repository
git clone https://github.com/YOUR_USERNAME/smart-parcel.git .
```

**Option B: Via SCP (From local machine)**
```powershell
# Di Windows local machine:
scp -r D:\projct\projek_cdio\backend root@YOUR_VPS_IP:/var/www/smartparcel/
scp -r D:\projct\projek_cdio\wa root@YOUR_VPS_IP:/var/www/smartparcel/
scp -r D:\projct\projek_cdio\pwa\dist root@YOUR_VPS_IP:/var/www/smartparcel/pwa/
```

**Option C: Manual Upload**
1. Zip folder `backend`, `wa`, `pwa/dist`
2. Upload via FileZilla/WinSCP
3. Unzip di VPS

### 2.3 Setup Backend Environment

```bash
cd /var/www/smartparcel/backend

# Copy production environment
cp .env.production .env

# Edit dengan IP VPS Anda
nano .env
```

**Update these values:**
```bash
# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate API token
API_TOKEN=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# Update MQTT_HOST dengan IP VPS
MQTT_HOST=YOUR_VPS_IP

# Update CORS (ganti YOUR_VPS_IP)
CORS_ORIGIN=http://YOUR_VPS_IP,http://YOUR_VPS_IP:8080
```

### 2.4 Install Backend Dependencies

```bash
cd /var/www/smartparcel/backend
npm install --production
```

### 2.5 Setup Database

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npm run seed
```

### 2.6 Start Backend with PM2

```bash
# Start backend
pm2 start npm --name "smartparcel-backend" -- start

# Check status
pm2 status

# View logs
pm2 logs smartparcel-backend

# Save PM2 config
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy-paste the command it shows
```

---

## 📝 STEP 3: Deploy WhatsApp Service

### 3.1 Setup WhatsApp Environment

```bash
cd /var/www/smartparcel/wa

# Create .env file
nano .env
```

**Add:**
```bash
PORT=3001
NODE_ENV=production
SESSION_DIR=./wa-session
BACKEND_URL=http://localhost:8080
```

### 3.2 Install Dependencies

```bash
npm install --production
```

### 3.3 Start with PM2

```bash
pm2 start npm --name "smartparcel-whatsapp" -- start
pm2 save
```

---

## 📝 STEP 4: Deploy PWA Frontend

### 4.1 **Di Local Machine (Windows)**, Update & Build

```powershell
cd D:\projct\projek_cdio\pwa

# Edit .env.production, ganti IP dengan VPS IP Anda
notepad .env.production
```

**Update:**
```bash
VITE_PROD_API_URL=http://YOUR_VPS_IP:8080/api/v1
VITE_PROD_WS_URL=http://YOUR_VPS_IP:8080
VITE_PROD_WA_WS_URL=http://YOUR_VPS_IP:3001
```

**Build:**
```powershell
npm run build
```

### 4.2 Upload `dist` folder ke VPS

```powershell
scp -r D:\projct\projek_cdio\pwa\dist root@YOUR_VPS_IP:/var/www/smartparcel/pwa/
```

### 4.3 Configure Nginx

**Di VPS:**
```bash
sudo nano /etc/nginx/sites-available/smartparcel
```

**Add this config:**
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Or your domain.com

    # PWA Frontend
    location / {
        root /var/www/smartparcel/pwa/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:8080/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WhatsApp WebSocket
    location /wa/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Storage/Images
    location /storage/ {
        alias /var/www/smartparcel/backend/storage/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/smartparcel /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## 📝 STEP 5: Build & Install Android APK

### 5.1 **Di Local Machine**, Build Production APK

```powershell
cd D:\projct\projek_cdio\pwa

# Sync to Android
npx cap sync android

# Build APK
cd android
.\gradlew assembleRelease  # Or assembleDebug for testing
```

### 5.2 Sign APK (Optional - untuk Production)

```powershell
# Generate keystore (once)
keytool -genkey -v -keystore smartparcel.keystore -alias smartparcel -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore smartparcel.keystore app\build\outputs\apk\release\app-release-unsigned.apk smartparcel

# Zipalign
"$env:ANDROID_HOME\build-tools\34.0.0\zipalign.exe" -v 4 app\build\outputs\apk\release\app-release-unsigned.apk app\build\outputs\apk\release\app-release.apk
```

### 5.3 Install to Phone

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

**Or copy APK to phone manually**

---

## 📝 STEP 6: Test Everything

### 6.1 Test Backend

```bash
# Check if backend running
curl http://localhost:8080/api/v1/health

# Check PM2 status
pm2 status

# View logs
pm2 logs smartparcel-backend --lines 50
```

### 6.2 Test MQTT

```bash
# Subscribe to test topic
mosquitto_sub -h localhost -t "test" -u smartbox -P engganngodinginginmcu

# In another terminal, publish
mosquitto_pub -h localhost -t "test" -m "Hello MQTT" -u smartbox -P engganngodinginginmcu
```

### 6.3 Test Web PWA

Open browser: `http://YOUR_VPS_IP`

Should see login page.

### 6.4 Test Android App

1. Open app on phone
2. Should see login screen
3. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
4. Check Dashboard → should load devices/packages
5. Check real-time updates (MQTT)

---

## 🔐 STEP 7: Secure with HTTPS (Optional but RECOMMENDED)

### 7.1 Get Domain

Buy a domain (e.g., `smartparcel.com`) and point A record to VPS IP.

### 7.2 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.3 Get SSL Certificate

```bash
sudo certbot --nginx -d smartparcel.com -d www.smartparcel.com
```

### 7.4 Update PWA .env.production

```bash
VITE_PROD_API_URL=https://smartparcel.com/api/v1
VITE_PROD_WS_URL=https://smartparcel.com
VITE_PROD_WA_WS_URL=https://smartparcel.com/wa
```

### 7.5 Rebuild APK with HTTPS URLs

```powershell
cd D:\projct\projek_cdio\pwa
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

---

## 🛠️ MAINTENANCE

### View Logs

```bash
# Backend logs
pm2 logs smartparcel-backend

# WhatsApp logs
pm2 logs smartparcel-whatsapp

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MQTT logs
sudo journalctl -u mosquitto -f
```

### Restart Services

```bash
# Restart backend
pm2 restart smartparcel-backend

# Restart WhatsApp
pm2 restart smartparcel-whatsapp

# Restart Nginx
sudo systemctl restart nginx

# Restart MQTT
sudo systemctl restart mosquitto
```

### Update Code

```bash
cd /var/www/smartparcel

# Pull latest code
git pull origin main

# Update backend
cd backend
npm install --production
npx prisma migrate deploy
pm2 restart smartparcel-backend

# Update WhatsApp
cd ../wa
npm install --production
pm2 restart smartparcel-whatsapp

# Update PWA (upload new dist from local)
# Then reload nginx
sudo systemctl reload nginx
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Can't connect to server"

**Check backend running:**
```bash
pm2 status
curl http://localhost:8080/api/v1/health
```

**Check firewall:**
```bash
sudo ufw status
```

**Check nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Problem: "Login invalid"

**Check backend logs:**
```bash
pm2 logs smartparcel-backend --lines 100
```

**Check database:**
```bash
cd /var/www/smartparcel/backend
npx prisma studio  # Opens DB browser
```

**Reset admin password:**
```bash
npm run seed  # Re-seed default users
```

### Problem: "MQTT not working"

**Check MQTT running:**
```bash
sudo systemctl status mosquitto
```

**Test connection:**
```bash
mosquitto_sub -h localhost -t "#" -u smartbox -P engganngodinginginmcu
```

**Check backend MQTT config:**
```bash
cd /var/www/smartparcel/backend
cat .env | grep MQTT
```

### Problem: "WebSocket connection failed"

**Check nginx WebSocket config:**
```bash
sudo nano /etc/nginx/sites-available/smartparcel
# Ensure proxy_set_header Upgrade & Connection are set
```

**Check backend WebSocket:**
```bash
pm2 logs smartparcel-backend | grep socket
```

---

## 📊 MONITORING

### Setup Monitoring (Optional)

```bash
# Install htop
sudo apt install -y htop

# Monitor resources
htop

# Monitor disk space
df -h

# Monitor network
sudo iftop
```

### PM2 Monitoring

```bash
# Web-based monitoring
pm2 web

# View metrics
pm2 monit
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] VPS setup dengan Ubuntu 20.04/22.04
- [ ] Node.js 18 installed
- [ ] PM2 installed
- [ ] Nginx installed dan configured
- [ ] Mosquitto MQTT installed dan configured
- [ ] Firewall configured (ports 80, 443, 8080, 3001, 1883)
- [ ] Backend deployed dan running (PM2)
- [ ] WhatsApp service deployed dan running (PM2)
- [ ] PWA frontend built dan deployed (Nginx)
- [ ] Environment variables updated dengan VPS IP
- [ ] Android APK built dengan production URLs
- [ ] APK installed di phone dan tested
- [ ] Login working
- [ ] Real-time updates (Socket.IO) working
- [ ] MQTT working (device detection)
- [ ] WhatsApp integration working
- [ ] Notifications working
- [ ] SSL/HTTPS configured (optional)
- [ ] Domain configured (optional)
- [ ] Backup strategy implemented (optional)

---

## 🎉 SUCCESS!

Jika semua checklist ✅, maka deployment berhasil!

**Access URLs:**
- PWA Web: `http://YOUR_VPS_IP` or `https://smartparcel.com`
- Backend API: `http://YOUR_VPS_IP:8080/api/v1`
- WhatsApp Service: `http://YOUR_VPS_IP:3001`
- MQTT Broker: `mqtt://YOUR_VPS_IP:1883`

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

**Remember to:**
1. ✅ Change default passwords
2. ✅ Update JWT_SECRET
3. ✅ Update API_TOKEN
4. ✅ Setup HTTPS with domain
5. ✅ Setup backup strategy
6. ✅ Monitor logs regularly

---

Need help? Check logs:
```bash
pm2 logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u mosquitto -f
```
