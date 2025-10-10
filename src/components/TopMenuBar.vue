<template>
  <div class="top-menu-bar">
    <div class="menu-content">
      <!-- Title -->
      <h1 class="menu-title">{{ t('app.title') }}</h1>
      
      <!-- Right side icons -->
      <div class="menu-icons">
        <!-- Download/Install Icon -->
        <button
          v-if="isInstallable && !isPWA"
          class="menu-icon-btn"
          @click="$emit('install')"
          :title="t('app.install')"
          aria-label="Install app"
        >
          <DownloadIcon />
        </button>

        <!-- Language Selector Icon -->
        <button
          class="menu-icon-btn"
          @click="$emit('toggleLanguage')"
          :title="t('language.selector')"
          aria-label="Language selector"
        >
          <LanguageIcon />
        </button>

        <!-- Settings Icon -->
        <button
          class="menu-icon-btn"
          @click="$emit('toggleSettings')"
          :title="t('settings.title')"
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n'
import DownloadIcon from './icons/DownloadIcon.vue'
import LanguageIcon from './icons/LanguageIcon.vue'
import SettingsIcon from './icons/SettingsIcon.vue'

const { t } = useI18n()

defineProps<{
  isInstallable: boolean
  isPWA: boolean
}>()

defineEmits<{
  install: []
  toggleLanguage: []
  toggleSettings: []
}>()
</script>

<style scoped>
.top-menu-bar {
  background-color: var(--color-primary);
  color: var(--color-text-light);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: var(--shadow-md);
  position: static;
  width: 100%;
}

.menu-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.menu-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-light);
  margin: 0;
}

.menu-icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.menu-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: var(--spacing-xs);
}

.menu-icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.menu-icon-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.15);
}

.menu-icon-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

/* Responsive adjustments */
@media (max-width: 479px) {
  .top-menu-bar {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .menu-title {
    font-size: var(--font-size-lg);
  }
  
  .menu-icons {
    gap: var(--spacing-xs);
  }
}

@media (min-width: 1024px) {
  .menu-title {
    font-size: var(--font-size-2xl);
  }
  
  .menu-icon-btn {
    width: var(--touch-target-comfortable);
    height: var(--touch-target-comfortable);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .menu-icon-btn {
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
  
  .menu-icon-btn:focus {
    border-color: var(--color-text-light);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .menu-icon-btn {
    transition: none;
  }
  
  .menu-icon-btn:hover {
    transform: none;
  }
}
</style>