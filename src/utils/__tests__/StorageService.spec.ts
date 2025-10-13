import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '../StorageService'
import type { UserSettings, PrayerCycleState } from '@/types'

describe('StorageService', () => {
  let storageService: StorageService
  let mockLocalStorage: { [key: string]: string }

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {}

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key]
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {}
        })
      },
      writable: true
    })

    storageService = new StorageService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Settings Management', () => {
    it('should save and load settings correctly', () => {
      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      storageService.saveSettings(testSettings)
      const loadedSettings = storageService.loadSettings()

      expect(loadedSettings).toEqual(testSettings)
    })

    it('should return default settings when no saved settings exist', () => {
      const defaultSettings = storageService.loadSettings()

      expect(defaultSettings).toEqual({
        audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const })
    })

    it('should validate settings structure and merge with defaults', () => {
      // Save invalid settings
      mockLocalStorage['prayer-cycle-settings'] = JSON.stringify({
        audioEnabled: 'invalid',
        primaryColor: 123
      })

      const loadedSettings = storageService.loadSettings()

      expect(loadedSettings).toEqual({
        audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const })
    })

    it('should create backup when saving settings', () => {
      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      storageService.saveSettings(testSettings)

      expect(mockLocalStorage['prayer-cycle-backup']).toBeDefined()
      expect(JSON.parse(mockLocalStorage['prayer-cycle-backup'])).toEqual(testSettings)
    })

    it('should restore from backup when main settings are corrupted', () => {
      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      // Save valid backup
      mockLocalStorage['prayer-cycle-backup'] = JSON.stringify(testSettings)
      // Corrupt main settings
      mockLocalStorage['prayer-cycle-settings'] = 'invalid json'

      const loadedSettings = storageService.loadSettings()

      expect(loadedSettings).toEqual(testSettings)
    })
  })

  describe('Session Management', () => {
    it('should save and load active session correctly', () => {
      const testState: PrayerCycleState = {
        currentStep: 3,
        timeRemaining: 180,
        status: 'active',
        settings: {
          audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const }
      }

      storageService.saveSession(testState)
      const loadedSession = storageService.loadSession()

      expect(loadedSession).toMatchObject({
        currentStep: 3,
        timeRemaining: 180,
        status: 'active'
      })
    })

    it('should save paused session correctly', () => {
      const testState: PrayerCycleState = {
        currentStep: 5,
        timeRemaining: 120,
        status: 'paused',
        settings: {
          audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const }
      }

      storageService.saveSession(testState)
      const loadedSession = storageService.loadSession()

      expect(loadedSession).toMatchObject({
        currentStep: 5,
        timeRemaining: 120,
        status: 'paused'
      })
    })

    it('should not save idle or completed sessions', () => {
      const idleState: PrayerCycleState = {
        currentStep: 0,
        timeRemaining: 300,
        status: 'idle',
        settings: {
          audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const }
      }

      const completedState: PrayerCycleState = {
        currentStep: 11,
        timeRemaining: 0,
        status: 'completed',
        settings: {
          audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const }
      }

      storageService.saveSession(idleState)
      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()

      storageService.saveSession(completedState)
      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()
    })

    it('should return null for expired sessions', () => {
      const oldTimestamp = Date.now() - (3 * 60 * 60 * 1000) // 3 hours ago

      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 3,
        timeRemaining: 180,
        status: 'active',
        timestamp: oldTimestamp
      })

      const loadedSession = storageService.loadSession()

      expect(loadedSession).toBeNull()
      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()
    })

    it('should validate session data structure', () => {
      // Invalid session data
      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 'invalid',
        timeRemaining: -1,
        status: 'invalid',
        timestamp: 'invalid'
      })

      const loadedSession = storageService.loadSession()

      expect(loadedSession).toBeNull()
    })

    it('should clear session correctly', () => {
      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 3,
        timeRemaining: 180,
        status: 'active',
        timestamp: Date.now()
      })

      storageService.clearSession()

      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()
    })
  })

  describe('Storage Availability', () => {
    it('should detect localStorage availability', () => {
      expect(storageService.isLocalStorageAvailable()).toBe(true)
    })

    it('should handle localStorage unavailability gracefully', () => {
      // Mock localStorage to throw error
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      const newStorageService = new StorageService()

      expect(newStorageService.isLocalStorageAvailable()).toBe(false)
    })

    it('should use memory storage when localStorage fails', () => {
      // Mock localStorage to throw error
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      const newStorageService = new StorageService()

      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      // Should not throw error and use memory storage
      expect(() => newStorageService.saveSettings(testSettings)).not.toThrow()

      const loadedSettings = newStorageService.loadSettings()
      expect(loadedSettings.audioEnabled).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle JSON parsing errors gracefully', () => {
      mockLocalStorage['prayer-cycle-settings'] = 'invalid json'

      expect(() => storageService.loadSettings()).not.toThrow()

      const settings = storageService.loadSettings()
      expect(settings).toEqual({
        audioEnabled: true, primaryColor: '#2cace2', wakeLockEnabled: true, themeMode: 'auto' as const })
    })

    it('should handle storage quota exceeded errors', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      expect(() => storageService.saveSettings(testSettings)).not.toThrow()
    })

    it('should clear corrupted session data', () => {
      mockLocalStorage['prayer-cycle-session'] = 'invalid json'

      const loadedSession = storageService.loadSession()

      expect(loadedSession).toBeNull()
      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()
    })
  })

  describe('Utility Methods', () => {
    it('should clear all stored data', () => {
      mockLocalStorage['prayer-cycle-settings'] = 'test'
      mockLocalStorage['prayer-cycle-session'] = 'test'
      mockLocalStorage['prayer-cycle-backup'] = 'test'

      storageService.clearAll()

      expect(mockLocalStorage['prayer-cycle-settings']).toBeUndefined()
      expect(mockLocalStorage['prayer-cycle-session']).toBeUndefined()
      expect(mockLocalStorage['prayer-cycle-backup']).toBeUndefined()
    })
  })

  describe('Session Recovery Edge Cases', () => {
    it('should handle session with invalid step number', () => {
      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 15, // Invalid step (should be 0-11)
        timeRemaining: 180,
        status: 'active',
        timestamp: Date.now()
      })

      const loadedSession = storageService.loadSession()

      expect(loadedSession).toBeNull()
    })

    it('should handle session with negative time remaining', () => {
      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 3,
        timeRemaining: -10, // Invalid negative time
        status: 'active',
        timestamp: Date.now()
      })

      const loadedSession = storageService.loadSession()

      expect(loadedSession).toBeNull()
    })

    it('should include current settings in recovered session', () => {
      const testSettings: UserSettings = {
        audioEnabled: false, primaryColor: '#2cace2', wakeLockEnabled: false, themeMode: 'auto' as const }

      storageService.saveSettings(testSettings)

      mockLocalStorage['prayer-cycle-session'] = JSON.stringify({
        currentStep: 3,
        timeRemaining: 180,
        status: 'active',
        timestamp: Date.now()
      })

      const loadedSession = storageService.loadSession()

      expect(loadedSession?.settings).toEqual(testSettings)
    })
  })
})