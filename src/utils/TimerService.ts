/**
 * High-precision timer service using requestAnimationFrame for accurate timing
 * Includes pause/resume functionality and drift compensation
 */

export class TimerService {
  private startTime: number = 0;
  private pausedTime: number = 0;
  private duration: number = 0;
  private remainingTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  private onTick: ((remaining: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  /**
   * Start the timer with specified duration and callbacks
   * @param duration Duration in seconds
   * @param onTick Callback called on each tick with remaining time
   * @param onComplete Callback called when timer completes
   */
  start(
    duration: number,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): void {
    if (this.isRunning) {
      this.stop();
    }

    this.duration = duration;
    this.remainingTime = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now();

    this.tick();
  }

  /**
   * Pause the timer and return remaining time
   * @returns Remaining time in seconds
   */
  pause(): number {
    if (!this.isRunning || this.isPaused) {
      return this.remainingTime;
    }

    // Calculate current remaining time before pausing
    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000;
    this.remainingTime = Math.max(0, this.duration - elapsed);

    this.isPaused = true;
    this.pausedTime = currentTime;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return this.remainingTime;
  }

  /**
   * Resume the timer from paused state
   * @param remaining Optional remaining time to resume with
   */
  resume(remaining?: number): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    if (remaining !== undefined) {
      this.remainingTime = remaining;
      // Recalculate duration and start time based on new remaining time
      this.duration = remaining;
      this.startTime = performance.now();
    } else {
      // Adjust start time to account for paused duration
      const pausedDuration = performance.now() - this.pausedTime;
      this.startTime += pausedDuration;
    }

    this.isPaused = false;
    this.tick();
  }

  /**
   * Stop the timer completely
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.onTick = null;
    this.onComplete = null;
  }

  /**
   * Get current remaining time
   * @returns Remaining time in seconds
   */
  getRemainingTime(): number {
    return this.remainingTime;
  }

  /**
   * Check if timer is currently running
   * @returns True if timer is running and not paused
   */
  isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Check if timer is paused
   * @returns True if timer is paused
   */
  getPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Internal tick method using requestAnimationFrame for high precision
   */
  private tick = (): void => {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds

    // Calculate remaining time with drift compensation
    this.remainingTime = Math.max(0, this.duration - elapsed);

    // Call tick callback with remaining time
    if (this.onTick) {
      this.onTick(this.remainingTime);
    }

    // Check if timer is complete
    if (this.remainingTime <= 0) {
      this.isRunning = false;
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    // Schedule next tick
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}