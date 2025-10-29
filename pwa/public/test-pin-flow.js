// Test Script untuk PIN Flow
// Paste di Browser Console (F12)

console.log('=== PIN Flow Test Script ===\n');

// Test 1: Check current auth state
console.log('1. Current Auth State:');
console.log('   - Token:', localStorage.getItem('token') ? 'EXISTS' : 'NONE');
console.log('   - User:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'NONE');
console.log('   - PIN:', localStorage.getItem('userPin') ? 'SET' : 'NOT SET');
console.log('   - Last Activity:', localStorage.getItem('lastActivity'));
console.log('   - Onboarding:', localStorage.getItem('onboarding_completed') ? 'DONE' : 'PENDING');

// Test 2: Clear all auth data (simulate first time)
window.clearAuth = function() {
  console.log('\n2. Clearing all auth data...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userPin');
  localStorage.removeItem('lastActivity');
  localStorage.removeItem('onboarding_completed');
  console.log('   ✅ Auth cleared. Reload page to see login screen.');
};

// Test 3: Simulate old lastActivity (force PIN unlock)
window.simulateInactive = function() {
  console.log('\n3. Simulating 31 minutes of inactivity...');
  const oldTime = Date.now() - (31 * 60 * 1000); // 31 minutes ago
  localStorage.setItem('lastActivity', oldTime.toString());
  console.log('   ✅ Last activity set to:', new Date(oldTime).toLocaleTimeString());
  console.log('   Reload page to see PIN unlock screen.');
};

// Test 4: Reset PIN (force PIN setup on next login)
window.resetPIN = function() {
  console.log('\n4. Resetting PIN...');
  localStorage.removeItem('userPin');
  console.log('   ✅ PIN removed. Login again to setup new PIN.');
};

// Test 5: Check if mobile
window.checkMobile = function() {
  console.log('\n5. Device Detection:');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  console.log('   - User Agent:', navigator.userAgent);
  console.log('   - Window Width:', window.innerWidth);
  console.log('   - Is Mobile:', isMobile ? '✅ YES' : '❌ NO');
  console.log('   - PIN feature:', isMobile ? 'ENABLED' : 'DISABLED');
};

// Test 6: Show all localStorage
window.showStorage = function() {
  console.log('\n6. All localStorage items:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`   - ${key}:`, value);
  }
};

// Show available commands
console.log('\n📋 Available Commands:');
console.log('   clearAuth()       - Clear all auth data');
console.log('   simulateInactive() - Force PIN unlock screen');
console.log('   resetPIN()        - Remove PIN (setup again)');
console.log('   checkMobile()     - Check if device is mobile');
console.log('   showStorage()     - Show all localStorage');
console.log('\n');

// Auto-run initial check
console.log('Running initial check...\n');
window.checkMobile();
