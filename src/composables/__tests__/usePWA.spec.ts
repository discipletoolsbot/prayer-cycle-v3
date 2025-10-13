import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { usePWA } from '../usePWA'

// Mock the OfflineService
vi.mock('@/utils/OfflineService', () => {
  let mockIsOnline = true

  const mockOfflineService = {
    get isOnline() { return mockIsOnline },
    set isOnline(value: boolean) { mockIsOnline = value },
    onOnline: vi.fn(),
    onOffline: vi.fn(),
    removeOnlineCallback: vi.fn(),
    removeOfflineCallback: vi.fn()
  }

  return {
    offlineService: mockOfflineService
  }
})

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.standalone for iOS PWA detection
Object.defineProperty(window.navigator, 'standalone', {
  writable: true,
  value: false
})

describe('usePWA', () => {
  let TestComponent: any
  let wrapper: any

  beforeEach(() => {
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    // Reset matchMedia mock
    vi.mocked(window.matchMedia).mockImplementation(query => ({
      matches: query === '(display-mode: standalone)' ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    TestComponent = defineComponent({
      setup() {
        return usePWA()
      },
      template: '<div></div>'
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('initialization', () => {
    it('should initialize with correct online state', async () => {
      const { offlineService } = await import('@/utils/OfflineService')
      ;(offlineService as any).isOnline = true

      wrapper = mount(TestComponent)

      expect(wrapper.vm.isOnline).toBe(true)
    })

    it('should initialize with offline state when navigator.onLine is false', async () => {
      const { offlineService } = await import('@/utils/OfflineService')
      ;(offlineService as any).isOnline = false

      wrapper = mount(TestComponent)

      expect(wrapper.vm.isOnline).toBe(false)
    })

    it('should initialize installable state as false', () => {
      wrapper = mount(TestComponent)

      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('should detect PWA mode correctly', () => {
      wrapper = mount(TestComponent)

      expect(wrapper.vm.isPWA).toBe(false)
    })
  })

  describe('online/offline detection', () => {
    it('should register callbacks with offline service', async () => {
      const { offlineService } = await import('@/utils/OfflineService')

      wrapper = mount(TestComponent)

      expect(offlineService.onOnline).toHaveBeenCalled()
      expect(offlineService.onOffline).toHaveBeenCalled()
    })

    it('should clean up callbacks on unmount', async () => {
      const { offlineService } = await import('@/utils/OfflineService')

      wrapper = mount(TestComponent)
      wrapper.unmount()

      expect(offlineService.removeOnlineCallback).toHaveBeenCalled()
      expect(offlineService.removeOfflineCallback).toHaveBeenCalled()
    })
  })

  describe('PWA installation', () => {
    it('should handle beforeinstallprompt event', async () => {
      wrapper = mount(TestComponent)

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      // Simulate beforeinstallprompt event
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))

      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isInstallable).toBe(true)
    })

    it('should install PWA when installPWA is called', async () => {
      wrapper = mount(TestComponent)

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      }

      // Simulate beforeinstallprompt event
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await wrapper.vm.$nextTick()

      // Call installPWA
      const result = await wrapper.vm.installPWA()

      expect(mockEvent.prompt).toHaveBeenCalled()
      expect(result).toBe(true)
      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('should handle PWA installation rejection', async () => {
      wrapper = mount(TestComponent)

      const mockEvent = {
        preventDefault: vi.fn(),
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      }

      // Simulate beforeinstallprompt event
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), mockEvent))
      await wrapper.vm.$nextTick()

      // Call installPWA
      const result = await wrapper.vm.installPWA()

      expect(result).toBe(false)
      expect(wrapper.vm.isInstallable).toBe(false)
    })

    it('should return false when no deferred prompt is available', async () => {
      wrapper = mount(TestComponent)

      const result = await wrapper.vm.installPWA()

      expect(result).toBe(false)
    })
  })

  describe('PWA detection', () => {
    it('should detect standalone display mode', () => {
      vi.mocked(window.matchMedia).mockImplementation(query => ({
        matches: query === '(display-mode: standalone)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      wrapper = mount(TestComponent)

      expect(wrapper.vm.isPWA).toBe(true)
    })

    it('should detect iOS standalone mode', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        writable: true,
        value: true
      })

      wrapper = mount(TestComponent)

      expect(wrapper.vm.isPWA).toBe(true)
    })
  })
})