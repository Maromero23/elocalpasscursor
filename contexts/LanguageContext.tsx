'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import enTranslations from '../translations/en.json'
import esTranslations from '../translations/es.json'

type Language = 'en' | 'es'
type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  isSpanish: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const useTranslation = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

interface LanguageProviderProps {
  children: ReactNode
}

// Function to detect browser language
const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en'
  
  // Get browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en'
  
  // Check if browser is set to Spanish
  if (browserLang.toLowerCase().startsWith('es')) {
    return 'es'
  }
  
  // Default to English for any other language
  return 'en'
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Detect browser language on component mount
    const detectedLanguage = detectBrowserLanguage()
    setLanguage(detectedLanguage)
    setIsLoaded(true)
  }, [])

  // Get translations based on current language
  const getTranslations = (lang: Language): Translations => {
    switch (lang) {
      case 'es':
        return esTranslations as Translations
      case 'en':
      default:
        return enTranslations
    }
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslations(language),
    isSpanish: language === 'es'
  }

  // Render immediately to prevent blocking images and content
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
} 