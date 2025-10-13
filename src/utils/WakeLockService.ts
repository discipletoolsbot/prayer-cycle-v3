/**
 * WakeLockService - Manages screen wake lock functionality
 * Prevents screen dimming during prayer sessions with proper fallbacks
 */

export class WakeLockService {
  private wakeLock: any = null
  private isSupported: boolean = false
  private isEnabled: boolean = true

  constructor() {
    this.isSupported = 'wakeLock' in navigator
    if (!this.isSupported) {
      console.warn('Screen Wake Lock API is not supported in this browser')
    }
  }

  /**
   * Check if wake lock is supported by the browser
   */
  isWakeLockSupported(): boolean {
    return this.isSupported
  }

  /**
   * Enable or disable wake lock functionality
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled

    // If disabling and currently active, release the wake lock
    if (!enabled && this.wakeLock) {
      this.releaseWakeLock()
    }
  }

  /**
   * Get current enabled state
   */
  getEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Request screen wake lock to prevent screen dimming
   */
  async requestWakeLock(): Promise<boolean> {
    // Don't request if not enabled or not supported
    if (!this.isEnabled || !this.isSupported) {
      return false
    }

    // Don't request if already active
    if (this.wakeLock) {
      return true
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen')

      // Listen for wake lock release (can happen automatically)
      this.wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock was released')
        this.wakeLock = null
      })

      console.log('Screen wake lock activated')
      return true
    } catch (error) {
      console.warn('Failed to activate screen wake lock:', error)
      this.wakeLock = null
      return false
    }
  }

  /**
   * Release the current wake lock
   */
  releaseWakeLock(): void {
    if (this.wakeLock) {
      try {
        // The release() method returns a promise, but we don't need to await it
        this.wakeLock.release().catch((error: any) => {
          console.warn('Error releasing wake lock:', error)
        })
        console.log('Screen wake lock released')
      } catch (error) {
        console.warn('Error releasing wake lock:', error)
      } finally {
        this.wakeLock = null
      }
    }
  }

  /**
   * Check if wake lock is currently active
   */
  isActive(): boolean {
    return this.wakeLock !== null
  }

  /**
   * Handle page visibility changes
   * Wake lock is automatically released when page becomes hidden
   */
  handleVisibilityChange(): void {
    if (!document.hidden && this.isEnabled && !this.wakeLock) {
      // Page became visible again, re-request wake lock if needed
      this.requestWakeLock()
    }
  }

  /**
   * Cleanup - release wake lock and remove listeners
   */
  dispose(): void {
    this.releaseWakeLock()
  }
}

// Export singleton instance
export const wakeLockService = new WakeLockService()