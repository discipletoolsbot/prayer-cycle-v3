import { ref, computed, readonly } from 'vue'
import { defineStore } from 'pinia'
import type { PrayerCycleState, UserSettings, PrayerStatus } from '@/types'
import { PRAYER_STEPS, TOTAL_PRAYER_STEPS, STEP_DURATION_SECONDS } from '@/constants/prayerSteps'

/**
 * Pinia store for managing prayer cycle state and actions
 * Handles timer control, step progression, and user settings
 */
export const usePrayerCycleStore = defineStore('prayerCycle', () => {
  // Reactive state properties
  const currentStep = ref<number>(0)
  const timeRemaining = ref<number>(STEP_DURATION_SECONDS)
  const status = ref<PrayerStatus>('idle')
  const settings = ref<UserSettings>({
    audioEnabled: true,
    primaryColor: '#2cace2',
    wakeLockEnabled: true
  })

  // Custom step duration (can be overridden by URL parameter)
  const stepDuration = ref<number>(STEP_DURATION_SECONDS)

  // Computed getters
  const currentPrayerStep = computed(() => PRAYER_STEPS[currentStep.value])

  const progressPercentage = computed(() => {
    const completedSteps = currentStep.value
    const currentStepProgress = (STEP_DURATION_SECONDS - timeRemaining.value) / STEP_DURATION_SECONDS
    return ((completedSteps + currentStepProgress) / TOTAL_PRAYER_STEPS) * 100
  })

  const isActive = computed(() => status.value === 'active')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  const stepProgress = computed(() => ({
    current: currentStep.value + 1, // 1-based for display
    total: TOTAL_PRAYER_STEPS,
    completed: currentStep.value,
    remaining: TOTAL_PRAYER_STEPS - currentStep.value - 1
  }))

  // Store actions for timer control
  function startCycle(): void {
    currentStep.value = 0
    timeRemaining.value = stepDuration.value
    status.value = 'active'
  }

  function pauseTimer(): void {
    if (status.value === 'active') {
      status.value = 'paused'
    }
  }

  function resumeTimer(): void {
    if (status.value === 'paused') {
      status.value = 'active'
    }
  }

  function restartCycle(): void {
    currentStep.value = 0
    timeRemaining.value = stepDuration.value
    status.value = 'idle'
  }

  // State transition logic for step progression
  function nextStep(): void {
    if (currentStep.value < TOTAL_PRAYER_STEPS - 1) {
      currentStep.value++
      timeRemaining.value = stepDuration.value
      status.value = 'active' // Set directly to active, no transitioning delay
    } else {
      completeCycle()
    }
  }

  function updateTimer(remaining: number): void {
    timeRemaining.value = Math.max(0, remaining)

    // Note: Auto-advance is handled by TimerService calling handleTimerComplete in App.vue
    // Removed duplicate nextStep() call that was causing steps to be skipped
  }

  function completeStep(): void {
    nextStep()
  }

  function completeCycle(): void {
    status.value = 'completed'
    timeRemaining.value = 0
  }

  function updateSettings(newSettings: Partial<UserSettings>): void {
    settings.value = { ...settings.value, ...newSettings }
  }

  function setStepDuration(duration: number): void {
    stepDuration.value = duration
    // Reset timeRemaining to new duration if currently idle
    if (status.value === 'idle') {
      timeRemaining.value = duration
    }
  }

  // Reset to initial state
  function reset(): void {
    currentStep.value = 0
    timeRemaining.value = stepDuration.value
    status.value = 'idle'
  }

  // Restore session state (for session recovery)
  function restoreSession(sessionState: Partial<PrayerCycleState>): void {
    if (sessionState.currentStep !== undefined) {
      currentStep.value = Math.max(0, Math.min(sessionState.currentStep, TOTAL_PRAYER_STEPS - 1))
    }
    if (sessionState.timeRemaining !== undefined) {
      timeRemaining.value = Math.max(0, sessionState.timeRemaining)
    }
    if (sessionState.status !== undefined) {
      status.value = sessionState.status
    }
    if (sessionState.settings !== undefined) {
      settings.value = { ...settings.value, ...sessionState.settings }
    }
  }

  return {
    // State
    currentStep: readonly(currentStep),
    timeRemaining: readonly(timeRemaining),
    status: readonly(status),
    settings: readonly(settings),

    // Getters
    currentPrayerStep,
    progressPercentage,
    isActive,
    isPaused,
    isCompleted,
    isIdle,
    stepProgress,

    // Actions
    startCycle,
    pauseTimer,
    resumeTimer,
    restartCycle,
    nextStep,
    updateTimer,
    completeStep,
    completeCycle,
    updateSettings,
    setStepDuration,
    reset,
    restoreSession
  }
})
