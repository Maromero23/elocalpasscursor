// Language detection utility for automatic language selection
// Supports browser language detection and fallback logic

interface LanguageMap {
  [key: string]: string
}

// Supported languages with their display names
export const SUPPORTED_LANGUAGES: LanguageMap = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'pt': 'Português',
  'it': 'Italiano'
}

// Default language fallback
export const DEFAULT_LANGUAGE = 'en'

/**
 * Detects the user's preferred language from browser settings
 * @returns {string} Language code (e.g., 'en', 'es')
 */
export function detectBrowserLanguage(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  // Get user's preferred languages from browser
  const userLanguages = [
    navigator.language,
    ...(navigator.languages || [])
  ]

  // Find the first supported language
  for (const lang of userLanguages) {
    // Extract language code (e.g., 'en-US' -> 'en')
    const langCode = lang.split('-')[0].toLowerCase()
    
    if (SUPPORTED_LANGUAGES[langCode]) {
      console.log(`🌍 Auto-detected language: ${langCode} (${SUPPORTED_LANGUAGES[langCode]})`)
      return langCode
    }
  }

  // Fallback to default language
  console.log(`🌍 Using default language: ${DEFAULT_LANGUAGE}`)
  return DEFAULT_LANGUAGE
}

/**
 * Gets language from Accept-Language header (server-side)
 * @param {string} acceptLanguageHeader - The Accept-Language header value
 * @returns {string} Language code
 */
export function detectServerLanguage(acceptLanguageHeader?: string): string {
  if (!acceptLanguageHeader) {
    return DEFAULT_LANGUAGE
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, quality] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(),
        quality: quality ? parseFloat(quality) : 1.0
      }
    })
    .sort((a, b) => b.quality - a.quality)

  // Find the first supported language
  for (const { code } of languages) {
    if (SUPPORTED_LANGUAGES[code]) {
      console.log(`🌍 Server detected language: ${code} (${SUPPORTED_LANGUAGES[code]})`)
      return code
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * Gets the display name for a language code
 * @param {string} langCode - Language code (e.g., 'en')
 * @returns {string} Display name (e.g., 'English')
 */
export function getLanguageDisplayName(langCode: string): string {
  return SUPPORTED_LANGUAGES[langCode] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
}

/**
 * Validates if a language code is supported
 * @param {string} langCode - Language code to validate
 * @returns {boolean} Whether the language is supported
 */
export function isLanguageSupported(langCode: string): boolean {
  return !!SUPPORTED_LANGUAGES[langCode]
}

/**
 * Hook for client-side language detection
 * @returns {string} Detected language code
 */
export function useAutoLanguageDetection(): string {
  if (typeof window !== 'undefined') {
    return detectBrowserLanguage()
  }
  return DEFAULT_LANGUAGE
} 