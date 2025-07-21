import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { detectLanguage, t, getPlural, formatDate, type SupportedLanguage } from '@/lib/translations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    const { clientName, clientEmail, guests, days, deliveryMethod, scheduledFor } = body
    
    // Validate required fields
    if (!clientName || !clientEmail || !guests || !days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get seller info and configuration
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        savedConfigId: true,
        configurationName: true 
      }
    })
    
    if (!seller?.savedConfigId) {
      return NextResponse.json(
        { error: 'No configuration assigned to seller' },
        { status: 400 }
      )
    }
    
    // Get the saved QR configuration that this seller is paired to
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: {
        id: seller.savedConfigId
      }
    })
    
    if (!savedConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 400 }
      )
    }
    
    // Parse the configuration JSON
    const config = JSON.parse(savedConfig.config)
    
    // Validate delivery method based on configuration
    const requestedDelivery = deliveryMethod || config.button3DeliveryMethod
    
    if (config.button3DeliveryMethod === 'DIRECT' && requestedDelivery !== 'DIRECT') {
      return NextResponse.json(
        { error: 'Only direct delivery allowed for this configuration' },
        { status: 400 }
      )
    }
    
    if (config.button3DeliveryMethod === 'URLS' && requestedDelivery !== 'URLS') {
      return NextResponse.json(
        { error: 'Only URL delivery allowed for this configuration' },
        { status: 400 }
      )
    }
    
    if (config.button3DeliveryMethod === 'BOTH' && !['DIRECT', 'URLS'].includes(requestedDelivery)) {
      return NextResponse.json(
        { error: 'Invalid delivery method. Must be DIRECT or URLS' },
        { status: 400 }
      )
    }
    
    // Calculate pricing (Button 2) - Hidden from seller
    let calculatedPrice = 0
    if (config.button2PricingType === 'FIXED') {
      calculatedPrice = config.button2FixedPrice || 0
    } else if (config.button2PricingType === 'VARIABLE') {
      // Variable pricing: base + (guest increase * extra guests) + (day increase * extra days)
      const basePrice = config.button2VariableBasePrice || 0
      const extraGuests = Math.max(0, guests - 1) // Assuming first guest is included in base
      const extraDays = Math.max(0, days - 1) // Assuming first day is included in base
      const guestPrice = (config.button2VariableGuestIncrease || 0) * extraGuests
      const dayPrice = (config.button2VariableDayIncrease || 0) * extraDays
      calculatedPrice = basePrice + guestPrice + dayPrice
      
      // Add commission if configured
      if (config.button2VariableCommission > 0) {
        calculatedPrice += config.button2VariableCommission
      }
      
      // Add tax if configured
      if (config.button2IncludeTax && config.button2TaxPercentage > 0) {
        calculatedPrice += calculatedPrice * (config.button2TaxPercentage / 100)
      }
    }
    
    // Generate unique QR code
    const qrCodeId = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)
    
    // Get seller details with location and distributor info for analytics
    const sellerDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })

    // Store QR record with calculated price (hidden from seller)
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: session.user.id,
        customerName: clientName,
        customerEmail: clientEmail,
        guests: guests,
        days: days,
        cost: calculatedPrice, // Hidden pricing stored
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: requestedDelivery === 'DIRECT' ? null : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/landing/${qrCodeId}`
      }
    })
    
    // Generate magic link token for customer access
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: clientEmail,
        customerName: clientName,
        expiresAt: tokenExpiresAt
      }
    })

    // Create magic link URL
    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`
    
    // Calculate revenue breakdown for analytics
    const basePrice = config.button2PricingType === 'FIXED' 
      ? config.button2FixedPrice || 0 
      : config.button2VariableBasePrice || 0
    
    const extraGuests = Math.max(0, guests - 1)
    const extraDays = Math.max(0, days - 1)
    const guestAmount = config.button2PricingType === 'VARIABLE' 
      ? (config.button2VariableGuestIncrease || 0) * extraGuests 
      : 0
    const dayAmount = config.button2PricingType === 'VARIABLE' 
      ? (config.button2VariableDayIncrease || 0) * extraDays 
      : 0
    const commissionAmount = config.button2PricingType === 'VARIABLE' 
      ? config.button2VariableCommission || 0 
      : 0
    const taxAmount = config.button2IncludeTax && config.button2TaxPercentage > 0
      ? calculatedPrice * (config.button2TaxPercentage / 100)
      : 0
    
    // Create comprehensive analytics record
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        
        // Customer Information
        customerName: clientName,
        customerEmail: clientEmail,
        
        // QR Code Details
        guests: guests,
        days: days,
        cost: calculatedPrice,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: requestedDelivery,
        language: 'en',
        
        // Seller Information
        sellerId: session.user.id,
        sellerName: sellerDetails?.name,
        sellerEmail: sellerDetails?.email || '',
        
        // Location Information
        locationId: sellerDetails?.locationId,
        locationName: sellerDetails?.location?.name,
        
        // Distributor Information
        distributorId: sellerDetails?.location?.distributorId,
        distributorName: sellerDetails?.location?.distributor?.name,
        
        // Configuration Information
        configurationId: seller.savedConfigId,
        configurationName: seller.configurationName,
        pricingType: config.button2PricingType,
        fixedPrice: config.button2PricingType === 'FIXED' ? config.button2FixedPrice : null,
        variableBasePrice: config.button2PricingType === 'VARIABLE' ? config.button2VariableBasePrice : null,
        variableGuestIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableGuestIncrease : null,
        variableDayIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableDayIncrease : null,
        variableCommission: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission : null,
        includeTax: config.button2IncludeTax || false,
        taxPercentage: config.button2TaxPercentage,
        
        // Revenue Breakdown
        baseAmount: basePrice,
        guestAmount: guestAmount,
        dayAmount: dayAmount,
        commissionAmount: commissionAmount,
        taxAmount: taxAmount,
        totalAmount: calculatedPrice,
        
        // Tracking & Analytics
        landingUrl: qrCode.landingUrl,
        magicLinkUrl: magicLinkUrl,
        welcomeEmailSent: false, // Will be updated when email is actually sent
        rebuyEmailScheduled: config.button5SendRebuyEmail || false
      }
    })
    
    // Button 4: Welcome Email Template Logic
    // For direct seller generation, we don't know customer's language yet
    // We'll use a special magic link that detects language when customer clicks it
    const customerLanguage: SupportedLanguage = 'en' // Default to English for seller generation
    
    console.log(`🌍 Seller generation - Using default language: ${customerLanguage} (customer language will be detected when they access the email)`)
    
    // Generate email content using translation system
    const subject = t('email.welcome.subject', customerLanguage)
    
    const guestPlural = getPlural(guests, customerLanguage, 'guest')
    const dayPlural = getPlural(days, customerLanguage, 'day')
    const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
    
    const emailContent = `${t('email.welcome.greeting', customerLanguage, { customerName: clientName })}

${t('email.welcome.ready', customerLanguage)}

${t('email.welcome.details.header', customerLanguage)}
${t('email.welcome.details.code', customerLanguage, { qrCode: qrCodeId })}
${t('email.welcome.details.guests', customerLanguage, { guests: guests.toString() })}
${t('email.welcome.details.days', customerLanguage, { days: days.toString() })}

${t('email.welcome.access.direct.header', customerLanguage)}
${t('email.welcome.access.direct.text', customerLanguage)}

${t('email.welcome.access.portal.header', customerLanguage)}
${t('email.welcome.access.portal.text', customerLanguage, { magicLink: magicLinkUrl })}

${t('email.welcome.validity', customerLanguage, { expirationDate: formattedExpirationDate })}

${t('email.welcome.closing', customerLanguage)}

${t('email.welcome.signature', customerLanguage)}
`
    
    // Button 5: Rebuy Email Logic (Hidden from seller)
    const shouldSendRebuyEmail = config.button5SendRebuyEmail
    let rebuyEmailScheduled = false
    
    if (shouldSendRebuyEmail) {
      console.log(`📧 REBUY EMAIL: Enabled for ${clientEmail} - QR expires on ${expiresAt.toLocaleDateString()}`)
      console.log(`📧 REBUY EMAIL: Will be automatically sent 6-12 hours before expiration via scheduled service`)
      console.log(`📧 REBUY EMAIL: Customer will receive renewal reminder with portal access`)
      rebuyEmailScheduled = true
      
      // The rebuy email will be sent automatically by the scheduled service at:
      // /api/rebuy-emails/send which runs periodically and checks for QR codes
      // expiring within 6-12 hours that have rebuy emails enabled
    } else {
      console.log(`❌ REBUY EMAIL: Disabled for this configuration`)
    }
    
    // Update analytics record with correct rebuyEmailScheduled value
    await prisma.qRCodeAnalytics.updateMany({
      where: { qrCodeId: qrCode.id },
      data: { rebuyEmailScheduled: rebuyEmailScheduled }
    })
    
    // Check if this is a scheduled QR code (2 minutes minimum buffer)
    const isScheduled = scheduledFor && new Date(scheduledFor) >= new Date(Date.now() + 2 * 60 * 1000)
    
    // Validate that scheduled time is at least 2 minutes in the future
    if (scheduledFor && new Date(scheduledFor) < new Date(Date.now() + 2 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Scheduled time must be at least 2 minutes in the future' },
        { status: 400 }
      )
    }
    
    if (isScheduled) {
      // Don't create QR code yet - just store the scheduling info
      const scheduledQR = await prisma.scheduledQRCode.create({
        data: {
          scheduledFor: new Date(scheduledFor),
          clientName,
          clientEmail,
          guests,
          days,
          sellerId: session.user.id,
          configurationId: seller.savedConfigId,
          deliveryMethod: requestedDelivery,
          landingPageId: body.landingPageId || null,
          isProcessed: false
        }
      })
      
      // Delete the QR code we created since we don't need it yet
      await prisma.qRCode.delete({
        where: { id: qrCode.id }
      })
      
      // Delete the analytics record too
      await prisma.qRCodeAnalytics.deleteMany({
        where: { qrCodeId: qrCode.id }
      })
      
      // Delete the access token too
      await prisma.customerAccessToken.deleteMany({
        where: { qrCodeId: qrCode.id }
      })
      
      console.log(`📅 QR code creation scheduled for ${new Date(scheduledFor).toLocaleString()}`)
      
      // If this is a scheduled QR, schedule exact-time processing with QStash
      if (scheduledFor && scheduledFor.trim().length > 0) {
        const scheduledDateTime = new Date(scheduledFor)
        const delay = scheduledDateTime.getTime() - Date.now()
        
        if (delay > 0 && process.env.QSTASH_TOKEN) {
          try {
            // Schedule exact processing with Upstash QStash V2
            const qstashResponse = await fetch(`https://qstash.upstash.io/v2/publish/${process.env.NEXTAUTH_URL}/api/scheduled-qr/process-single`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
                'Content-Type': 'application/json',
                'Upstash-Delay': `${delay}ms`
              },
              body: JSON.stringify({
                scheduledQRId: scheduledQR.id
              })
            })
            
            if (qstashResponse.ok) {
              const qstashData = await qstashResponse.json()
              console.log(`📅 SCHEDULED QR: QStash job created for exact time: ${scheduledDateTime}`)
              console.log(`🆔 QStash Message ID: ${qstashData.messageId}`)
            } else {
              console.error('❌ QStash scheduling failed:', await qstashResponse.text())
            }
          } catch (qstashError) {
            console.error('❌ QStash error:', qstashError)
            // Fallback: could still rely on periodic checking
          }
        } else if (delay > 0) {
          console.log(`📅 SCHEDULED QR: QStash token not configured, relying on periodic processing`)
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `QR code scheduled to be created and sent on ${new Date(scheduledFor).toLocaleString()}`,
        scheduled: true,
        scheduledFor: scheduledFor,
        scheduledId: scheduledQR.id,
        emailSent: false
      })
    }
    
    // 🚀 SEND ACTUAL WELCOME EMAIL (only if not scheduled)
    let emailSent = false
    try {
      // Import email service
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      
      // Get email templates from saved configuration
      let emailTemplates = null
      if (seller.savedConfigId) {
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: seller.savedConfigId },
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
      
      // Professional Email Translation System (same as landing page)
      const translateEmailHTML = async (htmlContent: string, targetLanguage: SupportedLanguage): Promise<string> => {
        if (targetLanguage === 'en') return htmlContent
        
        console.log(`🌍 SELLER EMAIL TRANSLATION: Translating email HTML to ${targetLanguage}`)
        
        // Extract text content from HTML while preserving structure
        let translatedHTML = htmlContent
        
        // Function to translate text using professional APIs
        const translateText = async (text: string): Promise<string> => {
          if (!text || text.trim().length === 0) return text
          
          console.log(`🔄 Seller Email Translation - Input: "${text.substring(0, 100)}..."`)
          
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
                console.log(`✅ Seller Email LibreTranslate success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
              }
            }
          } catch (error) {
            console.warn('⚠️ Seller Email LibreTranslate failed, trying MyMemory API...')
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
                  console.log(`✅ Seller Email MyMemory success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
                }
              }
            } catch (error) {
              console.warn('⚠️ Seller Email MyMemory API also failed')
            }
          }
          
          // If both APIs failed, keep original text
          if (!translationSuccessful) {
            console.warn(`⚠️ Both seller email translation APIs failed for: "${text.substring(0, 50)}...", keeping original`)
          }
          
          return translatedText
        }
        
        // Convert formal Spanish (USTED) to informal Spanish (TÚ)
        const makeInformalSpanish = (spanish: string): string => {
          console.log(`🔄 Seller Email Converting to informal Spanish (TÚ): "${spanish.substring(0, 100)}..."`)
          
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
        
        console.log(`✅ Seller Email HTML translation completed for ${targetLanguage}`)
        return translatedHTML
      }

      let emailHtml
      let emailSubject = subject
      
      // Use custom HTML template if available, otherwise use default
      if (emailTemplates?.welcomeEmail?.customHTML && emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
        // Use custom HTML template from QR configuration
        const customTemplate = emailTemplates.welcomeEmail.customHTML
        
        let processedTemplate = customTemplate
          .replace(/\{customerName\}/g, clientName)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, guests.toString())
          .replace(/\{days\}/g, days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{magicLink\}/g, magicLinkUrl || '')
          .replace(/\{customerPortalUrl\}/g, magicLinkUrl || '')
        
        // Apply universal email translation for Spanish customers
        emailHtml = await translateEmailHTML(processedTemplate, customerLanguage)
        
        // Use custom subject if available
        if (emailTemplates.welcomeEmail.subject) {
          emailSubject = emailTemplates.welcomeEmail.subject
        }
        
        console.log(`📧 Using custom HTML template from QR configuration (translated for ${customerLanguage})`)
      } else if (emailTemplates?.welcomeEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
        console.log(`📧 USE_DEFAULT_TEMPLATE detected - Loading actual default template`)
        
        // Load the actual default template from database
        try {
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          
          const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
            where: { isDefault: true }
          })
          
          if (defaultTemplate && defaultTemplate.customHTML) {
            console.log(`📧 FOUND DEFAULT TEMPLATE in database - Length: ${defaultTemplate.customHTML.length} chars`)
            
            let processedTemplate = defaultTemplate.customHTML
              .replace(/\{customerName\}/g, clientName)
              .replace(/\{qrCode\}/g, qrCodeId)
              .replace(/\{guests\}/g, guests.toString())
              .replace(/\{days\}/g, days.toString())
              .replace(/\{expirationDate\}/g, formattedExpirationDate)
              .replace(/\{magicLink\}/g, magicLinkUrl || '')
              .replace(/\{customerPortalUrl\}/g, magicLinkUrl || '')
            
            // Apply universal email translation for Spanish customers
            emailHtml = await translateEmailHTML(processedTemplate, customerLanguage)
            
            // Use default template subject
            if (defaultTemplate.subject) {
              emailSubject = defaultTemplate.subject
            }
            
            console.log(`📧 Using DEFAULT template from database (translated for ${customerLanguage})`)
            
            await prisma.$disconnect()
          } else {
            console.log(`⚠️ No default template found in database, falling back to generic template`)
            await prisma.$disconnect()
            
            // Fallback to generic template
            emailHtml = createWelcomeEmailHtml({
              customerName: clientName,
              qrCode: qrCodeId,
              guests: guests,
              days: days,
              expiresAt: formattedExpirationDate,
              customerPortalUrl: magicLinkUrl,
              language: customerLanguage,
              deliveryMethod: requestedDelivery
            })
            console.log(`📧 Generated fallback HTML template`)
          }
        } catch (error) {
          console.error('❌ Error loading default template from database:', error)
          
          // Fallback to generic template
          emailHtml = createWelcomeEmailHtml({
            customerName: clientName,
            qrCode: qrCodeId,
            guests: guests,
            days: days,
            expiresAt: formattedExpirationDate,
            customerPortalUrl: magicLinkUrl,
            language: customerLanguage,
            deliveryMethod: requestedDelivery
          })
          console.log(`📧 Generated error fallback HTML template`)
        }
      } else {
        // Use generic default HTML template
        emailHtml = createWelcomeEmailHtml({
          customerName: clientName,
          qrCode: qrCodeId,
          guests: guests,
          days: days,
          expiresAt: formattedExpirationDate,
          customerPortalUrl: magicLinkUrl,
          language: customerLanguage,
          deliveryMethod: requestedDelivery
        })
        console.log(`📧 Using generic default HTML template`)
      }

      // Send the email
      emailSent = await sendEmail({
        to: clientEmail,
        subject: emailSubject,
        html: emailHtml
      })

      if (emailSent) {
        console.log(`✅ Welcome email sent successfully to ${clientEmail}`)
        
        // Update analytics record to reflect email was sent
        await prisma.qRCodeAnalytics.updateMany({
          where: { qrCodeId: qrCode.id },
          data: { welcomeEmailSent: true }
        })
      } else {
        console.error(`❌ Failed to send welcome email to ${clientEmail}`)
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
    }
    
    console.log(`📧 WELCOME EMAIL SUMMARY:
To: ${clientEmail}
Subject: ${subject}
Delivery Method: ${requestedDelivery}
Rebuy Email Scheduled: ${rebuyEmailScheduled}
Email Sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
    
    return NextResponse.json({
      success: true,
      qrCode: qrCodeId,
      expiresAt: expiresAt,
      message: emailSent ? 'QR code generated and email sent successfully' : 'QR code generated but email failed to send',
      magicLinkUrl: magicLinkUrl,
      emailSent: emailSent
    })
    
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
