import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Security check for external cron services
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('🔒 SINGLE REBUY EMAIL: Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { qrCodeId } = await request.json()
    
    if (!qrCodeId) {
      return NextResponse.json({ error: 'Missing qrCodeId' }, { status: 400 })
    }

    console.log(`🎯 SINGLE REBUY EMAIL: Processing rebuy email for QR: ${qrCodeId}`)
    
    // Get the specific QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    })

    if (!qrCode) {
      console.log(`❌ QR Code not found: ${qrCodeId}`)
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    if (!qrCode.isActive) {
      console.log(`❌ QR Code not active: ${qrCodeId}`)
      return NextResponse.json({ error: 'QR Code not active' }, { status: 400 })
    }

    // Check if rebuy email already sent (using rebuyEmailScheduled field for tracking)
    if (qrCode.analytics && !qrCode.analytics.rebuyEmailScheduled) {
      console.log(`✅ Rebuy email already processed for QR: ${qrCodeId}`)
      return NextResponse.json({
        success: true,
        message: 'Rebuy email already processed',
        alreadySent: true
      })
    }

    // Get seller's configuration to check if rebuy emails are enabled
    const sellerConfig = qrCode.seller.savedConfig
    if (!sellerConfig) {
      console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - seller has no saved configuration`)
      return NextResponse.json({ error: 'No configuration found' }, { status: 400 })
    }

    const configData = JSON.parse(sellerConfig.config)
    if (!configData.button5SendRebuyEmail) {
      console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - rebuy emails disabled for this configuration`)
      return NextResponse.json({ error: 'Rebuy emails disabled' }, { status: 400 })
    }

    // Import necessary modules
    const { sendEmail } = await import('@/lib/email-service')
    
    type SupportedLanguage = 'en' | 'es'

    // Detect customer language
    let customerLanguage: SupportedLanguage = 'en'
    
    try {
      if (qrCode.analytics?.language) {
        customerLanguage = qrCode.analytics.language as SupportedLanguage
        console.log(`📧 REBUY EMAIL: Using stored customer language: ${customerLanguage}`)
      } else {
        customerLanguage = 'en'
        console.log(`📧 REBUY EMAIL: No stored language found, defaulting to English`)
      }
    } catch (error) {
      console.log(`📧 REBUY EMAIL: Language detection failed, defaulting to English`)
      customerLanguage = 'en'
    }
    
    // Generate customer portal URL for renewal
    let customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCode.customerEmail}`

    // Calculate hours left until expiration
    const now = new Date()
    const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

    let emailHtml: string
    let emailSubject: string

    // Get email templates from configuration
    const emailTemplates = sellerConfig.emailTemplates ? JSON.parse(sellerConfig.emailTemplates) : null
    
    console.log(`📧 REBUY EMAIL: Checking email templates for QR ${qrCode.code}`)
    console.log(`  - Has emailTemplates: ${!!emailTemplates}`)
    console.log(`  - Has rebuyEmail: ${!!emailTemplates?.rebuyEmail}`)
    
    // Add seller tracking to customer portal URL if enabled
    if (emailTemplates?.rebuyEmail?.rebuyConfig?.enableSellerTracking) {
      const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig
      const trackingMethod = rebuyConfig.trackingMethod || 'url_param'
      
      if (trackingMethod === 'url_param' || trackingMethod === 'both') {
        // Add seller_id parameter to track which seller the customer came from
        customerPortalUrl += `&seller_id=${qrCode.sellerId}`
        console.log(`🔗 SINGLE REBUY EMAIL: Added seller tracking to URL: seller_id=${qrCode.sellerId}`)
      }
      
      if (trackingMethod === 'discount_code' || trackingMethod === 'both') {
        // Add discount code parameter if discount is enabled
        if (rebuyConfig.enableDiscountCode) {
          const discountCode = `${rebuyConfig.codePrefix || 'REBUY'}${rebuyConfig.discountValue || 15}`
          customerPortalUrl += `&discount=${discountCode}`
          console.log(`🎫 SINGLE REBUY EMAIL: Added discount code to URL: discount=${discountCode}`)
        }
      }
    }

    // Professional Rebuy Email Translation System
    const translateSubject = async (subject: string, targetLanguage: SupportedLanguage): Promise<string> => {
      if (targetLanguage === 'en') return subject
      
      try {
        const response = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: subject,
            source: 'en',
            target: 'es',
            format: 'text'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          return result.translatedText || subject
        }
      } catch (error) {
        console.warn('Translation failed, using original subject')
      }
      
      return subject
    }

    // Use custom template if available
    if (emailTemplates?.rebuyEmail?.customHTML) {
      console.log(`📧 REBUY EMAIL: Using custom template for QR ${qrCode.code}`)
      
      let processedTemplate = emailTemplates.rebuyEmail.customHTML
        .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
        .replace(/\{qrCode\}/g, qrCode.code)
        .replace(/\{guests\}/g, qrCode.guests.toString())
        .replace(/\{days\}/g, qrCode.days.toString())
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())
        .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
        .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
        .replace(/\{rebuyUrl\}/g, customerPortalUrl)
      
      emailHtml = processedTemplate

      // Get subject from rebuy config if available
      if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
        const originalSubject = emailTemplates.rebuyEmail.rebuyConfig.emailSubject
        emailSubject = await translateSubject(originalSubject, customerLanguage)
      } else {
        const originalSubject = `Your ELocalPass expires in ${hoursLeft} hours - Renew now!`
        emailSubject = await translateSubject(originalSubject, customerLanguage)
      }
      
    } else {
      // Use default rebuy template
      console.log(`📧 REBUY EMAIL: Using default template for QR ${qrCode.code}`)
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your ELocalPass is Expiring Soon!</h2>
          <p>Hello ${qrCode.customerName || 'Valued Customer'},</p>
          <p>Your ELocalPass (${qrCode.code}) expires in <strong>${hoursLeft} hours</strong>.</p>
          <p>Don't miss out! Renew your pass to continue enjoying the benefits.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${customerPortalUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Renew Your Pass
            </a>
          </div>
          <p>Details:</p>
          <ul>
            <li>Guests: ${qrCode.guests}</li>
            <li>Days: ${qrCode.days}</li>
            <li>Expires: ${qrCode.expiresAt.toLocaleString()}</li>
          </ul>
          <p>Thank you for choosing ELocalPass!</p>
        </div>
      `
      
      emailSubject = await translateSubject(`Your ELocalPass expires in ${hoursLeft} hours - Renew now!`, customerLanguage)
    }

    console.log(`📧 REBUY EMAIL: Sending email to ${qrCode.customerEmail} with subject: ${emailSubject}`)

    const emailSent = await sendEmail({
      to: qrCode.customerEmail!,
      subject: emailSubject,
      html: emailHtml
    })

    if (emailSent) {
      console.log(`✅ REBUY EMAIL: Successfully sent to ${qrCode.customerEmail} for QR ${qrCode.code}`)
      
      // Mark as sent in analytics (set rebuyEmailScheduled to false to indicate it's been sent)
      if (qrCode.analytics) {
        await prisma.qRCodeAnalytics.update({
          where: { id: qrCode.analytics.id },
          data: { rebuyEmailScheduled: false }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: `Rebuy email sent successfully`,
        qrCode: qrCode.code,
        email: qrCode.customerEmail,
        hoursLeft: hoursLeft
      })
    } else {
      console.log(`❌ REBUY EMAIL: Failed to send to ${qrCode.customerEmail} for QR ${qrCode.code}`)
      return NextResponse.json({
        success: false,
        message: 'Failed to send rebuy email',
        qrCode: qrCode.code,
        email: qrCode.customerEmail
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ SINGLE REBUY EMAIL: Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Single rebuy email processor - use POST with qrCodeId' 
  })
} 