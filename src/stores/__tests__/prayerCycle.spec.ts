import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrayerCycleStore } from '../prayerCycle'
import { STEP_DURATION_SECONDS, TOTAL_PRAYER_STEPS } from '@/constants/prayerSteps'

describe('Prayer Cycle Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with correct default state', () => {
    const store = usePrayerCycleStore()

    expect(store.currentStep).toBe(0)
    expect(store.timeRemaining).toBe(STEP_DURATION_SECONDS)
    expect(store.status).toBe('idle')
    expect(store.settings.audioEnabled).toBe(true)
    expect(store.settings.primaryColor).toBe('#2cace2')
  })

  it('starts cycle correctly', () => {
    const store = usePrayerCycleStore()

    store.startCycle()

    expect(store.status).toBe('active')
    expect(store.currentStep).toBe(0)
    expect(store.timeRemaining).toBe(STEP_DURATION_SECONDS)
    expect(store.isActive).toBe(true)
    expect(store.isIdle).toBe(false)
  })

  it('pauses and resumes timer correctly', () => {
    const store = usePrayerCycleStore()

    store.startCycle()
    expect(store.status).toBe('active')

    store.pauseTimer()
    expect(store.status).toBe('paused')
    expect(store.isPaused).toBe(true)
    expect(store.isActive).toBe(false)

    store.resumeTimer()
    expect(store.status).toBe('active')
    expect(store.isActive).toBe(true)
    expect(store.isPaused).toBe(false)
  })

  it('advances to next step correctly', () => {
    const store = usePrayerCycleStore()

    store.startCycle()
    const initialStep = store.currentStep

    store.nextStep()

    expect(store.currentStep).toBe(initialStep + 1)
    expect(store.timeRemaining).toBe(STEP_DURATION_SECONDS)
  })

  it('completes cycle when reaching final step', () => {
    const store = usePrayerCycleStore()

    store.startCycle()

    // Advance to the last step
    for (let i = 0; i < TOTAL_PRAYER_STEPS - 1; i++) {
      store.nextStep()
    }

    // Should be on the last step
    expect(store.currentStep).toBe(TOTAL_PRAYER_STEPS - 1)

    // Advance one more time to complete
    store.nextStep()

    expect(store.status).toBe('completed')
    expect(store.isCompleted).toBe(true)
    expect(store.timeRemaining).toBe(0)
  })

  it('calculates progress percentage correctly', () => {
    const store = usePrayerCycleStore()

    store.startCycle()

    // At start of first step with full time remaining
    expect(store.progressPercentage).toBe(0)

    // Simulate half time elapsed in first step
    store.updateTimer(STEP_DURATION_SECONDS / 2)
    expect(store.progressPercentage).toBeCloseTo(100 / TOTAL_PRAYER_STEPS / 2)

    // Move to second step
    store.nextStep()
    expect(store.progressPercentage).toBeCloseTo(100 / TOTAL_PRAYER_STEPS)
  })

  it('provides correct step progress information', () => {
    const store = usePrayerCycleStore()

    store.startCycle()

    expect(store.stepProgress.current).toBe(1) // 1-based for display
    expect(store.stepProgress.total).toBe(TOTAL_PRAYER_STEPS)
    expect(store.stepProgress.completed).toBe(0)
    expect(store.stepProgress.remaining).toBe(TOTAL_PRAYER_STEPS - 1)

    store.nextStep()

    expect(store.stepProgress.current).toBe(2)
    expect(store.stepProgress.completed).toBe(1)
    expect(store.stepProgress.remaining).toBe(TOTAL_PRAYER_STEPS - 2)
  })

  it('updates settings correctly', () => {
    const store = usePrayerCycleStore()

    store.updateSettings({ audioEnabled: false })

    expect(store.settings.audioEnabled).toBe(false)
    expect(store.settings.primaryColor).toBe('#2cace2') // Should remain unchanged
  })

  it('resets to initial state correctly', () => {
    const store = usePrayerCycleStore()

    // Change state
    store.startCycle()
    store.nextStep()
    store.updateTimer(100)

    // Reset
    store.reset()

    expect(store.currentStep).toBe(0)
    expect(store.timeRemaining).toBe(STEP_DURATION_SECONDS)
    expect(store.status).toBe('idle')
  })

  it('restarts cycle correctly', () => {
    const store = usePrayerCycleStore()

    // Start and advance
    store.startCycle()
    store.nextStep()
    store.updateTimer(100)

    // Restart
    store.restartCycle()

    expect(store.currentStep).toBe(0)
    expect(store.timeRemaining).toBe(STEP_DURATION_SECONDS)
    expect(store.status).toBe('idle')
  })

  it('updates timer correctly when reaching zero', () => {
    const store = usePrayerCycleStore()

    store.startCycle()
    const initialStep = store.currentStep

    // Simulate timer reaching zero
    store.updateTimer(0)

    // Store doesn't auto-advance - that's handled externally by TimerService/App.vue
    expect(store.currentStep).toBe(initialStep)
    expect(store.timeRemaining).toBe(0)
  })

  it('provides current prayer step information', () => {
    const store = usePrayerCycleStore()

    store.startCycle()

    expect(store.currentPrayerStep.name).toBe('prayer.steps.praise.name')
    expect(store.currentPrayerStep.id).toBe(0)
    expect(store.currentPrayerStep.duration).toBe(STEP_DURATION_SECONDS)

    store.nextStep()

    expect(store.currentPrayerStep.name).toBe('prayer.steps.wait.name')
    expect(store.currentPrayerStep.id).toBe(1)
  })
})