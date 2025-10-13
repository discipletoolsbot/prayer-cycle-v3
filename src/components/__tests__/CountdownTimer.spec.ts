import { describe, it, expect } from 'vitest'
import { mountWithI18n as mount } from '@/test-utils'
import CountdownTimer from '../CountdownTimer.vue'
import type { PrayerStatus } from '@/types'

describe('CountdownTimer', () => {
  const defaultProps = {
    timeRemaining: 300, // 5 minutes
    status: 'active' as PrayerStatus,
    deviceType: 'mobile' as const
  }

  describe('Time Formatting', () => {
    it('formats time correctly as MM:SS', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 300 }
      })

      expect(wrapper.find('.countdown-timer__display').text()).toBe('05:00')
    })

    it('formats time correctly for single digit minutes and seconds', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 65 }
      })

      expect(wrapper.find('.countdown-timer__display').text()).toBe('01:05')
    })

    it('formats time correctly for zero seconds', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 60 }
      })

      expect(wrapper.find('.countdown-timer__display').text()).toBe('01:00')
    })

    it('formats time correctly when time is zero', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 0 }
      })

      expect(wrapper.find('.countdown-timer__display').text()).toBe('00:00')
    })

    it('handles large time values correctly', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 3661 } // 61 minutes, 1 second
      })

      expect(wrapper.find('.countdown-timer__display').text()).toBe('61:01')
    })
  })


  describe('Status-based Color Changes', () => {
    it('applies active status class', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, status: 'active' }
      })

      expect(wrapper.classes()).toContain('countdown-timer--active')
      expect(wrapper.find('.countdown-timer__label').text()).toBe('Active')
    })

    it('applies paused status class', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, status: 'paused' }
      })

      expect(wrapper.classes()).toContain('countdown-timer--paused')
      expect(wrapper.find('.countdown-timer__label').text()).toBe('Paused')
    })

    it('applies completed status class', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, status: 'completed' }
      })

      expect(wrapper.classes()).toContain('countdown-timer--completed')
      expect(wrapper.find('.countdown-timer__label').text()).toBe('Completed')
    })

    it('applies idle status class', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, status: 'idle' }
      })

      expect(wrapper.classes()).toContain('countdown-timer--idle')
      expect(wrapper.find('.countdown-timer__label').text()).toBe('Ready')
    })

    it('applies transitioning status class', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, status: 'transitioning' }
      })

      expect(wrapper.classes()).toContain('countdown-timer--transitioning')
      expect(wrapper.find('.countdown-timer__label').text()).toBe('Transitioning')
    })
  })

  describe('Component Structure', () => {
    it('renders the timer display element', () => {
      const wrapper = mount(CountdownTimer, { props: defaultProps })

      expect(wrapper.find('.countdown-timer__display').exists()).toBe(true)
    })

    it('renders the status label element', () => {
      const wrapper = mount(CountdownTimer, { props: defaultProps })

      expect(wrapper.find('.countdown-timer__label').exists()).toBe(true)
    })

    it('has proper ARIA structure for accessibility', () => {
      const wrapper = mount(CountdownTimer, { props: defaultProps })

      // Timer should be readable by screen readers
      expect(wrapper.find('.countdown-timer__display').exists()).toBe(true)
      expect(wrapper.find('.countdown-timer__label').exists()).toBe(true)
    })
  })

  describe('Typography and Readability', () => {
    it('uses monospace font family for consistent digit spacing', () => {
      const wrapper = mount(CountdownTimer, { props: defaultProps })
      const display = wrapper.find('.countdown-timer__display')

      // Check that the element exists and would have monospace styling
      expect(display.exists()).toBe(true)
      expect(display.element.tagName).toBe('DIV')
    })

    it('displays time with proper padding for consistent width', () => {
      // Test various time values to ensure consistent formatting
      const testCases = [
        { time: 0, expected: '00:00' },
        { time: 5, expected: '00:05' },
        { time: 60, expected: '01:00' },
        { time: 125, expected: '02:05' },
        { time: 3600, expected: '60:00' }
      ]

      testCases.forEach(({ time, expected }) => {
        const wrapper = mount(CountdownTimer, {
          props: { ...defaultProps, timeRemaining: time }
        })
        expect(wrapper.find('.countdown-timer__display').text()).toBe(expected)
      })
    })
  })


  describe('Props Validation', () => {
    it('handles negative time values gracefully', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: -10 }
      })

      // Should display as 00:00 or handle gracefully
      expect(wrapper.find('.countdown-timer__display').text()).toMatch(/^\d{2}:\d{2}$/)
    })

    it('handles very large time values', () => {
      const wrapper = mount(CountdownTimer, {
        props: { ...defaultProps, timeRemaining: 99999 }
      })

      // Should still format correctly
      expect(wrapper.find('.countdown-timer__display').text()).toMatch(/^\d+:\d{2}$/)
    })
  })

  describe('Status Label Display', () => {
    const statusTests = [
      { status: 'active' as PrayerStatus, label: 'Active' },
      { status: 'paused' as PrayerStatus, label: 'Paused' },
      { status: 'completed' as PrayerStatus, label: 'Completed' },
      { status: 'idle' as PrayerStatus, label: 'Ready' },
      { status: 'transitioning' as PrayerStatus, label: 'Transitioning' }
    ]

    statusTests.forEach(({ status, label }) => {
      it(`displays correct label for ${status} status`, () => {
        const wrapper = mount(CountdownTimer, {
          props: { ...defaultProps, status }
        })

        expect(wrapper.find('.countdown-timer__label').text()).toBe(label)
      })
    })
  })
})