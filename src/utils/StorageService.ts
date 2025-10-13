import type { PrayerCycleState, UserSettings } from '@/types'

/**
 * StorageService handles local persistence of settings and session state
 * Provides graceful fallbacks when localStorage is unavailable
 */
export class StorageService {
  private static readonly SETTINGS_KEY = 'prayer-cycle-settings'
  private static readonly SESSION_KEY = 'prayer-cycle-session'
  private static readonly BACKUP_KEY = 'prayer-cycle-backup'

  private isStorageAvailable: boolean
  private memoryStorage: Map<string, string> = new Map()

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability()
  }

  /**
   * Check if localStorage is available and functional
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.warn('localStorage is not available, falling back to memory storage:', error)
      return false
    }
  }

  /**
   * Generic method to save data with fallback to memory storage
   */
  private setItem(key: string, value: string): void {
    if (this.isStorageAvailable) {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.warn(`Failed to save to localStorage, using memory storage:`, error)
        this.memoryStorage.set(key, value)
      }
    } else {
      this.memoryStorage.set(key, value)
    }
  }

  /**
   * Generic method to retrieve data with fallback to memory storage
   */
  private getItem(key: string): string | null {
    if (this.isStorageAvailable) {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.warn(`Failed to read from localStorage, checking memory storage:`, error)
        return this.memoryStorage.get(key) || null
      }
    } else {
      return this.memoryStorage.get(key) || null
    }
  }

  /**
   * Generic method to remove data with fallback to memory storage
   */
  private removeItem(key: string): void {
    if (this.isStorageAvailable) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove from localStorage, removing from memory storage:`, error)
      }
    }
    this.memoryStorage.delete(key)
  }

  /**
   * Save user settings to storage
   */
  saveSettings(settings: UserSettings): void {
    try {
      const settingsJson = JSON.stringify(settings)
      this.setItem(StorageService.SETTINGS_KEY, settingsJson)

      // Create backup of settings
      this.setItem(StorageService.BACKUP_KEY, settingsJson)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  /**
   * Load user settings from storage with default fallback
   */
  loadSettings(): UserSettings {
    const defaultSettings: UserSettings = {
      audioEnabled: true,
      primaryColor: '#2cace2',
      wakeLockEnabled: true
    }

    try {
      const settingsJson = this.getItem(StorageService.SETTINGS_KEY)
      if (settingsJson) {
        const parsedSettings = JSON.parse(settingsJson)

        // Validate settings structure and merge with defaults
        return {
          audioEnabled: typeof parsedSettings.audioEnabled === 'boolean' 
            ? parsedSettings.audioEnabled 
            : defaultSettings.audioEnabled,
          primaryColor: typeof parsedSettings.primaryColor === 'string' 
            ? parsedSettings.primaryColor 
            : defaultSettings.primaryColor,
          wakeLockEnabled: typeof parsedSettings.wakeLockEnabled === 'boolean'
            ? parsedSettings.wakeLockEnabled
            : defaultSettings.wakeLockEnabled
        }
      }
    } catch (error) {
      console.warn('Failed to load settings, attempting backup restore:', error)
      const restoredSettings = this.restoreSettingsFromBackup()
      if (restoredSettings) {
        console.info('Successfully restored settings from backup')
        return restoredSettings
      }
    }

    return defaultSettings
  }

  /**
   * Save current prayer session state for recovery
   */
  saveSession(state: PrayerCycleState): void {
    try {
      // Only save session if it's in progress (not idle or completed)
      if (state.status === 'active' || state.status === 'paused' || state.status === 'transitioning') {
        const sessionData = {
          currentStep: state.currentStep,
          timeRemaining: state.timeRemaining,
          status: state.status,
          timestamp: Date.now() // Add timestamp for session validation
        }

        const sessionJson = JSON.stringify(sessionData)
        this.setItem(StorageService.SESSION_KEY, sessionJson)
      }
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Load saved prayer session for recovery
   * Returns null if no valid session exists or session is too old
   */
  loadSession(): PrayerCycleState | null {
    try {
      const sessionJson = this.getItem(StorageService.SESSION_KEY)
      if (sessionJson) {
        const sessionData = JSON.parse(sessionJson)

        // Validate session data structure
        if (this.isValidSessionData(sessionData)) {
          // Check if session is not too old (max 2 hours)
          const maxSessionAge = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
          const sessionAge = Date.now() - sessionData.timestamp

          if (sessionAge <= maxSessionAge) {
            // Return partial state for recovery (settings will be loaded separately)
            return {
              currentStep: sessionData.currentStep,
              timeRemaining: sessionData.timeRemaining,
              status: sessionData.status,
              settings: this.loadSettings() // Load current settings
            }
          } else {
            console.info('Session expired, clearing old session data')
            this.clearSession()
          }
        }
      }
    } catch (error) {
      console.info('Session data corrupted, clearing and resetting')
      this.clearSession() // Clear corrupted session data
    }

    return null
  }

  /**
   * Clear saved session data
   */
  clearSession(): void {
    this.removeItem(StorageService.SESSION_KEY)
  }

  /**
   * Restore settings from backup
   */
  private restoreSettingsFromBackup(): UserSettings | null {
    try {
      const backupJson = this.getItem(StorageService.BACKUP_KEY)
      if (backupJson) {
        const backupSettings = JSON.parse(backupJson)

        // Validate backup settings and restore to main storage
        if (this.isValidSettingsData(backupSettings)) {
          this.setItem(StorageService.SETTINGS_KEY, backupJson)
          return backupSettings
        }
      }
    } catch (error) {
      console.error('Failed to restore settings from backup:', error)
    }

    return null
  }

  /**
   * Validate session data structure
   */
  private isValidSessionData(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.currentStep === 'number' &&
      data.currentStep >= 0 &&
      data.currentStep < 12 &&
      typeof data.timeRemaining === 'number' &&
      data.timeRemaining >= 0 &&
      ['active', 'paused', 'transitioning'].includes(data.status) &&
      typeof data.timestamp === 'number'
    )
  }

  /**
   * Validate settings data structure
   */
  private isValidSettingsData(data: any): boolean {
    return (
      typeof data === 'object' &&
      typeof data.audioEnabled === 'boolean' &&
      typeof data.primaryColor === 'string' &&
      (data.wakeLockEnabled === undefined || typeof data.wakeLockEnabled === 'boolean')
    )
  }

  /**
   * Get storage availability status
   */
  isLocalStorageAvailable(): boolean {
    return this.isStorageAvailable
  }

  /**
   * Clear all stored data (for testing or reset purposes)
   */
  clearAll(): void {
    this.removeItem(StorageService.SETTINGS_KEY)
    this.removeItem(StorageService.SESSION_KEY)
    this.removeItem(StorageService.BACKUP_KEY)
    this.memoryStorage.clear()
  }
}

// Export singleton instance
export const storageService = new StorageService()