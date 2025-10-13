import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OfflineService } from '../OfflineService'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('OfflineService', () => {
  let offlineService: OfflineService
  let mockOnlineCallback: ReturnType<typeof vi.fn>
  let mockOfflineCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    offlineService = new OfflineService()
    mockOnlineCallback = vi.fn()
    mockOfflineCallback = vi.fn()
  })

  afterEach(() => {
    offlineService.destroy()
  })

  describe('initialization', () => {
    it('should initialize with correct online state', () => {
      expect(offlineService.isOnline).toBe(true)
      expect(offlineService.isOffline).toBe(false)
    })

    it('should initialize with offline state when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      const service = new OfflineService()
      expect(service.isOnline).toBe(false)
      expect(service.isOffline).toBe(true)
      service.destroy()
    })
  })

  describe('callback management', () => {
    it('should register and call online callbacks', () => {
      offlineService.onOnline(mockOnlineCallback)

      // Simulate online event
      window.dispatchEvent(new Event('online'))

      expect(mockOnlineCallback).toHaveBeenCalledTimes(1)
    })

    it('should register and call offline callbacks', () => {
      offlineService.onOffline(mockOfflineCallback)

      // Simulate offline event
      window.dispatchEvent(new Event('offline'))

      expect(mockOfflineCallback).toHaveBeenCalledTimes(1)
    })

    it('should remove online callbacks', () => {
      offlineService.onOnline(mockOnlineCallback)
      offlineService.removeOnlineCallback(mockOnlineCallback)

      // Simulate online event
      window.dispatchEvent(new Event('online'))

      expect(mockOnlineCallback).not.toHaveBeenCalled()
    })

    it('should remove offline callbacks', () => {
      offlineService.onOffline(mockOfflineCallback)
      offlineService.removeOfflineCallback(mockOfflineCallback)

      // Simulate offline event
      window.dispatchEvent(new Event('offline'))

      expect(mockOfflineCallback).not.toHaveBeenCalled()
    })

    it('should handle multiple callbacks', () => {
      const mockCallback2 = vi.fn()

      offlineService.onOnline(mockOnlineCallback)
      offlineService.onOnline(mockCallback2)

      // Simulate online event
      window.dispatchEvent(new Event('online'))

      expect(mockOnlineCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('state changes', () => {
    it('should update state when going online', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      const service = new OfflineService()

      expect(service.isOnline).toBe(false)

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
      window.dispatchEvent(new Event('online'))

      expect(service.isOnline).toBe(true)
      expect(service.isOffline).toBe(false)

      service.destroy()
    })

    it('should update state when going offline', () => {
      expect(offlineService.isOnline).toBe(true)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      window.dispatchEvent(new Event('offline'))

      expect(offlineService.isOnline).toBe(false)
      expect(offlineService.isOffline).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should clean up event listeners and callbacks on destroy', () => {
      offlineService.onOnline(mockOnlineCallback)
      offlineService.onOffline(mockOfflineCallback)

      offlineService.destroy()

      // Simulate events after destroy
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))

      expect(mockOnlineCallback).not.toHaveBeenCalled()
      expect(mockOfflineCallback).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle removing non-existent callbacks gracefully', () => {
      const nonExistentCallback = vi.fn()

      expect(() => {
        offlineService.removeOnlineCallback(nonExistentCallback)
        offlineService.removeOfflineCallback(nonExistentCallback)
      }).not.toThrow()
    })

    it('should handle rapid state changes', () => {
      offlineService.onOnline(mockOnlineCallback)
      offlineService.onOffline(mockOfflineCallback)

      // Rapid state changes
      window.dispatchEvent(new Event('offline'))
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))
      window.dispatchEvent(new Event('online'))

      expect(mockOnlineCallback).toHaveBeenCalledTimes(2)
      expect(mockOfflineCallback).toHaveBeenCalledTimes(2)
    })
  })
})