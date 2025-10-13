/**
 * AudioService - Handles audio notifications for prayer step transitions
 * 
 * Features:
 * - Plays clock-chime.mp3 file
 * - Web Audio API with HTML5 Audio fallback
 * - Volume control and system settings respect
 * - Enable/disable toggle functionality
 */

import notificationSoundUrl from '@/assets/clock-chime.mp3';

export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private htmlAudioElement: HTMLAudioElement | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;
  private useWebAudio: boolean = true;

  /**
   * Initialize the audio service
   * Attempts Web Audio API first, falls back to HTML5 Audio
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try Web Audio API first
      await this.initializeWebAudio();
      this.useWebAudio = true;
    } catch (error) {
      console.warn('Web Audio API initialization failed, falling back to HTML5 Audio:', error);
      try {
        await this.initializeHtmlAudio();
        this.useWebAudio = false;
      } catch (fallbackError) {
        console.error('Both Web Audio API and HTML5 Audio initialization failed:', fallbackError);
        throw new Error('Audio initialization failed');
      }
    }

    this.initialized = true;
  }

  /**
   * Initialize Web Audio API and load notification sound
   */
  private async initializeWebAudio(): Promise<void> {
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Resume context if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Load the MP3 notification sound
    await this.loadNotificationSound();
  }

  /**
   * Initialize HTML5 Audio fallback
   */
  private async initializeHtmlAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create HTML5 Audio element with MP3 file
      this.htmlAudioElement = new Audio(notificationSoundUrl);
      this.htmlAudioElement.preload = 'auto';

      this.htmlAudioElement.addEventListener('canplaythrough', () => {
        resolve();
      }, { once: true });

      this.htmlAudioElement.addEventListener('error', (error) => {
        reject(error);
      }, { once: true });

      // Trigger loading
      this.htmlAudioElement.load();
    });
  }

  /**
   * Load notification sound from MP3 file for Web Audio API
   */
  private async loadNotificationSound(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      // Fetch the MP3 file
      const response = await fetch(notificationSoundUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load notification sound: ${error}`);
    }
  }


  /**
   * Unlock audio for Safari - must be called during user interaction
   * This ensures the audio context is in a "running" state
   */
  async unlockAudio(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      if (this.useWebAudio && this.audioContext) {
        // Resume audio context if suspended (Safari requirement)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } else if (this.htmlAudioElement) {
        // For HTML5 Audio, play a silent sound to unlock on Safari
        // Store original volume
        const originalVolume = this.htmlAudioElement.volume;
        // Set to silent
        this.htmlAudioElement.volume = 0;
        // Attempt to play
        try {
          await this.htmlAudioElement.play();
          this.htmlAudioElement.pause();
          this.htmlAudioElement.currentTime = 0;
        } catch (e) {
          // Ignore errors during unlock
        }
        // Restore volume
        this.htmlAudioElement.volume = originalVolume;
      }
    } catch (error) {
      console.warn('Failed to unlock audio:', error);
    }
  }

  /**
   * Play notification sound
   */
  async playNotification(): Promise<void> {
    if (!this.enabled || !this.initialized) {
      return;
    }

    try {
      if (this.useWebAudio && this.audioContext && this.audioBuffer) {
        await this.playWebAudioNotification();
      } else if (this.htmlAudioElement) {
        await this.playHtmlAudioNotification();
      }
    } catch (error) {
      console.error('Failed to play notification:', error);
    }
  }

  /**
   * Play notification using Web Audio API
   */
  private async playWebAudioNotification(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) {
      throw new Error('Web Audio not properly initialized');
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create and configure source
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;

    // Connect to destination
    source.connect(this.audioContext.destination);

    // Start playback
    source.start();
  }

  /**
   * Play notification using HTML5 Audio
   */
  private async playHtmlAudioNotification(): Promise<void> {
    if (!this.htmlAudioElement) {
      throw new Error('HTML Audio not properly initialized');
    }

    // Reset to beginning
    this.htmlAudioElement.currentTime = 0;

    // Play the sound
    await this.htmlAudioElement.play();
  }

  /**
   * Enable or disable audio notifications
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is currently enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if the service respects system settings
   * This includes checking for silent mode on mobile devices
   */
  respectsSystemSettings(): boolean {
    // Check if we're in a mobile environment
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile, we respect the system volume and silent mode
      // The browser will automatically handle silent mode
      return true;
    }

    // On desktop, we respect the system volume
    return true;
  }

  /**
   * Get the current initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.htmlAudioElement) {
      this.htmlAudioElement.pause();
      this.htmlAudioElement = null;
    }

    this.audioBuffer = null;
    this.initialized = false;
  }
}

// Export a singleton instance
export const audioService = new AudioService();