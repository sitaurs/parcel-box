# PIN Authentication Flow - FIXED

## ❌ Bug yang Diperbaiki

**Masalah**: PIN setup muncul SEBELUM login, bahkan saat user belum authenticate.

**Penyebab**: 
- `needsPinSetup` flag di-set di `initializeAuth()` saat app pertama kali load
- PIN setup screen di-render di luar `ProtectedRoute`

## ✅ Solusi

### 1. **Pindahkan PIN Setup ke Dalam ProtectedRoute**

PIN setup dan unlock sekarang hanya muncul SETELAH user berhasil login dan masuk ke dalam protected area.

```tsx
// App.tsx - Flow yang Benar
<ProtectedRoute>
  {isLoading && <LoadingScreen />}
  {needsPinUnlock && user && <PINUnlock />}
  {needsPinSetup && user && !needsPinUnlock && <PINSetup />}
  {showOnboarding && <Onboarding />}
  {/* Main App */}
</ProtectedRoute>
```

### 2. **Hanya Set needsPinSetup Saat Fresh Login**

`initializeAuth()` sekarang TIDAK lagi check PIN setup saat restore session dari localStorage.

```tsx
// AuthContext.tsx - initializeAuth()
const initializeAuth = async () => {
  // ... token validation ...
  
  // ✅ Only check PIN unlock (for returning users)
  if (isMobile && userPin && timeSinceLastActivity > 30min) {
    setNeedsPinUnlock(true);
    return;
  }
  
  // ❌ DON'T check needsPinSetup here!
  // Only set it on fresh login
  
  setUser(userData);
}
```

```tsx
// AuthContext.tsx - login()
const login = async (email: string, password: string) => {
  // ... login logic ...
  
  // ✅ Check PIN setup ONLY after fresh login
  const isMobile = isMobileDevice();
  const userPin = localStorage.getItem('userPin');
  if (isMobile && !userPin) {
    setNeedsPinSetup(true); // First time login on mobile
  }
}
```

## 🎯 Flow yang Benar

### A. First Time Login (Mobile)

```
┌─────────────────┐
│  Login Page     │ ← User start here (NOT logged in)
└────────┬────────┘
         │ Enter email & password
         ▼
┌─────────────────┐
│  POST /login    │
└────────┬────────┘
         │ Success → Set token, user
         ▼
┌─────────────────┐
│ ProtectedRoute  │ ← User NOW authenticated
└────────┬────────┘
         │ isAuthenticated = true
         ▼
┌─────────────────┐
│   PIN Setup     │ ← Show ONLY if mobile & no PIN
└────────┬────────┘
         │ Create PIN → Save to localStorage
         ▼
┌─────────────────┐
│   Onboarding    │ ← If not completed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
```

### B. Return User - Recent Activity (< 30 min)

```
┌─────────────────┐
│   Open App      │
└────────┬────────┘
         │ Check localStorage
         ▼
┌─────────────────┐
│ initializeAuth()│
└────────┬────────┘
         │ token valid, lastActivity < 30min
         │ ❌ DON'T show PIN setup (already have PIN)
         ▼
┌─────────────────┐
│   Dashboard     │ ← Direct access
└─────────────────┘
```

### C. Return User - Inactive (> 30 min)

```
┌─────────────────┐
│   Open App      │
└────────┬────────┘
         │ Check localStorage
         ▼
┌─────────────────┐
│ initializeAuth()│
└────────┬────────┘
         │ token valid, lastActivity > 30min
         │ has PIN
         ▼
┌─────────────────┐
│  PIN Unlock     │ ← Verify PIN
└────────┬────────┘
         │ PIN correct
         ▼
┌─────────────────┐
│   Dashboard     │
└─────────────────┘
```

### D. Session Expired

```
┌─────────────────┐
│   Open App      │
└────────┬────────┘
         │ Check localStorage
         ▼
┌─────────────────┐
│ initializeAuth()│
└────────┬────────┘
         │ token expired!
         │ logout() + clear localStorage
         ▼
┌─────────────────┐
│   Login Page    │ ← Must login again
└─────────────────┘
```

## 🔍 Key Changes Summary

### Before (Bug):
```tsx
// App.tsx
function AppContent() {
  // ❌ PIN setup rendered OUTSIDE ProtectedRoute
  if (needsPinSetup && user) {
    return <PINSetup />;
  }
  
  return (
    <BrowserRouter>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoute>...</ProtectedRoute>} />
    </BrowserRouter>
  );
}

// AuthContext.tsx - initializeAuth()
if (isMobile && !userPin) {
  setNeedsPinSetup(true); // ❌ Set even on app reload!
}
```

### After (Fixed):
```tsx
// App.tsx
function AppContent() {
  return (
    <BrowserRouter>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          {/* ✅ PIN setup INSIDE ProtectedRoute */}
          {needsPinSetup && user && <PINSetup />}
          <MainApp />
        </ProtectedRoute>
      } />
    </BrowserRouter>
  );
}

// AuthContext.tsx - initializeAuth()
// ✅ DON'T check PIN setup during init
// Only check PIN unlock for returning users

// AuthContext.tsx - login()
if (isMobile && !userPin) {
  setNeedsPinSetup(true); // ✅ Only set on fresh login
}
```

## ✅ Testing Checklist

### Test 1: First Login (Mobile)
1. Clear localStorage
2. Open app → Should see Login page ✅
3. Login with credentials
4. Should see PIN Setup ✅
5. Create PIN
6. Should see Onboarding (if not done) ✅
7. Should see Dashboard ✅

### Test 2: Reload After Login
1. Complete Test 1
2. Reload page (F5)
3. Should see Dashboard directly ✅
4. Should NOT see PIN setup again ❌

### Test 3: Return After 30+ Minutes
1. Complete Test 1
2. Set lastActivity to old timestamp:
   ```js
   localStorage.setItem('lastActivity', Date.now() - (31*60*1000));
   ```
3. Reload page
4. Should see PIN Unlock ✅
5. Enter PIN
6. Should see Dashboard ✅

### Test 4: Desktop Login
1. Open app on desktop (width > 768px)
2. Login
3. Should NOT see PIN setup ❌
4. Should see Onboarding/Dashboard directly ✅

### Test 5: Session Expired
1. Login
2. Manually expire token or wait 7 days
3. Reload page
4. Should redirect to Login page ✅

## 📝 Code References

### Files Modified:
- ✅ `pwa/src/App.tsx` - Moved PIN screens inside ProtectedRoute
- ✅ `pwa/src/contexts/AuthContext.tsx` - Removed PIN check from initializeAuth

### Files Unchanged:
- ✅ `pwa/src/components/PINSetup.tsx` - Works as before
- ✅ `pwa/src/components/PINUnlock.tsx` - Works as before
- ✅ `pwa/src/components/ProtectedRoute.tsx` - Works as before

## 🎉 Result

**Before**: PIN setup muncul sebelum login ❌
**After**: PIN setup hanya muncul setelah login berhasil ✅

Flow sekarang benar:
1. Login Page (public)
2. Login berhasil → masuk ProtectedRoute
3. PIN Setup (jika mobile & first time)
4. Onboarding (jika belum selesai)
5. Dashboard

---

**Fixed**: October 27, 2025
**Issue**: PIN setup showing before login
**Solution**: Move PIN screens inside ProtectedRoute, only set needsPinSetup on fresh login
