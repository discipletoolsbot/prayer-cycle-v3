import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountWithI18n as mount } from '@/test-utils'
import TimerControls from '../TimerControls.vue'
import type { PrayerStatus } from '@/types'

describe('TimerControls', () => {
  let wrapper: any

  beforeEach(() => {
    // Setup for each test
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders with default mobile props', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      expect(wrapper.find('.timer-controls').exists()).toBe(true)
      expect(wrapper.find('.timer-controls--mobile').exists()).toBe(true)
      expect(wrapper.find('.timer-controls--desktop').exists()).toBe(false)
    })


    it('renders all control buttons', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      const buttons = wrapper.findAll('.timer-controls__button')
      expect(buttons).toHaveLength(3)

      // Check button labels
      const labels = buttons.map((btn: any) => btn.find('.timer-controls__label').text())
      expect(labels).toContain('Start')
      expect(labels).toContain('Next')
      expect(labels).toContain('Restart')
    })
  })

  describe('Button States and Labels', () => {
    it('shows correct play/pause button label for idle status', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Start')
      expect(playButton.attributes('aria-label')).toBe('Start prayer cycle')
    })

    it('shows correct play/pause button label for active status', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Pause')
      expect(playButton.attributes('aria-label')).toBe('Pause current step')
      expect(playButton.classes()).toContain('timer-controls__button--active')
    })

    it('shows correct play/pause button label for paused status', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'paused' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Resume')
      expect(playButton.attributes('aria-label')).toBe('Resume current step')
    })

    it('shows correct play/pause button label for completed status', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'completed' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      expect(playButton.find('.timer-controls__label').text()).toBe('Completed')
      expect(playButton.attributes('aria-label')).toBe('Prayer cycle completed')
      expect(playButton.attributes('disabled')).toBeDefined()
    })

    it('disables buttons when status is completed', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'completed' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      const nextButton = wrapper.findAll('.timer-controls__button--secondary')[0]

      expect(playButton.attributes('disabled')).toBeDefined()
      expect(nextButton.attributes('disabled')).toBeDefined()
      expect(wrapper.find('.timer-controls--disabled').exists()).toBe(true)
    })
  })

  describe('Event Emission', () => {
    it('emits play event when clicking start button in idle state', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      await playButton.trigger('click')

      expect(wrapper.emitted('play')).toHaveLength(1)
    })

    it('emits play event when clicking resume button in paused state', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'paused' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      await playButton.trigger('click')

      expect(wrapper.emitted('play')).toHaveLength(1)
    })

    it('emits pause event when clicking pause button in active state', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      await playButton.trigger('click')

      expect(wrapper.emitted('pause')).toHaveLength(1)
    })

    it('emits next event when clicking next button', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      const nextButton = wrapper.findAll('.timer-controls__button--secondary')[0]
      await nextButton.trigger('click')

      expect(wrapper.emitted('next')).toHaveLength(1)
    })

    it('emits restart event when clicking restart button', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      const restartButton = wrapper.findAll('.timer-controls__button--secondary')[1]
      await restartButton.trigger('click')

      expect(wrapper.emitted('restart')).toHaveLength(1)
    })

    it('does not emit events when buttons are disabled', async () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'completed' as PrayerStatus
        }
      })

      const playButton = wrapper.find('.timer-controls__button--primary')
      const nextButton = wrapper.findAll('.timer-controls__button--secondary')[0]

      await playButton.trigger('click')
      await nextButton.trigger('click')

      expect(wrapper.emitted('play')).toBeFalsy()
      expect(wrapper.emitted('next')).toBeFalsy()
    })
  })


  describe('Accessibility', () => {
    it('has proper ARIA labels for all buttons', () => {
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      const buttons = wrapper.findAll('.timer-controls__button')
      buttons.forEach((button: any) => {
        expect(button.attributes('aria-label')).toBeTruthy()
      })
    })

  })

  describe('Visual States', () => {

    it('shows correct icons for play and pause states', () => {
      // Test play icon (idle state)
      wrapper = mount(TimerControls, {
        props: {
          status: 'idle' as PrayerStatus
        }
      })

      let playButton = wrapper.find('.timer-controls__button--primary')
      let playIcon = playButton.find('svg path')
      expect(playIcon.attributes('d')).toBe('M8 5v14l11-7z') // Play icon path

      wrapper.unmount()

      // Test pause icon (active state)
      wrapper = mount(TimerControls, {
        props: {
          status: 'active' as PrayerStatus
        }
      })

      playButton = wrapper.find('.timer-controls__button--primary')
      let pauseIcon = playButton.find('svg path')
      expect(pauseIcon.attributes('d')).toBe('M6 19h4V5H6v14zm8-14v14h4V5h-4z') // Pause icon path
    })
  })
})