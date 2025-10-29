# 📡 MQTT ACK Format Specification

**Version:** 1.0  
**Last Updated:** 24 Oktober 2025  
**Purpose:** Integrasi PWA/AI Agent dengan real-time feedback

---

## 📋 Overview

Sistem menggunakan **3 jenis ACK** untuk memberikan feedback real-time:

1. **Photo ACK** - Status upload foto (success/failed, dengan retry tracking)
2. **Control ACK** - Konfirmasi perintah kontrol dari PWA
3. **Event Steps** - Progress pipeline detection-foto-drop

---

## 1️⃣ Photo ACK

**Topic:** `smartparcel/box-01/photo/status`

**Dikirim oleh:** ESP32-CAM  
**Kapan:** Setiap percobaan upload (1..N kali)

### Format Sukses

```json
{
  "ok": true,
  "http": 201,
  "try": 1,
  "bytes": 42637,
  "id": 12,
  "photoUrl": "/api/v1/photos/12.jpg",
  "thumbUrl": "/api/v1/photos/12_thumb.jpg",
  "ts": "2025-10-23T13:05:32.000Z",
  "deviceId": "box-01",
  "meta": {
    "cm": 17.3
  }
}
```

### Format Gagal

```json
{
  "ok": false,
  "http": 0,
  "try": 3,
  "bytes": 42580,
  "id": null,
  "photoUrl": null,
  "thumbUrl": null,
  "ts": null,
  "deviceId": "box-01",
  "meta": {
    "cm": 18.1
  }
}
```

### Field Description

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Upload berhasil (true) atau gagal (false) |
| `http` | integer | HTTP status code (0 = TCP connection failed) |
| `try` | integer | Percobaan ke-N (1, 2, 3...) |
| `bytes` | integer | Ukuran foto dalam bytes |
| `id` | integer/null | Package ID dari backend (jika sukses) |
| `photoUrl` | string/null | URL foto full size |
| `thumbUrl` | string/null | URL thumbnail |
| `ts` | string/null | Timestamp ISO 8601 dari backend |
| `deviceId` | string | Device identifier |
| `meta.cm` | float | Jarak deteksi dalam cm |

### HTTP Status Codes

| Code | Meaning | ok Value |
|------|---------|----------|
| 0 | TCP connection failed | false |
| 200/201/204 | Success | true |
| 400 | Bad request | false |
| 401 | Unauthorized | false |
| 500 | Server error | false |

### Retry Logic

ESP32-CAM akan retry hingga **3 kali** jika gagal:
1. Attempt 1: Immediate
2. Attempt 2: After 2s delay
3. Attempt 3: After 2s delay (final attempt)

Setiap attempt publish ACK baru dengan `try` yang berbeda.

---

## 2️⃣ Control ACK

**Topic:** `smartparcel/box-01/control/ack`

**Dikirim oleh:** ESP8266 atau ESP32-CAM  
**Kapan:** Saat menerima perintah dari PWA

### Lock Control

**Success - Closed (Hold):**
```json
{
  "ok": true,
  "action": "lock",
  "state": "closed"
}
```

**Success - Open (Release):**
```json
{
  "ok": true,
  "action": "lock",
  "state": "open"
}
```

**Failed - Parse Error:**
```json
{
  "ok": false,
  "action": "lock",
  "detail": "parse_error"
}
```

### Camera Capture

**Success:**
```json
{
  "ok": true,
  "action": "capture"
}
```

**Failed - Busy:**
```json
{
  "ok": false,
  "action": "capture",
  "detail": "busy"
}
```

### Buzzer Test

**Started:**
```json
{
  "ok": true,
  "action": "buzzer"
}
```

**Completed:**
```json
{
  "ok": true,
  "action": "buzzer",
  "done": true
}
```

### Field Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ok` | boolean | ✅ | Perintah berhasil dieksekusi |
| `action` | string | ✅ | Jenis perintah: "lock", "capture", "buzzer" |
| `state` | string | ❌ | State untuk lock: "open" atau "closed" |
| `detail` | string | ❌ | Detail error jika ok=false |
| `done` | boolean | ❌ | true jika buzzer selesai |

---

## 3️⃣ Event Steps

**Topic:** `smartparcel/box-01/event`

**Dikirim oleh:** ESP8266  
**Kapan:** Saat progress pipeline berjalan

### Step Sequence

```
1. wait_before_photo  → Paket terdeteksi, menunggu foto
2. photo_ok           → Foto berhasil upload
3. wait_before_lock   → Delay sebelum release solenoid
4. lock_on_5s         → Solenoid HOLD (manual lock)
5. lock_off           → Solenoid RELEASE (drop!)
6. buzzer_60s         → Buzzer start 1 menit
```

### Format

**With timestamp:**
```json
{
  "step": "wait_before_photo",
  "ms": 4231
}
```

**Without timestamp:**
```json
{
  "step": "photo_ok"
}
```

### Field Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step` | string | ✅ | Nama step (lihat tabel di bawah) |
| `ms` | integer | ❌ | Timestamp millis() dari ESP |

### Step Types

| Step | Triggered By | Description |
|------|--------------|-------------|
| `wait_before_photo` | ESP8266 | Paket terdeteksi, ESP32-CAM akan foto |
| `photo_ok` | Backend | Foto berhasil upload ke server |
| `wait_before_lock` | Backend | Delay sebelum release (opsional) |
| `lock_on_5s` | ESP8266 | Solenoid HOLD manual (emergency) |
| `lock_off` | ESP8266 | Solenoid RELEASE, paket drop |
| `buzzer_60s` | ESP8266 | Buzzer start 60 detik |

---

## 🔄 Complete Flow Example

### Scenario: Package Detection → Photo → Drop

**1. User taruh paket di lempengan**

```
ESP8266 sensor: 14.5 cm (dalam range 12-25)
```

**2. ESP8266 publish detect event:**

```json
{
  "type": "detect",
  "cm": 14.5
}
```

**3. ESP8266 publish event step:**

```json
{
  "step": "wait_before_photo",
  "ms": 4231
}
```

**4. Backend forward ke ESP32-CAM:**

```
Topic: smartparcel/box-01/cmd/capture
Payload: {"distance": 14.5}
```

**5. ESP32-CAM send control ACK:**

```json
{
  "ok": true,
  "action": "capture"
}
```

**6. ESP32-CAM capture & upload (attempt 1):**

```json
{
  "ok": true,
  "http": 201,
  "try": 1,
  "bytes": 42637,
  "id": 12,
  "photoUrl": "/api/v1/photos/12.jpg",
  "thumbUrl": "/api/v1/photos/12_thumb.jpg",
  "ts": "2025-10-24T13:05:32.000Z",
  "deviceId": "box-01",
  "meta": {
    "cm": 14.5
  }
}
```

**7. Backend publish event step:**

```json
{
  "step": "photo_ok"
}
```

**8. Backend send lock command:**

```
Topic: smartparcel/box-01/lock/set
Payload: {"state": "open"}
```

**9. ESP8266 send control ACK:**

```json
{
  "ok": true,
  "action": "lock",
  "state": "open"
}
```

**10. ESP8266 publish event step:**

```json
{
  "step": "lock_off"
}
```

**11. ESP8266 publish buzzer event:**

```json
{
  "step": "buzzer_60s"
}
```

**12. ESP8266 buzzer start 60 detik**

**13. After 60 seconds, ESP8266 send ACK:**

```json
{
  "ok": true,
  "action": "buzzer",
  "done": true
}
```

---

## 📱 PWA Dashboard Integration

### Real-time Updates

Dashboard dapat listen untuk semua ACK dan update UI:

```typescript
// Photo ACK
socket.on('smartparcel/box-01/photo/status', (data) => {
  if (data.ok) {
    showNotification(`📸 Foto berhasil upload (${data.bytes} bytes)`);
    addPhotoToGallery(data.photoUrl, data.thumbUrl);
  } else {
    showNotification(`❌ Upload gagal (attempt ${data.try}/3)`, 'error');
  }
});

// Control ACK
socket.on('smartparcel/box-01/control/ack', (data) => {
  if (data.action === 'lock' && data.state === 'open') {
    showNotification('📦 Paket dropped!');
  }
});

// Event Steps
socket.on('smartparcel/box-01/event', (data) => {
  if (data.step === 'wait_before_photo') {
    showProgress('📸 Capturing photo...');
  } else if (data.step === 'photo_ok') {
    showProgress('✅ Photo uploaded');
  } else if (data.step === 'lock_off') {
    showProgress('📦 Package dropping...');
  } else if (data.step === 'buzzer_60s') {
    showProgress('🔔 Buzzer activated');
  }
});
```

---

## 🧪 Testing Commands

### Test Photo Upload

```bash
# Publish capture command
mosquitto_pub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/cmd/capture" \
  -m '{"distance":15.5}'

# Subscribe to photo ACK
mosquitto_sub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/photo/status"
```

### Test Lock Control

```bash
# Release (drop)
mosquitto_pub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/lock/set" \
  -m '{"state":"open"}'

# Hold (lock)
mosquitto_pub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/lock/set" \
  -m '{"state":"closed"}'

# Subscribe to control ACK
mosquitto_sub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/control/ack"
```

### Test Buzzer

```bash
# Start buzzer (1 minute)
mosquitto_pub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/buzzer/trigger" \
  -m '{"ms":60000}'

# Subscribe to control ACK (akan dapat 2 ACK: start dan done)
mosquitto_sub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/control/ack"
```

### Monitor Event Steps

```bash
# Subscribe to all events
mosquitto_sub -h 13.213.57.228 -u smartbox -P engganngodinginginmcu \
  -t "smartparcel/box-01/event"
```

---

## 🎯 Implementation Status

### ESP32-CAM ✅
- [x] Photo ACK with full format
- [x] Control ACK for capture (ok:true / ok:false with "busy")
- [x] Retry logic (3 attempts with delay)
- [x] Parse backend response for id/photoUrl/thumbUrl/ts
- [x] Meta field with distance

### ESP8266 ✅
- [x] Control ACK for lock (state: "open"/"closed")
- [x] Control ACK for buzzer (start + done)
- [x] Event steps (wait_before_photo, lock_off, buzzer_60s, etc.)
- [x] Non-blocking buzzer with pattern (500ms ON, 300ms OFF)

### Backend 🔄
- [ ] Parse photo ACK and emit to PWA
- [ ] Handle event steps and trigger next actions
- [ ] Forward control ACK to PWA
- [ ] Callback logic: photo_ok → send lock command

---

## 📊 Message Flow Diagram

```
┌─────────────┐
│   ESP8266   │ Sensor detect (12-25 cm)
└──────┬──────┘
       ↓ MQTT publish: event {"type":"detect","cm":14.5}
       ↓ MQTT publish: event {"step":"wait_before_photo","ms":...}
┌──────────────┐
│   Backend    │ Receive detect event
└──────┬───────┘
       ↓ MQTT publish: cmd/capture {"distance":14.5}
┌──────────────┐
│  ESP32-CAM   │ Receive capture command
└──────┬───────┘
       ↓ MQTT publish: control/ack {"ok":true,"action":"capture"}
       ↓ Flash ON → Capture → Upload HTTP POST
       ↓ MQTT publish: photo/status (attempt 1) {"ok":true,"http":201,...}
┌──────────────┐
│   Backend    │ Receive photo ACK
└──────┬───────┘
       ↓ MQTT publish: event {"step":"photo_ok"}
       ↓ MQTT publish: lock/set {"state":"open"}
┌─────────────┐
│   ESP8266   │ Receive lock command
└──────┬──────┘
       ↓ MQTT publish: control/ack {"ok":true,"action":"lock","state":"open"}
       ↓ Solenoid OFF (release!)
       ↓ MQTT publish: event {"step":"lock_off"}
       ↓ MQTT publish: event {"step":"buzzer_60s"}
       ↓ Buzzer 60 seconds (500ms ON, 300ms OFF)
       ↓ MQTT publish: control/ack {"ok":true,"action":"buzzer","done":true}
```

---

**Format ACK ready for PWA/AI Agent integration! 🚀📡**
