import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
        manifest: {
          name: 'Smart Parcel Box',
          short_name: 'Parcel Box',
          description: 'Smart Parcel Box monitoring and control system',
          theme_color: '#1e40af',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: new RegExp(`^${API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/.*`),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
              },
            },
            {
              urlPattern: new RegExp(`^${API_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/media/.*`),
              handler: 'CacheFirst',
              options: {
                cacheName: 'media-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 5173,
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
        },
        '/media': {
          target: API_URL,
          changeOrigin: true,
        },
        '/ws': {
          target: API_URL.replace('http', 'ws'),
          ws: true,
        },
      },
    },
  };
});
