import { describe, it, expect } from 'vitest'
import { mountWithI18n as mount } from '@/test-utils'
import ProgressIndicator from '../ProgressIndicator.vue'

describe('ProgressIndicator', () => {
  describe('Component Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          deviceType: 'mobile'
        }
      })

      expect(wrapper.find('.progress-indicator').exists()).toBe(true)
      expect(wrapper.find('.step-counter').exists()).toBe(true)
      expect(wrapper.find('.progress-circle-container').exists()).toBe(true)
      expect(wrapper.find('.countdown-display').exists()).toBe(true)
    })

    it('displays correct step counter text', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 3,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepText = wrapper.find('.step-text')
      expect(stepText.text()).toBe('Step 3 of 12')
    })

    it('displays correct countdown time in center', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 5,
          totalSteps: 12,
          timeRemaining: 180, // 3 minutes
          deviceType: 'mobile'
        }
      })

      const countdownTime = wrapper.find('.countdown-time')
      expect(countdownTime.text()).toBe('3:00')
    })

    it('displays step progress correctly', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 4,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepText = wrapper.find('.step-text')
      expect(stepText.text()).toBe('Step 4 of 12')
    })
  })


  describe('SVG Circle Progress Visualization', () => {
    it('renders background and progress circles', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          deviceType: 'mobile'
        }
      })

      const circles = wrapper.findAll('circle')
      expect(circles.length).toBeGreaterThanOrEqual(2) // Background + progress + step indicators

      // Check background circle
      const backgroundCircle = circles[0]
      expect(backgroundCircle.attributes('fill')).toBe('var(--color-background-soft)')
      expect(backgroundCircle.attributes('stroke')).toBe('var(--color-background-mute)')

      // Step indicator circles are also present
      expect(circles.length).toBeGreaterThanOrEqual(12) // Background + 12 step indicators
    })

    it('renders progress pie slice correctly', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 6,
          totalSteps: 12,
          timeRemaining: 150,
          stepDuration: 300,
          deviceType: 'mobile'
        }
      })

      const progressPie = wrapper.find('.progress-pie')
      expect(progressPie.exists()).toBe(true)
      expect(progressPie.attributes('fill')).toBe('rgba(44, 172, 226, 0.6)')
      expect(progressPie.attributes('stroke')).toBe('rgba(44, 172, 226, 0.8)')
    })

    it('renders correct number of step indicator dots', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 3,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepDots = wrapper.findAll('.step-dot')
      expect(stepDots.length).toBe(12)
    })
  })

  describe('Step Indicator Visual States', () => {
    it('shows completed steps in success color', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 4,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepDots = wrapper.findAll('.step-dot')

      // First 3 steps should be completed (success color)
      for (let i = 0; i < 3; i++) {
        expect(stepDots[i].attributes('fill')).toBe('var(--pc-success)')
        expect(stepDots[i].attributes('stroke')).toBe('#1e7e34') // Darker green border for better contrast
      }
    })

    it('shows current step in primary color', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 4,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepDots = wrapper.findAll('.step-dot')

      // 4th step (index 3) should be current (primary color)
      expect(stepDots[3].attributes('fill')).toBe('var(--color-primary)')
      expect(stepDots[3].attributes('stroke')).toBe('var(--color-primary)')
    })

    it('shows upcoming steps in light color', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 4,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      const stepDots = wrapper.findAll('.step-dot')

      // Steps 5-12 (indices 4-11) should be upcoming (light color)
      for (let i = 4; i < 12; i++) {
        expect(stepDots[i].attributes('fill')).toBe('var(--color-background-soft)')
        expect(stepDots[i].attributes('stroke')).toBe('var(--color-text-secondary)')
      }
    })
  })

  describe('Edge Cases', () => {
    it('handles first step correctly', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 1,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      expect(wrapper.find('.step-text').text()).toBe('Step 1 of 12')

      const stepDots = wrapper.findAll('.step-dot')
      expect(stepDots[0].attributes('fill')).toBe('var(--color-primary)') // Current
      expect(stepDots[1].attributes('fill')).toBe('var(--color-background-soft)') // Upcoming
    })

    it('handles last step correctly', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 12,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      expect(wrapper.find('.step-text').text()).toBe('Step 12 of 12')

      const stepDots = wrapper.findAll('.step-dot')
      expect(stepDots[11].attributes('fill')).toBe('var(--color-primary)') // Current (last)
      expect(stepDots[10].attributes('fill')).toBe('var(--pc-success)') // Completed
    })

    it('handles single step cycle', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 1,
          totalSteps: 1,
          deviceType: 'mobile'
        }
      })

      expect(wrapper.find('.step-text').text()).toBe('Step 1 of 1')

      const stepDots = wrapper.findAll('.step-dot')
      expect(stepDots.length).toBe(1)
      expect(stepDots[0].attributes('fill')).toBe('var(--color-primary)')
    })
  })

  describe('Accessibility', () => {
    it('provides semantic structure with proper text content', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 5,
          totalSteps: 12,
          timeRemaining: 300,
          deviceType: 'mobile'
        }
      })

      // Check that all text content is accessible
      expect(wrapper.text()).toContain('Step 5 of 12')
      expect(wrapper.text()).toContain('5:00') // countdown time
    })

    it('maintains proper contrast with CSS custom properties', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          deviceType: 'mobile'
        }
      })

      // Verify that color values use CSS custom properties for theming
      const progressCircle = wrapper.findAll('circle')[1]
      expect(progressCircle.attributes('stroke')).toBe('var(--color-primary)')

      const stepText = wrapper.find('.step-text')
      expect(stepText.classes()).not.toContain('text-primary') // Uses default text color
    })
  })

  describe('Requirements Validation', () => {
    it('satisfies requirement 2.1: displays visual progress indicator', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 6,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      // Should show circular progress visualization
      expect(wrapper.find('.progress-circle').exists()).toBe(true)
      expect(wrapper.find('.progress-pie').exists()).toBe(true)

      // Should show current position in 12-step cycle
      const stepDots = wrapper.findAll('.step-dot')
      expect(stepDots.length).toBe(12)
    })

    it('satisfies requirement 2.2: shows step number', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 7,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      // Should display which step number is currently active
      expect(wrapper.find('.step-text').text()).toBe('Step 7 of 12')
    })

    it('satisfies requirement 2.3: indicates completed and upcoming steps', () => {
      const wrapper = mount(ProgressIndicator, {
        props: {
          currentStep: 5,
          totalSteps: 12,
          deviceType: 'mobile'
        }
      })

      // Should indicate completed, current, and upcoming steps via step dots

      const stepDots = wrapper.findAll('.step-dot')
      // Completed steps (0-3) should have success color
      expect(stepDots[3].attributes('fill')).toBe('var(--pc-success)')
      // Current step (4) should have primary color
      expect(stepDots[4].attributes('fill')).toBe('var(--color-primary)')
      // Upcoming steps (5+) should have light color
      expect(stepDots[5].attributes('fill')).toBe('var(--color-background-soft)')
    })

  })
})