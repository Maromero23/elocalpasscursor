'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EnhancedLandingPageTemplate } from '../../../components/enhanced-landing-page-template'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Remove problematic server directives that cause render errors

interface QRConfigData {
  id: string
  businessName: string
  logoUrl?: string
  
  // Main Header Text with Typography
  headerText: string
  headerTextColor?: string
  headerFontFamily?: string
  headerFontSize?: string
  
  // Description Text with Typography
  descriptionText: string
  descriptionTextColor?: string
  descriptionFontFamily?: string
  descriptionFontSize?: string
  
  // CTA Button Text with Typography
  ctaButtonText: string
  ctaButtonTextColor?: string
  ctaButtonFontFamily?: string
  ctaButtonFontSize?: string
  
  // Form Title Text with Typography
  formTitleText?: string
  formTitleTextColor?: string
  formTitleFontFamily?: string
  formTitleFontSize?: string
  
  // Form Instructions Text with Typography
  formInstructionsText?: string
  formInstructionsTextColor?: string
  formInstructionsFontFamily?: string
  formInstructionsFontSize?: string
  
  // Footer Disclaimer Text with Typography
  footerDisclaimerText?: string
  footerDisclaimerTextColor?: string
  footerDisclaimerFontFamily?: string
  footerDisclaimerFontSize?: string
  
  // Brand Colors
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // Individual Box Colors
  guestSelectionBoxColor?: string
  daySelectionBoxColor?: string
  footerDisclaimerBoxColor?: string
  
  // QR Configuration Rules from Button 1
  allowCustomGuests: boolean
  defaultGuests: number
  maxGuests: number
  allowCustomDays: boolean
  defaultDays: number
  maxDays: number
}

export default function EnhancedLandingPage() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [configData, setConfigData] = useState<QRConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add language detection for default text translation - detect immediately
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    // Detect language immediately on component initialization
    if (typeof window !== 'undefined') {
      const detectedLang = detectLanguage()
      console.log('🌍 Enhanced Landing - Customer language detected IMMEDIATELY:', detectedLang)
      return detectedLang
    }
    return 'en'
  })
  
  useEffect(() => {
    // Re-detect language to ensure it's correct
    const detectedLang = detectLanguage()
    setLanguage(detectedLang)
    console.log('🌍 Enhanced Landing - Customer language re-detected in useEffect:', detectedLang)
  }, [])
  
  // Add simple cache-busting log
  useEffect(() => {
    console.log('🔄 Enhanced Landing - Page loaded with force-dynamic and revalidate=0')
  }, [])

  // Get urlId from URL parameters immediately (synchronously)
  const [urlId, setUrlId] = useState<string | null>(() => {
    // Initialize urlId immediately on component mount
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const urlIdParam = searchParams.get('urlId')
      console.log('🔍 Enhanced Landing - URL ID from query (IMMEDIATE):', urlIdParam)
      return urlIdParam
    }
    return null
  })

  useEffect(() => {
    if (qrId) {
      console.log('🔄 Enhanced Landing - Fetching data with qrId:', qrId, 'urlId:', urlId, 'language:', language)
      try {
        fetchQRConfigData()
      } catch (error) {
        console.error('🚨 Enhanced Landing - Critical error in useEffect:', error)
        setError('Critical error loading page')
        setLoading(false)
      }
    }
  }, [qrId, language]) // Add language dependency to re-fetch when language changes

  const fetchQRConfigData = async () => {
    try {
      console.log('🔍 Enhanced Landing Page - Fetching QR config for ID:', qrId)
      console.log('🔍 Enhanced Landing Page - URL ID:', urlId)
      
      // First try to load from database
      try {
        // Add cache-busting timestamp to prevent stale data
        const timestamp = Date.now()
        const cacheBreaker = `t=${timestamp}&cb=${Math.random()}`
        console.log('🔄 Enhanced Landing - Fetching with cache breaker:', cacheBreaker)
        const dbResponse = await fetch(`/api/landing-page/config/${qrId}?${cacheBreaker}`, {
          cache: 'no-store', // Force fresh data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (dbResponse.ok) {
          const dbConfig = await dbResponse.json()
          console.log('✅ Enhanced Landing - Loaded config from database:', dbConfig)
          console.log('🔍 Enhanced Landing - landingPageConfig structure:', dbConfig.landingPageConfig)
          console.log('🔍 Enhanced Landing - temporaryUrls array:', dbConfig.landingPageConfig?.temporaryUrls)
          
          // Check for URL-specific customizations first
          let landingConfig = dbConfig.landingPageConfig
          
          if (urlId) {
            console.log('🔍 Enhanced Landing - Looking for URL-specific content for urlId:', urlId)
            console.log('🔍 Enhanced Landing - urlId type:', typeof urlId)
            console.log('🔍 Enhanced Landing - urlId length:', urlId.length)
            
            // Check for URL-specific customizations in temporaryUrls array (NEW CORRECT STRUCTURE)
            if (dbConfig.landingPageConfig?.temporaryUrls) {
              console.log('🔍 Enhanced Landing - Available URL IDs in temporaryUrls:', 
                dbConfig.landingPageConfig.temporaryUrls.map((url: any) => url.id))
              const urlEntry = dbConfig.landingPageConfig.temporaryUrls.find((url: any) => url.id === urlId)
              if (urlEntry?.customizations) {
                landingConfig = urlEntry.customizations
                console.log('✅ Enhanced Landing - Using URL-specific customizations from temporaryUrls for URL:', urlId)
                console.log('✅ Enhanced Landing - Customizations loaded:', urlEntry.customizations)
              } else {
                console.log('⚠️ Enhanced Landing - No customizations found in temporaryUrls for URL:', urlId)
              }
            }
            
            // Fallback: Check legacy structures if new structure doesn't have data
            if (!landingConfig || landingConfig === dbConfig.landingPageConfig) {
              if (dbConfig.landingPageConfig?.templates?.landingPage?.urlCustomContent?.[urlId]) {
                landingConfig = dbConfig.landingPageConfig.templates.landingPage.urlCustomContent[urlId]
                console.log('✅ Enhanced Landing - Using URL-specific content from legacy templates structure for URL:', urlId)
              }
              else if (dbConfig.templates?.landingPage?.urlCustomContent?.[urlId]) {
                landingConfig = dbConfig.templates.landingPage.urlCustomContent[urlId]
                console.log('✅ Enhanced Landing - Using URL-specific content from legacy structure for URL:', urlId)
              }
              else {
                console.log('⚠️ Enhanced Landing - No URL-specific content found for URL:', urlId, '- using general config')
              }
            }
          }
          
          // Use landingPageConfig from database (either general or URL-specific)
          if (landingConfig) {
            console.log('✅ Enhanced Landing - Using landing page config:', landingConfig)
            
            console.log('🌍 Enhanced Landing - Current language for defaults:', language)
            
            // Advanced translation system
            const autoTranslateText = async (text: string): Promise<string> => {
              if (!text || language === 'en') return text
              
              console.log(`🔄 Complete Text Box Translation - Input: "${text}"`)
              
              // COMPLETE TEXT BOX TRANSLATION SYSTEM
              // Instead of word-by-word, translate entire text boxes as complete units
              
              // 1. EXACT PHRASE MATCHES (Highest Priority) - For known common phrases
              const exactPhrases: Record<string, string> = {
                // EXACT CUSTOM TEXT FROM SCREENSHOTS
                'WELCOME TO......THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'BIENVENIDO A......ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                
                // Common complete phrases
                'WELCOME TO......': 'BIENVENIDO A......',
                'WELCOME TO': 'BIENVENIDO A',
                'Welcome to': 'Bienvenido a',
                'SIGN UP FOR YOUR ELOCALPASS': 'REGÍSTRESE PARA SU ELOCALPASS',
                'Sign Up For Your ELocalPass': 'Regístrese Para Su ELocalPass',
                'GET YOUR FREE ELOCALPASS': 'OBTENGA SU ELOCALPASS GRATIS',
                'Get Your Free ELocalPass': 'Obtenga Su ELocalPass Gratis',
                'GET YOUR ELOCALPASS NOW': 'OBTENER SU ELOCALPASS AHORA',
                'Get Your ELocalPass Now': 'Obtener Su ELocalPass Ahora',
                'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO:',
                'Just complete the fields below and receive your gift via email:': 'Solo complete los campos a continuación y reciba su regalo por correo electrónico:',
                'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS.',
                'Fully enjoy the experience of paying like a local. ELocalPass guarantees that you will not receive any kind of spam and that your data is protected.': 'Disfrute completamente la experiencia de pagar como un local. ELocalPass garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos.',
                'Click HERE to read the privacy notice and data usage': 'Haga clic AQUÍ para leer el aviso de privacidad y uso de datos',
                'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico.'
              }
              
              // Check for exact phrase matches first
              const trimmedText = text.trim()
              for (const [english, spanish] of Object.entries(exactPhrases)) {
                if (trimmedText.toLowerCase() === english.toLowerCase()) {
                  console.log(`✅ Exact phrase match: "${text}" → "${spanish}"`)
                  return spanish
                }
              }
              
              // 2. INTELLIGENT COMPLETE TEXT TRANSLATION
              // For any custom English text, translate it as a complete intelligent unit
              
              // Detect if text appears to be in English (contains common English words)
              const englishIndicators = [
                'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
              ]
              
              const textLower = text.toLowerCase()
              const hasEnglishWords = englishIndicators.some(word => 
                textLower.includes(` ${word} `) || 
                textLower.startsWith(`${word} `) || 
                textLower.endsWith(` ${word}`) ||
                textLower === word
              )
              
              if (hasEnglishWords) {
                // This appears to be English text - translate the complete content as a unit
                console.log(`🔍 Detected English text, translating complete unit: "${text}"`)
                
                // Create a comprehensive translation mapping for complete text transformation
                let translatedText = text
                
                // Apply comprehensive phrase-based translations
                const phraseTranslations: Record<string, string> = {
                  // Complete sentence starters
                  'Welcome to': 'Bienvenido a',
                  'WELCOME TO': 'BIENVENIDO A',
                  'Thanks you very much for': 'Muchas gracias por',
                  'Thank you very much for': 'Muchas gracias por',
                  'THANK YOU VERY MUCH FOR': 'MUCHAS GRACIAS POR',
                  'This was edited and added to the original': 'Esto fue editado y agregado al original',
                  'THIS WAS EDITED AND ADDED TO THE ORIGINAL': 'ESTO FUE EDITADO Y AGREGADO AL ORIGINAL',
                  'to see if its translating to Spanish': 'para ver si se está traduciendo al español',
                  'TO SEE IF ITS TRANSLATIING TO SPANISH': 'PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL',
                  'Sign up for your': 'Regístrese para su',
                  'SIGN UP FOR YOUR': 'REGÍSTRESE PARA SU',
                  'Just complete the fields below': 'Solo complete los campos a continuación',
                  'JUST COMPLETE THE FIELDS BELOW': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN',
                  'and receive your gift via email': 'y reciba su regalo por correo electrónico',
                  'AND RECEIVE YOUR GIFT VIA EMAIL': 'Y RECIBA SU REGALO POR CORREO ELECTRÓNICO',
                  'Get your': 'Obtener su',
                  'GET YOUR': 'OBTENER SU',
                  'right now': 'ahora mismo',
                  'RIGHT NOW': 'AHORA MISMO',
                  'Fully enjoy the experience': 'Disfrute completamente la experiencia',
                  'FULLY ENJOY THE EXPERIENCE': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA',
                  'of paying like a local': 'de pagar como un local',
                  'OF PAYING LIKE A LOCAL': 'DE PAGAR COMO UN LOCAL',
                  'guarantees that you will not receive': 'garantiza que no recibirá',
                  'GUARANTEES THAT YOU WILL NOT RECEIVE': 'GARANTIZA QUE NO RECIBIRÁ',
                  'any kind of spam': 'ningún tipo de spam',
                  'ANY KIND OF SPAM': 'NINGÚN TIPO DE SPAM',
                  'and that your data is protected': 'y que sus datos están protegidos',
                  'AND THAT YOUR DATA IS PROTECTED': 'Y QUE SUS DATOS ESTÁN PROTEGIDOS'
                }
                
                // Apply phrase translations
                for (const [english, spanish] of Object.entries(phraseTranslations)) {
                  const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                  translatedText = translatedText.replace(regex, spanish)
                }
                
                // Apply word-level translations for remaining English words
                const wordTranslations: Record<string, string> = {
                  // Common words that might remain
                  ' was ': ' fue ', ' WAS ': ' FUE ',
                  ' edited ': ' editado ', ' EDITED ': ' EDITADO ',
                  ' and ': ' y ', ' AND ': ' Y ',
                  ' added ': ' agregado ', ' ADDED ': ' AGREGADO ',
                  ' the ': ' el ', ' THE ': ' EL ',
                  ' original ': ' original ', ' ORIGINAL ': ' ORIGINAL ',
                  ' see ': ' ver ', ' SEE ': ' VER ',
                  ' if ': ' si ', ' IF ': ' SI ',
                  ' its ': ' se está ', ' ITS ': ' SE ESTÁ ',
                  ' translating ': ' traduciendo ', ' TRANSLATING ': ' TRADUCIENDO ',
                  ' translatiing ': ' traduciendo ', ' TRANSLATIING ': ' TRADUCIENDO ', // Handle typo
                  ' spanish ': ' español ', ' SPANISH ': ' ESPAÑOL ',
                  ' elocalpass ': ' elocalpass ', ' ELOCALPASS ': ' ELOCALPASS ', // Keep brand name
                  ' now ': ' ahora ', ' NOW ': ' AHORA ',
                  ' today ': ' hoy ', ' TODAY ': ' HOY '
                }
                
                // Apply word translations
                for (const [english, spanish] of Object.entries(wordTranslations)) {
                  translatedText = translatedText.replace(new RegExp(english, 'gi'), spanish)
                }
                
                // Clean up extra spaces
                translatedText = translatedText.replace(/\s+/g, ' ').trim()
                
                console.log(`✅ Complete text translation result: "${text}" → "${translatedText}"`)
                return translatedText
              }
              
              // If not detected as English, return as-is
              console.log(`ℹ️ Text not detected as English, returning as-is: "${text}"`)
              return text
            }

            // Simple universal translation: Translate EVERY text box as a whole unit for Spanish customers
            const getSmartTranslatedText = async (savedText: string | undefined, translationKey: string): Promise<string> => {
              if (!savedText) {
                // No saved text, use translation
                return t(translationKey, language)
              }
              
              // For Spanish customers: ALWAYS translate the entire text box content (default OR custom)
              if (language === 'es') {
                const autoTranslated = await autoTranslateText(savedText)
                console.log(`🔄 Universal Translation - Translating entire text box: "${savedText}" → "${autoTranslated}"`)
                return autoTranslated
              }
              
              // For English customers: use text as-is
              return savedText
            }
            
            const translatedHeaderText = await getSmartTranslatedText(landingConfig.headerText, 'landing.default.header.text')
            const translatedDescriptionText = await getSmartTranslatedText(landingConfig.descriptionText, 'landing.default.description.text') 
            const translatedCtaButtonText = await getSmartTranslatedText(landingConfig.ctaButtonText, 'landing.default.cta.button.text')
            const translatedFormTitleText = await getSmartTranslatedText(landingConfig.formTitleText, 'landing.form.title')
            const translatedFormInstructionsText = await getSmartTranslatedText(landingConfig.formInstructionsText, 'landing.form.instructions')
            const translatedFooterDisclaimerText = await getSmartTranslatedText(landingConfig.footerDisclaimerText, 'landing.disclaimer')
            
            console.log('🔤 Enhanced Landing - Final header text:', translatedHeaderText)
            console.log('🔤 Enhanced Landing - Final description text:', translatedDescriptionText)
            console.log('🔤 Enhanced Landing - Final CTA button text:', translatedCtaButtonText)
            console.log('🔤 Enhanced Landing - Final form title text:', translatedFormTitleText)
            console.log('🔤 Enhanced Landing - Final form instructions text:', translatedFormInstructionsText)
            console.log('🔤 Enhanced Landing - Final footer disclaimer text:', translatedFooterDisclaimerText)
            
            setConfigData({
              id: qrId,
              businessName: landingConfig.businessName || t('landing.default.business.name', language),
              logoUrl: landingConfig.logoUrl,
              
              // Header Text with Typography - Use smart translation
              headerText: translatedHeaderText,
              headerTextColor: landingConfig.headerTextColor,
              headerFontFamily: landingConfig.headerFontFamily,
              headerFontSize: landingConfig.headerFontSize,
              
              // Description Text with Typography - Use smart translation
              descriptionText: translatedDescriptionText,
              descriptionTextColor: landingConfig.descriptionTextColor,
              descriptionFontFamily: landingConfig.descriptionFontFamily,
              descriptionFontSize: landingConfig.descriptionFontSize,
              
              // CTA Button Text with Typography - Use smart translation
              ctaButtonText: translatedCtaButtonText,
              ctaButtonTextColor: landingConfig.ctaButtonTextColor,
              ctaButtonFontFamily: landingConfig.ctaButtonFontFamily,
              ctaButtonFontSize: landingConfig.ctaButtonFontSize,
              
              // Form Title Text with Typography
              formTitleText: translatedFormTitleText,
              formTitleTextColor: landingConfig.formTitleTextColor,
              formTitleFontFamily: landingConfig.formTitleFontFamily,
              formTitleFontSize: landingConfig.formTitleFontSize,
              
              // Form Instructions Text with Typography
              formInstructionsText: translatedFormInstructionsText,
              formInstructionsTextColor: landingConfig.formInstructionsTextColor,
              formInstructionsFontFamily: landingConfig.formInstructionsFontFamily,
              formInstructionsFontSize: landingConfig.formInstructionsFontSize,
              
              // Footer Disclaimer Text with Typography
              footerDisclaimerText: translatedFooterDisclaimerText,
              footerDisclaimerTextColor: landingConfig.footerDisclaimerTextColor,
              footerDisclaimerFontFamily: landingConfig.footerDisclaimerFontFamily,
              footerDisclaimerFontSize: landingConfig.footerDisclaimerFontSize,
              
              // Brand Colors
              primaryColor: landingConfig.primaryColor || '#3b82f6',
              secondaryColor: landingConfig.secondaryColor || '#6366f1',
              backgroundColor: landingConfig.backgroundColor || '#ffffff',
              
              // Individual Box Colors
              guestSelectionBoxColor: landingConfig.guestSelectionBoxColor,
              daySelectionBoxColor: landingConfig.daySelectionBoxColor,
              footerDisclaimerBoxColor: landingConfig.footerDisclaimerBoxColor,
              
              // QR Configuration Rules from parent config - Use Button 1 values
              allowCustomGuests: dbConfig.config?.button1GuestsAllowCustom ?? true,
              defaultGuests: dbConfig.config?.button1GuestsDefault ?? 2,
              maxGuests: dbConfig.config?.button1GuestsMax ?? 10,
              allowCustomDays: dbConfig.config?.button1DaysAllowCustom ?? true,
              defaultDays: dbConfig.config?.button1DaysDefault ?? 3,
              maxDays: dbConfig.config?.button1DaysMax ?? 10
            })
            
            setLoading(false)
            return
          }
        } else {
          console.log('⚠️ Enhanced Landing - Database config not found, status:', dbResponse.status)
          console.log('⚠️ Enhanced Landing - Response text:', await dbResponse.text())
        }
      } catch (dbError) {
        console.error('⚠️ Enhanced Landing - Database error:', dbError)
      }
      
      // Fallback to qrConfigurations Map API
      console.log('📡 Enhanced Landing - Falling back to qrConfigurations Map API for qrId:', qrId)
      const response = await fetch(`/api/qr-config/${qrId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Enhanced Landing - Received config data from Map:', data)
        console.log('🖼️ Enhanced Landing - Logo URL:', data.logoUrl)
        
        // Advanced translation system
        const autoTranslateText = async (text: string): Promise<string> => {
          if (!text || language === 'en') return text
          
          console.log(`🔄 Complete Text Box Translation - Input: "${text}"`)
          
          // COMPLETE TEXT BOX TRANSLATION SYSTEM
          // Instead of word-by-word, translate entire text boxes as complete units
          
          // 1. EXACT PHRASE MATCHES (Highest Priority) - For known common phrases
          const exactPhrases: Record<string, string> = {
            // EXACT CUSTOM TEXT FROM SCREENSHOTS
            'WELCOME TO......THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'BIENVENIDO A......ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            
            // Common complete phrases
            'WELCOME TO......': 'BIENVENIDO A......',
            'WELCOME TO': 'BIENVENIDO A',
            'Welcome to': 'Bienvenido a',
            'SIGN UP FOR YOUR ELOCALPASS': 'REGÍSTRESE PARA SU ELOCALPASS',
            'Sign Up For Your ELocalPass': 'Regístrese Para Su ELocalPass',
            'GET YOUR FREE ELOCALPASS': 'OBTENGA SU ELOCALPASS GRATIS',
            'Get Your Free ELocalPass': 'Obtenga Su ELocalPass Gratis',
            'GET YOUR ELOCALPASS NOW': 'OBTENER SU ELOCALPASS AHORA',
            'Get Your ELocalPass Now': 'Obtener Su ELocalPass Ahora',
            'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO:',
            'Just complete the fields below and receive your gift via email:': 'Solo complete los campos a continuación y reciba su regalo por correo electrónico:',
            'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS.',
            'Fully enjoy the experience of paying like a local. ELocalPass guarantees that you will not receive any kind of spam and that your data is protected.': 'Disfrute completamente la experiencia de pagar como un local. ELocalPass garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos.',
            'Click HERE to read the privacy notice and data usage': 'Haga clic AQUÍ para leer el aviso de privacidad y uso de datos',
            'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico.'
          }
          
          // Check for exact phrase matches first
          const trimmedText = text.trim()
          for (const [english, spanish] of Object.entries(exactPhrases)) {
            if (trimmedText.toLowerCase() === english.toLowerCase()) {
              console.log(`✅ Exact phrase match: "${text}" → "${spanish}"`)
              return spanish
            }
          }
          
          // 2. INTELLIGENT COMPLETE TEXT TRANSLATION
          // For any custom English text, translate it as a complete intelligent unit
          
          // Detect if text appears to be in English (contains common English words)
          const englishIndicators = [
            'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
          ]
          
          const textLower = text.toLowerCase()
          const hasEnglishWords = englishIndicators.some(word => 
            textLower.includes(` ${word} `) || 
            textLower.startsWith(`${word} `) || 
            textLower.endsWith(` ${word}`) ||
            textLower === word
          )
          
          if (hasEnglishWords) {
            // This appears to be English text - translate the complete content as a unit
            console.log(`🔍 Detected English text, translating complete unit: "${text}"`)
            
            // Create a comprehensive translation mapping for complete text transformation
            let translatedText = text
            
            // Apply comprehensive phrase-based translations
            const phraseTranslations: Record<string, string> = {
              // Complete sentence starters
              'Welcome to': 'Bienvenido a',
              'WELCOME TO': 'BIENVENIDO A',
              'Thanks you very much for': 'Muchas gracias por',
              'Thank you very much for': 'Muchas gracias por',
              'THANK YOU VERY MUCH FOR': 'MUCHAS GRACIAS POR',
              'This was edited and added to the original': 'Esto fue editado y agregado al original',
              'THIS WAS EDITED AND ADDED TO THE ORIGINAL': 'ESTO FUE EDITADO Y AGREGADO AL ORIGINAL',
              'to see if its translating to Spanish': 'para ver si se está traduciendo al español',
              'TO SEE IF ITS TRANSLATIING TO SPANISH': 'PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL',
              'Sign up for your': 'Regístrese para su',
              'SIGN UP FOR YOUR': 'REGÍSTRESE PARA SU',
              'Just complete the fields below': 'Solo complete los campos a continuación',
              'JUST COMPLETE THE FIELDS BELOW': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN',
              'and receive your gift via email': 'y reciba su regalo por correo electrónico',
              'AND RECEIVE YOUR GIFT VIA EMAIL': 'Y RECIBA SU REGALO POR CORREO ELECTRÓNICO',
              'Get your': 'Obtener su',
              'GET YOUR': 'OBTENER SU',
              'right now': 'ahora mismo',
              'RIGHT NOW': 'AHORA MISMO',
              'Fully enjoy the experience': 'Disfrute completamente la experiencia',
              'FULLY ENJOY THE EXPERIENCE': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA',
              'of paying like a local': 'de pagar como un local',
              'OF PAYING LIKE A LOCAL': 'DE PAGAR COMO UN LOCAL',
              'guarantees that you will not receive': 'garantiza que no recibirá',
              'GUARANTEES THAT YOU WILL NOT RECEIVE': 'GARANTIZA QUE NO RECIBIRÁ',
              'any kind of spam': 'ningún tipo de spam',
              'ANY KIND OF SPAM': 'NINGÚN TIPO DE SPAM',
              'and that your data is protected': 'y que sus datos están protegidos',
              'AND THAT YOUR DATA IS PROTECTED': 'Y QUE SUS DATOS ESTÁN PROTEGIDOS'
            }
            
            // Apply phrase translations
            for (const [english, spanish] of Object.entries(phraseTranslations)) {
              const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
              translatedText = translatedText.replace(regex, spanish)
            }
            
            // Apply word-level translations for remaining English words
            const wordTranslations: Record<string, string> = {
              // Common words that might remain
              ' was ': ' fue ', ' WAS ': ' FUE ',
              ' edited ': ' editado ', ' EDITED ': ' EDITADO ',
              ' and ': ' y ', ' AND ': ' Y ',
              ' added ': ' agregado ', ' ADDED ': ' AGREGADO ',
              ' the ': ' el ', ' THE ': ' EL ',
              ' original ': ' original ', ' ORIGINAL ': ' ORIGINAL ',
              ' see ': ' ver ', ' SEE ': ' VER ',
              ' if ': ' si ', ' IF ': ' SI ',
              ' its ': ' se está ', ' ITS ': ' SE ESTÁ ',
              ' translating ': ' traduciendo ', ' TRANSLATING ': ' TRADUCIENDO ',
              ' translatiing ': ' traduciendo ', ' TRANSLATIING ': ' TRADUCIENDO ', // Handle typo
              ' spanish ': ' español ', ' SPANISH ': ' ESPAÑOL ',
              ' elocalpass ': ' elocalpass ', ' ELOCALPASS ': ' ELOCALPASS ', // Keep brand name
              ' now ': ' ahora ', ' NOW ': ' AHORA ',
              ' today ': ' hoy ', ' TODAY ': ' HOY '
            }
            
            // Apply word translations
            for (const [english, spanish] of Object.entries(wordTranslations)) {
              translatedText = translatedText.replace(new RegExp(english, 'gi'), spanish)
            }
            
            // Clean up extra spaces
            translatedText = translatedText.replace(/\s+/g, ' ').trim()
            
            console.log(`✅ Complete text translation result: "${text}" → "${translatedText}"`)
            return translatedText
          }
          
          // If not detected as English, return as-is
          console.log(`ℹ️ Text not detected as English, returning as-is: "${text}"`)
          return text
        }

        const getSmartTranslatedText = async (savedText: string | undefined, translationKey: string): Promise<string> => {
          if (!savedText) {
            return t(translationKey, language)
          }
          
          // For Spanish customers: ALWAYS translate the entire text box content (default OR custom)
          if (language === 'es') {
            const autoTranslated = await autoTranslateText(savedText)
            console.log(`🔄 Map API Universal Translation - Translating entire text box: "${savedText}" → "${autoTranslated}"`)
            return autoTranslated
          }
          
          // For English customers: use text as-is
          return savedText
        }
        
        // Apply translation to all text fields
        const translatedData = {
          ...data,
          headerText: await getSmartTranslatedText(data.headerText, 'landing.default.header.text'),
          descriptionText: await getSmartTranslatedText(data.descriptionText, 'landing.default.description.text'),
          ctaButtonText: await getSmartTranslatedText(data.ctaButtonText, 'landing.default.cta.button.text'),
          formTitleText: await getSmartTranslatedText(data.formTitleText, 'landing.form.title'),
          formInstructionsText: await getSmartTranslatedText(data.formInstructionsText, 'landing.form.instructions'),
          footerDisclaimerText: await getSmartTranslatedText(data.footerDisclaimerText, 'landing.disclaimer')
        }
        
        console.log('🔤 Enhanced Landing - Map API Final translated data:', translatedData)
        setConfigData(translatedData)
      } else {
        console.error('❌ Enhanced Landing - API response not ok:', response.status, response.statusText)
        throw new Error('Failed to fetch configuration')
      }
    } catch (error) {
      console.error('💥 Enhanced Landing - Error fetching QR config:', error)
      setError('Failed to load landing page configuration')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your landing page...</p>
        </div>
      </div>
    )
  }

  if (error || !configData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Landing Page Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested landing page could not be found.'}</p>
          <p className="text-sm text-gray-500">QR ID: {qrId}</p>
        </div>
      </div>
    )
  }

  return (
    <EnhancedLandingPageTemplate
      qrConfigId={configData.id}
      businessName={configData.businessName}
      logoUrl={configData.logoUrl}
      
      // Header Text with Typography
      headerText={configData.headerText}
      headerTextColor={configData.headerTextColor}
      headerFontFamily={configData.headerFontFamily}
      headerFontSize={configData.headerFontSize}
      
      // Description Text with Typography
      descriptionText={configData.descriptionText}
      descriptionTextColor={configData.descriptionTextColor}
      descriptionFontFamily={configData.descriptionFontFamily}
      descriptionFontSize={configData.descriptionFontSize}
      
      // CTA Button Text with Typography
      ctaButtonText={configData.ctaButtonText}
      ctaButtonTextColor={configData.ctaButtonTextColor}
      ctaButtonFontFamily={configData.ctaButtonFontFamily}
      ctaButtonFontSize={configData.ctaButtonFontSize}
      
      // Form Title Text with Typography
      formTitleText={configData.formTitleText}
      formTitleTextColor={configData.formTitleTextColor}
      formTitleFontFamily={configData.formTitleFontFamily}
      formTitleFontSize={configData.formTitleFontSize}
      
      // Form Instructions Text with Typography
      formInstructionsText={configData.formInstructionsText}
      formInstructionsTextColor={configData.formInstructionsTextColor}
      formInstructionsFontFamily={configData.formInstructionsFontFamily}
      formInstructionsFontSize={configData.formInstructionsFontSize}
      
      // Footer Disclaimer Text with Typography
      footerDisclaimerText={configData.footerDisclaimerText}
      footerDisclaimerTextColor={configData.footerDisclaimerTextColor}
      footerDisclaimerFontFamily={configData.footerDisclaimerFontFamily}
      footerDisclaimerFontSize={configData.footerDisclaimerFontSize}
      
      // Brand Colors
      primaryColor={configData.primaryColor}
      secondaryColor={configData.secondaryColor}
      backgroundColor={configData.backgroundColor}
      
      // Individual Box Colors
      guestSelectionBoxColor={configData.guestSelectionBoxColor}
      daySelectionBoxColor={configData.daySelectionBoxColor}
      footerDisclaimerBoxColor={configData.footerDisclaimerBoxColor}
      
      // QR Configuration Rules
      allowCustomGuests={configData.allowCustomGuests}
      defaultGuests={configData.defaultGuests}
      maxGuests={configData.maxGuests}
      allowCustomDays={configData.allowCustomDays}
      defaultDays={configData.defaultDays}
      maxDays={configData.maxDays}
    />
  )
}
