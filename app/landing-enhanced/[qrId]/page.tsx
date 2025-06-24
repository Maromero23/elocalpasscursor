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
            
            // Professional translation system with informal Spanish (TÚ) enforcement
            const autoTranslateText = async (text: string): Promise<string> => {
              if (!text || language === 'en') return text
              
              console.log(`🔄 Professional Translation - Input: "${text}"`)
              
              let translatedText = text
              
              // Try LibreTranslate first
              try {
                const response = await fetch('https://libretranslate.com/translate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    q: text,
                    source: 'en',
                    target: 'es',
                    format: 'text'
                  })
                })
                
                if (response.ok) {
                  const result = await response.json()
                  translatedText = result.translatedText
                  console.log(`✅ LibreTranslate success: "${text}" → "${translatedText}"`)
                }
              } catch (error) {
                console.warn('⚠️ LibreTranslate failed, trying MyMemory API...')
                
                // Fallback to MyMemory API
                try {
                  const encodedText = encodeURIComponent(text)
                  const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`)
                  
                  if (response.ok) {
                    const result = await response.json()
                    if (result.responseData && result.responseData.translatedText) {
                      translatedText = result.responseData.translatedText
                      console.log(`✅ MyMemory success: "${text}" → "${translatedText}"`)
                    }
                  }
                } catch (error) {
                  console.warn('⚠️ MyMemory API also failed, using original text')
                }
              }
              
              // Convert formal Spanish (USTED) to informal Spanish (TÚ)
              const makeInformalSpanish = (spanish: string): string => {
                if (language !== 'es') return spanish
                
                console.log(`🔄 Converting to informal Spanish (TÚ): "${spanish}"`)
                
                let informalText = spanish
                
                // Convert formal pronouns to informal
                informalText = informalText.replace(/\busted\b/gi, 'tú')
                informalText = informalText.replace(/\bUsted\b/g, 'Tú')
                
                // Convert possessive pronouns
                informalText = informalText.replace(/\bsu\b/g, 'tu')  // your (formal) → your (informal)
                informalText = informalText.replace(/\bSu\b/g, 'Tu')
                informalText = informalText.replace(/\bsus\b/g, 'tus') // your plural
                informalText = informalText.replace(/\bSus\b/g, 'Tus')
                
                // Convert common formal verb forms to informal
                informalText = informalText.replace(/\btiene\b/g, 'tienes')     // you have
                informalText = informalText.replace(/\bTiene\b/g, 'Tienes')
                informalText = informalText.replace(/\bpuede\b/g, 'puedes')     // you can
                informalText = informalText.replace(/\bPuede\b/g, 'Puedes')
                informalText = informalText.replace(/\bquiere\b/g, 'quieres')   // you want
                informalText = informalText.replace(/\bQuiere\b/g, 'Quieres')
                informalText = informalText.replace(/\bnecesita\b/g, 'necesitas') // you need
                informalText = informalText.replace(/\bNecesita\b/g, 'Necesitas')
                informalText = informalText.replace(/\bdebe\b/g, 'debes')       // you should
                informalText = informalText.replace(/\bDebe\b/g, 'Debes')
                informalText = informalText.replace(/\bestá\b/g, 'estás')       // you are
                informalText = informalText.replace(/\bEstá\b/g, 'Estás')
                
                if (informalText !== spanish) {
                  console.log(`✅ Converted to informal: "${spanish}" → "${informalText}"`)
                }
                
                return informalText
              }
              
              const finalText = makeInformalSpanish(translatedText)
              return finalText
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
        
        // Professional translation system with informal Spanish (TÚ) enforcement
        const autoTranslateText = async (text: string): Promise<string> => {
          if (!text || language === 'en') return text
          
          console.log(`🔄 Professional Translation - Input: "${text}"`)
          
          let translatedText = text
          
          // Try LibreTranslate first
          try {
            const response = await fetch('https://libretranslate.com/translate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: text,
                source: 'en',
                target: 'es',
                format: 'text'
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              translatedText = result.translatedText
              console.log(`✅ LibreTranslate success: "${text}" → "${translatedText}"`)
            }
          } catch (error) {
            console.warn('⚠️ LibreTranslate failed, trying MyMemory API...')
            
            // Fallback to MyMemory API
            try {
              const encodedText = encodeURIComponent(text)
              const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`)
              
              if (response.ok) {
                const result = await response.json()
                if (result.responseData && result.responseData.translatedText) {
                  translatedText = result.responseData.translatedText
                  console.log(`✅ MyMemory success: "${text}" → "${translatedText}"`)
                }
              }
            } catch (error) {
              console.warn('⚠️ MyMemory API also failed, using original text')
            }
          }
          
          // Convert formal Spanish (USTED) to informal Spanish (TÚ)
          const makeInformalSpanish = (spanish: string): string => {
            if (language !== 'es') return spanish
            
            console.log(`🔄 Converting to informal Spanish (TÚ): "${spanish}"`)
            
            let informalText = spanish
            
            // Convert formal pronouns to informal
            informalText = informalText.replace(/\busted\b/gi, 'tú')
            informalText = informalText.replace(/\bUsted\b/g, 'Tú')
            
            // Convert possessive pronouns
            informalText = informalText.replace(/\bsu\b/g, 'tu')  // your (formal) → your (informal)
            informalText = informalText.replace(/\bSu\b/g, 'Tu')
            informalText = informalText.replace(/\bsus\b/g, 'tus') // your plural
            informalText = informalText.replace(/\bSus\b/g, 'Tus')
            
            // Convert common formal verb forms to informal
            informalText = informalText.replace(/\btiene\b/g, 'tienes')     // you have
            informalText = informalText.replace(/\bTiene\b/g, 'Tienes')
            informalText = informalText.replace(/\bpuede\b/g, 'puedes')     // you can
            informalText = informalText.replace(/\bPuede\b/g, 'Puedes')
            informalText = informalText.replace(/\bquiere\b/g, 'quieres')   // you want
            informalText = informalText.replace(/\bQuiere\b/g, 'Quieres')
            informalText = informalText.replace(/\bnecesita\b/g, 'necesitas') // you need
            informalText = informalText.replace(/\bNecesita\b/g, 'Necesitas')
            informalText = informalText.replace(/\bdebe\b/g, 'debes')       // you should
            informalText = informalText.replace(/\bDebe\b/g, 'Debes')
            informalText = informalText.replace(/\bestá\b/g, 'estás')       // you are
            informalText = informalText.replace(/\bEstá\b/g, 'Estás')
            
            if (informalText !== spanish) {
              console.log(`✅ Converted to informal: "${spanish}" → "${informalText}"`)
            }
            
            return informalText
          }
          
          const finalText = makeInformalSpanish(translatedText)
          return finalText
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
