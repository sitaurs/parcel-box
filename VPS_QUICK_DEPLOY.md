# 🚀 DEPLOY KE VPS - QUICK GUIDE

## ⚡ SUPER QUICK START (15 Menit)

### **Apa yang Sudah Saya Fix:**

✅ **Hardcoded IP Fixed** - PWA sekarang pakai environment variables
✅ **Production Config Ready** - `.env.production` untuk backend & PWA
✅ **Auto Build Script** - `build-production.ps1` untuk build APK otomatis
✅ **VPS Setup Script** - `setup-vps.sh` untuk auto-setup VPS
✅ **Deployment Guide** - `VPS_DEPLOYMENT_GUIDE.md` lengkap step-by-step

---

## 📋 YANG PERLU ANDA LAKUKAN

### **Step 1: Setup VPS (10 menit)**

1. **SSH ke VPS:**
```bash
ssh root@YOUR_VPS_IP
```

2. **Upload setup script:**
```bash
# Di Windows (PowerShell):
scp D:\projct\projek_cdio\setup-vps.sh root@YOUR_VPS_IP:/root/
```

3. **Run setup script di VPS:**
```bash
chmod +x /root/setup-vps.sh
/root/setup-vps.sh
# Masukkan VPS IP saat ditanya
```

Script akan otomatis install:
- ✅ Node.js 18
- ✅ PM2
- ✅ Nginx
- ✅ Mosquitto MQTT
- ✅ Firewall rules
- ✅ Generate JWT & API secrets

4. **Upload project files:**
```bash
# Di Windows:
scp -r D:\projct\projek_cdio\backend root@YOUR_VPS_IP:/var/www/smartparcel/
scp -r D:\projct\projek_cdio\wa root@YOUR_VPS_IP:/var/www/smartparcel/
```

5. **Start services di VPS:**
```bash
# Backend
cd /var/www/smartparcel/backend
sudo cp /tmp/backend.env .env
npm install --production
npx prisma migrate deploy
npx prisma generate
pm2 start npm --name smartparcel-backend -- start

# WhatsApp
cd /var/www/smartparcel/wa
sudo cp /tmp/wa.env .env
npm install --production
pm2 start npm --name smartparcel-whatsapp -- start

# Save PM2
pm2 save
pm2 startup  # Copy-paste command yang muncul
```

---

### **Step 2: Build APK (5 menit)**

1. **Di Windows (PowerShell):**
```powershell
cd D:\projct\projek_cdio
.\build-production.ps1
# Masukkan VPS IP saat ditanya (misal: 13.213.57.228)
```

Script akan otomatis:
- ✅ Update `.env.production` dengan VPS IP
- ✅ Build PWA (`npm run build`)
- ✅ Sync ke Android (`npx cap sync`)
- ✅ Build APK (`gradlew assembleDebug`)
- ✅ Copy APK ke root folder dengan nama `smartparcel-YOUR_IP.apk`

2. **Upload PWA ke VPS:**
```powershell
scp -r D:\projct\projek_cdio\pwa\dist root@YOUR_VPS_IP:/var/www/smartparcel/pwa/
```

3. **Reload Nginx di VPS:**
```bash
sudo systemctl reload nginx
```

---

### **Step 3: Install & Test APK**

1. **Install APK ke phone:**
```powershell
# Via USB
adb install -r smartparcel-YOUR_IP.apk

# Or copy to phone manually
```

2. **Test di phone:**
- ✅ Open app
- ✅ Allow notification permission
- ✅ Login (admin@example.com / admin123)
- ✅ Check Dashboard → devices/packages
- ✅ Test MQTT (trigger paket baru)
- ✅ Test WhatsApp integration

---

## 🔍 TROUBLESHOOTING

### **Problem: "Cannot login" atau "Invalid credentials"**

**Cek backend running di VPS:**
```bash
pm2 status
pm2 logs smartparcel-backend --lines 50
```

**Test API di VPS:**
```bash
curl http://localhost:8080/api/v1/health
```

**Cek CORS di backend .env:**
```bash
cat /var/www/smartparcel/backend/.env | grep CORS
# Should be: CORS_ORIGIN=*
```

**Reset database & reseed:**
```bash
cd /var/www/smartparcel/backend
rm -f prisma/db.sqlite
npx prisma migrate deploy
npm run seed
pm2 restart smartparcel-backend
```

---

### **Problem: "Cannot connect to server"**

**Cek firewall di VPS:**
```bash
sudo ufw status
# Pastikan port 8080 dan 3001 ALLOWED
```

**Cek Nginx di VPS:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

**Test koneksi dari phone:**
- Buka browser di phone
- Akses: `http://YOUR_VPS_IP`
- Harusnya muncul login page

**Cek APK environment:**
- Pastikan APK di-build dengan IP VPS yang benar
- Lihat file: `pwa/.env.production`
- IP harus sesuai dengan VPS Anda

---

### **Problem: "MQTT not working"**

**Cek Mosquitto di VPS:**
```bash
sudo systemctl status mosquitto
```

**Test MQTT di VPS:**
```bash
mosquitto_sub -h localhost -t "#" -u smartbox -P engganngodinginginmcu
```

**Cek backend MQTT config:**
```bash
cat /var/www/smartparcel/backend/.env | grep MQTT
```

**Restart services:**
```bash
sudo systemctl restart mosquitto
pm2 restart smartparcel-backend
```

---

### **Problem: "App bisa buka tapi data kosong"**

**Cek database ada data:**
```bash
cd /var/www/smartparcel/backend
npx prisma studio
# Open browser ke port yang ditunjukkan
# Check tables: User, Device, Package
```

**Seed ulang data:**
```bash
npm run seed
pm2 restart smartparcel-backend
```

**Cek logs real-time:**
```bash
pm2 logs smartparcel-backend
# Buka app di phone, lihat log request
```

---

## 📊 MONITORING

### **Check Services Status**
```bash
pm2 status
pm2 monit
```

### **View Logs**
```bash
# All logs
pm2 logs

# Specific service
pm2 logs smartparcel-backend --lines 100
pm2 logs smartparcel-whatsapp --lines 100

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MQTT
sudo journalctl -u mosquitto -f
```

### **System Resources**
```bash
# CPU, RAM, Disk
htop

# Disk space
df -h

# Network
sudo iftop
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Change default admin password
  - Login ke PWA → Settings → Change Password
  
- [ ] Update JWT_SECRET di backend .env
  - Generated automatically by setup script
  
- [ ] Update API_TOKEN di backend .env
  - Generated automatically by setup script
  - Update di ESP32 firmware juga!
  
- [ ] Setup HTTPS dengan domain & SSL
  - See: VPS_DEPLOYMENT_GUIDE.md Step 7
  
- [ ] Restrict CORS to your domain only
  - Edit backend .env: `CORS_ORIGIN=https://yourdomain.com`
  
- [ ] Setup firewall properly
  - Done by setup script
  
- [ ] Setup backup strategy
  - Database: `/var/www/smartparcel/backend/prisma/db.sqlite`
  - Storage: `/var/www/smartparcel/backend/storage/`
  - WhatsApp session: `/var/www/smartparcel/wa/wa-session/`

---

## 📁 FILE SUMMARY

### **Files Created/Modified:**

1. ✅ `pwa/.env.development` - Development environment
2. ✅ `pwa/.env.production` - Production environment (UPDATE IP!)
3. ✅ `pwa/src/lib/api.ts` - Use env variables, not hardcoded IP
4. ✅ `pwa/src/lib/socket.ts` - Use env variables, not hardcoded IP
5. ✅ `backend/.env.production` - Backend production config
6. ✅ `VPS_DEPLOYMENT_GUIDE.md` - Complete deployment guide
7. ✅ `setup-vps.sh` - Auto VPS setup script
8. ✅ `build-production.ps1` - Auto APK build script
9. ✅ `VPS_QUICK_DEPLOY.md` - This file (quick reference)

---

## 🎯 STEP-BY-STEP CHECKLIST

### **VPS Setup:**
- [ ] SSH to VPS
- [ ] Upload `setup-vps.sh`
- [ ] Run setup script
- [ ] Upload backend & wa folders
- [ ] Install dependencies
- [ ] Run database migrations
- [ ] Start services with PM2
- [ ] Upload PWA dist folder
- [ ] Test: `curl http://localhost:8080/api/v1/health`

### **APK Build:**
- [ ] Update `pwa/.env.production` with VPS IP
- [ ] Run `build-production.ps1`
- [ ] Wait for build (~3 minutes)
- [ ] Get APK: `smartparcel-YOUR_IP.apk`

### **Testing:**
- [ ] Install APK on phone
- [ ] Open app
- [ ] Login works
- [ ] Dashboard loads
- [ ] Devices visible
- [ ] Packages visible
- [ ] Real-time updates work (Socket.IO)
- [ ] MQTT events work
- [ ] WhatsApp integration works
- [ ] Notifications work

### **Production Ready:**
- [ ] Change admin password
- [ ] Update JWT_SECRET
- [ ] Update API_TOKEN (backend + ESP32)
- [ ] Setup HTTPS with domain
- [ ] Restrict CORS
- [ ] Setup monitoring
- [ ] Setup backup

---

## 🆘 NEED HELP?

**Check comprehensive guide:**
```
VPS_DEPLOYMENT_GUIDE.md
```

**View logs:**
```bash
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

**Restart everything:**
```bash
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mosquitto
```

---

## ✅ SUCCESS INDICATORS

Jika semua ini berhasil, deployment SUKSES:

- ✅ `http://YOUR_VPS_IP` → Shows login page
- ✅ `http://YOUR_VPS_IP:8080/api/v1/health` → Returns 200 OK
- ✅ `pm2 status` → All services ONLINE
- ✅ Phone app login successful
- ✅ Dashboard shows data
- ✅ Real-time updates working
- ✅ MQTT events detected
- ✅ Notifications appear

---

**IP VPS Anda:** `13.213.57.228` (MQTT server)

**Update semua config dengan IP ini!**

Good luck! 🚀
