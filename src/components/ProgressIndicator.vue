<template>
  <div class="progress-indicator" :class="deviceClass">
    <!-- Circular progress visualization -->
    <div class="progress-circle-container">
      <svg class="progress-circle" :width="circleSize" :height="circleSize" :viewBox="`0 0 ${circleSize} ${circleSize}`">
        <!-- Background circle -->
        <circle
          :cx="centerX"
          :cy="centerY"
          :r="radius"
          fill="var(--color-background-soft)"
          stroke="var(--color-background-mute)"
          :stroke-width="2"
        />
        
        <!-- Progress pie slice -->
        <path
          :d="progressPiePath"
          fill="rgba(44, 172, 226, 0.6)"
          stroke="rgba(44, 172, 226, 0.8)"
          stroke-width="1"
          class="progress-pie"
        />
        
        <!-- Step indicators around the circle -->
        <g class="step-indicators">
          <circle
            v-for="step in totalSteps"
            :key="step"
            :cx="getStepIndicatorX(step - 1)"
            :cy="getStepIndicatorY(step - 1)"
            :r="indicatorRadius"
            :fill="getStepIndicatorColor(step - 1)"
            :stroke="getStepIndicatorStroke(step - 1)"
            :stroke-width="getStepIndicatorStrokeWidth(step - 1)"
            class="step-dot"
          />
        </g>
      </svg>
      
      <!-- Countdown timer in the center of the circle -->
      <div class="countdown-display">
        <span class="countdown-time">{{ formattedTimeRemaining }}</span>
      </div>
    </div>
    
    <!-- Step counter display moved below circle -->
    <div class="step-counter">
      <span class="step-text">{{ t('prayer.timer.step') }} {{ safeCurrentStep }} {{ t('prayer.timer.of') }} {{ totalSteps }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

interface Props {
  currentStep?: number // 1-based step number for display
  totalSteps?: number
  timeRemaining?: number // seconds remaining in current step
  deviceType?: 'mobile' | 'desktop'
  stepDuration?: number // total duration of each step in seconds
  isCompleted?: boolean // whether the prayer cycle is completed
}

const props = withDefaults(defineProps<Props>(), {
  currentStep: 1,
  totalSteps: 12,
  timeRemaining: 300,
  deviceType: 'mobile',
  stepDuration: 300,
  isCompleted: false
})

// Computed properties for responsive design
const deviceClass = computed(() => `progress-indicator--${props.deviceType}`)

// Ensure currentStep is always within valid bounds (1 to totalSteps)
const safeCurrentStep = computed(() => Math.max(1, Math.min(props.currentStep, props.totalSteps)))

const circleSize = computed(() => props.deviceType === 'desktop' ? 300 : 240)
const radius = computed(() => props.deviceType === 'desktop' ? 127.5 : 100)
const strokeWidth = computed(() => props.deviceType === 'desktop' ? 12 : 12)
const indicatorRadius = computed(() => props.deviceType === 'desktop' ? 9 : 8)
const indicatorStrokeWidth = computed(() => props.deviceType === 'desktop' ? 3 : 3)

// Center coordinates based on circle size
const centerX = computed(() => circleSize.value / 2)
const centerY = computed(() => circleSize.value / 2)

// Note: Circumference calculation removed - using pie slice instead

// Time-based progress calculation (like a clock)
const progressPercentage = computed(() => {
  // If prayer cycle is completed, show full progress
  if (props.isCompleted) {
    return 1.0 // 100% complete
  }
  
  // Calculate completed steps progress
  const completedSteps = safeCurrentStep.value - 1
  
  // Calculate elapsed time in current step (like a clock's minute hand)
  const elapsedInCurrentStep = props.stepDuration - props.timeRemaining
  const currentStepProgress = elapsedInCurrentStep / props.stepDuration
  
  // Combine completed steps + current step progress for overall cycle progress
  return (completedSteps + currentStepProgress) / props.totalSteps
})

// Generate SVG path for pie slice progress
const progressPiePath = computed(() => {
  const progress = progressPercentage.value
  
  // No progress = no pie slice
  if (progress <= 0) return ''
  
  const centerXVal = centerX.value
  const centerYVal = centerY.value
  const radiusVal = radius.value
  
  // For 100% completion, create a full circle using two semicircle arcs
  if (progress >= 0.999) {
    return `M ${centerXVal} ${centerYVal} 
            m ${radiusVal} 0 
            A ${radiusVal} ${radiusVal} 0 1 1 ${centerXVal - radiusVal} ${centerYVal} 
            A ${radiusVal} ${radiusVal} 0 1 1 ${centerXVal + radiusVal} ${centerYVal} 
            Z`
  }
  
  // Convert progress to angle (0 to 2π)
  // Start at right (3 o'clock) and go clockwise - the SVG rotation will handle positioning
  const angle = progress * 2 * Math.PI
  
  // Calculate end point of the arc
  const endX = centerXVal + radiusVal * Math.cos(angle)
  const endY = centerYVal + radiusVal * Math.sin(angle)
  
  // Use large arc flag if progress > 0.5 (180 degrees)
  const largeArcFlag = progress > 0.5 ? 1 : 0
  
  // Create SVG path for pie slice - starting at right, will be rotated by CSS
  return `M ${centerXVal} ${centerYVal} 
          L ${centerXVal + radiusVal} ${centerYVal} 
          A ${radiusVal} ${radiusVal} 0 ${largeArcFlag} 1 ${endX} ${endY} 
          Z`
})

// Step progress calculations
const completedSteps = computed(() => safeCurrentStep.value - 1)
const remainingSteps = computed(() => props.totalSteps - safeCurrentStep.value)

// Time formatting - M:SS format, display only updates at 5-second intervals
const formattedTimeRemaining = computed(() => {
  const totalSeconds = Math.floor(props.timeRemaining) // Floor to avoid decimal issues
  
  // Show the current 5-second bucket
  // For 15,14,13,12,11 show 15; for 10,9,8,7,6 show 10; for 5,4,3,2,1 show 5
  // Only show 0 when timeRemaining is actually 0 or negative
  let displaySeconds
  if (props.timeRemaining <= 0) {
    displaySeconds = 0
  } else if (totalSeconds === 0) {
    // For 0.1 to 0.9 seconds, show 5
    displaySeconds = 5
  } else if (totalSeconds % 5 === 0) {
    // Exact multiple of 5 - show that value
    displaySeconds = totalSeconds
  } else {
    // Round up to next multiple of 5
    displaySeconds = Math.ceil(totalSeconds / 5) * 5
  }
  
  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Step indicator positioning and styling
function getStepIndicatorX(stepIndex: number): number {
  // Position all step indicators evenly around the circle
  // stepIndex 0 should be at the top (12 o'clock)
  // Since the SVG is rotated -90deg, we start at 0 degrees (3 o'clock in normal coords)
  // which becomes 12 o'clock after rotation
  const angle = (stepIndex / props.totalSteps) * 2 * Math.PI
  return centerX.value + radius.value * Math.cos(angle)
}

function getStepIndicatorY(stepIndex: number): number {
  // Position all step indicators evenly around the circle
  // stepIndex 0 should be at the top (12 o'clock)
  const angle = (stepIndex / props.totalSteps) * 2 * Math.PI
  return centerY.value + radius.value * Math.sin(angle)
}

function getStepIndicatorColor(stepIndex: number): string {
  // If prayer cycle is completed, all steps should be green
  if (props.isCompleted) {
    return 'var(--pc-success)' // All steps completed - green
  }
  
  if (stepIndex < safeCurrentStep.value - 1) {
    return 'var(--pc-success)' // Completed steps - green
  } else if (stepIndex === safeCurrentStep.value - 1) {
    return 'var(--color-primary)' // Current step - primary blue
  } else {
    return 'var(--color-background-soft)' // Upcoming steps - light gray
  }
}

function getStepIndicatorStroke(stepIndex: number): string {
  // If prayer cycle is completed, all steps should have green border
  if (props.isCompleted) {
    return '#1e7e34' // All steps completed - darker green border
  }
  
  if (stepIndex < safeCurrentStep.value - 1) {
    return '#1e7e34' // Darker green border for completed steps (better contrast)
  } else if (stepIndex === safeCurrentStep.value - 1) {
    return 'var(--color-primary)'
  } else {
    return 'var(--color-text-secondary)'
  }
}

function getStepIndicatorStrokeWidth(stepIndex: number): number {
  // If prayer cycle is completed, all steps should have thick border
  if (props.isCompleted) {
    return props.deviceType === 'desktop' ? 4.5 : 4.5
  }
  
  if (stepIndex < safeCurrentStep.value - 1) {
    // Thicker border for completed steps to improve visibility
    return props.deviceType === 'desktop' ? 4.5 : 4.5
  } else {
    // Normal border for current and upcoming steps
    return indicatorStrokeWidth.value
  }
}

</script>

<style scoped>
.progress-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.step-counter {
  text-align: center;
}

.step-text {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.progress-circle-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
}

.countdown-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.countdown-time {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-circle {
  transform: rotate(-90deg);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  max-width: 100%;
  height: auto;
}

.progress-pie {
  /* No transition for immediate updates - pie should follow timer exactly */
}

.step-indicators .step-dot {
  transition: all 0.3s ease-in-out;
}


/* Mobile-specific styles */
.progress-indicator--mobile {
  max-width: 420px;
  padding-top: 0;
}

.progress-indicator--mobile .step-text {
  font-size: var(--font-size-base);
}

.progress-indicator--mobile .countdown-time {
  font-size: var(--font-size-lg);
}


/* Desktop/projector-specific styles */
.progress-indicator--desktop {
  max-width: 600px;
}

.progress-indicator--desktop .step-text {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.progress-indicator--desktop .countdown-time {
  font-size: var(--font-size-3xl);
}


/* Responsive breakpoints */
@media (min-width: 768px) {
  .progress-indicator--mobile .step-text {
    font-size: var(--font-size-xl);
  }
  
  .progress-indicator--mobile .countdown-time {
    font-size: var(--font-size-xl);
  }
}

@media (min-width: 1024px) {
  .progress-indicator--desktop .step-text {
    font-size: var(--font-size-3xl);
  }
  
  .progress-indicator--desktop .countdown-time {
    font-size: var(--font-size-4xl);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .progress-pie,
  .step-dot {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .progress-circle {
    filter: none;
  }
  
  .step-dot {
    stroke-width: 2px;
  }
}
</style>