import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mountWithI18n as mount } from '@/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TimerControls from '../TimerControls.vue'
import { usePrayerCycleStore } from '@/stores/prayerCycle'
import type { PrayerStatus } from '@/types'

describe('TimerControls Integration', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    const pinia = createPinia()
    setActivePinia(pinia)
    store = usePrayerCycleStore()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Store Integration', () => {
    it('integrates correctly with Pinia store status', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: store.status as PrayerStatus
        }
      })

      expect(wrapper.find('.timer-controls').exists()).toBe(true)

      // Initial state should be idle
      const playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Start')
    })

    it('responds to store status changes', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      // Initially shows Start
      let playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Start')

      // Update props to active status
      await wrapper.setProps({ status: 'active' })

      playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Pause')
      expect(playButton.classes()).toContain('timer-controls__button--active')
    })

    it('emits events that can be handled by store actions', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      // Test play event emission
      const playButton = wrapper.find('.timer-controls__button--primary')
      await playButton.trigger('click')

      expect(wrapper.emitted('play')).toHaveLength(1)

      // Test next event emission
      const nextButton = wrapper.findAll('.timer-controls__button--secondary')[0]
      await nextButton.trigger('click')

      expect(wrapper.emitted('next')).toHaveLength(1)

      // Test restart event emission
      const restartButton = wrapper.findAll('.timer-controls__button--secondary')[1]
      await restartButton.trigger('click')

      expect(wrapper.emitted('restart')).toHaveLength(1)
    })

    it('handles completed status correctly', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'completed' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      const nextButton = wrapper.findAll('.timer-controls__button--secondary')[0]

      // Buttons should be disabled
      expect(playButton.attributes('disabled')).toBeDefined()
      expect(nextButton.attributes('disabled')).toBeDefined()

      // Label should show completed
      expect(playButton.find('.timer-controls__label').text()).toBe('Completed')

      // Container should have disabled class
      expect(wrapper.find('.timer-controls--disabled').exists()).toBe(true)
    })
  })


  describe('Accessibility Integration', () => {
    it('provides proper accessibility attributes', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      // Check ARIA labels
      const buttons = wrapper.findAll('.timer-controls__button')
      buttons.forEach((button: any) => {
        expect(button.attributes('aria-label')).toBeTruthy()
      })

      // Component should be accessible without tabindex since we removed keyboard shortcuts
    })

    it('does not show keyboard shortcuts since they were removed', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      const shortcutsHint = wrapper.find('.timer-controls__shortcut-hint')
      expect(shortcutsHint.exists()).toBe(false)
    })
  })

  describe('Visual State Integration', () => {
    it('shows correct visual states for different prayer statuses', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      // Test idle state
      let playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.classes()).not.toContain('timer-controls__button--active')

      // Test active state
      await wrapper.setProps({ status: 'active' })
      playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.classes()).toContain('timer-controls__button--active')

      // Test paused state
      await wrapper.setProps({ status: 'paused' })
      playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.classes()).not.toContain('timer-controls__button--active')
      expect(playButton.find('.timer-controls__label').text()).toBe('Resume')
    })

    it('shows correct icons for play/pause states', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      // Test play icon (idle state)
      let playButton = wrapper.find('.timer-controls__button--primary')
      let icon = playButton.find('svg path')
      expect(icon.attributes('d')).toBe('M8 5v14l11-7z') // Play icon

      // Test pause icon (active state)
      await wrapper.setProps({ status: 'active' })
      playButton = wrapper.find('.timer-controls__button--primary')
      icon = playButton.find('svg path')
      expect(icon.attributes('d')).toBe('M6 19h4V5H6v14zm8-14v14h4V5h-4z') // Pause icon
    })
  })
})