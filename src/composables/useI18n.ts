import { computed } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { SUPPORTED_LANGUAGES, setLanguage as setAppLanguage } from '@/i18n'

/**
 * Composable for internationalization functionality
 * Provides translation methods and language management
 */
export function useI18n() {
  const { t, locale, availableLocales } = useVueI18n()

  const currentLanguage = computed(() => locale.value)

  const currentLanguageInfo = computed(() => 
    SUPPORTED_LANGUAGES.find(lang => lang.code === locale.value) || SUPPORTED_LANGUAGES[0]
  )

  const supportedLanguages = computed(() => SUPPORTED_LANGUAGES.filter(lang => lang.enabled))

  /**
   * Change the application language
   * @param languageCode - The language code to switch to
   */
  const changeLanguage = async (languageCode: string) => {
    await setAppLanguage(languageCode)
  }

  /**
   * Get translation with fallback to key if translation is missing
   * @param key - Translation key
   * @param fallback - Fallback text if translation is missing
   */
  const translate = (key: string, fallback?: string) => {
    const translation = t(key)
    return translation === key && fallback ? fallback : translation
  }

  /**
   * Check if a language is supported and enabled
   * @param languageCode - The language code to check
   */
  const isLanguageSupported = (languageCode: string) => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode && lang.enabled)
  }

  /**
   * Get the native name for a language code
   * @param languageCode - The language code
   */
  const getLanguageNativeName = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)
    return language?.nativeName || languageCode
  }

  return {
    t: translate,
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages,
    changeLanguage,
    isLanguageSupported,
    getLanguageNativeName,
    availableLocales
  }
}