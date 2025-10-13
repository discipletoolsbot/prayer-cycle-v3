<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePrayerCycleStore } from './stores/prayerCycle'
import { usePWA } from './composables/usePWA'
import { useI18n } from './composables/useI18n'
import { TimerService } from './utils/TimerService'
import { audioService } from './utils/AudioService'
import { storageService } from './utils/StorageService'
import { wakeLockService } from './utils/WakeLockService'
import { STEP_DURATION_SECONDS } from './constants/prayerSteps'
import type { UserSettings } from './types'
import StepDisplay from './components/StepDisplay.vue'
import ProgressIndicator from './components/ProgressIndicator.vue'
import TimerControls from './components/TimerControls.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import LanguageSelector from './components/LanguageSelector.vue'
import LanguageDropdown from './components/LanguageDropdown.vue'
import TopMenuBar from './components/TopMenuBar.vue'

const { t } = useI18n()

// Pinia store connection
const store = usePrayerCycleStore()

// PWA functionality
const { isOnline, isInstallable, installPWA, isPWA } = usePWA()

// Services
const timerService = new TimerService()

// Get step duration from URL parameter or use default
function getStepDuration(): number {
  const urlParams = new URLSearchParams(window.location.search)
  const stepParam = urlParams.get('step')
  
  if (stepParam) {
    const duration = parseInt(stepParam, 10)
    if (!isNaN(duration) && duration > 0) {
      console.log(`Using URL parameter step duration: ${duration} seconds`)
      return duration
    }
  }
  
  return STEP_DURATION_SECONDS
}

// Get the actual step duration to use
const actualStepDuration = getStepDuration()

// Detect device type based on screen size and user agent
function detectDeviceType(): 'mobile' | 'desktop' {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isSmallScreen = window.innerWidth < 768
  return isMobile || isSmallScreen ? 'mobile' : 'desktop'
}

// Device type detection and responsive behavior - initialize with detected type
const deviceType = ref<'mobile' | 'desktop'>(detectDeviceType())

// Menu state management
const showLanguageSelector = ref(false)
const showSettings = ref(false)
const settingsPanel = ref<InstanceType<typeof SettingsPanel> | null>(null)

// Update device type on window resize with debouncing to prevent excessive updates
let resizeTimeout: ReturnType<typeof setTimeout> | null = null

function handleResize() {
  // Debounce resize events to prevent excessive updates
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  
  resizeTimeout = setTimeout(() => {
    const newDeviceType = detectDeviceType()
    if (newDeviceType !== deviceType.value) {
      deviceType.value = newDeviceType
    }
    resizeTimeout = null
  }, 150) // 150ms debounce
}

// Screen wake lock functionality using the service
async function requestWakeLock() {
  if (store.status === 'active') {
    await wakeLockService.requestWakeLock()
  }
}

function releaseWakeLock() {
  wakeLockService.releaseWakeLock()
}

// Timer management
function handleTimerTick(remaining: number) {
  store.updateTimer(remaining)
}

function handleTimerComplete() {
  if (store.settings.audioEnabled) {
    const playAudio = async () => {
      try {
        if (!audioService.isInitialized()) {
          await audioService.initialize()
        }
        await audioService.playNotification()
      } catch (error) {
        console.warn('Failed to play audio notification:', error)
      }
    }
    playAudio() // Fire and forget - don't await
  }

  // Advance to next step immediately (don't wait for audio)
  store.completeStep()

  // Start timer for next step if not completed
  if (store.status === 'active') {
    startTimer()
  }
}

function startTimer() {
  if (store.timeRemaining > 0) {
    timerService.start(
      store.timeRemaining,
      handleTimerTick,
      handleTimerComplete
    )
  }
}

// Timer control handlers
async function handlePlay() {
  // Initialize audio on user interaction to satisfy Safari's autoplay policy
  if (store.settings.audioEnabled) {
    try {
      if (!audioService.isInitialized()) {
        await audioService.initialize()
      }
      // Ensure audio context is unlocked/resumed on Safari
      await audioService.unlockAudio()
    } catch (error) {
      console.warn('Audio initialization on play failed:', error)
    }
  }

  if (store.isIdle) {
    store.startCycle()
    startTimer()
    requestWakeLock()
  } else if (store.isPaused) {
    store.resumeTimer()
    timerService.resume(store.timeRemaining)
    requestWakeLock()
  }

  // Save session state
  storageService.saveSession({
    currentStep: store.currentStep,
    timeRemaining: store.timeRemaining,
    status: store.status,
    settings: store.settings
  })
}

function handlePause() {
  if (store.isActive) {
    const remaining = timerService.pause()
    store.pauseTimer()
    releaseWakeLock()
    
    // Save paused session state
    storageService.saveSession({
      currentStep: store.currentStep,
      timeRemaining: remaining,
      status: store.status,
      settings: store.settings
    })
  }
}

function handleNext() {
  timerService.stop()
  store.nextStep()
  
  if (store.status === 'active') {
    startTimer()
  } else if (store.isCompleted) {
    releaseWakeLock()
    storageService.clearSession()
  }
}

function handleRestart() {
  timerService.stop()
  store.restartCycle()
  releaseWakeLock()
  storageService.clearSession()
}

function handleSettingsUpdate(newSettings: Partial<UserSettings>) {
  store.updateSettings(newSettings)
  storageService.saveSettings(store.settings)
}

// Menu handlers
function handleToggleLanguage() {
  showLanguageSelector.value = !showLanguageSelector.value
  showSettings.value = false
}

function handleToggleSettings() {
  showLanguageSelector.value = false
  // Trigger the settings panel's toggle method
  if (settingsPanel.value) {
    settingsPanel.value.togglePanel()
  }
}

function handleLanguageSelected() {
  showLanguageSelector.value = false
}

function handleClickOutside(event: Event) {
  const target = event.target as Element
  if (!target.closest('.dropdown-panel') && !target.closest('.menu-icon-btn') && !target.closest('.settings-panel')) {
    showLanguageSelector.value = false
  }
}

// Computed properties for template
const currentStep = computed(() => store.currentPrayerStep)
const isTransitioning = computed(() => store.status === 'transitioning')

// Watch for status changes to manage wake lock
watch(() => store.status, (newStatus, oldStatus) => {
  if (newStatus === 'active' && oldStatus !== 'active') {
    requestWakeLock()
  } else if (newStatus !== 'active' && oldStatus === 'active') {
    releaseWakeLock()
  }
  
  // Save session state on status changes
  if (newStatus === 'active' || newStatus === 'paused') {
    storageService.saveSession({
      currentStep: store.currentStep,
      timeRemaining: store.timeRemaining,
      status: store.status,
      settings: store.settings
    })
  } else if (newStatus === 'completed' || newStatus === 'idle') {
    storageService.clearSession()
  }
})

// Watch for wake lock setting changes
watch(() => store.settings.wakeLockEnabled, (enabled) => {
  wakeLockService.setEnabled(enabled)

  // If enabling and currently active, request wake lock
  if (enabled && store.status === 'active') {
    requestWakeLock()
  }

  // Save updated settings
  storageService.saveSettings(store.settings)
})

// Theme management
function applyTheme(themeMode: 'auto' | 'light' | 'dark') {
  const htmlElement = document.documentElement

  if (themeMode === 'auto') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    htmlElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    // Use user preference
    htmlElement.setAttribute('data-theme', themeMode)
  }
}

// Watch for theme mode changes
watch(() => store.settings.themeMode, (themeMode) => {
  applyTheme(themeMode)
  storageService.saveSettings(store.settings)
})

// Listen for system theme changes when in auto mode
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
function handleSystemThemeChange() {
  if (store.settings.themeMode === 'auto') {
    applyTheme('auto')
  }
}
darkModeMediaQuery.addEventListener('change', handleSystemThemeChange)

// Component lifecycle hooks
onMounted(async () => {
  // Set custom step duration from URL parameter
  store.setStepDuration(actualStepDuration)
  
  // Add resize listener for device type detection
  window.addEventListener('resize', handleResize)
  
  // Load settings from storage
  const savedSettings = storageService.loadSettings()
  
  // The deviceType ref is already initialized with detectDeviceType() result
  const currentDetectedType = detectDeviceType()
  
  // For now, always use auto-detection to fix the current issue
  // In the future, we can add a user preference toggle
  deviceType.value = currentDetectedType
  
  store.updateSettings(savedSettings)

  // Apply theme based on saved settings
  applyTheme(savedSettings.themeMode || 'auto')

  // Set audio enabled flag (actual initialization happens on user interaction in handlePlay)
  audioService.setEnabled(savedSettings.audioEnabled)

  // Initialize wake lock service
  wakeLockService.setEnabled(savedSettings.wakeLockEnabled)
  
  // Attempt session recovery
  const savedSession = storageService.loadSession()
  if (savedSession && (savedSession.status === 'active' || savedSession.status === 'paused')) {
    // Restore session state using the store method
    store.restoreSession(savedSession)
    
    // If session was active, start timer
    if (savedSession.status === 'active') {
      startTimer()
      requestWakeLock()
    }
    
    console.log('Prayer session recovered from storage')
  }
  
  // Handle page visibility changes for timer management
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // Handle clicks outside dropdowns
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Cleanup timer service
  timerService.stop()

  // Dispose wake lock service
  wakeLockService.dispose()

  // Remove event listeners
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('click', handleClickOutside)
  darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange)

  // Dispose audio service
  audioService.dispose()

  // Save final session state if in progress
  if (store.status === 'active' || store.status === 'paused') {
    storageService.saveSession({
      currentStep: store.currentStep,
      timeRemaining: store.timeRemaining,
      status: store.status,
      settings: store.settings
    })
  }
})

// Handle page visibility changes (tab switching, minimizing)
function handleVisibilityChange() {
  if (document.hidden) {
    // Page is hidden - save current state
    if (store.status === 'active' || store.status === 'paused') {
      storageService.saveSession({
        currentStep: store.currentStep,
        timeRemaining: store.timeRemaining,
        status: store.status,
        settings: store.settings
      })
    }
  } else {
    // Page is visible again - timer service handles timing compensation automatically
    if (store.status === 'active') {
      requestWakeLock()
    }
    // Let wake lock service handle visibility changes
    wakeLockService.handleVisibilityChange()
  }
}
</script>

<template>
  <!-- Top Menu Bar - Always at top -->
  <TopMenuBar
    :is-installable="isInstallable"
    :is-p-w-a="isPWA"
    @install="installPWA"
    @toggle-language="handleToggleLanguage"
    @toggle-settings="handleToggleSettings"
  />
  
  <!-- Language Selector Dropdown -->
  <div v-if="showLanguageSelector" class="dropdown-panel">
    <LanguageDropdown @language-selected="handleLanguageSelected" />
  </div>
  
  <!-- Settings Panel -->
  <SettingsPanel
    ref="settingsPanel"
    :settings="store.settings"
    :device-type="deviceType"
    @update-settings="handleSettingsUpdate"
  />

  <!-- Mobile Layout -->
  <div v-if="deviceType === 'mobile'" class="prayer-app-mobile">
    <!-- Offline Status Banner -->
    <div v-if="!isOnline" class="offline-banner">
      <span class="offline-icon">📱</span>
      <span class="offline-text">Offline Mode - All features available</span>
    </div>

    <!-- Mobile Timer Controls -->
    <div class="mobile-controls">
      <TimerControls
        :status="store.status"
        :device-type="deviceType"
        @play="handlePlay"
        @pause="handlePause"
        @next="handleNext"
        @restart="handleRestart"
      />
    </div>

    <!-- Mobile Main Content -->
    <main class="prayer-main-mobile">
      <!-- Step Display Section -->
      <section class="prayer-step-section-mobile">
        <StepDisplay 
          :step="currentStep"
          :time-remaining="store.timeRemaining"
          :device-type="deviceType"
          :is-transitioning="isTransitioning"
        />
      </section>

      <!-- Progress Indicator Section -->
      <section class="prayer-progress-section-mobile">
        <ProgressIndicator 
          :current-step="store.stepProgress.current"
          :total-steps="store.stepProgress.total"
          :time-remaining="store.timeRemaining"
          :step-duration="actualStepDuration"
          :device-type="deviceType"
          :is-completed="store.isCompleted"
        />
      </section>


    </main>
  </div>

  <!-- Desktop Layout -->
  <div v-else class="prayer-app-desktop-wrapper">
    <!-- Offline Status Banner -->
    <div v-if="!isOnline" class="offline-banner desktop">
      <span class="offline-icon">💻</span>
      <span class="offline-text">Offline Mode - All features available</span>
    </div>

    <!-- Desktop Timer Controls (outside grid) -->
    <div class="desktop-controls">
      <TimerControls
        :status="store.status"
        :device-type="deviceType"
        @play="handlePlay"
        @pause="handlePause"
        @next="handleNext"
        @restart="handleRestart"
      />
    </div>

    <!-- Desktop Grid Layout -->
    <div class="prayer-app-desktop">
    <!-- Desktop Main Content -->
    <main class="prayer-main-desktop">
      <StepDisplay 
        :step="currentStep"
        :time-remaining="store.timeRemaining"
        :device-type="deviceType"
        :is-transitioning="isTransitioning"
      />
    </main>

    <!-- Desktop Sidebar -->
    <aside class="prayer-sidebar-desktop">
      <!-- Progress Section -->
      <section class="flex flex-col items-center">
        <h2 class="text-xl font-semibold text-primary mb-md">{{ t('prayer.progress.total_progress') }}</h2>
        <ProgressIndicator 
          :current-step="store.stepProgress.current"
          :total-steps="store.stepProgress.total"
          :time-remaining="store.timeRemaining"
          :step-duration="actualStepDuration"
          :device-type="deviceType"
          :is-completed="store.isCompleted"
        />
      </section>

    </aside>

    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles that override the global layout system */

/* Header styles */
.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: var(--spacing-sm);
}

/* Ensure smooth transitions between layouts */
.prayer-app-mobile,
.prayer-app-desktop {
  transition: all 0.3s ease-in-out;
}

/* Mobile-specific adjustments */
.prayer-app-mobile {
  /* Additional mobile-specific styles if needed */
}

/* Desktop-specific adjustments */
.prayer-app-desktop {
  /* Additional desktop-specific styles if needed */
}

/* Responsive adjustments for the demo */
@media (max-width: 767px) {
  .prayer-header-mobile .flex {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .prayer-header-mobile .btn {
    width: 100%;
    max-width: 200px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet adjustments for mobile layout */
  .prayer-main-mobile {
    max-width: 800px;
    margin: 0 auto;

  }
}

@media (min-width: 1024px) {
  /* Desktop layout is already handled by the CSS grid system */
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .prayer-app-mobile,
  .prayer-app-desktop {
    transition: none;
  }
}

/* PWA Offline and Install Banners */
.offline-banner {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: var(--spacing-xs) var(--spacing-sm);
  text-align: center;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  position: relative;
  z-index: 999;
}

.offline-banner.desktop {
  font-size: 1rem;
  padding: var(--spacing-sm) var(--spacing-md);
}

.offline-icon {
  font-size: 1.2em;
}

.offline-text {
  font-weight: 500;
}

/* Dropdown Panel Styles */
.dropdown-panel {
  position: absolute;
  top: var(--header-height);
  right: var(--spacing-lg);
  z-index: var(--z-dropdown);
  background: var(--color-background);
  border: 1px solid var(--color-text-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-md);
  min-width: 250px;
  max-width: 90vw;
  overflow: hidden;
}

/* RTL support for dropdown panel */
[dir="rtl"] .dropdown-panel {
  right: auto;
  left: var(--spacing-lg);
}


/* Layout adjustments - no padding needed for static header */
.prayer-app-mobile,
.prayer-app-desktop-wrapper {
  /* No padding-top needed since header is now static */
}

/* Desktop wrapper to contain controls outside grid */
.prayer-app-desktop-wrapper {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - var(--header-height));
  overflow-y: auto;
}

/* Override the grid padding since it's now inside wrapper */
.prayer-app-desktop-wrapper .prayer-app-desktop {
  padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
  flex: 1;
}

/* Mobile and Desktop Control Styles */
.mobile-controls {
  display: flex;
  justify-content: center;
  padding: 0;
  background: var(--color-background-soft);
  border-radius: var(--radius-lg);
  margin: 0;
}

.desktop-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-background-soft);
  border-radius: var(--radius-xl);
  margin: 0 auto;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .mobile-controls,
  .desktop-controls,
  .prayer-sidebar-desktop {
    border: 2px solid var(--color-text);
  }
  
  .dropdown-panel {
    border: 2px solid var(--color-text);
  }
  
  .offline-banner {
    border: 2px solid var(--color-text);
    background-color: var(--color-background);
  }
}

/* Responsive adjustments for desktop wrapper */
@media (min-width: 1024px) and (max-width: 1439px) {
  .prayer-app-desktop-wrapper .prayer-app-desktop {
    padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
  }
}

@media (min-width: 1440px) {
  .prayer-app-desktop-wrapper .prayer-app-desktop {
    padding: 0 var(--spacing-xxl) var(--spacing-xxl) var(--spacing-xxl);
  }
  
  .desktop-controls {
    width: calc(100% - 2 * var(--spacing-xxl));
  }
}

@media (min-width: 1920px) {
  .prayer-app-desktop-wrapper .prayer-app-desktop {
    padding: 0 var(--spacing-3xl) var(--spacing-3xl) var(--spacing-3xl);
  }
  
  .desktop-controls {
    width: calc(100% - 2 * var(--spacing-3xl));
  }
}
</style>
