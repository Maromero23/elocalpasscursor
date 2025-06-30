// Production-ready email service for ELocalPass
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

// Email service configuration
const getEmailTransporter = () => {
  // Check which email service is configured (prioritize SendGrid, then Resend)
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid configuration (CURRENT WORKING)
    console.log('📧 Using SendGrid email service')
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else if (process.env.RESEND_API_KEY) {
    // Resend configuration (RECOMMENDED)
    console.log('📧 Using Resend email service')
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  } else if (process.env.SENDGRID_API_KEY) {
    // SendGrid configuration
    console.log('📧 Using SendGrid email service')
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else {
    // Try multiple SMTP services as fallback
    console.log('📧 Using fallback SMTP email service')
    
    // If we have Outlook credentials, use those
    if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS) {
      console.log('📧 Using Outlook SMTP')
      return nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASS,
        },
      })
    }
    
    // Gmail SMTP (if configured)
    console.log('📧 Using Gmail/SMTP email service')
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || process.env.GMAIL_USER,
        pass: (process.env.EMAIL_PASS || process.env.GMAIL_PASS || '').replace(/\s/g, ''),
      },
    })
  }
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter()
    
    // Use different from address based on email service
    let fromAddress = options.from || process.env.FROM_EMAIL
    
    // Use verified sender address based on service
    if (process.env.SENDGRID_API_KEY) {
      fromAddress = process.env.EMAIL_FROM_ADDRESS || 'maromas23@hotmail.com'
    } else if (process.env.RESEND_API_KEY) {
      fromAddress = 'ELocalPass <onboarding@resend.dev>'
    } else if (!fromAddress) {
      fromAddress = process.env.EMAIL_FROM_ADDRESS || 'info@elocalpass.com'
    }
    
    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    console.log(`📧 Sending email to: ${options.to}`)
    console.log(`📧 Subject: ${options.subject}`)
    console.log(`📧 Service: ${getEmailServiceName()}`)
    console.log(`📧 From: ${mailOptions.from}`)
    console.log(`📧 User: ${process.env.GMAIL_USER || process.env.EMAIL_USER}`)
    console.log(`📧 Pass length: ${(process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').replace(/\s/g, '').length}`)
    
    const result = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent successfully: ${result.messageId}`)
    return true
    
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    // Re-throw the error so it can be caught by the caller
    throw error
  }
}

const getEmailServiceName = (): string => {
  if (process.env.SENDGRID_API_KEY) return 'SendGrid'
  if (process.env.RESEND_API_KEY) return 'Resend'
  if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS) return 'Outlook'
  return 'Gmail/SMTP'
}

// Email templates for production
export const createWelcomeEmailHtml = (data: {
  customerName: string
  qrCode: string
  guests: number
  days: number
  expiresAt: string
  customerPortalUrl?: string
  language: string
  deliveryMethod: string
}) => {
  const isSpanish = data.language === 'es'
  
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .qr-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #667eea; }
      .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isSpanish ? 'Tu ELocalPass está listo' : 'Your ELocalPass is Ready'}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ${isSpanish ? 'Tu ELocalPass está listo!' : 'Your ELocalPass is Ready!'}</h1>
        </div>
        
        <div class="content">
          <p>${isSpanish ? `¡Hola ${data.customerName}!` : `Hello ${data.customerName}!`}</p>
          
          <p>${isSpanish ? 'Tu pase local ha sido creado exitosamente.' : 'Your local pass has been created successfully.'}</p>
          
          <div class="details">
            <h3>📋 ${isSpanish ? 'DETALLES DEL PASE' : 'PASS DETAILS'}</h3>
            <ul>
              <li><strong>${isSpanish ? 'Código' : 'Code'}:</strong> ${data.qrCode}</li>
              <li><strong>${isSpanish ? 'Huéspedes' : 'Guests'}:</strong> ${data.guests} ${isSpanish ? 'personas' : 'people'}</li>
              <li><strong>${isSpanish ? 'Válido por' : 'Valid for'}:</strong> ${data.days} ${isSpanish ? 'días' : 'days'}</li>
              <li><strong>${isSpanish ? 'Válido hasta' : 'Valid until'}:</strong> ${data.expiresAt}</li>
            </ul>
          </div>
          
          ${data.customerPortalUrl ? `
            <div class="qr-section">
              <h3>📱 ${isSpanish ? 'PORTAL DEL CLIENTE' : 'CUSTOMER PORTAL'}</h3>
              <p>${isSpanish ? 'Accede a tu código QR en cualquier momento:' : 'Access your QR code anytime:'}</p>
              <a href="${data.customerPortalUrl}" class="button">
                ${isSpanish ? 'Ver Mi Pase' : 'View My Pass'}
              </a>
            </div>
          ` : `
            <div class="qr-section">
              <h3>🎯 ${isSpanish ? 'ACCESO DIRECTO' : 'DIRECT ACCESS'}</h3>
              <p>${isSpanish ? 'Este código te da acceso inmediato a tu experiencia local.' : 'This code gives you immediate access to your local experience.'}</p>
              <p>${isSpanish ? 'Simplemente muestra este código QR en el punto de acceso.' : 'Simply show this QR code at the access point.'}</p>
            </div>
          `}
          
          <div class="footer">
            <p>${isSpanish ? '¡Esperamos que disfrutes tu experiencia local!' : 'We hope you enjoy your local experience!'}</p>
            <p>${isSpanish ? 'Saludos,' : 'Best regards,'}<br>
            ${isSpanish ? 'El Equipo de ELocalPass' : 'The ELocalPass Team'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Create rebuy email HTML template
export const createRebuyEmailHtml = (data: {
  customerName: string
  qrCode: string
  guests: number
  days: number
  hoursLeft: number
  customerPortalUrl?: string
  language: string
  rebuyUrl?: string
}) => {
  const isSpanish = data.language === 'es'
  
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .urgency-section { background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #dc2626; text-align: center; }
      .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .cta-button { display: inline-block; background: #dc2626; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-size: 18px; font-weight: bold; }
      .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
      .timer { font-size: 24px; font-weight: bold; color: #dc2626; }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isSpanish ? '¡Tu ELocalPass expira pronto!' : 'Your ELocalPass Expires Soon!'}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ ${isSpanish ? '¡No dejes que termine tu aventura local!' : 'Don\'t Let Your Local Adventure End!'}</h1>
        </div>
        
        <div class="content">
          <p>${isSpanish ? `¡Hola ${data.customerName}!` : `Hello ${data.customerName}!`}</p>
          
          <div class="urgency-section">
            <h2>🚨 ${isSpanish ? '¡TIEMPO LIMITADO!' : 'TIME RUNNING OUT!'}</h2>
            <div class="timer">${data.hoursLeft} ${isSpanish ? 'horas restantes' : 'hours left'}</div>
            <p>${isSpanish ? 'Tu ELocalPass expira pronto. ¡No pierdas tus descuentos locales!' : 'Your ELocalPass expires soon. Don\'t lose your local discounts!'}</p>
          </div>
          
          <div class="details">
            <h3>📋 ${isSpanish ? 'TU PASE ACTUAL' : 'YOUR CURRENT PASS'}</h3>
            <ul>
              <li><strong>${isSpanish ? 'Código' : 'Code'}:</strong> ${data.qrCode}</li>
              <li><strong>${isSpanish ? 'Huéspedes' : 'Guests'}:</strong> ${data.guests} ${isSpanish ? 'personas' : 'people'}</li>
              <li><strong>${isSpanish ? 'Duración' : 'Duration'}:</strong> ${data.days} ${isSpanish ? 'días' : 'days'}</li>
              <li><strong>${isSpanish ? 'Tiempo restante' : 'Time left'}:</strong> ${data.hoursLeft} ${isSpanish ? 'horas' : 'hours'}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; margin-bottom: 20px;">
              ${isSpanish ? '¡Continúa disfrutando de experiencias locales increíbles!' : 'Keep enjoying amazing local experiences!'}
            </p>
            
            ${data.rebuyUrl ? `
              <a href="${data.rebuyUrl}" class="cta-button">
                🎯 ${isSpanish ? 'OBTENER OTRO PASE' : 'GET ANOTHER PASS'}
              </a>
            ` : `
              ${data.customerPortalUrl ? `
                <a href="${data.customerPortalUrl}" class="cta-button">
                  🎯 ${isSpanish ? 'RENOVAR MI PASE' : 'RENEW MY PASS'}
                </a>
              ` : ''}
            `}
          </div>
          
          <div class="details">
            <h4>💡 ${isSpanish ? '¿Por qué renovar?' : 'Why renew?'}</h4>
            <ul>
              <li>${isSpanish ? '✅ Continúa ahorrando en restaurantes locales' : '✅ Keep saving at local restaurants'}</li>
              <li>${isSpanish ? '✅ Acceso a descuentos exclusivos' : '✅ Access to exclusive discounts'}</li>
              <li>${isSpanish ? '✅ Descubre nuevos lugares increíbles' : '✅ Discover amazing new places'}</li>
              <li>${isSpanish ? '✅ Experiencias auténticas como un local' : '✅ Authentic experiences like a local'}</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>${isSpanish ? '¡Gracias por elegir ELocalPass!' : 'Thank you for choosing ELocalPass!'}</p>
            <p>${isSpanish ? 'Tu socio en experiencias locales' : 'Your local experience partner'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

interface WelcomeEmailData {
  customerName: string
  customerEmail: string
  qrCode: string
  guests: number
  days: number
  expiresAt: Date
  magicLinkUrl: string
  customerLanguage: 'en' | 'es'
  deliveryMethod: string
  savedConfigId: string
}

export async function sendWelcomeEmailWithTemplates(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
    type SupportedLanguage = 'en' | 'es'
    
    const formattedExpirationDate = formatDate(data.expiresAt, data.customerLanguage)
    const subject = t('email.welcome.subject', data.customerLanguage)

    // Get email templates from saved configuration
    let emailTemplates = null
    if (data.savedConfigId) {
      const savedConfig = await prisma.savedQRConfiguration.findUnique({
        where: { id: data.savedConfigId },
        select: { emailTemplates: true }
      })
      
      // Parse email templates JSON
      if (savedConfig?.emailTemplates) {
        try {
          emailTemplates = typeof savedConfig.emailTemplates === 'string' 
            ? JSON.parse(savedConfig.emailTemplates) 
            : savedConfig.emailTemplates
        } catch (error) {
          console.log('Error parsing email templates:', error)
        }
      }
    }

    // Professional Email Translation System
    const translateEmailHTML = async (htmlContent: string, targetLanguage: SupportedLanguage): Promise<string> => {
      if (targetLanguage === 'en') return htmlContent
      
      console.log(`🌍 EMAIL TRANSLATION: Translating email HTML to ${targetLanguage}`)
      
      // Extract text content from HTML while preserving structure
      let translatedHTML = htmlContent
      
      // Function to translate text using professional APIs
      const translateText = async (text: string): Promise<string> => {
        if (!text || text.trim().length === 0) return text
        
        console.log(`🔄 Email Translation - Input: "${text.substring(0, 100)}..."`)
        
        let translatedText = text
        let translationSuccessful = false
        
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
            if (result.translatedText && result.translatedText.trim()) {
              translatedText = result.translatedText
              translationSuccessful = true
              console.log(`✅ Email LibreTranslate success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
            }
          }
        } catch (error) {
          console.warn('⚠️ Email LibreTranslate failed, trying MyMemory API...')
        }
        
        // Fallback to MyMemory API if LibreTranslate failed
        if (!translationSuccessful) {
          try {
            const encodedText = encodeURIComponent(text)
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`)
            
            if (response.ok) {
              const result = await response.json()
              if (result.responseData && result.responseData.translatedText && result.responseData.translatedText.trim()) {
                translatedText = result.responseData.translatedText
                translationSuccessful = true
                console.log(`✅ Email MyMemory success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
              }
            }
          } catch (error) {
            console.warn('⚠️ Email MyMemory API also failed')
          }
        }
        
        // If both APIs failed, keep original text
        if (!translationSuccessful) {
          console.warn(`⚠️ Both email translation APIs failed for: "${text.substring(0, 50)}...", keeping original`)
        }
        
        return translatedText
      }
      
      // Convert formal Spanish (USTED) to informal Spanish (TÚ)
      const makeInformalSpanish = (spanish: string): string => {
        console.log(`🔄 Email Converting to informal Spanish (TÚ): "${spanish.substring(0, 100)}..."`)
        
        let informalText = spanish
        
        // Convert formal pronouns to informal
        informalText = informalText.replace(/\busted\b/gi, 'tú')
        informalText = informalText.replace(/\bUsted\b/g, 'Tú')
        
        // Convert possessive pronouns
        informalText = informalText.replace(/\bsu\b/g, 'tu')
        informalText = informalText.replace(/\bSu\b/g, 'Tu')
        informalText = informalText.replace(/\bsus\b/g, 'tus')
        informalText = informalText.replace(/\bSus\b/g, 'Tus')
        
        // Convert common formal verb forms to informal
        informalText = informalText.replace(/\btiene\b/g, 'tienes')
        informalText = informalText.replace(/\bTiene\b/g, 'Tienes')
        informalText = informalText.replace(/\bpuede\b/g, 'puedes')
        informalText = informalText.replace(/\bPuede\b/g, 'Puedes')
        informalText = informalText.replace(/\bquiere\b/g, 'quieres')
        informalText = informalText.replace(/\bQuiere\b/g, 'Quieres')
        informalText = informalText.replace(/\bnecesita\b/g, 'necesitas')
        informalText = informalText.replace(/\bNecesita\b/g, 'Necesitas')
        informalText = informalText.replace(/\bdebe\b/g, 'debes')
        informalText = informalText.replace(/\bDebe\b/g, 'Debes')
        informalText = informalText.replace(/\bestá\b/g, 'estás')
        informalText = informalText.replace(/\bEstá\b/g, 'Estás')
        
        return informalText
      }
      
      // Extract and translate text content from HTML
      // This regex finds text content between HTML tags
      const textPattern = />([^<]+)</g
      let match
      while ((match = textPattern.exec(htmlContent)) !== null) {
        const originalText = match[1].trim()
        if (originalText && originalText.length > 0 && !/^[0-9\s\-\(\)\[\]{}@.,:;!?]+$/.test(originalText)) {
          const translatedText = await translateText(originalText)
          const informalText = makeInformalSpanish(translatedText)
          translatedHTML = translatedHTML.replace(`>${originalText}<`, `>${informalText}<`)
        }
      }
      
      // Also translate alt attributes and title attributes
      const altPattern = /alt="([^"]+)"/g
      let altMatch
      while ((altMatch = altPattern.exec(htmlContent)) !== null) {
        const originalAlt = altMatch[1]
        if (originalAlt && originalAlt.length > 0) {
          const translatedAlt = await translateText(originalAlt)
          const informalAlt = makeInformalSpanish(translatedAlt)
          translatedHTML = translatedHTML.replace(`alt="${originalAlt}"`, `alt="${informalAlt}"`)
        }
      }
      
      console.log(`✅ Email HTML translation completed for ${targetLanguage}`)
      return translatedHTML
    }

    let emailHtml
    let emailSubject = subject
    
    // Use custom HTML template if available, otherwise use default
    if (emailTemplates?.welcomeEmail?.customHTML && emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
      // Use custom HTML template from QR configuration
      const customTemplate = emailTemplates.welcomeEmail.customHTML
      
      let processedTemplate = customTemplate
        .replace(/\{customerName\}/g, data.customerName)
        .replace(/\{qrCode\}/g, data.qrCode)
        .replace(/\{guests\}/g, data.guests.toString())
        .replace(/\{days\}/g, data.days.toString())
        .replace(/\{expirationDate\}/g, formattedExpirationDate)
        .replace(/\{magicLink\}/g, data.magicLinkUrl || '')
        .replace(/\{customerPortalUrl\}/g, data.magicLinkUrl || '')
      
      // Apply universal email translation for Spanish customers
      emailHtml = await translateEmailHTML(processedTemplate, data.customerLanguage)
      
      // Use custom subject if available
      if (emailTemplates.welcomeEmail.subject) {
        emailSubject = emailTemplates.welcomeEmail.subject
      }
      
      console.log(`📧 Using custom HTML template from QR configuration (translated for ${data.customerLanguage})`)
    } else if (emailTemplates?.welcomeEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
      console.log(`📧 USE_DEFAULT_TEMPLATE detected - Loading actual default template`)
      
      // Load the actual default template from database
      try {
        const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { isDefault: true }
        })
        
        if (defaultTemplate && defaultTemplate.customHTML) {
          console.log(`📧 FOUND DEFAULT TEMPLATE in database - Length: ${defaultTemplate.customHTML.length} chars`)
          
          let processedTemplate = defaultTemplate.customHTML
            .replace(/\{customerName\}/g, data.customerName)
            .replace(/\{qrCode\}/g, data.qrCode)
            .replace(/\{guests\}/g, data.guests.toString())
            .replace(/\{days\}/g, data.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{magicLink\}/g, data.magicLinkUrl || '')
            .replace(/\{customerPortalUrl\}/g, data.magicLinkUrl || '')
          
          // Apply universal email translation for Spanish customers
          emailHtml = await translateEmailHTML(processedTemplate, data.customerLanguage)
          
          // Use default template subject
          if (defaultTemplate.subject) {
            emailSubject = defaultTemplate.subject
          }
          
          console.log(`📧 Using DEFAULT template from database (translated for ${data.customerLanguage})`)
        } else {
          console.log(`⚠️ No default template found in database, falling back to generic template`)
          
          // Fallback to generic template
          emailHtml = createWelcomeEmailHtml({
            customerName: data.customerName,
            qrCode: data.qrCode,
            guests: data.guests,
            days: data.days,
            expiresAt: formattedExpirationDate,
            customerPortalUrl: data.magicLinkUrl,
            language: data.customerLanguage,
            deliveryMethod: data.deliveryMethod
          })
          console.log(`📧 Generated fallback HTML template`)
        }
      } catch (error) {
        console.error('❌ Error loading default template from database:', error)
        
        // Fallback to generic template
        emailHtml = createWelcomeEmailHtml({
          customerName: data.customerName,
          qrCode: data.qrCode,
          guests: data.guests,
          days: data.days,
          expiresAt: formattedExpirationDate,
          customerPortalUrl: data.magicLinkUrl,
          language: data.customerLanguage,
          deliveryMethod: data.deliveryMethod
        })
        console.log(`📧 Generated error fallback HTML template`)
      }
    } else {
      // Use generic default HTML template
      emailHtml = createWelcomeEmailHtml({
        customerName: data.customerName,
        qrCode: data.qrCode,
        guests: data.guests,
        days: data.days,
        expiresAt: formattedExpirationDate,
        customerPortalUrl: data.magicLinkUrl,
        language: data.customerLanguage,
        deliveryMethod: data.deliveryMethod
      })
      console.log(`📧 Using generic default HTML template`)
    }

    // Send the email
    const emailSent = await sendEmail({
      to: data.customerEmail,
      subject: emailSubject,
      html: emailHtml
    })

    if (emailSent) {
      console.log(`✅ Welcome email sent successfully to ${data.customerEmail}`)
    } else {
      console.error(`❌ Failed to send welcome email to ${data.customerEmail}`)
    }

    return emailSent
  } catch (error) {
    console.error('❌ Error in sendWelcomeEmailWithTemplates:', error)
    return false
  }
}