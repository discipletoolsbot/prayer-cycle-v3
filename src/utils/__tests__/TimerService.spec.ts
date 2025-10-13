import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerService } from '../TimerService';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});
Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

describe('TimerService', () => {
  let timerService: TimerService;
  let onTickMock: ReturnType<typeof vi.fn>;
  let onCompleteMock: ReturnType<typeof vi.fn>;
  let currentTime: number;

  beforeEach(() => {
    timerService = new TimerService();
    onTickMock = vi.fn();
    onCompleteMock = vi.fn();
    currentTime = 0;

    // Reset mocks
    mockPerformanceNow.mockImplementation(() => currentTime);
    mockRequestAnimationFrame.mockImplementation((callback) => {
      // Simulate immediate execution for testing
      setTimeout(callback, 0);
      return 1; // Mock frame ID
    });
    mockCancelAnimationFrame.mockClear();
  });

  afterEach(() => {
    timerService.stop();
    vi.clearAllMocks();
  });

  describe('start', () => {
    it('should start timer with correct duration and callbacks', () => {
      const duration = 5; // 5 seconds

      timerService.start(duration, onTickMock, onCompleteMock);

      expect(timerService.isActive()).toBe(true);
      expect(timerService.getRemainingTime()).toBe(duration);
    });

    it('should stop existing timer before starting new one', () => {
      timerService.start(5, onTickMock, onCompleteMock);
      const firstTimerActive = timerService.isActive();

      timerService.start(10, onTickMock, onCompleteMock);

      expect(firstTimerActive).toBe(true);
      expect(timerService.isActive()).toBe(true);
      expect(timerService.getRemainingTime()).toBe(10);
    });

    it('should call onTick callback during timer execution', async () => {
      const duration = 2;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Simulate time passing
      currentTime = 500; // 0.5 seconds

      // Trigger tick manually for testing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(onTickMock).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    it('should pause timer and return remaining time', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Simulate 3 seconds passing
      currentTime = 3000;
      const remainingTime = timerService.pause();

      expect(timerService.getPausedState()).toBe(true);
      expect(timerService.isActive()).toBe(false);
      expect(remainingTime).toBeCloseTo(7, 1); // Should be around 7 seconds remaining
    });

    it('should resume timer from paused state', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Pause after 3 seconds
      currentTime = 3000;
      timerService.pause();

      // Resume after being paused for 2 seconds
      currentTime = 5000;
      timerService.resume();

      expect(timerService.getPausedState()).toBe(false);
      expect(timerService.isActive()).toBe(true);
    });

    it('should resume with specific remaining time when provided', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      timerService.pause();
      timerService.resume(5); // Resume with 5 seconds remaining

      expect(timerService.getRemainingTime()).toBe(5);
    });

    it('should not pause if timer is not running', () => {
      const remainingTime = timerService.pause();

      expect(timerService.getPausedState()).toBe(false);
      expect(remainingTime).toBe(0);
    });

    it('should not resume if timer is not paused', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Try to resume without pausing first
      timerService.resume();

      expect(timerService.isActive()).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop timer completely', () => {
      timerService.start(10, onTickMock, onCompleteMock);

      timerService.stop();

      expect(timerService.isActive()).toBe(false);
      expect(timerService.getPausedState()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('should clear callbacks when stopped', () => {
      timerService.start(10, onTickMock, onCompleteMock);
      timerService.stop();

      // Callbacks should be cleared (tested indirectly by ensuring no calls after stop)
      expect(timerService.isActive()).toBe(false);
    });
  });

  describe('timer completion', () => {
    it('should call onComplete when timer reaches zero', async () => {
      const duration = 1; // 1 second
      timerService.start(duration, onTickMock, onCompleteMock);

      // Simulate time passing beyond duration
      currentTime = 1500; // 1.5 seconds

      // Manually trigger tick to simulate completion
      const tickMethod = (timerService as any).tick;
      tickMethod();

      expect(onCompleteMock).toHaveBeenCalled();
      expect(timerService.isActive()).toBe(false);
    });

    it('should not go below zero remaining time', async () => {
      const duration = 1;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Simulate time passing way beyond duration
      currentTime = 5000; // 5 seconds

      const tickMethod = (timerService as any).tick;
      tickMethod();

      expect(timerService.getRemainingTime()).toBe(0);
    });
  });

  describe('drift compensation', () => {
    it('should calculate remaining time based on performance.now()', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Simulate precise time measurement
      currentTime = 2500; // 2.5 seconds

      const tickMethod = (timerService as any).tick;
      tickMethod();

      expect(timerService.getRemainingTime()).toBeCloseTo(7.5, 1);
    });

    it('should handle pause duration correctly in resume', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // Run for 2 seconds
      currentTime = 2000;
      timerService.pause();

      // Pause for 3 seconds
      currentTime = 5000;
      timerService.resume();

      // The timer should account for the pause duration
      // After resume, remaining time should still be around 8 seconds
      expect(timerService.getRemainingTime()).toBeCloseTo(8, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      timerService.start(0, onTickMock, onCompleteMock);

      const tickMethod = (timerService as any).tick;
      tickMethod();

      expect(onCompleteMock).toHaveBeenCalled();
      expect(timerService.getRemainingTime()).toBe(0);
    });

    it('should handle negative duration gracefully', () => {
      timerService.start(-5, onTickMock, onCompleteMock);

      const tickMethod = (timerService as any).tick;
      tickMethod();

      expect(onCompleteMock).toHaveBeenCalled();
      expect(timerService.getRemainingTime()).toBe(0);
    });

    it('should handle multiple pause/resume cycles', () => {
      const duration = 10;
      timerService.start(duration, onTickMock, onCompleteMock);

      // First pause/resume cycle - run for 2 seconds, pause for 1 second
      currentTime = 2000; // 2 seconds elapsed, 8 remaining
      timerService.pause();
      currentTime = 3000; // paused for 1 second
      timerService.resume();

      // Second pause/resume cycle - run for 2 more seconds, pause for 2 seconds
      currentTime = 5000; // total 3 seconds elapsed (2 + 1 from resume adjustment), 7 remaining
      timerService.pause();
      currentTime = 7000; // paused for 2 seconds
      timerService.resume();

      expect(timerService.isActive()).toBe(true);
      // After multiple pause/resume cycles, check the actual remaining time
      expect(timerService.getRemainingTime()).toBeCloseTo(6, 1);
    });

    it('should handle rapid start/stop cycles', () => {
      for (let i = 0; i < 5; i++) {
        timerService.start(10, onTickMock, onCompleteMock);
        timerService.stop();
      }

      expect(timerService.isActive()).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('state queries', () => {
    it('should correctly report active state', () => {
      expect(timerService.isActive()).toBe(false);

      timerService.start(10, onTickMock, onCompleteMock);
      expect(timerService.isActive()).toBe(true);

      timerService.pause();
      expect(timerService.isActive()).toBe(false);

      timerService.resume();
      expect(timerService.isActive()).toBe(true);

      timerService.stop();
      expect(timerService.isActive()).toBe(false);
    });

    it('should correctly report paused state', () => {
      expect(timerService.getPausedState()).toBe(false);

      timerService.start(10, onTickMock, onCompleteMock);
      expect(timerService.getPausedState()).toBe(false);

      timerService.pause();
      expect(timerService.getPausedState()).toBe(true);

      timerService.resume();
      expect(timerService.getPausedState()).toBe(false);

      timerService.stop();
      expect(timerService.getPausedState()).toBe(false);
    });

    it('should correctly report remaining time', () => {
      const duration = 10;

      expect(timerService.getRemainingTime()).toBe(0);

      timerService.start(duration, onTickMock, onCompleteMock);
      expect(timerService.getRemainingTime()).toBe(duration);

      currentTime = 3000; // 3 seconds
      const tickMethod = (timerService as any).tick;
      tickMethod();
      expect(timerService.getRemainingTime()).toBeCloseTo(7, 1);
    });
  });
});