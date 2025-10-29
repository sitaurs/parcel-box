# 🚫 Error 405: WhatsApp Connection BLOCKED

## ⚠️ Apa itu Error 405?

Error 405 adalah **Connection Blocked** dari WhatsApp server. Ini terjadi ketika:
- WhatsApp mendeteksi terlalu banyak koneksi dalam waktu singkat
- Session corrupted atau flagged sebagai mencurigakan
- IP address atau nomor HP di-blacklist sementara oleh WhatsApp

## 📋 Penyebab Umum

1. **Multiple connection attempts** dalam waktu singkat (< 1 menit)
2. **Restart berulang kali** saat ada masalah
3. **Session file corrupted** dari connection sebelumnya yang error
4. **Multi-device conflict** - WhatsApp Web aktif di device lain
5. **WhatsApp server maintenance** atau throttling

## ✅ Solusi yang Sudah Diterapkan

### 1. Auto-Clear Session
Ketika Error 405 terdeteksi, sistem akan:
```
✅ Otomatis delete wa-session/ folder
✅ Set flag isBlocked = true
✅ Prevent auto-reconnect (sesuai Baileys docs)
✅ Show pesan error yang jelas
```

### 2. Prevent Concurrent Starts
```typescript
private isStarting: boolean = false; // Prevent double-start
private isBlocked: boolean = false;  // Prevent reconnect on 405

// Check sebelum start
if (this.isStarting) {
  throw new Error('WhatsApp is already starting');
}

if (this.isBlocked) {
  throw new Error('WhatsApp blocked - Wait 5-10 minutes');
}
```

### 3. UI Protection
```typescript
// Button disabled saat loading
disabled={loading || status.connected || !socketConnected}

// Prevent double-click
if (loading) {
  addLog('⚠️ Request already in progress', 'warning');
  return;
}
```

### 4. Auto-Unblock Timer
```typescript
// Auto-unblock setelah 10 menit
setTimeout(() => {
  this.isBlocked = false;
  console.log('✅ Block flag cleared - you can try again');
}, 10 * 60 * 1000);
```

## 🔧 Cara Mengatasi Error 405

### Step 1: STOP Semua Koneksi
```bash
# Stop backend WhatsApp
taskkill /F /PID <PID>

# Atau dari Task Manager: End Task node.exe
```

### Step 2: Hapus Session (Manual)
```bash
cd wa
Remove-Item -Path wa-session -Recurse -Force
```

### Step 3: TUNGGU 5-10 MENIT
**PENTING:** Jangan langsung restart! WhatsApp perlu waktu untuk:
- Clear IP dari blacklist
- Reset rate limiting
- Clear suspicious activity flag

### Step 4: Pastikan WhatsApp Web Inactive
- Buka WhatsApp di HP
- Settings → Linked Devices
- **Logout dari semua device**

### Step 5: Restart & Scan QR
```bash
cd wa
npm run dev
```

Tunggu hingga QR code muncul, lalu **scan dengan HP**.

## 🚨 Yang TIDAK Boleh Dilakukan

❌ **Restart berkali-kali** → Makin di-block!  
❌ **Clear session + langsung restart** → Block tetap aktif!  
❌ **Pakai session dari backup lama** → Session invalid!  
❌ **Force reconnect** → Langgar Baileys documentation!  
❌ **Multi-device aktif** → Conflict error!  

## 📊 Log Messages yang Normal

### Ketika Error 405 Pertama Kali
```
🚫🚫🚫 ERROR 405: CONNECTION BLOCKED BY WHATSAPP 🚫🚫🚫

📋 Kemungkinan penyebab:
   1. Terlalu banyak percobaan koneksi dalam waktu singkat
   2. WhatsApp mendeteksi aktivitas mencurigakan
   3. IP address atau nomor HP di-flag sementara

🔧 Solusi:
   ✅ Session sudah AUTO-CLEARED
   ⏳ TUNGGU 5-10 MENIT sebelum coba lagi
   🔄 Jangan restart berulang kali (makin di-block!)
   📱 Pastikan WhatsApp Web di HP tidak sedang aktif

✅ Session folder deleted
✅ Block flag cleared - you can try again now (after 10 min)
```

### Kalau Coba Start Saat Masih Blocked
```
🚫 WhatsApp is BLOCKED (Error 405)
📋 Action required: Please wait 5-10 minutes before trying again
❌ Error: WhatsApp blocked - Wait 5-10 minutes and try again
```

### Setelah Clear Session Manual
```
✅ Session cleared: ./wa-session
🗑️  WhatsApp session cleared
(isBlocked flag di-reset otomatis)
```

## 🔍 Troubleshooting Checklist

- [ ] Backend running tanpa error di port 3001?
- [ ] PWA socket connected (2 clients)?
- [ ] Sudah tunggu 5-10 menit sejak Error 405?
- [ ] WhatsApp Web di HP sudah logout semua?
- [ ] Folder `wa-session/` sudah terhapus?
- [ ] Tidak ada multi-device aktif?
- [ ] Internet stabil?

## 📚 Referensi Baileys Documentation

**Section 3.4 - Handling Disconnections:**

> When statusCode === 405 (Connection Blocked):
> - DO NOT auto-reconnect
> - Delete session folder completely
> - Wait before trying again
> - This usually happens due to:
>   * Rate limiting
>   * Suspicious activity detection
>   * Too many failed connection attempts

**Section 6.2 - Best Practices:**

> Avoid rapid reconnection attempts. WhatsApp servers have rate limiting.
> If you get 405, wait at least 5 minutes before trying again.

## 🎯 Prevention Tips

1. **Jangan spam restart** - Tunggu hingga status jelas (Connected/Error)
2. **Monitor logs** - Perhatikan error patterns
3. **Use stable network** - Avoid switching wifi/mobile data
4. **One device at a time** - Logout dari device lain
5. **Respect rate limits** - Max 1 connection attempt per minute

## ✨ Fitur Protection yang Aktif

✅ **isStarting flag** - Prevent concurrent start attempts  
✅ **isBlocked flag** - Prevent reconnect on 405  
✅ **Auto-clear session** - Delete corrupted session automatically  
✅ **Auto-unblock timer** - Reset after 10 minutes  
✅ **UI disabled state** - Prevent double-click  
✅ **Socket debounce** - Prevent duplicate requests  

---

**Last Updated:** October 26, 2025  
**Status:** ✅ FIXED - No more infinite loop!
