# 🎉 Backend VPS Berhasil Jalan!

## ✅ Status Saat Ini

Backend sudah running dengan sempurna di VPS:
```
🚀 Server running on http://localhost:8080
✅ [MQTT] Connected to mqtt://13.213.57.228:1883
✅ Database initialized - 1 user(s) found
✅ [MQTT] Device box-01 status updated
```

## 📋 Next Steps - Jalankan di VPS

### 1. Test Backend Health dari localhost
```bash
curl http://localhost:8080/api/v1/health
```

**Expected:** `{"status":"ok"}`

### 2. Buka Firewall untuk Port 8080
```bash
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 1883/tcp
sudo ufw status
sudo ufw reload
```

### 3. Test Backend dari Internet (dari laptop kamu)
```bash
# Jalankan di laptop/PC lokal (bukan di VPS)
curl http://13.213.57.228:8080/api/v1/health
```

**Expected:** `{"status":"ok"}`

### 4. Setup WhatsApp Service
```bash
cd /home/ubuntu/smartparcel/wa
npm install --production

# Copy dan edit .env
cp .env.example .env
nano .env
```

Edit `.env`:
```env
PORT=3001
BACKEND_URL=http://localhost:8080
API_TOKEN=your_api_token_from_backend_env
```

Get API_TOKEN:
```bash
cat /home/ubuntu/smartparcel/backend/.env | grep API_TOKEN
```

Start WA service:
```bash
pm2 start npm --name smartparcel-whatsapp -- start
pm2 save
pm2 logs smartparcel-whatsapp
```

**Scan QR code dengan WhatsApp di HP**

### 5. Verify Semua Service Running
```bash
pm2 status

# Should show:
# smartparcel-backend   | online
# smartparcel-whatsapp  | online
```

### 6. Test API dari Internet
```bash
# Test dari laptop/PC lokal
curl -X POST http://13.213.57.228:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Should return JWT token.

### 7. Install APK di HP
- Transfer file: `smartparcel-13.213.57.228.apk` ke HP Android
- Install APK
- Buka aplikasi
- Login: `admin@example.com` / `admin123`
- **App harus bisa connect ke VPS!**

### 8. Test Real-time Updates
1. Buka Dashboard di APK
2. Di VPS, kirim test MQTT message:
```bash
# Install mosquitto-clients jika belum ada
sudo apt-get install -y mosquitto-clients

# Test publish package arrived
mosquitto_pub -h localhost -t smartparcel/box-01/package \
  -m '{"status":"arrived","timestamp":"2025-10-29T12:00:00Z"}'
```

3. Lihat di APK apakah dapat notifikasi dan data update real-time

---

## 🔧 Troubleshooting TypeScript Build (Optional)

Build gagal karena missing @types packages. Untuk fix (optional, tidak urgent):

```bash
cd /home/ubuntu/smartparcel/backend
npm install --save-dev \
  @types/express \
  @types/bcryptjs \
  @types/jsonwebtoken \
  @types/multer \
  @types/uuid \
  @types/web-push \
  typescript

npm run build
```

Tapi karena backend sudah jalan, ini **TIDAK URGENT**.

---

## 🎯 Success Checklist

Backend:
- [x] PM2 status: online
- [x] MQTT connected
- [x] Database ready
- [x] Listening on port 8080
- [ ] Health endpoint accessible from internet
- [ ] Firewall port 8080 opened

WhatsApp:
- [ ] WA service installed
- [ ] .env configured
- [ ] PM2 running
- [ ] QR code scanned
- [ ] WhatsApp connected

APK Testing:
- [ ] APK installed on phone
- [ ] Login successful
- [ ] Can see devices list
- [ ] Real-time updates working
- [ ] Notifications working

---

## 📞 Report Back

Setelah jalankan step 1-3, kasih tau hasilnya:

1. Hasil `curl http://localhost:8080/api/v1/health` (di VPS)
2. Status `sudo ufw status` (di VPS)
3. Hasil `curl http://13.213.57.228:8080/api/v1/health` (di laptop lokal)

Kalau semua ✅, lanjut setup WhatsApp dan test APK! 🚀
