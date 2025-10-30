import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
// DISABLED: Firebase not configured, causing crash
// import { notificationService } from './services/notificationService';

// Initialize native features for mobile app
const initNativeFeatures = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log('🚀 Running on native platform:', Capacitor.getPlatform());
    
    try {
      // Hide splash screen after React loads
      await SplashScreen.hide();
      
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1a202c' });
      
      // DISABLED: Initialize notifications - Firebase not configured
      // await notificationService.init();
      console.log('⚠️ Push notifications disabled (Firebase not configured)');
      
      console.log('✅ Native features initialized');
    } catch (error) {
      console.error('❌ Error initializing native features:', error);
    }
  } else {
    console.log('🌐 Running on web platform');
    
    // DISABLED: Initialize notifications for web
    // await notificationService.init();
    
    // Register service worker for web PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }
};

// Initialize and render app
initNativeFeatures();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
