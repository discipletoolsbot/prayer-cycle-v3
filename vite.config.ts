import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      // Check for updates every hour
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}'],
        // Force the service worker to skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Prayer Cycle - Biblical Prayer Guide',
        short_name: 'Prayer Cycle',
        description: 'A guided prayer application that leads you through 12 biblical prayer methods over 60 minutes',
        theme_color: '#2cace2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['lifestyle', 'spirituality'],
        icons: [
          {
            src: 'favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: 'favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
})
