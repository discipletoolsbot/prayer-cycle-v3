import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { WakeLockService } from '../WakeLockService'

// Mock the navigator.wakeLock API
const mockWakeLock = {
  request: vi.fn(),
  release: vi.fn(),
  addEventListener: vi.fn()
}

const mockWakeLockSentinel = {
  release: vi.fn(),
  addEventListener: vi.fn()
}

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    wakeLock: mockWakeLock
  },
  writable: true
})

describe('WakeLockService', () => {
  let service: WakeLockService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new WakeLockService()

    // Reset mock implementations
    mockWakeLock.request.mockResolvedValue(mockWakeLockSentinel)
    mockWakeLockSentinel.release.mockResolvedValue(undefined)
  })

  describe('Browser Support Detection', () => {
    it('should detect wake lock support when available', () => {
      expect(service.isWakeLockSupported()).toBe(true)
    })

    it('should detect lack of wake lock support', () => {
      // Temporarily remove wakeLock from navigator
      const originalWakeLock = (global.navigator as any).wakeLock
      delete (global.navigator as any).wakeLock

      const unsupportedService = new WakeLockService()
      expect(unsupportedService.isWakeLockSupported()).toBe(false)

      // Restore wakeLock
      ;(global.navigator as any).wakeLock = originalWakeLock
    })
  })

  describe('Enable/Disable Functionality', () => {
    it('should be enabled by default', () => {
      expect(service.getEnabled()).toBe(true)
    })

    it('should allow enabling and disabling', () => {
      service.setEnabled(false)
      expect(service.getEnabled()).toBe(false)

      service.setEnabled(true)
      expect(service.getEnabled()).toBe(true)
    })

    it('should release wake lock when disabled', async () => {
      // First request a wake lock
      await service.requestWakeLock()
      expect(mockWakeLock.request).toHaveBeenCalledWith('screen')

      // Then disable the service
      service.setEnabled(false)
      expect(mockWakeLockSentinel.release).toHaveBeenCalled()
    })
  })

  describe('Wake Lock Request', () => {
    it('should successfully request wake lock when enabled and supported', async () => {
      const result = await service.requestWakeLock()

      expect(result).toBe(true)
      expect(mockWakeLock.request).toHaveBeenCalledWith('screen')
      expect(service.isActive()).toBe(true)
    })

    it('should not request wake lock when disabled', async () => {
      service.setEnabled(false)
      const result = await service.requestWakeLock()

      expect(result).toBe(false)
      expect(mockWakeLock.request).not.toHaveBeenCalled()
      expect(service.isActive()).toBe(false)
    })

    it('should not request wake lock when not supported', async () => {
      // Remove wakeLock support
      delete (global.navigator as any).wakeLock
      const unsupportedService = new WakeLockService()

      const result = await unsupportedService.requestWakeLock()

      expect(result).toBe(false)
      expect(unsupportedService.isActive()).toBe(false)

      // Restore wakeLock
      ;(global.navigator as any).wakeLock = mockWakeLock
    })

    it('should handle wake lock request failure gracefully', async () => {
      const error = new Error('Wake lock request failed')
      mockWakeLock.request.mockRejectedValue(error)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await service.requestWakeLock()

      expect(result).toBe(false)
      expect(service.isActive()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Failed to activate screen wake lock:', error)

      consoleSpy.mockRestore()
    })

    it('should not request multiple wake locks', async () => {
      // Request first wake lock
      await service.requestWakeLock()
      expect(mockWakeLock.request).toHaveBeenCalledTimes(1)

      // Request second wake lock
      const result = await service.requestWakeLock()
      expect(result).toBe(true)
      expect(mockWakeLock.request).toHaveBeenCalledTimes(1) // Should not call again
    })

    it('should set up event listener for automatic release', async () => {
      await service.requestWakeLock()

      expect(mockWakeLockSentinel.addEventListener).toHaveBeenCalledWith('release', expect.any(Function))
    })
  })

  describe('Wake Lock Release', () => {
    it('should release active wake lock', async () => {
      // First request a wake lock
      await service.requestWakeLock()
      expect(service.isActive()).toBe(true)

      // Then release it
      service.releaseWakeLock()
      expect(mockWakeLockSentinel.release).toHaveBeenCalled()
      expect(service.isActive()).toBe(false)
    })

    it('should handle release when no wake lock is active', () => {
      // Should not throw error
      expect(() => service.releaseWakeLock()).not.toThrow()
      expect(mockWakeLockSentinel.release).not.toHaveBeenCalled()
    })

    it('should handle release errors gracefully', async () => {
      await service.requestWakeLock()

      const error = new Error('Release failed')
      mockWakeLockSentinel.release.mockRejectedValue(error)

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      service.releaseWakeLock()

      // Wait for the promise rejection to be handled
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(consoleSpy).toHaveBeenCalledWith('Error releasing wake lock:', error)
      expect(service.isActive()).toBe(false) // Should still mark as inactive

      consoleSpy.mockRestore()
    })
  })

  describe('Visibility Change Handling', () => {
    beforeEach(() => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false
      })
    })

    it('should re-request wake lock when page becomes visible', async () => {
      // Set page as visible and service enabled
      ;(document as any).hidden = false
      service.setEnabled(true)

      // Call visibility change handler
      service.handleVisibilityChange()

      // Should request wake lock
      expect(mockWakeLock.request).toHaveBeenCalledWith('screen')
    })

    it('should not re-request wake lock when page is hidden', async () => {
      ;(document as any).hidden = true

      service.handleVisibilityChange()

      expect(mockWakeLock.request).not.toHaveBeenCalled()
    })

    it('should not re-request wake lock when disabled', async () => {
      ;(document as any).hidden = false
      service.setEnabled(false)

      service.handleVisibilityChange()

      expect(mockWakeLock.request).not.toHaveBeenCalled()
    })

    it('should not re-request wake lock when already active', async () => {
      ;(document as any).hidden = false

      // First request wake lock
      await service.requestWakeLock()
      mockWakeLock.request.mockClear()

      // Handle visibility change
      service.handleVisibilityChange()

      // Should not request again
      expect(mockWakeLock.request).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should release wake lock on dispose', async () => {
      await service.requestWakeLock()
      expect(service.isActive()).toBe(true)

      service.dispose()

      expect(mockWakeLockSentinel.release).toHaveBeenCalled()
      expect(service.isActive()).toBe(false)
    })

    it('should handle dispose when no wake lock is active', () => {
      expect(() => service.dispose()).not.toThrow()
    })
  })

  describe('Automatic Release Event Handling', () => {
    it('should handle automatic wake lock release', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await service.requestWakeLock()
      expect(service.isActive()).toBe(true)

      // Simulate automatic release by calling the event listener
      const releaseHandler = mockWakeLockSentinel.addEventListener.mock.calls[0][1]
      releaseHandler()

      expect(service.isActive()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Screen wake lock was released')

      consoleSpy.mockRestore()
    })
  })
})