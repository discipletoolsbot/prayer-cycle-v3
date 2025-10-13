<template>
  <div 
    :class="[
      'step-display',
      `step-display--${deviceType}`,
      { 'step-display--transitioning': isTransitioning }
    ]"
  >
    <div class="step-display__content">
      <h1 class="step-display__name">
        {{ t(step.name) }}
      </h1>
      <p class="step-display__description">
        {{ t(step.description) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PrayerStep } from '@/types'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

interface Props {
  step: PrayerStep
  timeRemaining: number
  deviceType: 'mobile' | 'desktop'
  isTransitioning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTransitioning: false
})

// Computed properties for reactive styling
const stepDisplayClass = computed(() => ({
  'step-display': true,
  [`step-display--${props.deviceType}`]: true,
  'step-display--transitioning': props.isTransitioning
}))
</script>

<style scoped>
.step-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: var(--color-background);
  transition: all 0.3s ease-in-out;
  min-height: 200px;
}

.step-display__content {
  text-align: center;
  max-width: 100%;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.step-display--transitioning .step-display__content {
  opacity: 0.7;
  transform: translateY(-10px);
}

.step-display__name {
  color: var(--color-primary);
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  letter-spacing: 0.5px;
  transition: all 0.3s ease-in-out;
}

.step-display__description {
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
  transition: all 0.3s ease-in-out;
}

/* Mobile styles (default) */
.step-display--mobile {
  padding: 1.5rem 1rem;
}

.step-display--mobile .step-display__name {
  font-size: 1.75rem; /* 28px */
}

.step-display--mobile .step-display__description {
  font-size: 1rem; /* 16px */
  max-width: 90%;
  margin: 0 auto;
}

/* Desktop/Projector styles */
.step-display--desktop {
  padding: 2rem;
  min-height: 300px;
}

.step-display--desktop .step-display__name {
  font-size: 3rem; /* 48px - projector optimized */
  margin-bottom: 1.5rem;
}

.step-display--desktop .step-display__description {
  font-size: 1.5rem; /* 24px - projector readable */
  max-width: 80%;
  margin: 0 auto;
  line-height: 1.7;
}

/* Responsive breakpoints for mobile */
@media (max-width: 480px) {
  .step-display--mobile {
    padding: 0;
    justify-content: flex-start;
  }
  
  .step-display--mobile .step-display__name {
    font-size: 1.5rem; /* 24px for small screens */
  }
  
  .step-display--mobile .step-display__description {
    font-size: 0.9rem; /* 14px for small screens */
    max-width: 95%;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .step-display--mobile .step-display__name {
    font-size: 2rem; /* 32px for larger phones */
  }
  
  .step-display--mobile .step-display__description {
    font-size: 1.1rem; /* 18px for larger phones */
  }
}

/* Desktop responsive breakpoints */
@media (min-width: 1024px) {
  .step-display--desktop {
    padding: 3rem 2rem;
    min-height: 400px;
  }
  
  .step-display--desktop .step-display__name {
    font-size: 3.5rem; /* 56px for large screens */
  }
  
  .step-display--desktop .step-display__description {
    font-size: 1.75rem; /* 28px for large screens */
    max-width: 70%;
  }
}

@media (min-width: 1440px) {
  .step-display--desktop .step-display__name {
    font-size: 4rem; /* 64px for very large screens/projectors */
  }
  
  .step-display--desktop .step-display__description {
    font-size: 2rem; /* 32px for very large screens/projectors */
    max-width: 65%;
  }
}

/* High contrast mode for projectors - removed as we use theme variables */

/* Smooth transitions for step changes */
.step-display.v-enter-active,
.step-display.v-leave-active {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.step-display.v-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.step-display.v-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .step-display,
  .step-display__content,
  .step-display__name,
  .step-display__description {
    transition: none;
  }
  
  .step-display.v-enter-active,
  .step-display.v-leave-active {
    transition: none;
  }
}

/* Focus styles for accessibility */
.step-display:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>