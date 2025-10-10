import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

// Supported languages configuration - matching Zume training system codes
// Only languages with enabled: true will be displayed in the UI
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', enabled: true },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', enabled: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: true },
  { code: 'ar_jo', name: 'Arabic (Jordanian)', nativeName: 'العربية - الأردن', enabled: true },
  { code: 'ar_tn', name: 'Arabic (Tunisian)', nativeName: ' العربية التونسية', enabled: true },
  { code: 'hy', name: 'Armenian', nativeName: 'Armenian', enabled: true },
  { code: 'bn', name: 'Bengali (India)', nativeName: 'বাংলা', enabled: true },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', enabled: true },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', enabled: true },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', enabled: true },
  { code: 'zhhk', name: 'Cantonese (Traditional)', nativeName: '中文（繁體,香港）', enabled: true },
  { code: 'zhcn', name: 'Chinese (Simplified)', nativeName: '中文（简体）', enabled: true },
  { code: 'zhtw', name: 'Chinese (Traditional)', nativeName: '中文（繁體）', enabled: true },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', enabled: true },
  { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', enabled: true },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', enabled: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', enabled: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', enabled: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'کوردی', enabled: true },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', enabled: true },
  { code: 'mai', name: 'Maithili', nativeName: '𑒧𑒻𑒟𑒱𑒪𑒲', enabled: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', enabled: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', enabled: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', enabled: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', enabled: true },
  { code: 'fa', name: 'Persian/Farsi', nativeName: 'فارسی', enabled: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', enabled: true },
  { code: 'pa_pk', name: 'Punjabi (Western)', nativeName: 'ਪੰਜਾਬੀ (ਪੱਛਮੀ)', enabled: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', enabled: true },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', enabled: true },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', enabled: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: true },
  { code: 'swa', name: 'Swahili', nativeName: 'Kiswahili', enabled: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', enabled: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', enabled: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', enabled: true },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: true },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', enabled: true }
] as const

// Default language
const DEFAULT_LANGUAGE = 'en'

// Get browser language or fall back to default
function getBrowserLanguage(): string {
  const fullLang = navigator.language.replace('-', '_') // Convert en-US to en_US
  const shortLang = navigator.language.split('-')[0]

  // Try exact match first (e.g., en_US) - only enabled languages
  if (SUPPORTED_LANGUAGES.some(lang => lang.code === fullLang && lang.enabled)) {
    return fullLang
  }

  // Try short language code (e.g., en -> en_US) - only enabled languages
  const matchedLang = SUPPORTED_LANGUAGES.find(lang => lang.code.startsWith(shortLang) && lang.enabled)
  return matchedLang ? matchedLang.code : DEFAULT_LANGUAGE
}

// Get language from URL path (e.g., /es, /fr)
function getLanguageFromUrl(): string | null {
  const path = window.location.pathname
  // Extract the first segment of the path (e.g., /es -> es, /es/something -> es)
  const pathSegments = path.split('/').filter(segment => segment.length > 0)

  if (pathSegments.length > 0) {
    const langCode = pathSegments[0]
    // Validate against supported and enabled languages
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === langCode && lang.enabled)
    if (isSupported) {
      console.log(`Using URL path language: ${langCode}`)
      return langCode
    }
  }

  return null
}

// Get saved language from localStorage or browser default
function getSavedLanguage(): string {
  // Priority: URL path > localStorage > browser language > default
  return getLanguageFromUrl() || localStorage.getItem('prayer-cycle-language') || getBrowserLanguage()
}

// Save language to localStorage
export function saveLanguage(language: string): void {
  localStorage.setItem('prayer-cycle-language', language)
}

// Lazy load translation files
async function loadTranslation(language: string) {
  try {
    const translations = await import(`./locales/${language}.json`)
    return translations.default
  } catch (error) {
    console.warn(`Failed to load translation for ${language}, falling back to English`)
    return en
  }
}

// Create i18n instance
export const i18n = createI18n({
  legacy: false,
  locale: getSavedLanguage(),
  fallbackLocale: DEFAULT_LANGUAGE,
  messages: {
    en: en,
    fr: fr
  } as any,
  globalInjection: true
})

// Function to change language dynamically
export async function setLanguage(language: string) {
  if (!SUPPORTED_LANGUAGES.some(lang => lang.code === language && lang.enabled)) {
    console.warn(`Language ${language} is not supported or not enabled`)
    return
  }

  // Load translation if not already loaded
  if (!i18n.global.availableLocales.includes(language)) {
    const messages = await loadTranslation(language)
    i18n.global.setLocaleMessage(language as any, messages)
  }

  i18n.global.locale.value = language as any
  saveLanguage(language)

  // Update document language attribute
  document.documentElement.lang = language

  // Update URL path to reflect language change
  updateUrlPath(language)
}

// Update URL path with language code
function updateUrlPath(language: string): void {
  const currentPath = window.location.pathname
  const currentSearch = window.location.search
  const pathSegments = currentPath.split('/').filter(segment => segment.length > 0)

  // Check if first segment is a language code
  const firstSegmentIsLang = pathSegments.length > 0 &&
    SUPPORTED_LANGUAGES.some(lang => lang.code === pathSegments[0])

  let newPath: string

  if (language === DEFAULT_LANGUAGE) {
    // For default language (English), use root path
    if (firstSegmentIsLang) {
      // Remove language segment
      pathSegments.shift()
      newPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/'
    } else {
      newPath = currentPath
    }
  } else {
    // For non-default languages, add/replace language segment
    if (firstSegmentIsLang) {
      // Replace existing language segment
      pathSegments[0] = language
      newPath = `/${pathSegments.join('/')}`
    } else {
      // Add language segment
      newPath = pathSegments.length > 0 ? `/${language}/${pathSegments.join('/')}` : `/${language}`
    }
  }

  // Preserve query parameters
  const newUrl = newPath + currentSearch

  // Only update if the path changed
  if (newUrl !== currentPath + currentSearch) {
    window.history.pushState({}, '', newUrl)
  }
}

// Initialize with saved language
const savedLanguage = getSavedLanguage()
if (savedLanguage !== DEFAULT_LANGUAGE) {
  setLanguage(savedLanguage)
}