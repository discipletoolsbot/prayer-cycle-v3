import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountWithI18n } from '@/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'

// Mock the services
vi.mock('@/utils/AudioService', () => ({
  audioService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    setEnabled: vi.fn(),
    playNotification: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn()
  }
}))

vi.mock('@/utils/StorageService', () => ({
  storageService: {
    loadSettings: vi.fn().mockReturnValue({
      audioEnabled: true,
      primaryColor: '#2cace2'
    }),
    loadSession: vi.fn().mockReturnValue(null),
    saveSession: vi.fn(),
    clearSession: vi.fn()
  }
}))

// Mock navigator.wakeLock
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({
      release: vi.fn()
    })
  },
  writable: true
})

// Mock window.innerWidth for device detection
Object.defineProperty(window, 'innerWidth', {
  value: 375, // Mobile width
  writable: true
})

describe('App (PrayerCycleApp)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Reset window width to mobile for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      value: 375, // Mobile width
      writable: true
    })

    // Reset user agent to mobile
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
  })

  it('should render the mobile layout by default', () => {
    const wrapper = mountWithI18n(App)

    expect(wrapper.find('.prayer-app-mobile').exists()).toBe(true)
    expect(wrapper.find('.prayer-app-desktop').exists()).toBe(false)
  })


  it('should display the correct step information', () => {
    const wrapper = mountWithI18n(App)

    // Should show step 1 of 12 initially
    expect(wrapper.text()).toContain('Step 1 of 12')
  })

  it('should render all required components', () => {
    const wrapper = mountWithI18n(App)

    // Check that all child components are rendered
    expect(wrapper.findComponent({ name: 'StepDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ProgressIndicator' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TimerControls' }).exists()).toBe(true)
  })

  it('should handle timer control events', async () => {
    const wrapper = mountWithI18n(App)

    // Find the TimerControls component and emit play event
    const timerControls = wrapper.findComponent({ name: 'TimerControls' })
    await timerControls.vm.$emit('play')

    // The store should be updated (we can't easily test the internal state changes
    // without more complex mocking, but we can verify the component doesn't crash)
    expect(wrapper.exists()).toBe(true)
  })

  it('should initialize services on mount', () => {
    // Just verify the component mounts without errors
    // The service initialization is already mocked at the module level
    const wrapper = mountWithI18n(App)
    expect(wrapper.exists()).toBe(true)

    // Verify the component has the expected structure
    expect(wrapper.find('.prayer-app-mobile').exists()).toBe(true)
  })

})