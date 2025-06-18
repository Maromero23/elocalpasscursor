// Translation system for ELocalPass
// Supports Spanish (es) and English (en) only
// Any other language detected will default to English

export type SupportedLanguage = 'en' | 'es'

export interface TranslationMap {
  [key: string]: string
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationMap> = {
  en: {
    // Email Subjects
    'email.welcome.subject': 'Your ELocalPass is Ready - Immediate Access',
    'email.rebuy.subject': 'Your ELocalPass Expires Soon - Get Another!',
    
    // Email Content - Welcome
    'email.welcome.greeting': 'Hello {customerName},',
    'email.welcome.ready': 'Your ELocalPass is ready to use!',
    'email.welcome.details.header': '📋 PASS DETAILS:',
    'email.welcome.details.code': '• Code: {qrCode}',
    'email.welcome.details.guests': '• Guests: {guests} people',
    'email.welcome.details.days': '• Valid for: {days} days',
    'email.welcome.access.direct.header': '🎯 DIRECT ACCESS:',
    'email.welcome.access.direct.text': 'This code gives you immediate access to your local experience.\nSimply show this QR code at the access point.',
    'email.welcome.access.portal.header': '📱 ACCESS YOUR CUSTOMER PORTAL:',
    'email.welcome.access.portal.text': 'View and download your QR code anytime:\n{magicLink}',
    'email.welcome.validity': '⏰ VALID UNTIL: {expirationDate}',
    'email.welcome.closing': 'We hope you enjoy your local experience!',
    'email.welcome.signature': 'Best regards,\nThe ELocalPass Team',
    
    // Email Content - Rebuy
    'email.rebuy.greeting': 'Hello {customerName},',
    'email.rebuy.header': 'Don\'t Let Your Local Adventure End!',
    'email.rebuy.message': 'Your ELocalPass expires in 12 hours. Get another pass to continue your local experiences.',
    'email.rebuy.cta': 'Get Another Pass',
    'email.rebuy.closing': 'Thank you for choosing ELocalPass!',
    
    // Landing Page Content
    'landing.form.title': 'SIGN UP TO GET YOUR FREE ELOCALPASS!',
    'landing.form.instructions': 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
    'landing.form.name.placeholder': 'Name: (IT MUST MATCH YOUR ID)',
    'landing.form.email.placeholder': 'Email: (TO RECEIVE YOUR ELOCALPASS)',
    'landing.form.email.confirm.placeholder': 'Confirm Email: (MUST MATCH ABOVE)',
    'landing.form.email.mismatch': 'Email addresses do not match',
    'landing.form.submit.default': 'Get Your Pass',
    'landing.form.submit.processing': 'Processing...',
    'landing.pass.details': 'Pass Details: {guests} guest{guestPlural} × {days} day{dayPlural}',
    'landing.pass.preset': '(Preset by administrator)',
    'landing.disclaimer': 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
    'landing.privacy.link': 'Click HERE to read the privacy notice and data usage',
    'landing.error.fill.fields': 'Please fill in all required fields.',
    'landing.error.email.mismatch': 'Email addresses do not match. Please check and try again.',
    'landing.success.message': 'Success! Your ELocalPass has been created and sent to your email.',
    'landing.error.general': 'There was an error submitting your request. Please try again.',
    
    // Customer Portal
    'portal.welcome': 'Welcome to Your ELocalPass Portal',
    'portal.pass.active': 'Active Pass',
    'portal.pass.expired': 'Expired Pass',
    'portal.download.qr': 'Download QR Code',
    'portal.view.details': 'View Details',
    
    // General
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.success': 'Success',
    'general.close': 'Close',
    'general.cancel': 'Cancel',
    'general.confirm': 'Confirm',
    'general.guest.singular': '',
    'general.guest.plural': 's',
    'general.day.singular': '',
    'general.day.plural': 's'
  },
  
  es: {
    // Email Subjects
    'email.welcome.subject': 'Su ELocalPass está listo - Acceso Inmediato',
    'email.rebuy.subject': '¡Su ELocalPass expira pronto - Obtenga otro!',
    
    // Email Content - Welcome
    'email.welcome.greeting': 'Hola {customerName},',
    'email.welcome.ready': '¡Su ELocalPass está listo para usar!',
    'email.welcome.details.header': '📋 DETALLES DE SU PASE:',
    'email.welcome.details.code': '• Código: {qrCode}',
    'email.welcome.details.guests': '• Huéspedes: {guests} personas',
    'email.welcome.details.days': '• Válido por: {days} días',
    'email.welcome.access.direct.header': '🎯 ACCESO DIRECTO:',
    'email.welcome.access.direct.text': 'Este código le da acceso inmediato a su experiencia local.\nSolo muestre este código QR en el punto de acceso.',
    'email.welcome.access.portal.header': '📱 ACCEDA A SU PORTAL DE CLIENTE:',
    'email.welcome.access.portal.text': 'Vea y descargue su código QR en cualquier momento:\n{magicLink}',
    'email.welcome.validity': '⏰ VÁLIDO HASTA: {expirationDate}',
    'email.welcome.closing': '¡Disfrute su experiencia local!',
    'email.welcome.signature': 'Saludos,\nEl equipo ELocalPass',
    
    // Email Content - Rebuy
    'email.rebuy.greeting': 'Hola {customerName},',
    'email.rebuy.header': '¡No deje que termine su aventura local!',
    'email.rebuy.message': 'Su ELocalPass expira en 12 horas. Obtenga otro pase para continuar sus experiencias locales.',
    'email.rebuy.cta': 'Obtener Otro Pase',
    'email.rebuy.closing': '¡Gracias por elegir ELocalPass!',
    
    // Landing Page Content
    'landing.form.title': '¡REGÍSTRESE PARA OBTENER SU ELOCALPASS GRATIS!',
    'landing.form.instructions': 'SOLO COMPLETE LOS CAMPOS A CONTINUACIÓN Y RECIBA SU REGALO POR EMAIL:',
    'landing.form.name.placeholder': 'Nombre: (DEBE COINCIDIR CON SU ID)',
    'landing.form.email.placeholder': 'Email: (PARA RECIBIR SU ELOCALPASS)',
    'landing.form.email.confirm.placeholder': 'Confirmar Email: (DEBE COINCIDIR ARRIBA)',
    'landing.form.email.mismatch': 'Las direcciones de email no coinciden',
    'landing.form.submit.default': 'Obtener Su Pase',
    'landing.form.submit.processing': 'Procesando...',
    'landing.pass.details': 'Detalles del Pase: {guests} huésped{guestPlural} × {days} día{dayPlural}',
    'landing.pass.preset': '(Preestablecido por el administrador)',
    'landing.disclaimer': 'DISFRUTE COMPLETAMENTE LA EXPERIENCIA DE PAGAR COMO UN LOCAL. ELOCALPASS GARANTIZA QUE NO RECIBIRÁ NINGÚN TIPO DE SPAM Y QUE SUS DATOS ESTÁN PROTEGIDOS.',
    'landing.privacy.link': 'Haga clic AQUÍ para leer el aviso de privacidad y uso de datos',
    'landing.error.fill.fields': 'Por favor complete todos los campos requeridos.',
    'landing.error.email.mismatch': 'Las direcciones de email no coinciden. Por favor verifique e intente de nuevo.',
    'landing.success.message': '¡Éxito! Su ELocalPass ha sido creado y enviado a su email.',
    'landing.error.general': 'Hubo un error al enviar su solicitud. Por favor intente de nuevo.',
    
    // Customer Portal
    'portal.welcome': 'Bienvenido a Su Portal ELocalPass',
    'portal.pass.active': 'Pase Activo',
    'portal.pass.expired': 'Pase Expirado',
    'portal.download.qr': 'Descargar Código QR',
    'portal.view.details': 'Ver Detalles',
    
    // General
    'general.loading': 'Cargando...',
    'general.error': 'Error',
    'general.success': 'Éxito',
    'general.close': 'Cerrar',
    'general.cancel': 'Cancelar',
    'general.confirm': 'Confirmar',
    'general.guest.singular': '',
    'general.guest.plural': 'es',
    'general.day.singular': '',
    'general.day.plural': 's'
  }
}

// Normalize language code to supported language
export function normalizeLangCode(langCode: string): SupportedLanguage {
  if (!langCode) return 'en'
  
  const normalized = langCode.toLowerCase().split('-')[0]
  
  // Only support Spanish, everything else defaults to English
  if (normalized === 'es') {
    return 'es'
  }
  
  return 'en' // Default to English for any other language
}

// Get translation with variable replacement
export function t(key: string, language: SupportedLanguage, variables: Record<string, string | number> = {}): string {
  const translation = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key
  
  // Replace variables in the format {variableName}
  return translation.replace(/\{(\w+)\}/g, (match, varName) => {
    const value = variables[varName]
    return value !== undefined ? String(value) : match
  })
}

// Helper function to get pluralization
export function getPlural(count: number, language: SupportedLanguage, type: 'guest' | 'day'): string {
  if (count === 1) {
    return t(`general.${type}.singular`, language)
  } else {
    return t(`general.${type}.plural`, language)
  }
}

// Detect language from browser or Accept-Language header
export function detectLanguage(source?: string): SupportedLanguage {
  if (typeof window !== 'undefined') {
    // Client-side: use browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en'
    return normalizeLangCode(browserLang)
  } else if (source) {
    // Server-side: parse Accept-Language header
    const languages = source.split(',').map(lang => {
      const [code, quality] = lang.trim().split(';q=')
      return { code: code.trim(), quality: quality ? parseFloat(quality) : 1 }
    })
    
    // Sort by quality and find first supported language
    languages.sort((a, b) => b.quality - a.quality)
    
    for (const lang of languages) {
      const normalized = normalizeLangCode(lang.code)
      if (normalized === 'es') return 'es'
    }
  }
  
  return 'en' // Default fallback
}

// Format date according to language
export function formatDate(date: Date, language: SupportedLanguage): string {
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  return date.toLocaleDateString(locale)
} 