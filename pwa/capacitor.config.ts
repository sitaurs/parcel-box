import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartparcel.iot',
  appName: 'Smart Parcel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP connections for development
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
