<template>
  <div 
    :class="[
      'countdown-timer',
      `countdown-timer--${deviceType}`,
      `countdown-timer--${status}`
    ]"
  >
    <div class="countdown-timer__display">
      {{ formattedTime }}
    </div>
    <div class="countdown-timer__label">
      {{ statusLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PrayerStatus } from '@/types'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

interface Props {
  timeRemaining: number // seconds
  status: PrayerStatus
  deviceType: 'mobile' | 'desktop'
}

const props = defineProps<Props>()

// Format time as MM:SS
const formattedTime = computed(() => {
  // Ensure time is never negative
  const safeTime = Math.max(0, props.timeRemaining)
  const minutes = Math.floor(safeTime / 60)
  const seconds = safeTime % 60
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Status label for accessibility and user feedback
const statusLabel = computed(() => {
  switch (props.status) {
    case 'active':
      return t('prayer.timer.status.active')
    case 'paused':
      return t('prayer.timer.status.paused')
    case 'transitioning':
      return t('prayer.timer.status.transitioning')
    case 'completed':
      return t('prayer.timer.status.completed')
    case 'idle':
      return t('prayer.timer.status.idle')
    default:
      return ''
  }
})
</script>

<style scoped>
.countdown-timer {
  --active-color: #2cace2;
  --paused-color: #ffc107;
  --completed-color: #28a745;
  --idle-color: #6c757d;
  --transitioning-color: #17a2b8;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(44, 172, 226, 0.15);
  transition: all 0.3s ease-in-out;
  min-width: 200px;
}

.countdown-timer__display {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.05em;
  transition: all 0.3s ease-in-out;
  text-align: center;
}

.countdown-timer__label {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
  opacity: 0.8;
  transition: all 0.3s ease-in-out;
}

/* Mobile styles (default) */
.countdown-timer--mobile {
  padding: 1.25rem;
  border-radius: 8px;
}

.countdown-timer--mobile .countdown-timer__display {
  font-size: 2.5rem; /* 40px */
}

.countdown-timer--mobile .countdown-timer__label {
  font-size: 0.75rem; /* 12px */
}

/* Desktop/Projector styles */
.countdown-timer--desktop {
  padding: 2rem;
  border-radius: 16px;
  min-width: 300px;
}

.countdown-timer--desktop .countdown-timer__display {
  font-size: 4rem; /* 64px - projector friendly */
}

.countdown-timer--desktop .countdown-timer__label {
  font-size: 1rem; /* 16px */
  margin-top: 0.75rem;
}

/* Status-based color changes */
.countdown-timer--active {
  border: 3px solid var(--active-color);
}

.countdown-timer--active .countdown-timer__display {
  color: var(--active-color);
}

.countdown-timer--active .countdown-timer__label {
  color: var(--active-color);
}

.countdown-timer--paused {
  border: 3px solid var(--paused-color);
}

.countdown-timer--paused .countdown-timer__display {
  color: var(--paused-color);
}

.countdown-timer--paused .countdown-timer__label {
  color: var(--paused-color);
}

.countdown-timer--completed {
  border: 3px solid var(--completed-color);
}

.countdown-timer--completed .countdown-timer__display {
  color: var(--completed-color);
}

.countdown-timer--completed .countdown-timer__label {
  color: var(--completed-color);
}

.countdown-timer--idle {
  border: 3px solid var(--idle-color);
}

.countdown-timer--idle .countdown-timer__display {
  color: var(--idle-color);
}

.countdown-timer--idle .countdown-timer__label {
  color: var(--idle-color);
}

.countdown-timer--transitioning {
  border: 3px solid var(--transitioning-color);
  animation: pulse 1s ease-in-out infinite alternate;
}

.countdown-timer--transitioning .countdown-timer__display {
  color: var(--transitioning-color);
}

.countdown-timer--transitioning .countdown-timer__label {
  color: var(--transitioning-color);
}

/* Pulse animation for transitioning state */
@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(44, 172, 226, 0.15);
  }
  100% {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(23, 162, 184, 0.25);
  }
}

/* Responsive breakpoints for mobile */
@media (max-width: 480px) {
  .countdown-timer--mobile {
    padding: 1rem;
    min-width: 180px;
  }
  
  .countdown-timer--mobile .countdown-timer__display {
    font-size: 2rem; /* 32px for small screens */
  }
  
  .countdown-timer--mobile .countdown-timer__label {
    font-size: 0.7rem; /* 11px for small screens */
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .countdown-timer--mobile .countdown-timer__display {
    font-size: 3rem; /* 48px for larger phones */
  }
  
  .countdown-timer--mobile .countdown-timer__label {
    font-size: 0.8rem; /* 13px for larger phones */
  }
}

/* Desktop responsive breakpoints */
@media (min-width: 1024px) {
  .countdown-timer--desktop {
    padding: 2.5rem;
    min-width: 350px;
  }
  
  .countdown-timer--desktop .countdown-timer__display {
    font-size: 5rem; /* 80px for large screens */
  }
  
  .countdown-timer--desktop .countdown-timer__label {
    font-size: 1.125rem; /* 18px for large screens */
  }
}

@media (min-width: 1440px) {
  .countdown-timer--desktop {
    padding: 3rem;
    min-width: 400px;
  }
  
  .countdown-timer--desktop .countdown-timer__display {
    font-size: 6rem; /* 96px for very large screens/projectors */
  }
  
  .countdown-timer--desktop .countdown-timer__label {
    font-size: 1.25rem; /* 20px for very large screens/projectors */
  }
}

/* High contrast mode for projectors - removed as we use theme variables */

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .countdown-timer,
  .countdown-timer__display,
  .countdown-timer__label {
    transition: none;
  }
  
  .countdown-timer--transitioning {
    animation: none;
  }
}

/* Focus styles for accessibility */
.countdown-timer:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}

/* Special handling for very low time (under 1 minute) */
.countdown-timer[data-low-time="true"] .countdown-timer__display {
  animation: subtle-pulse 2s ease-in-out infinite;
}

@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Ensure monospace font fallbacks work properly */
.countdown-timer__display {
  font-variant-numeric: tabular-nums;
}
</style>