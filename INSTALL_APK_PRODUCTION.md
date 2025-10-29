# 📱 INSTALL APK PRODUCTION

## APK sudah di-build! ✅

**Location:** `D:\projct\projek_cdio\smartparcel-13.213.57.228.apk`
**Size:** 6.91 MB
**Target VPS:** `13.213.57.228`

---

## CARA INSTALL:

### **Method 1: Via USB (Fastest)**

1. **Colok phone via USB**
2. **Enable USB Debugging** (Settings → Developer Options)
3. **Run command:**

```powershell
adb devices
adb install -r "D:\projct\projek_cdio\smartparcel-13.213.57.228.apk"
```

---

### **Method 2: Copy Manual (Recommended jika USB tidak available)**

1. **Copy file APK ke phone:**
   - Via USB cable → Copy to Downloads folder
   - Via Google Drive / Dropbox
   - Via WhatsApp send to yourself

2. **Di phone:**
   - Open Files app
   - Go to Downloads
   - Tap `smartparcel-13.213.57.228.apk`
   - Allow install from this source
   - Tap Install

---

## ⚠️ PENTING: BACKEND HARUS RUNNING DI VPS!

Sebelum test APK, pastikan backend sudah running di VPS `13.213.57.228`

### **Deploy Backend ke VPS:**

1. **SSH ke VPS:**
```bash
ssh root@13.213.57.228
```

2. **Upload setup script:**
```bash
# Di Windows PowerShell:
scp D:\projct\projek_cdio\setup-vps.sh root@13.213.57.228:/root/
```

3. **Run setup di VPS:**
```bash
chmod +x /root/setup-vps.sh
/root/setup-vps.sh
# Enter IP: 13.213.57.228
```

4. **Upload project files:**
```bash
# Di Windows:
scp -r D:\projct\projek_cdio\backend root@13.213.57.228:/var/www/smartparcel/
scp -r D:\projct\projek_cdio\wa root@13.213.57.228:/var/www/smartparcel/
scp -r D:\projct\projek_cdio\pwa\dist root@13.213.57.228:/var/www/smartparcel/pwa/
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
pm2 startup
```

6. **Test backend:**
```bash
curl http://localhost:8080/api/v1/health
pm2 status
```

---

## 🧪 TEST APK

### **1. Install APK**
- Copy `smartparcel-13.213.57.228.apk` ke phone
- Install

### **2. Open App**
- Tap icon "Smart Parcel"
- Allow notification permission

### **3. Login**
- Email: `admin@example.com`
- Password: `admin123`

### **4. Check Dashboard**
- Should load devices/packages from VPS
- Check real-time updates (Socket.IO)

### **5. Test MQTT**
Di VPS, trigger paket baru:
```bash
mosquitto_pub -h localhost -t "device/BOX001/package/detected" \
  -u smartbox -P engganngodinginginmcu \
  -m '{"trackingNumber":"TEST123","recipient":"Test User","weight":1.5}'
```

### **6. Check Notification**
- Notifikasi harus muncul di phone
- Tap → navigate to Packages

---

## 🐛 TROUBLESHOOTING

### **Problem: Cannot connect to server**

**Test dari phone browser:**
- Open Chrome di phone
- Akses: `http://13.213.57.228`
- Harusnya muncul login page

**Jika tidak bisa:**
- Pastikan phone dan VPS di jaringan yang sama
- Atau pastikan VPS IP public accessible
- Check firewall VPS: `sudo ufw status`

---

### **Problem: Login invalid**

**Check backend di VPS:**
```bash
pm2 logs smartparcel-backend --lines 50
```

**Reset database:**
```bash
cd /var/www/smartparcel/backend
rm -f prisma/db.sqlite
npx prisma migrate deploy
npm run seed
pm2 restart smartparcel-backend
```

---

### **Problem: Data kosong**

**Seed data di VPS:**
```bash
cd /var/www/smartparcel/backend
npm run seed
pm2 restart smartparcel-backend
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend running di VPS (pm2 status)
- [ ] Backend accessible: `http://13.213.57.228:8080/api/v1/health`
- [ ] APK installed on phone
- [ ] App opens successfully
- [ ] Login works
- [ ] Dashboard loads
- [ ] Devices visible
- [ ] Packages visible
- [ ] Real-time updates work
- [ ] MQTT events work
- [ ] Notifications work

---

## 📚 FULL DOCUMENTATION

- **Quick Guide:** `VPS_QUICK_DEPLOY.md`
- **Complete Guide:** `VPS_DEPLOYMENT_GUIDE.md`
- **Notification Guide:** `NOTIFICATION_IMPLEMENTATION.md`

---

**Your APK is READY! Install dan test! 🚀**
