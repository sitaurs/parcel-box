# 🔧 VPS API Access Fix

## Issue Found

1. **Health endpoint salah** - Endpoint adalah `/health`, bukan `/api/v1/health`
2. **AWS Security Group belum dibuka** - VPS di AWS EC2 menggunakan Security Group, bukan UFW firewall

---

## ✅ Quick Fix

### 1. Test Health Endpoint yang Benar (di VPS)
```bash
curl http://localhost:8080/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T...",
  "uptime": 123.45
}
```

---

## 🔐 AWS Security Group Configuration

VPS kamu di AWS EC2 (IP: `13.213.57.228`). UFW firewall tidak akan work karena AWS menggunakan **Security Group** sebagai firewall.

### Cara Buka Port di AWS:

1. **Login ke AWS Console**: https://console.aws.amazon.com/
2. **Pergi ke EC2 Dashboard**
3. **Klik "Instances"**
4. **Pilih instance dengan IP `172.31.23.29` (private IP kamu)**
5. **Klik tab "Security"** di bawah
6. **Klik Security Group** (misalnya: `sg-xxxxxxxxx`)
7. **Klik "Edit inbound rules"**
8. **Add Rules:**

| Type        | Protocol | Port Range | Source    | Description               |
|-------------|----------|------------|-----------|---------------------------|
| Custom TCP  | TCP      | 8080       | 0.0.0.0/0 | Backend API               |
| Custom TCP  | TCP      | 3001       | 0.0.0.0/0 | WhatsApp Service          |
| Custom TCP  | TCP      | 1883       | 0.0.0.0/0 | MQTT Broker               |

9. **Save rules**

### Cara Cepat via AWS CLI (jika ada akses):

```bash
# Get Security Group ID
aws ec2 describe-instances \
  --filters "Name=private-ip-address,Values=172.31.23.29" \
  --query 'Reservations[*].Instances[*].SecurityGroups[*].GroupId' \
  --output text

# Add rules (replace sg-xxxxx with your security group ID)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --ip-permissions \
    IpProtocol=tcp,FromPort=8080,ToPort=8080,IpRanges='[{CidrIp=0.0.0.0/0,Description="Backend API"}]' \
    IpProtocol=tcp,FromPort=3001,ToPort=3001,IpRanges='[{CidrIp=0.0.0.0/0,Description="WhatsApp Service"}]' \
    IpProtocol=tcp,FromPort=1883,ToPort=1883,IpRanges='[{CidrIp=0.0.0.0/0,Description="MQTT Broker"}]'
```

---

## 🧪 Testing Steps

### Step 1: Test Localhost (di VPS)
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test root endpoint
curl http://localhost:8080/

# Test login endpoint
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**All should return JSON responses.**

### Step 2: Enable UFW (Optional, backup firewall)
```bash
# Enable UFW as secondary firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH - IMPORTANT!
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 1883/tcp
sudo ufw status
```

⚠️ **WARNING:** Always allow port 22 (SSH) before enabling UFW!

### Step 3: Test dari Internet (di laptop lokal)

**Setelah Security Group dibuka:**

```bash
# Test dari laptop/PC kamu (bukan di VPS)
curl http://13.213.57.228:8080/health
curl http://13.213.57.228:8080/

# Test login
curl -X POST http://13.213.57.228:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Step 4: Test dengan Browser
Buka browser, akses:
```
http://13.213.57.228:8080/health
http://13.213.57.228:8080/
```

Should see JSON response.

---

## 📋 Available Endpoints

Based on backend code:

### Public Endpoints
- `GET /health` - Health check
- `GET /` - API info

### Auth Endpoints
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `GET /api/v1/auth/me` - Get current user (requires auth)

### API Endpoints (require authentication)
- `/api/v1/packages` - Package management
- `/api/v1/events` - Event logs
- `/api/v1/devices` - Device management
- `/api/v1/wa` - WhatsApp integration
- `/api/v1/push` - Push notifications

### WebSocket
- `ws://13.213.57.228:8080` - Socket.IO connection

---

## 🎯 Current Status Checklist

Backend:
- [x] PM2 running (online)
- [x] MQTT connected
- [x] Database ready
- [x] Listening on port 8080
- [ ] `/health` endpoint accessible from localhost
- [ ] AWS Security Group configured
- [ ] Accessible from internet

Next:
- [ ] Setup WhatsApp service
- [ ] Test APK connection

---

## 🔍 Troubleshooting

### If curl hangs on localhost:
```bash
# Check if backend is actually listening
sudo netstat -tulpn | grep 8080

# Check PM2 logs
pm2 logs smartparcel-backend --lines 50

# Restart backend
pm2 restart smartparcel-backend
```

### If "Connection refused" from internet:
1. ✅ Check Security Group di AWS Console
2. ✅ Make sure port 8080 is open to `0.0.0.0/0`
3. ✅ Restart backend: `pm2 restart smartparcel-backend`

### If "Cannot assign requested address":
```bash
# Backend might be binding to 127.0.0.1 only
# Check config
cat /home/ubuntu/smartparcel/backend/.env | grep HOST
```

Should bind to `0.0.0.0` for external access.

---

## 📞 What to Do Now

### Immediate (di VPS):
```bash
# Test correct endpoint
curl http://localhost:8080/health
curl http://localhost:8080/
```

### Then (di AWS Console):
1. Login AWS
2. EC2 → Instances
3. Pilih instance kamu
4. Edit Security Group
5. Add inbound rules untuk port 8080, 3001, 1883

### Finally (di laptop lokal):
```bash
# Test dari internet
curl http://13.213.57.228:8080/health
```

Kalau sudah bisa, berarti siap test APK! 🚀
