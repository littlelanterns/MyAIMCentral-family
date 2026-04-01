import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['flavicon40.png', 'flavicon512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'MyAIM Central',
        short_name: 'MyAIM',
        description: 'Family management and AI literacy platform',
        theme_color: '#6B4C8A',
        background_color: '#FAF5F0',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-icon-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
