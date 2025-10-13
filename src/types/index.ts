/**
 * Core TypeScript interfaces for the Prayer Cycle application
 */

export interface PrayerStep {
  id: number;
  name: string;
  description: string;
  duration: number; // duration in seconds (300 for 5 minutes)
}

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface UserSettings {
  audioEnabled: boolean;
  primaryColor: string; // #2cace2
  wakeLockEnabled: boolean;
  themeMode: ThemeMode;
}

export interface PrayerCycleState {
  currentStep: number; // 0-11 for the 12 steps
  timeRemaining: number; // seconds remaining in current step
  status: 'idle' | 'active' | 'paused' | 'transitioning' | 'completed';
  settings: UserSettings;
}

export type PrayerStatus = PrayerCycleState['status'];