import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  let scheduledQRId: string = ''
  let isRetry: boolean = false
  
  try {
    console.log('🎯 SINGLE QR PROCESSOR: Request received')
    console.log('📋 Headers:', Object.fromEntries(request.headers.entries()))
    
    // QStash webhook verification (using correct signing key)
    const qstashSignature = request.headers.get('upstash-signature')
    const qstashTimestamp = request.headers.get('upstash-timestamp')
    const qstashSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
    
    console.log('🔍 QStash verification check:', {
      hasSignature: !!qstashSignature,
      hasTimestamp: !!qstashTimestamp,
      hasSigningKey: !!qstashSigningKey
    })
    
    if (qstashSignature && qstashTimestamp && qstashSigningKey) {
      try {
        // QStash webhook - verify signature
        const body = await request.text()
        console.log('📄 QStash request body length:', body.length)
        
        const signature = crypto
          .createHmac('sha256', qstashSigningKey)
          .update(`${qstashTimestamp}.${body}`)
          .digest('base64')
        
        const expectedSignature = `v1=${signature}`
        
        console.log('🔐 QStash signature verification:', {
          expected: expectedSignature,
          received: qstashSignature,
          match: expectedSignature === qstashSignature
        })
        
        if (expectedSignature !== qstashSignature) {
          console.log('🔒 SINGLE QR PROCESSOR: Invalid QStash signature')
          return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 })
        }
        
        // Parse the verified body
        const data = JSON.parse(body)
        scheduledQRId = data.scheduledQRId
        isRetry = data.isRetry || false
        
        console.log(`🔐 SINGLE QR PROCESSOR: QStash webhook verified for QR: ${scheduledQRId}`)
      } catch (verificationError) {
        console.error('❌ QStash verification error:', verificationError)
        return NextResponse.json({ error: 'QStash verification failed' }, { status: 401 })
      }
    } else {
      console.log('🔍 No QStash headers, checking for manual/cron request')
      
      // Fallback for manual requests
      const cronSecret = process.env.CRON_SECRET
      if (cronSecret) {
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${cronSecret}`) {
          console.log('🔒 SINGLE QR PROCESSOR: Unauthorized manual request')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
      
      const data = await request.json()
      scheduledQRId = data.scheduledQRId
      isRetry = data.isRetry || false
      
      console.log(`🔓 SINGLE QR PROCESSOR: Manual/cron request for QR: ${scheduledQRId}`)
    }
    
    console.log(`🔓 SINGLE QR PROCESSOR: Processing QR: ${scheduledQRId} (retry: ${isRetry})`)

    if (!scheduledQRId) {
      return NextResponse.json({ error: 'Missing scheduledQRId' }, { status: 400 })
    }

    console.log(`🎯 SINGLE QR PROCESSOR: Processing specific scheduled QR: ${scheduledQRId}${isRetry ? ' (RETRY)' : ''}`)
    
    // Get the specific scheduled QR
    const scheduledQR = await prisma.scheduledQRCode.findUnique({
      where: { id: scheduledQRId }
    })

    if (!scheduledQR) {
      console.log(`❌ Scheduled QR not found: ${scheduledQRId}`)
      return NextResponse.json({ error: 'Scheduled QR not found' }, { status: 404 })
    }

    if (scheduledQR.isProcessed) {
      console.log(`✅ Scheduled QR already processed: ${scheduledQRId}`)
      return NextResponse.json({ 
        success: true, 
        message: 'QR already processed',
        alreadyProcessed: true 
      })
    }

    // Check if this is overdue and track retry attempts
    const now = new Date()
    const isOverdue = scheduledQR.scheduledFor < now
    const retryCount = scheduledQR.retryCount || 0
    const maxRetries = 2

    if (isOverdue && retryCount >= maxRetries) {
      console.log(`🚨 QR ${scheduledQRId} has failed ${maxRetries} retry attempts - sending warning email`)
      await sendWarningEmail(scheduledQR)
      return NextResponse.json({ 
        success: false, 
        message: 'QR failed after max retries',
        failedAfterRetries: true 
      })
    }

    // Process this specific QR using the same logic as the batch processor
    // Import the necessary modules
    const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
    
    // Get seller info and configuration
    const seller = await prisma.user.findUnique({
      where: { id: scheduledQR.sellerId },
      select: { 
        id: true,
        savedConfigId: true,
        configurationName: true 
      }
    })

    let config
    let savedConfig = null

    // Handle different types of scheduled QRs
    if (scheduledQR.configurationId === 'default' || !seller?.savedConfigId) {
      // This is a PayPal or system-generated QR with default configuration
      console.log(`📅 PROCESSING: Using default configuration for scheduled QR: ${scheduledQR.id}`)
      
      // Use default configuration for PayPal/system QRs
      config = {
        button2PricingType: 'FIXED',
        button2FixedPrice: 0,
        button5SendRebuyEmail: false,
        // Welcome emails always enabled
      }
    } else {
      // This is a seller dashboard QR with saved configuration
      console.log(`📅 PROCESSING: Using saved configuration for scheduled QR: ${scheduledQR.id}`)
      
      if (!seller || !seller.savedConfigId) {
        throw new Error('No configuration assigned to seller')
      }

      // Get the saved QR configuration
      savedConfig = await prisma.savedQRConfiguration.findUnique({
        where: { id: seller.savedConfigId }
      })

      if (!savedConfig) {
        throw new Error('Configuration not found')
      }

      // Parse the configuration JSON
      config = JSON.parse(savedConfig.config)
    }
    
    // Calculate pricing
    let calculatedPrice = 0
    if (config.button2PricingType === 'FIXED') {
      calculatedPrice = config.button2FixedPrice || 0
    } else if (config.button2PricingType === 'VARIABLE') {
      const basePrice = config.button2VariableBasePrice || 0
      const extraGuests = Math.max(0, scheduledQR.guests - 1)
      const extraDays = Math.max(0, scheduledQR.days - 1)
      const guestPrice = (config.button2VariableGuestIncrease || 0) * extraGuests
      const dayPrice = (config.button2VariableDayIncrease || 0) * extraDays
      calculatedPrice = basePrice + guestPrice + dayPrice
      
      if (config.button2VariableCommission > 0) {
        calculatedPrice += config.button2VariableCommission
      }
      
      if (config.button2IncludeTax && config.button2TaxPercentage > 0) {
        calculatedPrice += calculatedPrice * (config.button2TaxPercentage / 100)
      }
    }

    // Generate unique QR code (NOW is activation time!)
    // Use PASS_ prefix for PayPal orders (default configurationId) to maintain consistency
    const qrCodeId = scheduledQR.configurationId === 'default' 
      ? `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + scheduledQR.days)

    // Create QR code
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: scheduledQR.sellerId,
        customerName: scheduledQR.clientName,
        customerEmail: scheduledQR.clientEmail,
        guests: scheduledQR.guests,
        days: scheduledQR.days,
        cost: scheduledQR.configurationId === 'default' ? (scheduledQR as any).amount : calculatedPrice,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: scheduledQR.deliveryMethod === 'DIRECT' ? null : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/landing/${qrCodeId}`
      }
    })

    // Generate magic link token
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: scheduledQR.clientEmail,
        customerName: scheduledQR.clientName,
        expiresAt: tokenExpiresAt
      }
    })

    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`

    // Create analytics record
    const sellerDetails = await prisma.user.findUnique({
      where: { id: scheduledQR.sellerId },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })

    // Create analytics record with Cancun timezone
    const currentTime = new Date()
    const cancunTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/Cancun"}))
    
    // Determine seller information for analytics (consistent with PayPal immediate creation)
    let analyticsSellerName, analyticsSellerEmail, analyticsLocationName, analyticsDistributorName
    
    if (scheduledQR.configurationId === 'default' || !seller?.savedConfigId) {
      // This is a PayPal QR - use consistent PayPal seller information
      analyticsSellerName = 'Online'
      analyticsSellerEmail = 'direct@elocalpass.com'
      analyticsLocationName = 'Online'
      analyticsDistributorName = 'Elocalpass'
    } else {
      // This is a seller dashboard QR - use actual seller information
      analyticsSellerName = sellerDetails?.name || 'Unknown Seller'
      analyticsSellerEmail = sellerDetails?.email || 'unknown@elocalpass.com'
      analyticsLocationName = sellerDetails?.location?.name || null
      analyticsDistributorName = sellerDetails?.location?.distributor?.name || null
    }
    
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        customerName: scheduledQR.clientName,
        customerEmail: scheduledQR.clientEmail,
        guests: scheduledQR.guests,
        days: scheduledQR.days,
        cost: scheduledQR.configurationId === 'default' ? (scheduledQR as any).amount : calculatedPrice,
        discountAmount: scheduledQR.configurationId === 'default' ? (scheduledQR as any).discountAmount : 0,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: scheduledQR.deliveryMethod,
        language: 'en',
        sellerId: scheduledQR.sellerId,
        sellerName: analyticsSellerName,
        sellerEmail: analyticsSellerEmail,
        locationId: sellerDetails?.locationId,
        locationName: analyticsLocationName,
        distributorId: sellerDetails?.location?.distributorId,
        distributorName: analyticsDistributorName,
        configurationId: seller?.savedConfigId || scheduledQR.configurationId,
        configurationName: seller?.configurationName || 'Default Configuration',
        pricingType: config.button2PricingType,
        fixedPrice: config.button2PricingType === 'FIXED' ? config.button2FixedPrice : null,
        variableBasePrice: config.button2PricingType === 'VARIABLE' ? config.button2VariableBasePrice : null,
        variableGuestIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableGuestIncrease : null,
        variableDayIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableDayIncrease : null,
        variableCommission: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission : null,
        includeTax: config.button2IncludeTax || false,
        taxPercentage: config.button2TaxPercentage,
        baseAmount: config.button2PricingType === 'FIXED' ? config.button2FixedPrice || 0 : config.button2VariableBasePrice || 0,
        guestAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableGuestIncrease || 0) * Math.max(0, scheduledQR.guests - 1) : 0,
        dayAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableDayIncrease || 0) * Math.max(0, scheduledQR.days - 1) : 0,
        commissionAmount: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission || 0 : 0,
        taxAmount: config.button2IncludeTax && config.button2TaxPercentage > 0 ? calculatedPrice * (config.button2TaxPercentage / 100) : 0,
        totalAmount: calculatedPrice,
        landingUrl: null,
        magicLinkUrl: magicLinkUrl,
        welcomeEmailSent: false,
        rebuyEmailScheduled: config.button5SendRebuyEmail || false,
        createdAt: cancunTime, // Use Cancun timezone
        updatedAt: cancunTime
      }
    })

    // Send welcome email based on configuration setting and QR type
    let emailSent = false
    
    // Welcome emails are always enabled (no toggle needed)
    console.log(`📧 SCHEDULED QR: Welcome emails are ENABLED - proceeding to send email`)
    
    try {
      // Import email service and translations
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      const { formatDate } = await import('@/lib/translations')
      
      const customerLanguage = 'en' // Default language
      const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
      
      let emailHtml = ''
      let emailSubject = 'Your ELocalPass is Ready - Scheduled Delivery'
    
      // Check if this is a PayPal QR or Seller QR
      if (scheduledQR.configurationId === 'default' || !seller?.savedConfigId) {
        // PayPal QR - use PayPal template
        console.log('📧 SCHEDULED QR: This is a PayPal QR - using PayPal welcome email template...')
        
        const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { 
            name: {
              contains: 'Paypal welcome email template'
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        console.log('📧 SCHEDULED QR: PayPal template search result:', {
          found: !!paypalTemplate,
          name: paypalTemplate?.name,
          hasCustomHTML: !!paypalTemplate?.customHTML,
          htmlLength: paypalTemplate?.customHTML?.length || 0
        })
        
        if (paypalTemplate && paypalTemplate.customHTML) {
          console.log('📧 SCHEDULED QR: Using PayPal-specific branded template')
          
          emailHtml = paypalTemplate.customHTML
            .replace(/\{customerName\}/g, scheduledQR.clientName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, scheduledQR.guests.toString())
            .replace(/\{days\}/g, scheduledQR.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          if (paypalTemplate.subject) {
            emailSubject = paypalTemplate.subject
              .replace(/\{customerName\}/g, scheduledQR.clientName)
              .replace(/\{qrCode\}/g, qrCodeId)
          }
        } else {
          console.log('⚠️ SCHEDULED QR: PayPal template not found - using fallback template')
          emailHtml = createWelcomeEmailHtml({
            customerName: scheduledQR.clientName,
            qrCode: qrCodeId,
            guests: scheduledQR.guests,
            days: scheduledQR.days,
            expiresAt: formattedExpirationDate,
            customerPortalUrl: magicLinkUrl,
            language: customerLanguage,
            deliveryMethod: 'DIRECT'
          })
        }
      } else {
        // Seller QR - use seller's custom template from their configuration
        console.log('📧 SCHEDULED QR: This is a Seller QR - using seller\'s custom email template...')
        
        // Get seller's email templates from their saved configuration
        const emailTemplates = savedConfig?.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null
        
        console.log('📧 SCHEDULED QR: Seller email templates:', {
          hasEmailTemplates: !!emailTemplates,
          hasWelcomeEmail: !!emailTemplates?.welcomeEmail,
          hasCustomHTML: !!emailTemplates?.welcomeEmail?.customHTML,
          htmlLength: emailTemplates?.welcomeEmail?.customHTML?.length || 0
        })
        
        if (emailTemplates?.welcomeEmail?.customHTML) {
          console.log('📧 SCHEDULED QR: Using seller\'s custom welcome email template')
          
          emailHtml = emailTemplates.welcomeEmail.customHTML
            .replace(/\{customerName\}/g, scheduledQR.clientName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, scheduledQR.guests.toString())
            .replace(/\{days\}/g, scheduledQR.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          if (emailTemplates.welcomeEmail.subject) {
            emailSubject = emailTemplates.welcomeEmail.subject
              .replace(/\{customerName\}/g, scheduledQR.clientName)
              .replace(/\{qrCode\}/g, qrCodeId)
          }
          
          console.log('📧 SCHEDULED QR: Seller template variables replaced successfully')
        } else {
          console.log('⚠️ SCHEDULED QR: Seller has no custom template - using fallback template')
          emailHtml = createWelcomeEmailHtml({
            customerName: scheduledQR.clientName,
            qrCode: qrCodeId,
            guests: scheduledQR.guests,
            days: scheduledQR.days,
            expiresAt: formattedExpirationDate,
            customerPortalUrl: magicLinkUrl,
            language: customerLanguage,
            deliveryMethod: 'DIRECT'
          })
        }
      }
      
      console.log(`📧 SCHEDULED QR: Generated welcome email HTML - Length: ${emailHtml.length} chars`)
      
      // Send the email
      emailSent = await sendEmail({
        to: scheduledQR.clientEmail,
        subject: emailSubject,
        html: emailHtml
      })
      
      console.log('📧 SCHEDULED QR: Email send result:', emailSent)

      if (emailSent) {
        console.log(`✅ SCHEDULED QR: Welcome email sent successfully to ${scheduledQR.clientEmail}`)
      } else {
        console.error(`❌ SCHEDULED QR: Failed to send welcome email to ${scheduledQR.clientEmail}`)
      }
    } catch (emailError) {
      console.error('❌ SCHEDULED QR: Error sending welcome email:', emailError)
      emailSent = false
    }

    if (emailSent) {
      await prisma.qRCodeAnalytics.updateMany({
        where: { qrCodeId: qrCode.id },
        data: { welcomeEmailSent: true }
      })
    }

    // Schedule rebuy email for exactly 12 hours before expiration
    if (config.button5SendRebuyEmail) {
      const rebuyTriggerTime = new Date(expiresAt.getTime() - (12 * 60 * 60 * 1000)) // 12 hours before expiration
      const rebuyDelay = rebuyTriggerTime.getTime() - Date.now()
      
      if (rebuyDelay > 0 && process.env.QSTASH_CURRENT_SIGNING_KEY) {
        try {
          const qstashResponse = await fetch(`https://qstash.upstash.io/v2/publish/${process.env.NEXTAUTH_URL}/api/rebuy-emails/send-single`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.QSTASH_CURRENT_SIGNING_KEY}`,
              'Content-Type': 'application/json',
              'Upstash-Delay': `${rebuyDelay}ms`
            },
            body: JSON.stringify({
              qrCodeId: qrCode.id
            })
          })
          
          if (qstashResponse.ok) {
            const qstashData = await qstashResponse.json()
            console.log(`📧 REBUY EMAIL: QStash job scheduled for exactly 12 hours before expiration`)
            console.log(`🆔 Rebuy QStash Message ID: ${qstashData.messageId}`)
          }
        } catch (qstashError) {
          console.error('❌ Rebuy QStash scheduling error:', qstashError)
        }
      }
    }

    // Mark as processed
    await prisma.scheduledQRCode.update({
      where: { id: scheduledQR.id },
      data: {
        isProcessed: true,
        processedAt: new Date(),
        createdQRCodeId: qrCodeId,
        retryCount: retryCount + 1
      }
    })
    
    console.log(`✅ SINGLE QR PROCESSOR: Successfully processed QR ${qrCodeId} for ${scheduledQR.clientEmail}${isRetry ? ' (RETRY SUCCESS)' : ''}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed scheduled QR`,
      qrCode: qrCodeId,
      emailSent: emailSent,
      scheduledQRId: scheduledQR.id,
      wasRetry: isRetry
    })
    
  } catch (error) {
    console.error('❌ SINGLE QR PROCESSOR: Error:', error)
    
    // If this was a retry attempt, increment retry count
    if (isRetry && scheduledQRId) {
      try {
        const scheduledQR = await prisma.scheduledQRCode.findUnique({
          where: { id: scheduledQRId }
        })
        
        if (scheduledQR && !scheduledQR.isProcessed) {
          const retryCount = (scheduledQR.retryCount || 0) + 1
          const maxRetries = 2
          
          await prisma.scheduledQRCode.update({
            where: { id: scheduledQRId },
            data: { retryCount }
          })
          
          // If we've reached max retries, send warning email
          if (retryCount >= maxRetries) {
            await sendWarningEmail(scheduledQR)
          }
        }
      } catch (updateError) {
        console.error('❌ Failed to update retry count:', updateError)
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Function to send warning email for failed QRs
async function sendWarningEmail(scheduledQR: any) {
  try {
    console.log(`🚨 SENDING WARNING EMAIL for failed QR: ${scheduledQR.id}`)
    
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    const warningEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 QR Code Processing Failed</h2>
        
        <p><strong>QR ID:</strong> ${scheduledQR.id}</p>
        <p><strong>Customer:</strong> ${scheduledQR.clientName} (${scheduledQR.clientEmail})</p>
        <p><strong>Scheduled For:</strong> ${scheduledQR.scheduledFor.toLocaleString()}</p>
        <p><strong>Guests:</strong> ${scheduledQR.guests}</p>
        <p><strong>Days:</strong> ${scheduledQR.days}</p>
        <p><strong>Seller ID:</strong> ${scheduledQR.sellerId}</p>
        <p><strong>Retry Count:</strong> ${scheduledQR.retryCount || 0}/2</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #dc2626; margin-top: 0;">⚠️ Manual Action Required</h3>
          <p>This QR code has failed to process after multiple retry attempts. Please investigate and manually process if needed.</p>
        </div>
        
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@elocalpass.com',
      to: 'info@elocalpass.com',
      subject: `🚨 QR Code Processing Failed - ${scheduledQR.id}`,
      html: warningEmailHtml
    })
    
    console.log(`✅ Warning email sent for QR ${scheduledQR.id}`)
    
  } catch (emailError) {
    console.error('❌ Failed to send warning email:', emailError)
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Single QR processor endpoint - use POST with scheduledQRId' 
  })
} 