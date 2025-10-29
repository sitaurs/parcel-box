# 🔐 FIRMWARE SECURITY GUIDE

## ⚠️ CRITICAL: Never Commit Credentials to Git!

This guide explains how to properly handle sensitive credentials in your ESP32-CAM and ESP8266 firmware.

---

## 📋 Quick Start

### Step 1: Create config.h from Template

```bash
cd firmware
cp include/config.h.example include/config.h
```

### Step 2: Edit config.h with Your Credentials

Open `firmware/include/config.h` and update with your actual values:

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// ========================================
// WiFi Configuration
// ========================================
#define WIFI_SSID "YourWiFiSSID"
#define WIFI_PASSWORD "YourWiFiPassword"

// ========================================
// API Configuration
// ========================================
#define API_BASE_URL "192.168.1.100"     // Your backend IP/domain
#define API_PORT 8080
#define DEVICE_ID "box-01"
#define API_TOKEN "your_secure_device_token_here"  // Change this!

// ========================================
// MQTT Configuration
// ========================================
#define MQTT_HOST "mqtt.yourserver.com"
#define MQTT_PORT 1883
#define MQTT_USER "smartbox"
#define MQTT_PASS "your_secure_mqtt_password"      // Change this!

// ========================================
// Hardware Configuration (ESP32-CAM)
// ========================================
#define PIN_LOCK_RELAY 13      // GPIO13 - Solenoid control
#define PIN_LAMP_RELAY 4       // GPIO4  - Lamp control
#define PIN_TRIG 12            // GPIO12 - HC-SR04 TRIG
#define PIN_ECHO 15            // GPIO15 - HC-SR04 ECHO
#define PIN_BUZZER 16          // GPIO16 - Buzzer control

// ========================================
// Detection Parameters
// ========================================
#define DISTANCE_MIN_CM 12     // Package detected (min)
#define DISTANCE_MAX_CM 25     // Package detected (max)
#define DISTANCE_DROP_CM 40    // Package dropped (empty)

#endif // CONFIG_H
```

### Step 3: Generate Secure Credentials

**API Token:**
```bash
# Generate random token (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Generate random token (Bash/Linux)
openssl rand -hex 16
```

**MQTT Password:**
```bash
# Generate strong password (PowerShell)
-join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 24 | % {[char]$_})
```

---

## 🚨 Security Checklist

### ✅ DO:
- [ ] Copy `config.h.example` to `config.h` 
- [ ] Update ALL default credentials
- [ ] Add `config.h` to `.gitignore`
- [ ] Use strong, random passwords (24+ characters)
- [ ] Use unique API token per device
- [ ] Store backup credentials securely (password manager)

### ❌ DON'T:
- [ ] Commit `config.h` to Git
- [ ] Use default/example passwords
- [ ] Share credentials in Slack/Discord/email
- [ ] Hardcode credentials in `.ino` files
- [ ] Use simple passwords like "12345678"
- [ ] Reuse passwords across devices

---

## 📁 .gitignore Configuration

Ensure your `firmware/.gitignore` includes:

```gitignore
# Credentials (NEVER commit!)
include/config.h
src/config.h

# PlatformIO
.pio/
.vscode/

# Build artifacts
*.bin
*.elf
```

---

## 🔄 Updating Credentials

### If credentials are already committed:

1. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch firmware/include/config.h" \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Force push (⚠️ destructive!):**
   ```bash
   git push origin --force --all
   ```

3. **Rotate ALL credentials immediately:**
   - Generate new API tokens
   - Change MQTT passwords
   - Update WiFi passwords if exposed
   - Update all devices with new credentials

---

## 🏢 Production Deployment

### Environment-specific configs:

**Development (`config.dev.h`):**
```cpp
#define API_BASE_URL "192.168.1.100"
#define MQTT_HOST "localhost"
```

**Production (`config.prod.h`):**
```cpp
#define API_BASE_URL "api.production.com"
#define MQTT_HOST "mqtt.production.com"
```

### Build scripts:
```bash
# Development build
cp include/config.dev.h include/config.h
platformio run --target upload

# Production build
cp include/config.prod.h include/config.h
platformio run --target upload
```

---

## 🔐 Backend Token Management

### Generate device token in backend:

```typescript
import crypto from 'crypto';

// Generate secure token
const token = crypto.randomBytes(32).toString('hex');
console.log('Device Token:', token);

// Add to .env
// API_TOKEN=generated_token_here
```

### Verify token in API:

```typescript
// backend/src/middleware/auth.ts
export function authenticateDevice(req, res, next) {
  const authHeader = req.headers.authorization;
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || token !== config.apiToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  next();
}
```

---

## 📊 Credentials Rotation Schedule

| Credential | Rotation Frequency | Priority |
|------------|-------------------|----------|
| API Token | Every 90 days | High |
| MQTT Password | Every 90 days | High |
| WiFi Password | Every 180 days | Medium |
| Device ID | Never (unique) | N/A |

---

## 🆘 Emergency Response

### If credentials are exposed:

1. **Immediate (within 1 hour):**
   - Rotate ALL exposed credentials
   - Check server logs for unauthorized access
   - Deploy new firmware with new credentials

2. **Short-term (within 24 hours):**
   - Audit all devices for updates
   - Review Git history for other leaks
   - Update documentation

3. **Long-term (within 1 week):**
   - Implement secrets management (Vault, AWS Secrets Manager)
   - Add automated credential scanning (git-secrets, trufflehog)
   - Train team on security best practices

---

## 🔗 Related Documentation

- [Backend .env Configuration](../backend/.env.example)
- [MQTT Broker Setup](../docs/mqtt-setup.md)
- [Device Registration Guide](../docs/device-registration.md)

---

## 📞 Security Contact

Report security issues to: **security@yourproject.com**

**DO NOT** create public GitHub issues for security vulnerabilities!
