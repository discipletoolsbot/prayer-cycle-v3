<template>
  <div class="language-dropdown">
    <div class="language-dropdown__header">
      <h3 class="language-dropdown__title">{{ t('settings.language.title') }}</h3>
      <span class="language-dropdown__current">
        {{ currentLanguageInfo.nativeName }}
      </span>
    </div>
    
    <div class="language-dropdown__list">
      <button
        v-for="language in supportedLanguages"
        :key="language.code"
        @click="handleLanguageSelect(language.code)"
        :class="[
          'language-dropdown__item',
          { 'language-dropdown__item--active': language.code === currentLanguage }
        ]"
        :aria-label="`Switch to ${language.nativeName}`"
      >
        <span class="language-dropdown__native">{{ language.nativeName }}</span>
        <span class="language-dropdown__english">{{ language.name }}</span>
        <span v-if="language.code === currentLanguage" class="language-dropdown__check">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t, currentLanguage, currentLanguageInfo, supportedLanguages, changeLanguage } = useI18n()

const emit = defineEmits<{
  languageSelected: []
}>()

const handleLanguageSelect = async (languageCode: string) => {
  if (languageCode !== currentLanguage.value) {
    await changeLanguage(languageCode)
  }
  emit('languageSelected')
}
</script>

<style scoped>
.language-dropdown {
  min-width: 280px;
  max-width: 320px;
}

.language-dropdown__header {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.language-dropdown__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
}

.language-dropdown__current {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.language-dropdown__list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.language-dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  color: var(--color-text);
  text-align: start;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  min-height: var(--touch-target-min);
}

.language-dropdown__item:hover {
  background: var(--color-primary-light);
}

.language-dropdown__item--active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.language-dropdown__item--active:hover {
  background: var(--color-primary-light);
}

.language-dropdown__native {
  font-weight: 500;
  margin-inline-end: var(--spacing-sm);
}

.language-dropdown__english {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex: 1;
}

.language-dropdown__check {
  color: var(--color-primary);
  margin-inline-start: var(--spacing-sm);
  flex-shrink: 0;
}

/* Custom scrollbar */
.language-dropdown__list::-webkit-scrollbar {
  width: 6px;
}

.language-dropdown__list::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: var(--radius-sm);
}

.language-dropdown__list::-webkit-scrollbar-thumb {
  background: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.language-dropdown__list::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* Focus styles for accessibility */
.language-dropdown__item:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-dropdown__item {
    border: 1px solid transparent;
  }
  
  .language-dropdown__item:hover,
  .language-dropdown__item--active {
    border-color: var(--color-primary);
  }
  
  .language-dropdown__header {
    border-bottom: 2px solid var(--color-text);
  }
}

/* Mobile responsiveness */
@media (max-width: 479px) {
  .language-dropdown {
    min-width: 260px;
    max-width: 90vw;
  }

  .language-dropdown__item {
    padding: var(--spacing-md);
  }

  .language-dropdown__native,
  .language-dropdown__english {
    font-size: var(--font-size-sm);
  }
}

/* RTL (Right-to-Left) Support */
[dir="rtl"] .language-dropdown {
  /* Ensure proper width in RTL */
  min-width: 280px;
  max-width: 320px;
}

[dir="rtl"] .language-dropdown__item {
  /* Ensure items stay within bounds */
  width: 100%;
}
</style>