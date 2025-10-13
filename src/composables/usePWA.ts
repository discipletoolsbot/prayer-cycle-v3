import { ref, onMounted, onUnmounted } from 'vue'
import { offlineService } from '@/utils/OfflineService'

/**
 * Composable for PWA functionality and offline state management
 */
export function usePWA() {
  const isOnline = ref(navigator.onLine)
  const isInstallable = ref(false)
  const deferredPrompt = ref<any>(null)

  // Handle online/offline status
  const handleOnline = () => {
    isOnline.value = true
  }

  const handleOffline = () => {
    isOnline.value = false
  }

  // Handle PWA install prompt
  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt.value = e
    isInstallable.value = true
  }

  // Install PWA
  const installPWA = async () => {
    if (!deferredPrompt.value) return false

    try {
      // Show the install prompt
      deferredPrompt.value.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.value.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the PWA install prompt')
      } else {
        console.log('User dismissed the PWA install prompt')
      }

      // Clear the deferredPrompt
      deferredPrompt.value = null
      isInstallable.value = false

      return outcome === 'accepted'
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }

  // Check if app is running as PWA
  const isPWA = () => {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
             (window.navigator as any).standalone === true
    } catch (error) {
      return false
    }
  }

  onMounted(() => {
    // Set up offline service callbacks
    offlineService.onOnline(handleOnline)
    offlineService.onOffline(handleOffline)

    // Set up PWA install prompt listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Initial online state
    isOnline.value = offlineService.isOnline
  })

  onUnmounted(() => {
    // Clean up offline service callbacks
    offlineService.removeOnlineCallback(handleOnline)
    offlineService.removeOfflineCallback(handleOffline)

    // Remove PWA install prompt listener
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  })

  return {
    isOnline,
    isInstallable,
    installPWA,
    isPWA: isPWA()
  }
}