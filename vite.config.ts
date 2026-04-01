import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA plugin removed — vite-plugin-pwa@1.2.0 doesn't support vite 8 yet.
    // PRD-33 (Offline/PWA) is post-MVP. Re-add when vite-plugin-pwa supports vite 8.
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
