<template>
  <div 
    :class="[
      'settings-panel',
      `settings-panel--${deviceType}`,
      { 'settings-panel--open': isOpen }
    ]"
  >


    <!-- Settings Panel Content -->
    <div 
      v-if="isOpen"
      class="settings-panel__content"
      @click.stop
    >
      <div class="settings-panel__header">
        <h3 class="settings-panel__title">Settings</h3>
        <button
          class="settings-panel__close"
          aria-label="Close settings"
          @click="closePanel"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="settings-panel__body">
        <!-- Audio Settings -->
        <div class="settings-panel__section">
          <h4 class="settings-panel__section-title">Audio</h4>
          <div class="settings-panel__option">
            <label class="settings-panel__label">
              <input
                type="checkbox"
                class="settings-panel__checkbox"
                :checked="settings.audioEnabled"
                @change="updateAudioSetting"
              />
              <span class="settings-panel__checkbox-custom"></span>
              <span class="settings-panel__label-text">
                Enable audio notifications
              </span>
            </label>
            <p class="settings-panel__description">
              Play gentle sounds when transitioning between prayer steps
            </p>
          </div>
        </div>

        <!-- Wake Lock Settings -->
        <div class="settings-panel__section">
          <h4 class="settings-panel__section-title">Screen</h4>
          <div class="settings-panel__option">
            <label class="settings-panel__label">
              <input
                type="checkbox"
                class="settings-panel__checkbox"
                :checked="settings.wakeLockEnabled"
                :disabled="!wakeLockSupported"
                @change="updateWakeLockSetting"
              />
              <span class="settings-panel__checkbox-custom"></span>
              <span class="settings-panel__label-text">
                Keep screen awake during prayer
              </span>
            </label>
            <p class="settings-panel__description">
              <span v-if="wakeLockSupported">
                Prevent screen from dimming or turning off during prayer sessions
              </span>
              <span v-else class="settings-panel__description--warning">
                Screen wake lock is not supported in this browser
              </span>
            </p>
          </div>
        </div>

      </div>

      <!-- Version Footer -->
      <div class="settings-panel__footer">
        <span class="settings-panel__version">Version {{ appVersion }}</span>
      </div>
    </div>

    <!-- Backdrop -->
    <div 
      v-if="isOpen"
      class="settings-panel__backdrop"
      @click="closePanel"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { UserSettings } from '@/types'
import { wakeLockService } from '@/utils/WakeLockService'
import packageJson from '../../package.json'

interface Props {
  settings: UserSettings
  deviceType?: 'mobile' | 'desktop'
}

interface Emits {
  updateSettings: [settings: Partial<UserSettings>]
}

const props = withDefaults(defineProps<Props>(), {
  deviceType: 'mobile'
})

const emit = defineEmits<Emits>()

// Component state
const isOpen = ref(false)

// Computed properties
const wakeLockSupported = computed(() => wakeLockService.isWakeLockSupported())
const appVersion = computed(() => packageJson.version)

// Event handlers
function togglePanel(): void {
  isOpen.value = !isOpen.value
}

function closePanel(): void {
  isOpen.value = false
}

function updateAudioSetting(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('updateSettings', { audioEnabled: target.checked })
}

function updateWakeLockSetting(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('updateSettings', { wakeLockEnabled: target.checked })
}


// Expose methods for parent components
defineExpose({
  togglePanel,
  closePanel
})
</script>

<style scoped>
.settings-panel {
  position: relative;
  z-index: 1000;
}



.settings-panel__content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  max-width: 90vw;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 1001;
}

.settings-panel__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.settings-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.settings-panel__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.settings-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-panel__close:hover {
  background: var(--color-background-secondary);
  color: var(--color-text);
}

.settings-panel__close svg {
  width: 16px;
  height: 16px;
}

.settings-panel__body {
  padding: var(--spacing-md);
}

.settings-panel__section {
  margin-bottom: var(--spacing-lg);
}

.settings-panel__section:last-child {
  margin-bottom: 0;
}

.settings-panel__section-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.settings-panel__option {
  margin-bottom: var(--spacing-md);
}

.settings-panel__option:last-child {
  margin-bottom: 0;
}

.settings-panel__label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  cursor: pointer;
  margin-bottom: var(--spacing-xs);
}

.settings-panel__checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.settings-panel__checkbox-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: 0.25rem;
  background: var(--color-background);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 1px;
}

.settings-panel__checkbox:checked + .settings-panel__checkbox-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.settings-panel__checkbox:checked + .settings-panel__checkbox-custom::after {
  content: '';
  width: 4px;
  height: 8px;
  border: 2px solid white;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
  margin-top: -2px;
}

.settings-panel__checkbox:disabled + .settings-panel__checkbox-custom {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-panel__label-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.4;
}

.settings-panel__description {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-left: 26px;
}

.settings-panel__description--warning {
  color: var(--pc-warning);
  font-weight: 500;
}

.settings-panel__footer {
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.settings-panel__version {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  opacity: 0.7;
}


/* Mobile-specific styles */
.settings-panel--mobile .settings-panel__content {
  width: 280px;
}



/* Desktop-specific styles */
.settings-panel--desktop .settings-panel__content {
  width: 360px;
}



/* Responsive adjustments */
@media (max-width: 480px) {
  .settings-panel__content {
    width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .settings-panel__checkbox-custom,
  .settings-panel__close {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .settings-panel__content {
    border-width: 2px;
  }
  
  .settings-panel__checkbox-custom {
    border-width: 2px;
  }
  
}

/* Focus visible for better keyboard navigation */
.settings-panel__close:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.settings-panel__checkbox:focus-visible + .settings-panel__checkbox-custom {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>