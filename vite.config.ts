import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative base so the static build can be hosted from any path.
  base: './',
  plugins: [
    react(),
    // Installable web app: Chrome/Edge offer "Install", it opens in its own window, can be
    // pinned to the taskbar, and works offline after the first visit.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Icons are already matched by globPatterns; adding them twice breaks precaching.
      includeManifestIcons: false,
      manifest: {
        name: 'Retro Arcade Revival',
        short_name: 'Retro Arcade',
        description: 'Free, instant-play retro arcade games. Starring Bopple.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#07051a',
        theme_color: '#140c2e',
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'arcade-icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
});
