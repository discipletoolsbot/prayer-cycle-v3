import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)

app.mount('#app')

// Register service worker for PWA functionality with automatic updates
if ('serviceWorker' in navigator) {
  // Import the PWA registration from vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        // New content available, prompt user to reload
        if (confirm('A new version of Prayer Cycle is available. Reload to update?')) {
          updateSW(true) // Pass true to reload the page
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline')
      },
      onRegistered(registration) {
        console.log('Service Worker registered successfully')

        // Check for updates every hour
        if (registration) {
          setInterval(() => {
            registration.update().catch(err => {
              console.error('Failed to check for updates:', err)
            })
          }, 60 * 60 * 1000) // Check every hour
        }
      },
      onRegisterError(error) {
        console.error('Service Worker registration failed:', error)
      }
    })
  })
}
