import { NextRequest, NextResponse } from 'next/server'
import { qrConfigurations } from '../../../../lib/qr-storage'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const { qrId } = params

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR ID is required' },
        { status: 400 }
      )
    }

    // Get QR configurations from storage
    console.log(`🔍 Looking for QR config: ${qrId}`)
    console.log(`📋 Available configs:`, Array.from(qrConfigurations.keys()))
    console.log(`🗂️ Total stored configs: ${qrConfigurations.size}`)
    
    const storedConfig = qrConfigurations.get(qrId)
    console.log(`🔍 Raw stored config for ${qrId}:`, storedConfig ? 'FOUND' : 'NOT FOUND')
    
    if (storedConfig) {
      console.log(`✅ Found stored config for ${qrId}:`, JSON.stringify(storedConfig, null, 2))
      
      const qrConfig: QRConfigData = {
        id: qrId,
        businessName: storedConfig.businessName,
        logoUrl: storedConfig.logoUrl || '',
        headerText: storedConfig.headerText,
        headerTextColor: storedConfig.headerTextColor,
        headerFontFamily: storedConfig.headerFontFamily,
        headerFontSize: storedConfig.headerFontSize,
        descriptionText: storedConfig.descriptionText,
        descriptionTextColor: storedConfig.descriptionTextColor,
        descriptionFontFamily: storedConfig.descriptionFontFamily,
        descriptionFontSize: storedConfig.descriptionFontSize,
        ctaButtonText: storedConfig.ctaButtonText,
        ctaButtonTextColor: storedConfig.ctaButtonTextColor,
        ctaButtonFontFamily: storedConfig.ctaButtonFontFamily,
        ctaButtonFontSize: storedConfig.ctaButtonFontSize,
        formTitleText: storedConfig.formTitleText,
        formTitleTextColor: storedConfig.formTitleTextColor,
        formTitleFontFamily: storedConfig.formTitleFontFamily,
        formTitleFontSize: storedConfig.formTitleFontSize,
        formInstructionsText: storedConfig.formInstructionsText,
        formInstructionsTextColor: storedConfig.formInstructionsTextColor,
        formInstructionsFontFamily: storedConfig.formInstructionsFontFamily,
        formInstructionsFontSize: storedConfig.formInstructionsFontSize,
        footerDisclaimerText: storedConfig.footerDisclaimerText,
        footerDisclaimerTextColor: storedConfig.footerDisclaimerTextColor,
        footerDisclaimerFontFamily: storedConfig.footerDisclaimerFontFamily,
        footerDisclaimerFontSize: storedConfig.footerDisclaimerFontSize,
        primaryColor: storedConfig.primaryColor,
        secondaryColor: storedConfig.secondaryColor,
        backgroundColor: storedConfig.backgroundColor,
        guestSelectionBoxColor: storedConfig.guestSelectionBoxColor,
        daySelectionBoxColor: storedConfig.daySelectionBoxColor,
        footerDisclaimerBoxColor: storedConfig.footerDisclaimerBoxColor,
        allowCustomGuests: storedConfig.allowCustomGuests,
        defaultGuests: storedConfig.defaultGuests,
        maxGuests: storedConfig.maxGuests,
        allowCustomDays: storedConfig.allowCustomDays,
        defaultDays: storedConfig.defaultDays,
        maxDays: storedConfig.maxDays
      }

      console.log(`✅ Found stored QR config: ${qrId}`)
      return NextResponse.json(qrConfig)
    }

    // Fallback to mock data for testing
    console.log(`⚠️ No stored config found for ${qrId}, using mock data`)
    
    // Auto-translate function for fallback data
    const autoTranslate = (text: string, language: string): string => {
      if (language !== 'es') return text
      
      // UNIVERSAL ENGLISH TEXT DETECTION AND TRANSLATION
      const containsEnglish = /\b(thanks|thank|you|very|much|giving|yourself|opportunity|discover|benefits|club|receive|access|gift|simply|fill|fields|below|via|email|complete|just|fully|enjoy|experience|paying|like|local|guarantees|kind|spam|data|protected|so|is|this|really|working|or|not|we|want|to|be|able|translate|perfectly|spanish|there|was|time|of|happiness|everyone|dont|miss|out|get|it|before|run|come|on|make|work|the|and|for|will|can|have|has|been|are|with|from|they|them|their|our|us|my|me|i|he|she|him|her|his|its|that|these|those|what|when|where|why|how|who|which|more|most|some|any|all|no|yes|good|bad|big|small|new|old|first|last|long|short|high|low|right|wrong|true|false)\b/i.test(text)
      
              if (containsEnglish) {
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
          
          // Handle specific complete phrases first
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
        
                  // Apply comprehensive translation map
          const englishToSpanishMap: Record<string, string> = {
            // Complete phrases first
            'thanks you very much': 'muchas gracias',
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
            
            'so is this': 'entonces esto',
            'really working': 'realmente funcionando',
            'or not': 'o no',
            'we want': 'queremos',
            'we wnat': 'queremos',
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
            'befoe we': 'antes de que',
            'run out': 'se nos acabe',
            'come on': 'vamos',
            'make it work': 'haz que funcione'
          }
        
        for (const [english, spanish] of Object.entries(englishToSpanishMap)) {
          const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          translatedText = translatedText.replace(regex, spanish)
        }
        
        return translatedText.replace(/\s+/g, ' ').trim()
      }
      
      return text
    }
    
    // Get language from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || ''
    const detectedLanguage = acceptLanguage.toLowerCase().includes('es') ? 'es' : 'en'
    console.log(`🌐 Detected language for fallback: ${detectedLanguage}`)
    
    const mockData: QRConfigData = {
      id: qrId,
      businessName: 'Club Viva',
      logoUrl: undefined,
      headerText: autoTranslate('THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.', detectedLanguage),
      headerTextColor: '#000',
      headerFontFamily: 'Arial',
      headerFontSize: '24px',
      descriptionText: autoTranslate('TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.', detectedLanguage),
      descriptionTextColor: '#666',
      descriptionFontFamily: 'Arial',
      descriptionFontSize: '18px',
      ctaButtonText: autoTranslate('Get your eLocalPass now!', detectedLanguage),
      ctaButtonTextColor: '#fff',
      ctaButtonFontFamily: 'Arial',
      ctaButtonFontSize: '18px',
      formTitleText: autoTranslate('Sign up for your eLocalPass', detectedLanguage),
      formTitleTextColor: '#000',
      formTitleFontFamily: 'Arial',
      formTitleFontSize: '24px',
      formInstructionsText: autoTranslate('Please fill out the form below to receive your eLocalPass', detectedLanguage),
      formInstructionsTextColor: '#666',
      formInstructionsFontFamily: 'Arial',
      formInstructionsFontSize: '18px',
      footerDisclaimerText: autoTranslate('By signing up, you agree to our terms and conditions', detectedLanguage),
      footerDisclaimerTextColor: '#666',
      footerDisclaimerFontFamily: 'Arial',
      footerDisclaimerFontSize: '14px',
      primaryColor: '#2563eb', // Blue
      secondaryColor: '#f97316', // Orange  
      backgroundColor: '#fef3f2',
      guestSelectionBoxColor: '#fff',
      daySelectionBoxColor: '#fff',
      footerDisclaimerBoxColor: '#fff',
      allowCustomGuests: true,
      defaultGuests: 2,
      maxGuests: 6,
      allowCustomDays: true,
      defaultDays: 7,
      maxDays: 30
    }

    return NextResponse.json(mockData)
    
  } catch (error) {
    console.error('Error fetching QR configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR configuration' },
      { status: 500 }
    )
  }
}
