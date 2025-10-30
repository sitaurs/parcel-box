import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartparcel.iot',
  appName: 'Smart Parcel',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // Changed to http to fix mixed content error
    cleartext: true, // Allow HTTP connections
    hostname: 'localhost',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a202c',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#4f46e5',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a202c',
    },
  },
};

export default config;
