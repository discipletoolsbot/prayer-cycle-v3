import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

// Supported languages configuration - matching Zume training system codes
// Only languages with enabled: true will be displayed in the UI
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', enabled: true },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', enabled: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', enabled: false },
  { code: 'ar_jo', name: 'Arabic (Jordanian)', nativeName: 'العربية - الأردن', enabled: false },
  { code: 'ar_tn', name: 'Arabic (Tunisian)', nativeName: ' العربية التونسية', enabled: false },
  { code: 'hy', name: 'Armenian', nativeName: 'Armenian', enabled: false },
  { code: 'asl', name: 'American Sign Language', nativeName: 'Sign Language', enabled: false },
  { code: 'bn', name: 'Bengali (India)', nativeName: 'বাংলা', enabled: false },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', enabled: false },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', enabled: false },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', enabled: false },
  { code: 'zhhk', name: 'Cantonese (Traditional)', nativeName: '中文（繁體,香港）', enabled: false },
  { code: 'zhcn', name: 'Chinese (Simplified)', nativeName: '中文（简体）', enabled: false },
  { code: 'zhtw', name: 'Chinese (Traditional)', nativeName: '中文（繁體）', enabled: false },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', enabled: false },
  { code: 'fr', name: 'French', nativeName: 'Français', enabled: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', enabled: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', enabled: false },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', enabled: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', enabled: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', enabled: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', enabled: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', enabled: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', enabled: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', enabled: false },
  { code: 'ku', name: 'Kurdish', nativeName: 'کوردی', enabled: false },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', enabled: false },
  { code: 'mai', name: 'Maithili', nativeName: '𑒧𑒻𑒟𑒱𑒪𑒲', enabled: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', enabled: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', enabled: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', enabled: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', enabled: false },
  { code: 'fa', name: 'Persian/Farsi', nativeName: 'فارسی', enabled: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', enabled: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', enabled: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', enabled: false },
  { code: 'pa_pk', name: 'Punjabi (Western)', nativeName: 'ਪੰਜਾਬੀ (ਪੱਛਮੀ)', enabled: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', enabled: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', enabled: false },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', enabled: false },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', enabled: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', enabled: false },
  { code: 'swa', name: 'Swahili', nativeName: 'Kiswahili', enabled: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', enabled: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', enabled: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', enabled: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', enabled: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', enabled: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', enabled: false },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', enabled: false }
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

// Get saved language from localStorage or browser default
function getSavedLanguage(): string {
  return localStorage.getItem('prayer-cycle-language') || getBrowserLanguage()
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
}

// Initialize with saved language
const savedLanguage = getSavedLanguage()
if (savedLanguage !== DEFAULT_LANGUAGE) {
  setLanguage(savedLanguage)
}