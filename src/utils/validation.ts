import type { PrayerCycleState, PrayerStatus } from '@/types'
import { TOTAL_PRAYER_STEPS } from '@/constants/prayerSteps'

/**
 * Validation functions for prayer cycle state transitions
 */

/**
 * Validates if a step number is within valid range (0-11)
 */
export function isValidStepNumber(step: number): boolean {
  return Number.isInteger(step) && step >= 0 && step < TOTAL_PRAYER_STEPS
}

/**
 * Validates if time remaining is a valid positive number or zero
 */
export function isValidTimeRemaining(time: number): boolean {
  return Number.isFinite(time) && time >= 0
}

/**
 * Validates if a prayer status is one of the allowed values
 */
export function isValidPrayerStatus(status: string): status is PrayerStatus {
  const validStatuses: PrayerStatus[] = ['idle', 'active', 'paused', 'transitioning', 'completed']
  return validStatuses.includes(status as PrayerStatus)
}

/**
 * Validates if a state transition is allowed based on current status
 */
export function isValidStateTransition(from: PrayerStatus, to: PrayerStatus): boolean {
  const validTransitions: Record<PrayerStatus, PrayerStatus[]> = {
    idle: ['active'],
    active: ['paused', 'transitioning', 'completed'],
    paused: ['active', 'idle'],
    transitioning: ['active', 'completed'],
    completed: ['idle']
  }

  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Validates if the current step can advance to the next step
 */
export function canAdvanceToNextStep(currentStep: number): boolean {
  return isValidStepNumber(currentStep) && currentStep < TOTAL_PRAYER_STEPS - 1
}

/**
 * Validates if the prayer cycle can be completed from current step
 */
export function canCompleteCycle(currentStep: number): boolean {
  return currentStep === TOTAL_PRAYER_STEPS - 1
}

/**
 * Validates the complete prayer cycle state object
 */
export function isValidPrayerCycleState(state: Partial<PrayerCycleState>): state is PrayerCycleState {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof state.currentStep === 'number' &&
    isValidStepNumber(state.currentStep) &&
    typeof state.timeRemaining === 'number' &&
    isValidTimeRemaining(state.timeRemaining) &&
    typeof state.status === 'string' &&
    isValidPrayerStatus(state.status) &&
    typeof state.settings === 'object' &&
    state.settings !== null &&
    typeof state.settings.audioEnabled === 'boolean' &&
    typeof state.settings.primaryColor === 'string' &&
    typeof state.settings.wakeLockEnabled === 'boolean'
  )
}

/**
 * Creates a default valid prayer cycle state
 */
export function createDefaultPrayerCycleState(): PrayerCycleState {
  return {
    currentStep: 0,
    timeRemaining: 300, // 5 minutes in seconds
    status: 'idle',
    settings: {
      audioEnabled: true,
      primaryColor: '#2cace2',
      wakeLockEnabled: true
    }
  }
}

/**
 * Validates and sanitizes a step transition
 */
export function validateStepTransition(
  currentStep: number,
  targetStep: number,
  currentStatus: PrayerStatus
): { isValid: boolean; error?: string } {
  if (!isValidStepNumber(currentStep)) {
    return { isValid: false, error: 'Current step is invalid' }
  }

  if (!isValidStepNumber(targetStep)) {
    return { isValid: false, error: 'Target step is invalid' }
  }

  if (currentStatus === 'completed') {
    return { isValid: false, error: 'Cannot transition steps when cycle is completed' }
  }

  if (targetStep !== currentStep + 1 && targetStep !== 0) {
    return { isValid: false, error: 'Can only advance to next step or restart to step 0' }
  }

  return { isValid: true }
}