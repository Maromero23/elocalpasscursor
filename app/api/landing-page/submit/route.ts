import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectLanguage, t, getPlural, formatDate, type SupportedLanguage } from '@/lib/translations'
import { sendEmail, createWelcomeEmailHtml } from '@/lib/email-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { qrConfigId, formData } = await request.json()

    // Validate required fields
    if (!qrConfigId || !formData?.name || !formData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get the configuration from saved configurations
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: qrConfigId }
    })

    if (!savedConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Parse configuration data
    const config = JSON.parse(savedConfig.config)
    const emailTemplates = savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null
    
    console.log(`🔍 EMAIL TEMPLATES DEBUG:`)
    console.log(`📧 Raw emailTemplates field:`, savedConfig.emailTemplates)
    console.log(`📧 Parsed emailTemplates:`, emailTemplates)
    console.log(`📧 Has welcomeEmail?:`, !!emailTemplates?.welcomeEmail)
    console.log(`📧 Has htmlContent?:`, !!emailTemplates?.welcomeEmail?.htmlContent)
    console.log(`📧 Has customHTML?:`, !!emailTemplates?.welcomeEmail?.customHTML)
    console.log(`📧 welcomeEmail structure:`, emailTemplates?.welcomeEmail)
    console.log(`📧 All emailTemplates keys:`, emailTemplates ? Object.keys(emailTemplates) : 'null')
    
    // Additional debugging for the specific fields
    if (emailTemplates?.welcomeEmail) {
      console.log(`📧 DETAILED welcomeEmail DEBUG:`)
      console.log(`  - id: ${emailTemplates.welcomeEmail.id}`)
      console.log(`  - name: ${emailTemplates.welcomeEmail.name}`)
      console.log(`  - subject: ${emailTemplates.welcomeEmail.subject}`)
      console.log(`  - content: ${emailTemplates.welcomeEmail.content ? 'present' : 'missing'}`)
      console.log(`  - customHTML: ${emailTemplates.welcomeEmail.customHTML ? 'present (' + emailTemplates.welcomeEmail.customHTML.length + ' chars)' : 'missing'}`)
      console.log(`  - htmlContent: ${emailTemplates.welcomeEmail.htmlContent ? 'present (' + emailTemplates.welcomeEmail.htmlContent.length + ' chars)' : 'missing'}`)
      console.log(`  - emailConfig.useDefaultEmail: ${emailTemplates.welcomeEmail.emailConfig?.useDefaultEmail}`)
    }

    // Validate guests and days against configuration rules
    const guests = formData.guests || config.button1GuestsDefault || 2
    const days = formData.days || config.button1DaysDefault || 3

    if (guests < 1 || guests > (config.button1GuestsRangeMax || 10)) {
      return NextResponse.json({ error: `Invalid number of guests. Must be between 1 and ${config.button1GuestsRangeMax || 10}` }, { status: 400 })
    }

    if (days < 1 || days > (config.button1DaysRangeMax || 30)) {
      return NextResponse.json({ error: `Invalid number of days. Must be between 1 and ${config.button1DaysRangeMax || 30}` }, { status: 400 })
    }

    // Calculate pricing based on configuration
    let calculatedPrice = 0
    if (config.button2PricingType === 'FIXED') {
      calculatedPrice = config.button2FixedPrice || 0
    } else if (config.button2PricingType === 'VARIABLE') {
      const basePrice = config.button2VariableBasePrice || 0
      const extraGuests = Math.max(0, guests - 1)
      const extraDays = Math.max(0, days - 1)
      const guestAmount = (config.button2VariableGuestIncrease || 0) * extraGuests
      const dayAmount = (config.button2VariableDayIncrease || 0) * extraDays
      
      calculatedPrice = basePrice + guestAmount + dayAmount
      
      // Apply commission
      const commission = config.button2VariableCommission || 0
      calculatedPrice += calculatedPrice * (commission / 100)
      
      // Apply tax if enabled
      if (config.button2IncludeTax) {
        const taxRate = config.button2TaxPercentage || 0
        calculatedPrice += calculatedPrice * (taxRate / 100)
      }
    }

    // Generate unique QR code ID
    const qrCodeId = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Set expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    // Find a seller to assign this QR to (for now, use the first seller with this configuration)
    // In a real implementation, you might want to use location-based assignment or round-robin
    const sellerWithConfig = await prisma.user.findFirst({
      where: {
        role: 'SELLER',
        savedConfigId: qrConfigId
      },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })

    if (!sellerWithConfig) {
      return NextResponse.json({ error: 'No seller available for this configuration' }, { status: 404 })
    }

    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: sellerWithConfig.id,
        customerName: formData.name,
        customerEmail: formData.email,
        guests: guests,
        days: days,
        cost: calculatedPrice,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: null // This was a landing page submission, so no additional landing URL needed
      }
    })

    // Generate magic link token for customer access
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: formData.email,
        customerName: formData.name,
        expiresAt: tokenExpiresAt
      }
    })

    // Create magic link URL
    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`

    // Prepare welcome email content using translation system
    const deliveryMethod = config.button3DeliveryMethod || 'DIRECT'
    
    // Auto-detect language from browser headers or use passed language
    const acceptLanguage = request.headers.get('accept-language') || undefined
    const customerLanguage: SupportedLanguage = formData.language || detectLanguage(acceptLanguage)
    
    console.log(`🌍 Customer language detected: ${customerLanguage}`)
    
    // Generate email content using translation system
    let emailSubject = t('email.welcome.subject', customerLanguage)
    
    const guestPlural = getPlural(guests, customerLanguage, 'guest')
    const dayPlural = getPlural(days, customerLanguage, 'day')
    const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
    
    let emailContent = `${t('email.welcome.greeting', customerLanguage, { customerName: formData.name })}

${t('email.welcome.ready', customerLanguage)}

${t('email.welcome.details.header', customerLanguage)}
${t('email.welcome.details.code', customerLanguage, { qrCode: qrCodeId })}
${t('email.welcome.details.guests', customerLanguage, { guests: guests.toString() })}
${t('email.welcome.details.days', customerLanguage, { days: days.toString() })}

${deliveryMethod === 'DIRECT' ? t('email.welcome.access.direct.header', customerLanguage) : t('email.welcome.access.portal.header', customerLanguage)}
${deliveryMethod === 'DIRECT' 
  ? t('email.welcome.access.direct.text', customerLanguage)
  : t('email.welcome.access.portal.text', customerLanguage, { magicLink: magicLinkUrl })}

${t('email.welcome.validity', customerLanguage, { expirationDate: formattedExpirationDate })}

${t('email.welcome.closing', customerLanguage)}

${t('email.welcome.signature', customerLanguage)}
`

    // Use custom email template if available (override translations)
    if (emailTemplates?.welcomeEmail) {
      const template = emailTemplates.welcomeEmail
      
      // Handle custom subject with translation
      if (template.subject) {
        emailSubject = template.subject
        
        // Translate custom subject for Spanish customers
        if (customerLanguage === 'es') {
          try {
            // Try LibreTranslate first
            const response = await fetch('https://libretranslate.com/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                q: template.subject,
                source: 'en',
                target: 'es',
                format: 'text'
              })
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.translatedText && result.translatedText.trim()) {
                emailSubject = result.translatedText
              }
            }
          } catch (error) {
            // Try MyMemory API as fallback
            try {
              const encodedText = encodeURIComponent(template.subject)
              const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`)
              
              if (response.ok) {
                const result = await response.json()
                if (result.responseData && result.responseData.translatedText) {
                  emailSubject = result.responseData.translatedText
                }
              }
            } catch {}
          }
          
          // Convert to informal Spanish (TÚ)
          emailSubject = emailSubject
            .replace(/\busted\b/gi, 'tú')
            .replace(/\bUsted\b/g, 'Tú')
            .replace(/\bsu\b/g, 'tu')
            .replace(/\bSu\b/g, 'Tu')
            .replace(/\bsus\b/g, 'tus')
            .replace(/\bSus\b/g, 'Tus')
            .replace(/\btiene\b/g, 'tienes')
            .replace(/\bTiene\b/g, 'Tienes')
            .replace(/\bpuede\b/g, 'puedes')
            .replace(/\bPuede\b/g, 'Puedes')
          
          console.log(`📧 Translated custom subject: "${template.subject}" → "${emailSubject}"`)
        }
      }
      
      if (template.content) {
        emailContent = template.content
          .replace(/\{customerName\}/g, formData.name)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, guests.toString())
          .replace(/\{days\}/g, days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{magicLink\}/g, magicLinkUrl)
      }
    }

    console.log(`📧 WELCOME EMAIL TO SEND:
To: ${formData.email}
Subject: ${emailSubject}
Language: ${customerLanguage}
Delivery Method: ${deliveryMethod}
Rebuy Email Scheduled: ${config.button5SendRebuyEmail || false}`)

    // 🚀 SEND ACTUAL WELCOME EMAIL
    let emailSent = false
    try {
      let emailHtml
      
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

      // Use custom HTML template if available, otherwise use default
      console.log(`📧 EMAIL HTML GENERATION DEBUG:`)
      console.log(`  - Checking for customHTML: ${!!emailTemplates?.welcomeEmail?.customHTML}`)
      console.log(`  - Checking for htmlContent: ${!!emailTemplates?.welcomeEmail?.htmlContent}`)
      
      if (emailTemplates?.welcomeEmail?.customHTML || (emailTemplates?.welcomeEmail?.htmlContent && emailTemplates.welcomeEmail.htmlContent !== 'USE_DEFAULT_TEMPLATE')) {
        // Use custom HTML template from QR configuration
        const customTemplate = emailTemplates.welcomeEmail.customHTML || emailTemplates.welcomeEmail.htmlContent
        console.log(`📧 USING CUSTOM HTML TEMPLATE - Length: ${customTemplate.length} chars`)
        console.log(`📧 First 200 chars of custom template: ${customTemplate.substring(0, 200)}...`)
        
        let processedTemplate = customTemplate
          .replace(/\{customerName\}/g, formData.name)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, guests.toString())
          .replace(/\{days\}/g, days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{magicLink\}/g, magicLinkUrl || '')
          .replace(/\{customerPortalUrl\}/g, magicLinkUrl || '')
        
        // Apply universal email translation for Spanish customers
        emailHtml = await translateEmailHTML(processedTemplate, customerLanguage)
        console.log(`📧 Using custom HTML template from QR configuration (translated for ${customerLanguage})`)
      } else {
        console.log(`📧 NO CUSTOM HTML FOUND - Using default template`)
        // Use default HTML template
        emailHtml = createWelcomeEmailHtml({
          customerName: formData.name,
          qrCode: qrCodeId,
          guests: guests,
          days: days,
          expiresAt: formattedExpirationDate,
          customerPortalUrl: deliveryMethod !== 'DIRECT' ? magicLinkUrl : undefined,
          language: customerLanguage,
          deliveryMethod: deliveryMethod
        })
        console.log(`📧 Generated default email HTML - Length: ${emailHtml.length} chars`)
      }

      // Send the email (now throws errors instead of returning false)
      await sendEmail({
        to: formData.email,
        subject: emailSubject,
        html: emailHtml
      })

      emailSent = true
      console.log(`✅ Welcome email sent successfully to ${formData.email}`)
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
    }

    // Schedule rebuy email if enabled
    if (config.button5SendRebuyEmail) {
      console.log(`📧 Rebuy email will be scheduled for ${formData.email} when QR expires on ${expiresAt.toLocaleDateString()}`)
    }

    return NextResponse.json({ 
      success: true, 
      qrCodeId: qrCode.id,
      message: t('landing.success.message', customerLanguage),
      deliveryMethod: deliveryMethod,
      magicLink: deliveryMethod !== 'DIRECT' ? magicLinkUrl : undefined,
      emailSent: emailSent
    })

  } catch (error) {
    console.error('Error submitting landing page form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
