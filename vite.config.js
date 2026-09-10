import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// Where the app is served from. GitHub Pages serves it under the repo
// subpath; a domain of its own (field.cdelectrical.co.nz) would serve it at
// the root, and this one value is all that has to change:
//
//     APP_BASE=/ npm run build
//
const base = process.env.APP_BASE ?? '/cde-field/'

export default defineConfig({
  base,
  server: { port: 5300, strictPort: true },
  define: {
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA ?? 'dev'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Cassidy-Davies Electrical — Field',
        short_name: 'CDE Field',
        description: 'On-site task progress for Cassidy-Davies electricians.',
        theme_color: '#ffffff',
        background_color: '#f4f6f8',
        display: 'standalone',
        // Its own scope, so this and the dashboard can both be installed from
        // the same origin without one service worker claiming the other's
        // pages. Scope is path-based, which is the whole reason a repo
        // subpath works here.
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Fonts are precached here, unlike the dashboard: this is opened on a
        // phone on site, where a slow connection means a visible flash of
        // fallback text before the real face loads.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
