import { mount, type MountingOptions } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import type { ComponentMountingOptions } from '@vue/test-utils'

// Create a minimal i18n instance for testing
const createTestI18n = () => {
  return createI18n({
    legacy: false,
    locale: 'en_US',
    fallbackLocale: 'en_US',
    messages: {
      en_US: {
        // Prayer steps
        'PRAISE': 'PRAISE',
        'Start your prayer hour by praising the Lord. Praise Him for things that are on your mind right now.': 'Start your prayer hour by praising the Lord. Praise Him for things that are on your mind right now.',
        'WAIT': 'WAIT',
        'Spend time waiting on the Lord.': 'Spend time waiting on the Lord.',

        // Prayer step names and descriptions - all 12 steps
        'prayer.steps.praise.name': 'PRAISE',
        'prayer.steps.praise.description': 'Start your prayer hour by praising the Lord. Praise Him for things that are on your mind right now.',
        'prayer.steps.wait.name': 'WAIT',
        'prayer.steps.wait.description': 'Spend time in silence, waiting on the Lord to speak to your heart.',
        'prayer.steps.confess.name': 'CONFESS',
        'prayer.steps.confess.description': 'Confess your sins and ask for God\'s forgiveness.',
        'prayer.steps.read_the_word.name': 'READ THE WORD',
        'prayer.steps.read_the_word.description': 'Read and meditate on Scripture.',
        'prayer.steps.ask.name': 'ASK',
        'prayer.steps.ask.description': 'Bring your personal requests to God.',
        'prayer.steps.intercession.name': 'INTERCESSION',
        'prayer.steps.intercession.description': 'Pray for others - family, friends, community, and world needs.',
        'prayer.steps.pray_the_word.name': 'PRAY THE WORD',
        'prayer.steps.pray_the_word.description': 'Pray Scripture back to God.',
        'prayer.steps.thank.name': 'THANK',
        'prayer.steps.thank.description': 'Thank God for His blessings, answered prayers, and faithfulness.',
        'prayer.steps.sing.name': 'SING',
        'prayer.steps.sing.description': 'Worship God through song or praise.',
        'prayer.steps.meditate.name': 'MEDITATE',
        'prayer.steps.meditate.description': 'Quietly reflect on God\'s goodness and character.',
        'prayer.steps.listen.name': 'LISTEN',
        'prayer.steps.listen.description': 'Be still and listen for God\'s voice.',
        'prayer.steps.praise_end.name': 'PRAISE',
        'prayer.steps.praise_end.description': 'End your prayer hour with praise and thanksgiving.',

        // Timer states
        'timer.status.idle': 'Ready to Start',
        'timer.status.active': 'Active',
        'timer.status.paused': 'Paused',
        'timer.status.completed': 'Completed',
        'timer.status.transitioning': 'Transitioning',
        'prayer.timer.status.idle': 'Ready',
        'prayer.timer.status.active': 'Active',
        'prayer.timer.status.paused': 'Paused',
        'prayer.timer.status.completed': 'Completed',
        'prayer.timer.status.transitioning': 'Transitioning',

        // Timer controls
        'prayer.timer.start': 'Start',
        'prayer.timer.pause': 'Pause',
        'prayer.timer.resume': 'Resume',
        'prayer.timer.next': 'Next',
        'prayer.timer.reset': 'Restart',
        'prayer.timer.completed': 'Completed',

        // Timer aria labels
        'prayer.timer.aria.start_cycle': 'Start prayer cycle',
        'prayer.timer.aria.pause_step': 'Pause current step',
        'prayer.timer.aria.resume_step': 'Resume current step',
        'prayer.timer.aria.next_step': 'Go to next step',
        'prayer.timer.aria.restart_cycle': 'Restart prayer cycle',
        'prayer.timer.aria.completed': 'Prayer cycle completed',
        'prayer.timer.aria.cycle_completed': 'Prayer cycle completed',

        // Step indicators
        'prayer.timer.step': 'Step',
        'prayer.timer.of': 'of',

        // Controls
        'controls.start': 'Start',
        'controls.pause': 'Pause',
        'controls.resume': 'Resume',
        'controls.next': 'Next',
        'controls.restart': 'Restart',

        // Common UI
        'common.step': 'Step',
        'common.of': 'of',
        'common.settings': 'Settings',

        // Language
        'language.selector': 'Language',

        // App
        'app.title': 'Prayer Hour',
        'app.description': 'A guided prayer experience',

        // Settings
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.audio': 'Audio Notifications',
        'settings.theme': 'Primary Color'
      }
    },
    globalInjection: true
  })
}

// Helper function to mount components with necessary global plugins
export function mountWithI18n<T>(component: T, options: ComponentMountingOptions<T> = {}) {
  const i18n = createTestI18n()
  const pinia = createPinia()

  return mount(component, {
    global: {
      plugins: [i18n, pinia],
      ...options.global
    },
    ...options
  })
}

// Export the i18n creator for custom test setups
export { createTestI18n } 