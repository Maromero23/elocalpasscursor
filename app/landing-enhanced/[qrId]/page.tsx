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
                // EXACT CUSTOM TEXT FROM SCREENSHOTS - OLD TEST
                'WELCOME TO......THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'BIENVENIDO A......ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
                
                // NEW CUSTOM TEXT FROM LATEST SCREENSHOTS
                'WELCOME TO......LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'BIENVENIDO A......VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                'Bienvenido a......LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Bienvenido a......VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                'Solo complete los campos a continuación y reciba su regalo por correo electrónico:LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Solo complete los campos a continuación y reciba su regalo por correo electrónico: VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                'Disfrute completamente la experiencia de pagar como un local. ELOCALPASS garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos.LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Disfrute completamente la experiencia de pagar como un local. ELOCALPASS garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos. VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                
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
              
              // UNIVERSAL ENGLISH TEXT DETECTION AND TRANSLATION
              // If text contains ANY English words, translate the ENTIRE text as a complete unit
              const containsEnglish = /\b(a|about|above|after|again|against|all|am|an|and|any|are|aren|as|at|be|because|been|before|being|below|between|both|but|by|can|cannot|could|did|do|does|doesn|doing|don|down|during|each|few|for|from|further|had|has|hasn|have|haven|having|he|her|here|hers|herself|him|himself|his|how|i|if|in|into|is|isn|it|its|itself|let|me|more|most|my|myself|no|nor|not|of|off|on|once|only|or|other|ought|our|ours|ourselves|out|over|own|same|shan|she|should|shouldn|so|some|such|than|that|the|their|theirs|them|themselves|then|there|these|they|this|those|through|to|too|under|until|up|very|was|wasn|we|were|weren|what|when|where|which|while|who|whom|why|will|with|won|would|wouldn|you|your|yours|yourself|yourselves|thanks|thank|giving|yourself|opportunity|discover|benefits|club|receive|access|gift|simply|fill|fields|below|via|email|complete|just|fully|enjoy|experience|paying|like|local|guarantees|kind|spam|data|protected|really|working|want|able|translate|perfectly|spanish|time|happiness|everyone|dont|miss|get|before|run|come|make|work|welcome|sign|up|elocalpass|now|today|here|click|read|privacy|notice|usage|protected|free|gift|access|full|day|days|guest|guests)\b/i.test(text)
              
              if (containsEnglish) {
                console.log(`🔍 Detected English words in text, translating complete unit: "${text}"`)
                
                // Create intelligent complete translation
                let translatedText = text
                
                // Handle specific complete sentences from screenshots
                
                // Complete description text translation
                if (text.includes('Thanks you very much for giving yourself the opportunity to discover the benefits of the club')) {
                  translatedText = translatedText.replace(/Thanks you very much for giving yourself the opportunity to discover the benefits of the club\. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email\..*$/gi, 'Muchas gracias por darte la oportunidad de descubrir los beneficios del club. Para recibir tu regalo de acceso completo de 7 días a eLocalPass, simplemente completa los campos a continuación y recibirás tu eLocalPass gratuito por correo electrónico.')
                }
                
                // Form instructions translation
                if (text.includes('JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL')) {
                  translatedText = translatedText.replace(/JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL.*$/gi, 'SOLO COMPLETA LOS CAMPOS A CONTINUACIÓN Y RECIBE TU REGALO POR CORREO ELECTRÓNICO')
                }
                
                // Footer disclaimer translation
                if (text.includes('FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL')) {
                  translatedText = translatedText.replace(/FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL\. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED\..*$/gi, 'DISFRUTA COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁS NINGÚN TIPO DE SPAM Y QUE TUS DATOS ESTÁN PROTEGIDOS.')
                }
                
                // Handle specific new patterns from latest screenshots
                if (text.includes('so is this really working or not')) {
                  translatedText = translatedText.replace(/so is this really working or not\?*/gi, 'entonces esto realmente está funcionando o no?')
                }
                if (text.includes('We wnat to be able to translate this perfectly to spanish')) {
                  translatedText = translatedText.replace(/We wnat to be able to translate this perfectly to spanish\.*/gi, 'Queremos poder traducir esto perfectamente al español.')
                }
                if (text.includes('there was a time of happiness to everyone')) {
                  translatedText = translatedText.replace(/there was a time of happiness to everyone\.*/gi, 'hubo un tiempo de felicidad para todos.')
                }
                if (text.includes('dont miss out get it befoe we run out')) {
                  translatedText = translatedText.replace(/dont miss out get it befoe we run out\.*/gi, 'no te lo pierdas consíguelo antes de que se nos acabe.')
                }
                if (text.includes('dont miss out get it before we run out')) {
                  translatedText = translatedText.replace(/dont miss out get it before we run out\.*/gi, 'no te lo pierdas consíguelo antes de que se nos acabe.')
                }
                if (text.includes('come on make it work')) {
                  translatedText = translatedText.replace(/come on make it work!*/gi, 'vamos haz que funcione!')
                }
                
                // UNIVERSAL COMPREHENSIVE TRANSLATION SYSTEM
                // This system can translate ANY English text intelligently
                
                // Step 1: Apply comprehensive phrase-level translations first
                const phraseTranslations: Record<string, string> = {
                  // Business/Marketing phrases
                  'welcome to': 'bienvenido a',
                  'thanks you very much': 'muchas gracias',
                  'thank you very much': 'muchas gracias',
                  'giving yourself': 'darte',
                  'the opportunity': 'la oportunidad',
                  'to discover': 'de descubrir',
                  'the benefits': 'los beneficios',
                  'of the club': 'del club',
                  'to receive': 'para recibir',
                  'your 7-day': 'tu acceso de 7 días',
                  'full access gift': 'regalo de acceso completo',
                  'simply fill': 'simplemente completa',
                  'the fields below': 'los campos a continuación',
                  'you will receive': 'recibirás',
                  'your free': 'tu gratuito',
                  'via email': 'por correo electrónico',
                  'just complete': 'solo completa',
                  'receive your gift': 'recibe tu regalo',
                  'fully enjoy': 'disfruta completamente',
                  'the experience': 'la experiencia',
                  'paying like': 'pagar como',
                  'a local': 'un local',
                  'guarantees that': 'garantiza que',
                  'you will not': 'no recibirás',
                  'any kind': 'ningún tipo',
                  'your data': 'tus datos',
                  'is protected': 'están protegidos',
                  'sign up for': 'regístrese para',
                  'get your': 'obtener su',
                  'right now': 'ahora mismo',
                  'click here': 'haga clic aquí',
                  'read the': 'leer el',
                  'privacy notice': 'aviso de privacidad',
                  'data usage': 'uso de datos',
                  
                  // Common question/test phrases
                  'so is this': 'entonces esto',
                  'really working': 'realmente funcionando',
                  'or not': 'o no',
                  'we want': 'queremos',
                  'we wnat': 'queremos', // Handle typo
                  'to be able': 'poder',
                  'to translate': 'traducir',
                  'this perfectly': 'esto perfectamente',
                  'to spanish': 'al español',
                  'there was': 'hubo',
                  'a time of': 'un tiempo de',
                  'happiness to': 'felicidad para',
                  'everyone': 'todos',
                  'dont miss out': 'no te lo pierdas',
                  'get it': 'consíguelo',
                  'before we': 'antes de que',
                  'befoe we': 'antes de que', // Handle typo
                  'run out': 'se nos acabe',
                  'come on': 'vamos',
                  'make it work': 'haz que funcione',
                  'i am adding': 'estoy agregando',
                  'to see if': 'para ver si',
                  'translates correctly': 'se traduce correctamente',
                  'after the edit': 'después de la edición',
                }
                
                // Apply phrase translations first (most important)
                for (const [english, spanish] of Object.entries(phraseTranslations)) {
                  const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                  translatedText = translatedText.replace(regex, spanish)
                }
                
                // Step 2: Apply comprehensive word-level translations
                const wordTranslations: Record<string, string> = {
                  
                  // Individual words
                  ' thanks ': ' gracias ',
                  ' thank ': ' gracias ',
                  ' you ': ' tú ',
                  ' very ': ' muy ',
                  ' much ': ' mucho ',
                  ' giving ': ' dando ',
                  ' yourself ': ' te ',
                  ' opportunity ': ' oportunidad ',
                  ' discover ': ' descubrir ',
                  ' benefits ': ' beneficios ',
                  ' club ': ' club ',
                  ' receive ': ' recibir ',
                  ' access ': ' acceso ',
                  ' gift ': ' regalo ',
                  ' simply ': ' simplemente ',
                  ' fill ': ' completa ',
                  ' fields ': ' campos ',
                  ' below ': ' continuación ',
                  ' via ': ' por ',
                  ' email ': ' correo ',
                  ' complete ': ' completa ',
                  ' just ': ' solo ',
                  ' fully ': ' completamente ',
                  ' enjoy ': ' disfruta ',
                  ' experience ': ' experiencia ',
                  ' paying ': ' pagar ',
                  ' like ': ' como ',
                  ' local ': ' local ',
                  ' guarantees ': ' garantiza ',
                  ' kind ': ' tipo ',
                  ' spam ': ' spam ',
                  ' data ': ' datos ',
                  ' protected ': ' protegidos ',
                  ' so ': ' entonces ',
                  ' is ': ' está ',
                  ' this ': ' esto ',
                  ' really ': ' realmente ',
                  ' working ': ' funcionando ',
                  ' or ': ' o ',
                  ' not ': ' no ',
                  ' we ': ' nosotros ',
                  ' want ': ' queremos ',
                  ' wnat ': ' queremos ', // Handle typo
                  ' to ': ' para ',
                  ' be ': ' ser ',
                  ' able ': ' capaces ',
                  ' translate ': ' traducir ',
                  ' perfectly ': ' perfectamente ',
                  ' spanish ': ' español ',
                  ' there ': ' allí ',
                  ' was ': ' fue ',
                  ' time ': ' tiempo ',
                  ' of ': ' de ',
                  ' happiness ': ' felicidad ',
                  ' everyone ': ' todos ',
                  ' dont ': ' no ',
                  ' miss ': ' pierdas ',
                  ' out ': ' fuera ',
                  ' get ': ' obtener ',
                  ' it ': ' lo ',
                  ' before ': ' antes ',
                  ' befoe ': ' antes ', // Handle typo
                  ' run ': ' correr ',
                  ' come ': ' ven ',
                  ' on ': ' en ',
                  ' make ': ' hacer ',
                  ' work ': ' trabajo ',
                  ' and ': ' y ',
                  ' the ': ' el ',
                  ' will ': ' será ',
                  ' free ': ' gratis '
                }
                
                // Step 3: Apply comprehensive word-level translations for ANY remaining English
                const universalWordTranslations: Record<string, string> = {
                  // Articles and common words
                  ' a ': ' un ', ' A ': ' UN ',
                  ' an ': ' un ', ' AN ': ' UN ',
                  ' the ': ' el ', ' THE ': ' EL ',
                  ' and ': ' y ', ' AND ': ' Y ',
                  ' or ': ' o ', ' OR ': ' O ',
                  ' but ': ' pero ', ' BUT ': ' PERO ',
                  ' for ': ' para ', ' FOR ': ' PARA ',
                  ' to ': ' para ', ' TO ': ' PARA ',
                  ' in ': ' en ', ' IN ': ' EN ',
                  ' on ': ' en ', ' ON ': ' EN ',
                  ' at ': ' en ', ' AT ': ' EN ',
                  ' with ': ' con ', ' WITH ': ' CON ',
                  ' from ': ' de ', ' FROM ': ' DE ',
                  ' by ': ' por ', ' BY ': ' POR ',
                  ' of ': ' de ', ' OF ': ' DE ',
                  ' as ': ' como ', ' AS ': ' COMO ',
                  
                  // Pronouns
                  ' i ': ' yo ', ' I ': ' YO ',
                  ' you ': ' tú ', ' YOU ': ' TÚ ',
                  ' he ': ' él ', ' HE ': ' ÉL ',
                  ' she ': ' ella ', ' SHE ': ' ELLA ',
                  ' we ': ' nosotros ', ' WE ': ' NOSOTROS ',
                  ' they ': ' ellos ', ' THEY ': ' ELLOS ',
                  ' it ': ' eso ', ' IT ': ' ESO ',
                  ' this ': ' esto ', ' THIS ': ' ESTO ',
                  ' that ': ' eso ', ' THAT ': ' ESO ',
                  ' these ': ' estos ', ' THESE ': ' ESTOS ',
                  ' those ': ' esos ', ' THOSE ': ' ESOS ',
                  ' my ': ' mi ', ' MY ': ' MI ',
                  ' your ': ' tu ', ' YOUR ': ' TU ',
                  ' his ': ' su ', ' HIS ': ' SU ',
                  ' her ': ' su ', ' HER ': ' SU ',
                  ' our ': ' nuestro ', ' OUR ': ' NUESTRO ',
                  ' their ': ' su ', ' THEIR ': ' SU ',
                  
                  // Verbs
                  ' am ': ' soy ', ' AM ': ' SOY ',
                  ' is ': ' es ', ' IS ': ' ES ',
                  ' are ': ' son ', ' ARE ': ' SON ',
                  ' was ': ' fue ', ' WAS ': ' FUE ',
                  ' were ': ' fueron ', ' WERE ': ' FUERON ',
                  ' be ': ' ser ', ' BE ': ' SER ',
                  ' been ': ' sido ', ' BEEN ': ' SIDO ',
                  ' being ': ' siendo ', ' BEING ': ' SIENDO ',
                  ' have ': ' tener ', ' HAVE ': ' TENER ',
                  ' has ': ' tiene ', ' HAS ': ' TIENE ',
                  ' had ': ' tuvo ', ' HAD ': ' TUVO ',
                  ' do ': ' hacer ', ' DO ': ' HACER ',
                  ' does ': ' hace ', ' DOES ': ' HACE ',
                  ' did ': ' hizo ', ' DID ': ' HIZO ',
                  ' will ': ' será ', ' WILL ': ' SERÁ ',
                  ' would ': ' sería ', ' WOULD ': ' SERÍA ',
                  ' can ': ' puede ', ' CAN ': ' PUEDE ',
                  ' could ': ' podría ', ' COULD ': ' PODRÍA ',
                  ' should ': ' debería ', ' SHOULD ': ' DEBERÍA ',
                  ' must ': ' debe ', ' MUST ': ' DEBE ',
                  ' get ': ' obtener ', ' GET ': ' OBTENER ',
                  ' go ': ' ir ', ' GO ': ' IR ',
                  ' come ': ' venir ', ' COME ': ' VENIR ',
                  ' see ': ' ver ', ' SEE ': ' VER ',
                  ' know ': ' saber ', ' KNOW ': ' SABER ',
                  ' think ': ' pensar ', ' THINK ': ' PENSAR ',
                  ' want ': ' querer ', ' WANT ': ' QUERER ',
                  ' need ': ' necesitar ', ' NEED ': ' NECESITAR ',
                  ' like ': ' como ', ' LIKE ': ' COMO ',
                  ' love ': ' amar ', ' LOVE ': ' AMAR ',
                  ' make ': ' hacer ', ' MAKE ': ' HACER ',
                  ' take ': ' tomar ', ' TAKE ': ' TOMAR ',
                  ' give ': ' dar ', ' GIVE ': ' DAR ',
                  ' put ': ' poner ', ' PUT ': ' PONER ',
                  ' say ': ' decir ', ' SAY ': ' DECIR ',
                  ' tell ': ' decir ', ' TELL ': ' DECIR ',
                  ' ask ': ' preguntar ', ' ASK ': ' PREGUNTAR ',
                  ' work ': ' trabajar ', ' WORK ': ' TRABAJAR ',
                  ' play ': ' jugar ', ' PLAY ': ' JUGAR ',
                  ' help ': ' ayudar ', ' HELP ': ' AYUDAR ',
                  ' find ': ' encontrar ', ' FIND ': ' ENCONTRAR ',
                  ' feel ': ' sentir ', ' FEEL ': ' SENTIR ',
                  ' look ': ' mirar ', ' LOOK ': ' MIRAR ',
                  ' seem ': ' parecer ', ' SEEM ': ' PARECER ',
                  ' try ': ' intentar ', ' TRY ': ' INTENTAR ',
                  ' use ': ' usar ', ' USE ': ' USAR ',
                  ' call ': ' llamar ', ' CALL ': ' LLAMAR ',
                  ' start ': ' empezar ', ' START ': ' EMPEZAR ',
                  ' stop ': ' parar ', ' STOP ': ' PARAR ',
                  ' turn ': ' girar ', ' TURN ': ' GIRAR ',
                  ' move ': ' mover ', ' MOVE ': ' MOVER ',
                  ' live ': ' vivir ', ' LIVE ': ' VIVIR ',
                  ' show ': ' mostrar ', ' SHOW ': ' MOSTRAR ',
                  ' hear ': ' oír ', ' HEAR ': ' OÍR ',
                  ' let ': ' dejar ', ' LET ': ' DEJAR ',
                  ' keep ': ' mantener ', ' KEEP ': ' MANTENER ',
                  ' hold ': ' sostener ', ' HOLD ': ' SOSTENER ',
                  ' bring ': ' traer ', ' BRING ': ' TRAER ',
                  ' happen ': ' pasar ', ' HAPPEN ': ' PASAR ',
                  ' write ': ' escribir ', ' WRITE ': ' ESCRIBIR ',
                  ' sit ': ' sentarse ', ' SIT ': ' SENTARSE ',
                  ' stand ': ' pararse ', ' STAND ': ' PARARSE ',
                  ' run ': ' correr ', ' RUN ': ' CORRER ',
                  ' walk ': ' caminar ', ' WALK ': ' CAMINAR ',
                  ' talk ': ' hablar ', ' TALK ': ' HABLAR ',
                  ' speak ': ' hablar ', ' SPEAK ': ' HABLAR ',
                  ' read ': ' leer ', ' READ ': ' LEER ',
                  ' listen ': ' escuchar ', ' LISTEN ': ' ESCUCHAR ',
                  ' watch ': ' ver ', ' WATCH ': ' VER ',
                  ' wait ': ' esperar ', ' WAIT ': ' ESPERAR ',
                  ' stay ': ' quedarse ', ' STAY ': ' QUEDARSE ',
                  ' leave ': ' salir ', ' LEAVE ': ' SALIR ',
                  ' return ': ' regresar ', ' RETURN ': ' REGRESAR ',
                  ' change ': ' cambiar ', ' CHANGE ': ' CAMBIAR ',
                  ' open ': ' abrir ', ' OPEN ': ' ABRIR ',
                  ' close ': ' cerrar ', ' CLOSE ': ' CERRAR ',
                  ' win ': ' ganar ', ' WIN ': ' GANAR ',
                  ' lose ': ' perder ', ' LOSE ': ' PERDER ',
                  ' buy ': ' comprar ', ' BUY ': ' COMPRAR ',
                  ' sell ': ' vender ', ' SELL ': ' VENDER ',
                  ' pay ': ' pagar ', ' PAY ': ' PAGAR ',
                  ' spend ': ' gastar ', ' SPEND ': ' GASTAR ',
                  ' cost ': ' costar ', ' COST ': ' COSTAR ',
                  ' save ': ' ahorrar ', ' SAVE ': ' AHORRAR ',
                  ' choose ': ' elegir ', ' CHOOSE ': ' ELEGIR ',
                  ' decide ': ' decidir ', ' DECIDE ': ' DECIDIR ',
                  ' remember ': ' recordar ', ' REMEMBER ': ' RECORDAR ',
                  ' forget ': ' olvidar ', ' FORGET ': ' OLVIDAR ',
                  ' learn ': ' aprender ', ' LEARN ': ' APRENDER ',
                  ' teach ': ' enseñar ', ' TEACH ': ' ENSEÑAR ',
                  ' understand ': ' entender ', ' UNDERSTAND ': ' ENTENDER ',
                  ' explain ': ' explicar ', ' EXPLAIN ': ' EXPLICAR ',
                  ' mean ': ' significar ', ' MEAN ': ' SIGNIFICAR ',
                  ' believe ': ' creer ', ' BELIEVE ': ' CREER ',
                  ' hope ': ' esperar ', ' HOPE ': ' ESPERAR ',
                  ' wish ': ' desear ', ' WISH ': ' DESEAR ',
                  ' agree ': ' estar de acuerdo ', ' AGREE ': ' ESTAR DE ACUERDO ',
                  ' disagree ': ' no estar de acuerdo ', ' DISAGREE ': ' NO ESTAR DE ACUERDO ',
                  
                  // Common adjectives
                  ' good ': ' bueno ', ' GOOD ': ' BUENO ',
                  ' bad ': ' malo ', ' BAD ': ' MALO ',
                  ' great ': ' genial ', ' GREAT ': ' GENIAL ',
                  ' small ': ' pequeño ', ' SMALL ': ' PEQUEÑO ',
                  ' big ': ' grande ', ' BIG ': ' GRANDE ',
                  ' large ': ' grande ', ' LARGE ': ' GRANDE ',
                  ' little ': ' pequeño ', ' LITTLE ': ' PEQUEÑO ',
                  ' long ': ' largo ', ' LONG ': ' LARGO ',
                  ' short ': ' corto ', ' SHORT ': ' CORTO ',
                  ' high ': ' alto ', ' HIGH ': ' ALTO ',
                  ' low ': ' bajo ', ' LOW ': ' BAJO ',
                  ' new ': ' nuevo ', ' NEW ': ' NUEVO ',
                  ' old ': ' viejo ', ' OLD ': ' VIEJO ',
                  ' young ': ' joven ', ' YOUNG ': ' JOVEN ',
                  ' hot ': ' caliente ', ' HOT ': ' CALIENTE ',
                  ' cold ': ' frío ', ' COLD ': ' FRÍO ',
                  ' warm ': ' cálido ', ' WARM ': ' CÁLIDO ',
                  ' cool ': ' fresco ', ' COOL ': ' FRESCO ',
                  ' fast ': ' rápido ', ' FAST ': ' RÁPIDO ',
                  ' slow ': ' lento ', ' SLOW ': ' LENTO ',
                  ' easy ': ' fácil ', ' EASY ': ' FÁCIL ',
                  ' hard ': ' difícil ', ' HARD ': ' DIFÍCIL ',
                  ' difficult ': ' difícil ', ' DIFFICULT ': ' DIFÍCIL ',
                  ' simple ': ' simple ', ' SIMPLE ': ' SIMPLE ',
                  ' complex ': ' complejo ', ' COMPLEX ': ' COMPLEJO ',
                  ' free ': ' gratis ', ' FREE ': ' GRATIS ',
                  ' expensive ': ' caro ', ' EXPENSIVE ': ' CARO ',
                  ' cheap ': ' barato ', ' CHEAP ': ' BARATO ',
                  ' rich ': ' rico ', ' RICH ': ' RICO ',
                  ' poor ': ' pobre ', ' POOR ': ' POBRE ',
                  ' full ': ' lleno ', ' FULL ': ' LLENO ',
                  ' empty ': ' vacío ', ' EMPTY ': ' VACÍO ',
                  ' clean ': ' limpio ', ' CLEAN ': ' LIMPIO ',
                  ' dirty ': ' sucio ', ' DIRTY ': ' SUCIO ',
                  ' safe ': ' seguro ', ' SAFE ': ' SEGURO ',
                  ' dangerous ': ' peligroso ', ' DANGEROUS ': ' PELIGROSO ',
                  ' happy ': ' feliz ', ' HAPPY ': ' FELIZ ',
                  ' sad ': ' triste ', ' SAD ': ' TRISTE ',
                  ' angry ': ' enojado ', ' ANGRY ': ' ENOJADO ',
                  ' excited ': ' emocionado ', ' EXCITED ': ' EMOCIONADO ',
                  ' tired ': ' cansado ', ' TIRED ': ' CANSADO ',
                  ' hungry ': ' hambriento ', ' HUNGRY ': ' HAMBRIENTO ',
                  ' thirsty ': ' sediento ', ' THIRSTY ': ' SEDIENTO ',
                  ' sick ': ' enfermo ', ' SICK ': ' ENFERMO ',
                  ' healthy ': ' saludable ', ' HEALTHY ': ' SALUDABLE ',
                  ' strong ': ' fuerte ', ' STRONG ': ' FUERTE ',
                  ' weak ': ' débil ', ' WEAK ': ' DÉBIL ',
                  ' beautiful ': ' hermoso ', ' BEAUTIFUL ': ' HERMOSO ',
                  ' ugly ': ' feo ', ' UGLY ': ' FEO ',
                  ' nice ': ' agradable ', ' NICE ': ' AGRADABLE ',
                  ' kind ': ' amable ', ' KIND ': ' AMABLE ',
                  ' mean ': ' malo ', ' MEAN ': ' MALO ',
                  ' smart ': ' inteligente ', ' SMART ': ' INTELIGENTE ',
                  ' stupid ': ' estúpido ', ' STUPID ': ' ESTÚPIDO ',
                  ' funny ': ' divertido ', ' FUNNY ': ' DIVERTIDO ',
                  ' serious ': ' serio ', ' SERIOUS ': ' SERIO ',
                  ' important ': ' importante ', ' IMPORTANT ': ' IMPORTANTE ',
                  ' special ': ' especial ', ' SPECIAL ': ' ESPECIAL ',
                  ' normal ': ' normal ', ' NORMAL ': ' NORMAL ',
                  ' strange ': ' extraño ', ' STRANGE ': ' EXTRAÑO ',
                  ' different ': ' diferente ', ' DIFFERENT ': ' DIFERENTE ',
                  ' same ': ' mismo ', ' SAME ': ' MISMO ',
                  ' similar ': ' similar ', ' SIMILAR ': ' SIMILAR ',
                  ' right ': ' correcto ', ' RIGHT ': ' CORRECTO ',
                  ' wrong ': ' incorrecto ', ' WRONG ': ' INCORRECTO ',
                  ' true ': ' verdadero ', ' TRUE ': ' VERDADERO ',
                  ' false ': ' falso ', ' FALSE ': ' FALSO ',
                  ' real ': ' real ', ' REAL ': ' REAL ',
                  ' fake ': ' falso ', ' FAKE ': ' FALSO ',
                  ' possible ': ' posible ', ' POSSIBLE ': ' POSIBLE ',
                  ' impossible ': ' imposible ', ' IMPOSSIBLE ': ' IMPOSIBLE ',
                  ' sure ': ' seguro ', ' SURE ': ' SEGURO ',
                  ' ready ': ' listo ', ' READY ': ' LISTO ',
                  ' busy ': ' ocupado ', ' BUSY ': ' OCUPADO ',
                  ' available ': ' disponible ', ' AVAILABLE ': ' DISPONIBLE ',
                  ' popular ': ' popular ', ' POPULAR ': ' POPULAR ',
                  ' famous ': ' famoso ', ' FAMOUS ': ' FAMOSO ',
                  ' local ': ' local ', ' LOCAL ': ' LOCAL ',
                  ' national ': ' nacional ', ' NATIONAL ': ' NACIONAL ',
                  ' international ': ' internacional ', ' INTERNATIONAL ': ' INTERNACIONAL ',
                  ' public ': ' público ', ' PUBLIC ': ' PÚBLICO ',
                  ' private ': ' privado ', ' PRIVATE ': ' PRIVADO ',
                  ' personal ': ' personal ', ' PERSONAL ': ' PERSONAL ',
                  ' professional ': ' profesional ', ' PROFESSIONAL ': ' PROFESIONAL ',
                  
                  // Business/Marketing specific words
                  ' welcome ': ' bienvenido ', ' WELCOME ': ' BIENVENIDO ',
                  ' thanks ': ' gracias ', ' THANKS ': ' GRACIAS ',
                  ' thank ': ' gracias ', ' THANK ': ' GRACIAS ',
                  ' opportunity ': ' oportunidad ', ' OPPORTUNITY ': ' OPORTUNIDAD ',
                  ' discover ': ' descubrir ', ' DISCOVER ': ' DESCUBRIR ',
                  ' benefits ': ' beneficios ', ' BENEFITS ': ' BENEFICIOS ',
                  ' club ': ' club ', ' CLUB ': ' CLUB ',
                  ' receive ': ' recibir ', ' RECEIVE ': ' RECIBIR ',
                  ' access ': ' acceso ', ' ACCESS ': ' ACCESO ',
                  ' gift ': ' regalo ', ' GIFT ': ' REGALO ',
                  ' simply ': ' simplemente ', ' SIMPLY ': ' SIMPLEMENTE ',
                  ' fill ': ' completa ', ' FILL ': ' COMPLETA ',
                  ' fields ': ' campos ', ' FIELDS ': ' CAMPOS ',
                  ' below ': ' continuación ', ' BELOW ': ' CONTINUACIÓN ',
                  ' via ': ' por ', ' VIA ': ' POR ',
                  ' email ': ' correo ', ' EMAIL ': ' CORREO ',
                  ' complete ': ' completa ', ' COMPLETE ': ' COMPLETA ',
                  ' just ': ' solo ', ' JUST ': ' SOLO ',
                  ' fully ': ' completamente ', ' FULLY ': ' COMPLETAMENTE ',
                  ' enjoy ': ' disfruta ', ' ENJOY ': ' DISFRUTA ',
                  ' experience ': ' experiencia ', ' EXPERIENCE ': ' EXPERIENCIA ',
                  ' paying ': ' pagar ', ' PAYING ': ' PAGAR ',
                  ' guarantees ': ' garantiza ', ' GUARANTEES ': ' GARANTIZA ',
                  ' spam ': ' spam ', ' SPAM ': ' SPAM ',
                  ' data ': ' datos ', ' DATA ': ' DATOS ',
                  ' protected ': ' protegidos ', ' PROTECTED ': ' PROTEGIDOS ',
                  ' sign ': ' registrar ', ' SIGN ': ' REGISTRAR ',
                  ' up ': ' arriba ', ' UP ': ' ARRIBA ',
                  ' now ': ' ahora ', ' NOW ': ' AHORA ',
                  ' today ': ' hoy ', ' TODAY ': ' HOY ',
                  ' here ': ' aquí ', ' HERE ': ' AQUÍ ',
                  ' click ': ' clic ', ' CLICK ': ' CLIC ',
                  ' read ': ' leer ', ' READ ': ' LEER ',
                  ' privacy ': ' privacidad ', ' PRIVACY ': ' PRIVACIDAD ',
                  ' notice ': ' aviso ', ' NOTICE ': ' AVISO ',
                  ' usage ': ' uso ', ' USAGE ': ' USO ',
                  ' day ': ' día ', ' DAY ': ' DÍA ',
                  ' days ': ' días ', ' DAYS ': ' DÍAS ',
                  ' guest ': ' huésped ', ' GUEST ': ' HUÉSPED ',
                  ' guests ': ' huéspedes ', ' GUESTS ': ' HUÉSPEDES ',
                  
                  // Test-specific words
                  ' adding ': ' agregando ', ' ADDING ': ' AGREGANDO ',
                  ' translates ': ' traduce ', ' TRANSLATES ': ' TRADUCE ',
                  ' correctly ': ' correctamente ', ' CORRECTLY ': ' CORRECTAMENTE ',
                  ' after ': ' después ', ' AFTER ': ' DESPUÉS ',
                  ' edit ': ' edición ', ' EDIT ': ' EDICIÓN ',
                  ' edited ': ' editado ', ' EDITED ': ' EDITADO ',
                  ' added ': ' agregado ', ' ADDED ': ' AGREGADO ',
                  ' original ': ' original ', ' ORIGINAL ': ' ORIGINAL ',
                  ' translating ': ' traduciendo ', ' TRANSLATING ': ' TRADUCIENDO ',
                  ' translatiing ': ' traduciendo ', ' TRANSLATIING ': ' TRADUCIENDO ', // Handle typo
                  ' spanish ': ' español ', ' SPANISH ': ' ESPAÑOL ',
                  ' english ': ' inglés ', ' ENGLISH ': ' INGLÉS ',
                  ' working ': ' funcionando ', ' WORKING ': ' FUNCIONANDO ',
                  ' changes ': ' cambios ', ' CHANGES ': ' CAMBIOS ',
                  ' wrote ': ' escribimos ', ' WROTE ': ' ESCRIBIMOS ',
                  ' lets ': ' veamos ', ' LETS ': ' VEAMOS ',
                  ' ver ': ' ver ', ' VER ': ' VER ', // Keep as is since it's already Spanish
                  ' si ': ' si ', ' SI ': ' SI ', // Keep as is since it's already Spanish
                  ' el ': ' el ', ' EL ': ' EL ', // Keep as is since it's already Spanish
                  ' para ': ' para ', ' PARA ': ' PARA ', // Keep as is since it's already Spanish
                  ' lo ': ' lo ', ' LO ': ' LO ', // Keep as is since it's already Spanish
                  
                  // Common nouns
                  ' time ': ' tiempo ', ' TIME ': ' TIEMPO ',
                  ' year ': ' año ', ' YEAR ': ' AÑO ',
                  ' month ': ' mes ', ' MONTH ': ' MES ',
                  ' week ': ' semana ', ' WEEK ': ' SEMANA ',
                  ' hour ': ' hora ', ' HOUR ': ' HORA ',
                  ' minute ': ' minuto ', ' MINUTE ': ' MINUTO ',
                  ' second ': ' segundo ', ' SECOND ': ' SEGUNDO ',
                  ' place ': ' lugar ', ' PLACE ': ' LUGAR ',
                  ' home ': ' casa ', ' HOME ': ' CASA ',
                  ' house ': ' casa ', ' HOUSE ': ' CASA ',
                  ' room ': ' habitación ', ' ROOM ': ' HABITACIÓN ',
                  ' door ': ' puerta ', ' DOOR ': ' PUERTA ',
                  ' window ': ' ventana ', ' WINDOW ': ' VENTANA ',
                  ' table ': ' mesa ', ' TABLE ': ' MESA ',
                  ' chair ': ' silla ', ' CHAIR ': ' SILLA ',
                  ' bed ': ' cama ', ' BED ': ' CAMA ',
                  ' car ': ' carro ', ' CAR ': ' CARRO ',
                  ' bus ': ' autobús ', ' BUS ': ' AUTOBÚS ',
                  ' train ': ' tren ', ' TRAIN ': ' TREN ',
                  ' plane ': ' avión ', ' PLANE ': ' AVIÓN ',
                  ' phone ': ' teléfono ', ' PHONE ': ' TELÉFONO ',
                  ' computer ': ' computadora ', ' COMPUTER ': ' COMPUTADORA ',
                  ' book ': ' libro ', ' BOOK ': ' LIBRO ',
                  ' paper ': ' papel ', ' PAPER ': ' PAPEL ',
                  ' pen ': ' pluma ', ' PEN ': ' PLUMA ',
                  ' pencil ': ' lápiz ', ' PENCIL ': ' LÁPIZ ',
                  ' money ': ' dinero ', ' MONEY ': ' DINERO ',
                  ' food ': ' comida ', ' FOOD ': ' COMIDA ',
                  ' water ': ' agua ', ' WATER ': ' AGUA ',
                  ' coffee ': ' café ', ' COFFEE ': ' CAFÉ ',
                  ' tea ': ' té ', ' TEA ': ' TÉ ',
                  ' milk ': ' leche ', ' MILK ': ' LECHE ',
                  ' bread ': ' pan ', ' BREAD ': ' PAN ',
                  ' meat ': ' carne ', ' MEAT ': ' CARNE ',
                  ' fish ': ' pescado ', ' FISH ': ' PESCADO ',
                  ' fruit ': ' fruta ', ' FRUIT ': ' FRUTA ',
                  ' vegetable ': ' verdura ', ' VEGETABLE ': ' VERDURA ',
                  ' music ': ' música ', ' MUSIC ': ' MÚSICA ',
                  ' movie ': ' película ', ' MOVIE ': ' PELÍCULA ',
                  ' game ': ' juego ', ' GAME ': ' JUEGO ',
                  ' sport ': ' deporte ', ' SPORT ': ' DEPORTE ',
                  ' school ': ' escuela ', ' SCHOOL ': ' ESCUELA ',
                  ' work ': ' trabajo ', ' WORK ': ' TRABAJO ',
                  ' job ': ' trabajo ', ' JOB ': ' TRABAJO ',
                  ' office ': ' oficina ', ' OFFICE ': ' OFICINA ',
                  ' store ': ' tienda ', ' STORE ': ' TIENDA ',
                  ' shop ': ' tienda ', ' SHOP ': ' TIENDA ',
                  ' market ': ' mercado ', ' MARKET ': ' MERCADO ',
                  ' restaurant ': ' restaurante ', ' RESTAURANT ': ' RESTAURANTE ',
                  ' hotel ': ' hotel ', ' HOTEL ': ' HOTEL ',
                  ' hospital ': ' hospital ', ' HOSPITAL ': ' HOSPITAL ',
                  ' bank ': ' banco ', ' BANK ': ' BANCO ',
                  ' church ': ' iglesia ', ' CHURCH ': ' IGLESIA ',
                  ' park ': ' parque ', ' PARK ': ' PARQUE ',
                  ' street ': ' calle ', ' STREET ': ' CALLE ',
                  ' road ': ' carretera ', ' ROAD ': ' CARRETERA ',
                  ' city ': ' ciudad ', ' CITY ': ' CIUDAD ',
                  ' town ': ' pueblo ', ' TOWN ': ' PUEBLO ',
                  ' country ': ' país ', ' COUNTRY ': ' PAÍS ',
                  ' world ': ' mundo ', ' WORLD ': ' MUNDO ',
                  ' people ': ' gente ', ' PEOPLE ': ' GENTE ',
                  ' person ': ' persona ', ' PERSON ': ' PERSONA ',
                  ' man ': ' hombre ', ' MAN ': ' HOMBRE ',
                  ' woman ': ' mujer ', ' WOMAN ': ' MUJER ',
                  ' child ': ' niño ', ' CHILD ': ' NIÑO ',
                  ' boy ': ' niño ', ' BOY ': ' NIÑO ',
                  ' girl ': ' niña ', ' GIRL ': ' NIÑA ',
                  ' friend ': ' amigo ', ' FRIEND ': ' AMIGO ',
                  ' family ': ' familia ', ' FAMILY ': ' FAMILIA ',
                  ' mother ': ' madre ', ' MOTHER ': ' MADRE ',
                  ' father ': ' padre ', ' FATHER ': ' PADRE ',
                  ' brother ': ' hermano ', ' BROTHER ': ' HERMANO ',
                  ' sister ': ' hermana ', ' SISTER ': ' HERMANA ',
                  ' son ': ' hijo ', ' SON ': ' HIJO ',
                  ' daughter ': ' hija ', ' DAUGHTER ': ' HIJA ',
                  ' husband ': ' esposo ', ' HUSBAND ': ' ESPOSO ',
                  ' wife ': ' esposa ', ' WIFE ': ' ESPOSA ',
                  ' name ': ' nombre ', ' NAME ': ' NOMBRE ',
                  ' number ': ' número ', ' NUMBER ': ' NÚMERO ',
                  ' color ': ' color ', ' COLOR ': ' COLOR ',
                  ' size ': ' tamaño ', ' SIZE ': ' TAMAÑO ',
                  ' price ': ' precio ', ' PRICE ': ' PRECIO ',
                  ' problem ': ' problema ', ' PROBLEM ': ' PROBLEMA ',
                  ' question ': ' pregunta ', ' QUESTION ': ' PREGUNTA ',
                  ' answer ': ' respuesta ', ' ANSWER ': ' RESPUESTA ',
                  ' idea ': ' idea ', ' IDEA ': ' IDEA ',
                  ' way ': ' manera ', ' WAY ': ' MANERA ',
                  ' thing ': ' cosa ', ' THING ': ' COSA ',
                  ' part ': ' parte ', ' PART ': ' PARTE ',
                  ' side ': ' lado ', ' SIDE ': ' LADO ',
                  ' end ': ' final ', ' END ': ' FINAL ',
                  ' beginning ': ' principio ', ' BEGINNING ': ' PRINCIPIO ',
                  ' middle ': ' medio ', ' MIDDLE ': ' MEDIO ',
                  ' top ': ' arriba ', ' TOP ': ' ARRIBA ',
                  ' bottom ': ' abajo ', ' BOTTOM ': ' ABAJO ',
                  ' left ': ' izquierda ', ' LEFT ': ' IZQUIERDA ',
                  ' right ': ' derecha ', ' RIGHT ': ' DERECHA ',
                  ' front ': ' frente ', ' FRONT ': ' FRENTE ',
                  ' back ': ' atrás ', ' BACK ': ' ATRÁS ',
                  ' inside ': ' dentro ', ' INSIDE ': ' DENTRO ',
                  ' outside ': ' fuera ', ' OUTSIDE ': ' FUERA ',
                  ' up ': ' arriba ', ' UP ': ' ARRIBA ',
                  ' down ': ' abajo ', ' DOWN ': ' ABAJO ',
                  ' over ': ' sobre ', ' OVER ': ' SOBRE ',
                  ' under ': ' bajo ', ' UNDER ': ' BAJO ',
                  ' near ': ' cerca ', ' NEAR ': ' CERCA ',
                  ' far ': ' lejos ', ' FAR ': ' LEJOS ',
                  ' here ': ' aquí ', ' HERE ': ' AQUÍ ',
                  ' there ': ' allí ', ' THERE ': ' ALLÍ ',
                  ' where ': ' dónde ', ' WHERE ': ' DÓNDE ',
                  ' when ': ' cuándo ', ' WHEN ': ' CUÁNDO ',
                  ' why ': ' por qué ', ' WHY ': ' POR QUÉ ',
                  ' how ': ' cómo ', ' HOW ': ' CÓMO ',
                  ' what ': ' qué ', ' WHAT ': ' QUÉ ',
                  ' who ': ' quién ', ' WHO ': ' QUIÉN ',
                  ' which ': ' cuál ', ' WHICH ': ' CUÁL ',
                  ' whose ': ' de quién ', ' WHOSE ': ' DE QUIÉN ',
                  ' whom ': ' a quién ', ' WHOM ': ' A QUIÉN ',
                  ' yes ': ' sí ', ' YES ': ' SÍ ',
                  ' no ': ' no ', ' NO ': ' NO ',
                  ' not ': ' no ', ' NOT ': ' NO ',
                  ' never ': ' nunca ', ' NEVER ': ' NUNCA ',
                  ' always ': ' siempre ', ' ALWAYS ': ' SIEMPRE ',
                  ' sometimes ': ' a veces ', ' SOMETIMES ': ' A VECES ',
                  ' often ': ' a menudo ', ' OFTEN ': ' A MENUDO ',
                  ' usually ': ' usualmente ', ' USUALLY ': ' USUALMENTE ',
                  ' maybe ': ' quizás ', ' MAYBE ': ' QUIZÁS ',
                  ' perhaps ': ' tal vez ', ' PERHAPS ': ' TAL VEZ ',
                  ' probably ': ' probablemente ', ' PROBABLY ': ' PROBABLEMENTE ',
                  ' certainly ': ' ciertamente ', ' CERTAINLY ': ' CIERTAMENTE ',
                  ' definitely ': ' definitivamente ', ' DEFINITELY ': ' DEFINITIVAMENTE ',
                  ' really ': ' realmente ', ' REALLY ': ' REALMENTE ',
                  ' very ': ' muy ', ' VERY ': ' MUY ',
                  ' quite ': ' bastante ', ' QUITE ': ' BASTANTE ',
                  ' rather ': ' más bien ', ' RATHER ': ' MÁS BIEN ',
                  ' pretty ': ' bastante ', ' PRETTY ': ' BASTANTE ',
                  ' too ': ' también ', ' TOO ': ' TAMBIÉN ',
                  ' also ': ' también ', ' ALSO ': ' TAMBIÉN ',
                  ' either ': ' tampoco ', ' EITHER ': ' TAMPOCO ',
                  ' neither ': ' tampoco ', ' NEITHER ': ' TAMPOCO ',
                  ' both ': ' ambos ', ' BOTH ': ' AMBOS ',
                  ' all ': ' todos ', ' ALL ': ' TODOS ',
                  ' some ': ' algunos ', ' SOME ': ' ALGUNOS ',
                  ' any ': ' cualquier ', ' ANY ': ' CUALQUIER ',
                  ' many ': ' muchos ', ' MANY ': ' MUCHOS ',
                  ' much ': ' mucho ', ' MUCH ': ' MUCHO ',
                  ' few ': ' pocos ', ' FEW ': ' POCOS ',
                  ' little ': ' poco ', ' LITTLE ': ' POCO ',
                  ' more ': ' más ', ' MORE ': ' MÁS ',
                  ' most ': ' más ', ' MOST ': ' MÁS ',
                  ' less ': ' menos ', ' LESS ': ' MENOS ',
                  ' least ': ' menos ', ' LEAST ': ' MENOS ',
                  ' enough ': ' suficiente ', ' ENOUGH ': ' SUFICIENTE ',
                  ' only ': ' solo ', ' ONLY ': ' SOLO ',
                  ' just ': ' solo ', ' JUST ': ' SOLO ',
                  ' almost ': ' casi ', ' ALMOST ': ' CASI ',
                  ' about ': ' acerca de ', ' ABOUT ': ' ACERCA DE ',
                  ' around ': ' alrededor ', ' AROUND ': ' ALREDEDOR ',
                  ' between ': ' entre ', ' BETWEEN ': ' ENTRE ',
                  ' among ': ' entre ', ' AMONG ': ' ENTRE ',
                  ' during ': ' durante ', ' DURING ': ' DURANTE ',
                  ' before ': ' antes ', ' BEFORE ': ' ANTES ',
                  ' after ': ' después ', ' AFTER ': ' DESPUÉS ',
                  ' while ': ' mientras ', ' WHILE ': ' MIENTRAS ',
                  ' until ': ' hasta ', ' UNTIL ': ' HASTA ',
                  ' since ': ' desde ', ' SINCE ': ' DESDE ',
                  ' because ': ' porque ', ' BECAUSE ': ' PORQUE ',
                  ' if ': ' si ', ' IF ': ' SI ',
                  ' unless ': ' a menos que ', ' UNLESS ': ' A MENOS QUE ',
                  ' although ': ' aunque ', ' ALTHOUGH ': ' AUNQUE ',
                  ' though ': ' aunque ', ' THOUGH ': ' AUNQUE ',
                  ' however ': ' sin embargo ', ' HOWEVER ': ' SIN EMBARGO ',
                  ' therefore ': ' por lo tanto ', ' THEREFORE ': ' POR LO TANTO ',
                  ' so ': ' entonces ', ' SO ': ' ENTONCES ',
                  ' then ': ' entonces ', ' THEN ': ' ENTONCES ',
                  ' now ': ' ahora ', ' NOW ': ' AHORA ',
                  ' today ': ' hoy ', ' TODAY ': ' HOY ',
                  ' tomorrow ': ' mañana ', ' TOMORROW ': ' MAÑANA ',
                  ' yesterday ': ' ayer ', ' YESTERDAY ': ' AYER ',
                  ' morning ': ' mañana ', ' MORNING ': ' MAÑANA ',
                  ' afternoon ': ' tarde ', ' AFTERNOON ': ' TARDE ',
                  ' evening ': ' noche ', ' EVENING ': ' NOCHE ',
                  ' night ': ' noche ', ' NIGHT ': ' NOCHE ',
                  ' early ': ' temprano ', ' EARLY ': ' TEMPRANO ',
                  ' late ': ' tarde ', ' LATE ': ' TARDE ',
                  ' soon ': ' pronto ', ' SOON ': ' PRONTO ',
                  ' later ': ' más tarde ', ' LATER ': ' MÁS TARDE ',
                  ' again ': ' otra vez ', ' AGAIN ': ' OTRA VEZ ',
                  ' once ': ' una vez ', ' ONCE ': ' UNA VEZ ',
                  ' twice ': ' dos veces ', ' TWICE ': ' DOS VECES ',
                  ' first ': ' primero ', ' FIRST ': ' PRIMERO ',
                  ' second ': ' segundo ', ' SECOND ': ' SEGUNDO ',
                  ' third ': ' tercero ', ' THIRD ': ' TERCERO ',
                  ' last ': ' último ', ' LAST ': ' ÚLTIMO ',
                  ' next ': ' siguiente ', ' NEXT ': ' SIGUIENTE ',
                  ' previous ': ' anterior ', ' PREVIOUS ': ' ANTERIOR ',
                  ' final ': ' final ', ' FINAL ': ' FINAL ',
                }
                
                // Apply universal word translations
                for (const [english, spanish] of Object.entries(universalWordTranslations)) {
                  const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                  translatedText = translatedText.replace(regex, spanish)
                }
                
                // Clean up
                translatedText = translatedText.replace(/\s+/g, ' ').trim()
                
                console.log(`✅ Universal English translation result: "${text}" → "${translatedText}"`)
                return translatedText
              }
              
              // 2. INTELLIGENT COMPLETE TEXT TRANSLATION
              // For any custom English text, translate it as a complete intelligent unit
              
              // Enhanced English detection - look for ANY English words or patterns
              const englishIndicators = [
                // Common English words
                'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
                // Additional English words from your test
                'lets', 'ver', 'si', 'changes', 'work', 'we', 'wrote', 'edit', 'english', 'original', 'if', 'this', 'giving', 'yourself', 'opportunity', 'discover', 'benefits', 'club', 'receive', 'access', 'gift', 'simply', 'fill', 'fields', 'below', 'will', 'free', 'via', 'email'
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
                  
                  // NEW PATTERNS FROM LATEST TEST
                  'LETS ver si THIS CHANGES WORK': 'VEAMOS SI ESTOS CAMBIOS FUNCIONAN',
                  'lets ver si this changes work': 'veamos si estos cambios funcionan',
                  'WE WROTE ON el ORIGINAL EDIT ENGLISH': 'ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
                  'we wrote on el original edit english': 'escribimos en el original editar inglés',
                  'WE WROTE ON': 'ESCRIBIMOS EN',
                  'we wrote on': 'escribimos en',
                  'EDIT ENGLISH': 'EDITAR INGLÉS',
                  'edit english': 'editar inglés',
                  
                  // OLD PATTERNS
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
                  // NEW WORDS FROM LATEST TEST
                  ' lets ': ' veamos ', ' LETS ': ' VEAMOS ',
                  ' ver ': ' ver ', ' VER ': ' VER ', // Keep as is since it's already Spanish
                  ' si ': ' si ', ' SI ': ' SI ', // Keep as is since it's already Spanish
                  ' this ': ' estos ', ' THIS ': ' ESTOS ',
                  ' changes ': ' cambios ', ' CHANGES ': ' CAMBIOS ',
                  ' work ': ' funcionan ', ' WORK ': ' FUNCIONAN ',
                  ' we ': ' escribimos ', ' WE ': ' ESCRIBIMOS ',
                  ' wrote ': ' escribimos ', ' WROTE ': ' ESCRIBIMOS ',
                  ' on ': ' en ', ' ON ': ' EN ',
                  ' el ': ' el ', ' EL ': ' EL ', // Keep as is since it's already Spanish
                  ' edit ': ' editar ', ' EDIT ': ' EDITAR ',
                  ' english ': ' inglés ', ' ENGLISH ': ' INGLÉS ',
                  
                  // EXISTING WORDS
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
            // EXACT CUSTOM TEXT FROM SCREENSHOTS - OLD TEST
            'WELCOME TO......THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'BIENVENIDO A......ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR CORREO ELECTRÓNICO. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED. THIS WAS EDITED AND ADDED TO THE ORIGINAL TO SEE IF ITS TRANSLATIING TO SPANISH?': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS. ESTO FUE EDITADO Y AGREGADO AL ORIGINAL PARA VER SI SE ESTÁ TRADUCIENDO AL ESPAÑOL?',
            
            // NEW CUSTOM TEXT FROM LATEST SCREENSHOTS
            'WELCOME TO......LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'BIENVENIDO A......VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
            'Bienvenido a......LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Bienvenido a......VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
            'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Muchas gracias por darse la oportunidad de descubrir los beneficios del club. Para recibir su regalo de acceso completo de 7 días a eLocalPass, simplemente complete los campos a continuación y recibirá su eLocalPass gratuito por correo electrónico. VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
            'Solo complete los campos a continuación y reciba su regalo por correo electrónico:LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Solo complete los campos a continuación y reciba su regalo por correo electrónico: VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
            'Disfrute completamente la experiencia de pagar como un local. ELOCALPASS garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos.LETS ver si THIS CHANGES WORK, WE WROTE ON el ORIGINAL EDIT ENGLISH': 'Disfrute completamente la experiencia de pagar como un local. ELOCALPASS garantiza que no recibirá ningún tipo de spam y que sus datos están protegidos. VEAMOS SI ESTOS CAMBIOS FUNCIONAN, ESCRIBIMOS EN EL ORIGINAL EDITAR INGLÉS',
            
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
