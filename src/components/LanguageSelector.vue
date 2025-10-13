<template>
  <div class="language-selector">
    <select 
      v-model="selectedLanguage"
      @change="handleLanguageChange"
      class="language-selector__select"
      :aria-label="t('settings.language.title')"
    >
      <option 
        v-for="language in supportedLanguages" 
        :key="language.code"
        :value="language.code"
      >
        {{ language.nativeName }} ({{ language.name }})
      </option>
    </select>
    <div class="language-selector__icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t, currentLanguage, supportedLanguages, changeLanguage } = useI18n()

const selectedLanguage = ref(currentLanguage.value)

// Watch for external language changes
watch(currentLanguage, (newLanguage) => {
  selectedLanguage.value = newLanguage
})

const handleLanguageChange = async () => {
  if (selectedLanguage.value !== currentLanguage.value) {
    await changeLanguage(selectedLanguage.value)
  }
}
</script>

<style scoped>
.language-selector {
  position: relative;
  display: inline-block;
}

.language-selector__select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text);
  cursor: pointer;
  min-width: 200px;
  transition: all 0.2s ease-in-out;
}

.language-selector__select:hover {
  border-color: var(--color-primary);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.language-selector__select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.language-selector__icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .language-selector__select {
    min-width: 150px;
    font-size: 0.9rem;
    padding: 0.625rem 2rem 0.625rem 0.75rem;
  }
}
</style>