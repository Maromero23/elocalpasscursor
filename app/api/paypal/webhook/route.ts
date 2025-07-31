import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = request.headers
    
    console.log('🔔 PAYPAL WEBHOOK RECEIVED')
    console.log('Headers:', Object.fromEntries(headers.entries()))
    console.log('Body:', body)
    
    // Check if this is an IPN (Instant Payment Notification) from Website Payments Standard
    if (body.includes('payment_status=') || body.includes('txn_id=')) {
      console.log('📨 Processing PayPal IPN (Website Payments Standard)')
      return await handlePayPalIPN(body)
    }
    
    // Otherwise, try to parse as JSON (newer API)
    const webhookData = JSON.parse(body)
    console.log('🔔 PAYPAL WEBHOOK EVENT:', webhookData.event_type)
    
    // Handle payment completion
    if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const paymentData = webhookData.resource
      const customData = paymentData.custom_id ? JSON.parse(paymentData.custom_id) : null
      
      if (customData) {
        console.log('💰 PAYMENT COMPLETED:', {
          paymentId: paymentData.id,
          amount: paymentData.amount.value,
          currency: paymentData.amount.currency_code,
          customerEmail: customData.customerEmail,
          customerName: customData.customerName,
          passType: customData.passType,
          guests: customData.guests,
          days: customData.days,
          deliveryType: customData.deliveryType,
          sellerId: customData.sellerId
        })
        
        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: paymentData.id,
            amount: parseFloat(paymentData.amount.value),
            currency: paymentData.amount.currency_code,
            customerEmail: customData.customerEmail,
            customerName: customData.customerName,
            passType: customData.passType,
            guests: customData.guests,
            days: customData.days,
            deliveryType: customData.deliveryType,
            deliveryDate: customData.deliveryDate,
            deliveryTime: customData.deliveryTime,
            discountCode: customData.discountCode,
            sellerId: customData.sellerId || null, // Use seller ID from custom data (discount codes, rebuy emails)
            status: 'PAID'
          }
        })
        
        console.log('📝 ORDER CREATED:', orderRecord.id)
        
        // Handle QR code creation based on delivery type
        if (customData.deliveryType === 'now') {
          // Create QR code immediately
          await createQRCode(orderRecord)
        } else {
          // Schedule QR code creation
          await scheduleQRCode(orderRecord)
        }
        
        return NextResponse.json({ 
          success: true, 
          orderId: orderRecord.id,
          redirectUrl: `${process.env.NEXTAUTH_URL}/payment-success?orderId=${orderRecord.id}`
        })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ PAYPAL WEBHOOK ERROR:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function createQRCode(orderRecord: any) {
  try {
    console.log('🎫 CREATING QR CODE FOR ORDER:', orderRecord.id)
    
    // Import necessary modules
    const crypto = await import('crypto')
    const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
    
    // Generate unique QR code
    const qrCodeId = `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + (orderRecord.days * 24 * 60 * 60 * 1000))
    
    // Determine seller information for PayPal orders BEFORE creating QR code
    let sellerId = 'cmc4ha7l000086a96ef0e06qq' // Default system seller ID
    let sellerName = 'Online'
    let sellerEmail = 'direct@elocalpass.com'
    let sellerDetails = null // Declare outside the block
    
    // Check if customer came from a specific seller (rebuy email or discount code)
    if (orderRecord.sellerId) {
      console.log('🔍 PayPal webhook: Customer came from seller:', orderRecord.sellerId)
      
      // Get seller details from database
      sellerDetails = await prisma.user.findUnique({
        where: { id: orderRecord.sellerId },
        include: {
          location: {
            include: {
              distributor: true
            }
          }
        }
      })
      
      if (sellerDetails) {
        sellerId = sellerDetails.id
        sellerName = sellerDetails.name || 'Unknown Seller'
        sellerEmail = sellerDetails.email || 'unknown@elocalpass.com'
        console.log('✅ PayPal webhook: Using seller details:', { sellerName, sellerEmail })
      } else {
        console.log('⚠️ PayPal webhook: Seller not found, using direct purchase')
        // Reset to defaults if seller not found
        sellerId = 'cmc4ha7l000086a96ef0e06qq'
        sellerName = 'Online'
        sellerEmail = 'direct@elocalpass.com'
        sellerDetails = null
      }
    } else {
      console.log('📋 PayPal webhook: Direct purchase from passes page')
      // Explicitly reset all seller information for direct sales
      sellerId = 'cmc4ha7l000086a96ef0e06qq'
      sellerName = 'Online'
      sellerEmail = 'direct@elocalpass.com'
      sellerDetails = null
    }
    
    // Create QR code record with correct seller ID
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: sellerId, // Use determined seller ID (not hardcoded)
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id, 'for seller:', sellerId)
    
    // Generate magic link token
    const accessToken = crypto.default.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: orderRecord.customerEmail,
        customerName: orderRecord.customerName,
        expiresAt: tokenExpiresAt
      }
    })

    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`
    
    // Create analytics record with proper seller information and Cancun timezone
    const now = new Date()
    const cancunTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Cancun"}))
    
    // Determine location and distributor information
    let locationId = null
    let locationName = null
    let distributorId = null
    let distributorName = 'Elocalpass' // Default for direct sales
    
    if (orderRecord.sellerId && sellerDetails) {
      // Use seller's location and distributor information for attributed sales
      locationId = sellerDetails.location?.id || null
      locationName = sellerDetails.location?.name || null
      distributorId = sellerDetails.location?.distributor?.id || null
      distributorName = sellerDetails.location?.distributor?.name || 'Elocalpass'
    } else {
      // For direct purchases (no seller attribution), set location to "Online"
      locationName = 'Online'
    }
    
    // Determine if rebuy emails should be scheduled based on seller configuration
    let shouldScheduleRebuyEmail = false
    
    if (orderRecord.sellerId && sellerDetails && sellerDetails.savedConfigId) {
      try {
        // Get seller's saved configuration to check rebuy email settings
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: sellerDetails.savedConfigId },
          select: { config: true }
        })
        
        if (savedConfig?.config) {
          const configData = JSON.parse(savedConfig.config)
          shouldScheduleRebuyEmail = configData.button5SendRebuyEmail === true
          console.log(`📧 PayPal webhook: Seller rebuy emails ${shouldScheduleRebuyEmail ? 'ENABLED' : 'DISABLED'} for seller ${sellerDetails.name}`)
        }
      } catch (error) {
        console.error('⚠️ PayPal webhook: Error checking seller rebuy email config:', error)
      }
    }
    
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: 'DIRECT',
        language: 'en',
        sellerId: sellerId,
        sellerName: sellerName,
        sellerEmail: sellerEmail,
        locationId: locationId,
        locationName: locationName,
        distributorId: distributorId,
        distributorName: distributorName,
        configurationId: 'default',
        configurationName: 'Default PayPal Configuration',
        pricingType: 'FIXED',
        fixedPrice: orderRecord.amount,
        variableBasePrice: null,
        variableGuestIncrease: null,
        variableDayIncrease: null,
        variableCommission: null,
        includeTax: false,
        taxPercentage: null,
        baseAmount: orderRecord.amount,
        guestAmount: 0,
        dayAmount: 0,
        commissionAmount: 0,
        taxAmount: 0,
        totalAmount: orderRecord.amount,
        landingUrl: null,
        magicLinkUrl: magicLinkUrl,
        welcomeEmailSent: false,
        rebuyEmailScheduled: shouldScheduleRebuyEmail, // Enable rebuy emails for seller-referred sales
        createdAt: cancunTime, // Use Cancun timezone
        updatedAt: cancunTime
      }
    })
    
    // Send welcome email using the proper email service with seller-specific or PayPal template
    const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
    
    const customerLanguage = 'en' // Default language for PayPal orders
    
    let emailHtml: string = ''
    let emailSubject: string = ''
    let emailSent: boolean = false
    
    // Check if this is a seller-referred sale and seller has custom templates
    if (orderRecord.sellerId && sellerDetails && sellerDetails.savedConfigId) {
      console.log('🎨 PayPal webhook: Seller-referred sale - checking for custom email templates')
      
      try {
        // Get seller's saved configuration with email templates
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: sellerDetails.savedConfigId },
          select: { emailTemplates: true }
        })
        
        let emailTemplates = null
        if (savedConfig?.emailTemplates) {
          try {
            emailTemplates = typeof savedConfig.emailTemplates === 'string' 
              ? JSON.parse(savedConfig.emailTemplates) 
              : savedConfig.emailTemplates
          } catch (error) {
            console.log('⚠️ PayPal webhook: Error parsing seller email templates:', error)
          }
        }
        
        // Use seller's custom welcome email template if available
        if (emailTemplates?.welcomeEmail?.customHTML && emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
          console.log('📧 PayPal webhook: Using seller\'s custom welcome email template')
          
          const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
          
          // Use seller's custom template
          emailHtml = emailTemplates.welcomeEmail.customHTML
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, orderRecord.guests.toString())
            .replace(/\{days\}/g, orderRecord.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          // Use seller's custom subject if available
          if (emailTemplates.welcomeEmail.subject) {
            emailSubject = emailTemplates.welcomeEmail.subject
              .replace(/\{customerName\}/g, orderRecord.customerName)
              .replace(/\{qrCode\}/g, qrCodeId)
          } else {
            emailSubject = `Welcome to ELocalPass - ${orderRecord.customerName}!`
          }
          
          emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log(`📧 PayPal webhook: Seller custom email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
          
          if (emailSent) {
            await prisma.qRCodeAnalytics.updateMany({
              where: { qrCodeId: qrCode.id },
              data: { welcomeEmailSent: true }
            })
            console.log('📊 Analytics updated - seller custom email marked as sent')
          }
        } else {
          console.log('📧 PayPal webhook: Seller has no custom template - falling back to PayPal template')
        }
      } catch (error) {
        console.error('⚠️ PayPal webhook: Error processing seller templates:', error)
        console.log('📧 PayPal webhook: Falling back to PayPal template due to error')
      }
    }
    
    // If no custom email was sent (direct sale or seller has no custom template), use PayPal template
    if (!emailSent) {
      console.log('📧 PayPal webhook: Using PayPal-specific template (direct sale or no custom template)')
      
      // Get the PayPal-specific template (NEWEST one if multiple exist)
      const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
        where: { 
          name: {
            contains: 'Paypal welcome email template (DO NOT ERASE)'
          }
        },
        orderBy: { createdAt: 'desc' } // Always get the latest copy
      })
      
      console.log('📧 PayPal webhook template search result:', {
        found: !!paypalTemplate,
        name: paypalTemplate?.name,
        id: paypalTemplate?.id,
        createdAt: paypalTemplate?.createdAt,
        hasCustomHTML: !!paypalTemplate?.customHTML
      })
      
      if (paypalTemplate && paypalTemplate.customHTML) {
        console.log('📧 Using PayPal-specific branded template')
        
        const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
        
        // Replace variables in template
        emailHtml = paypalTemplate.customHTML
          .replace(/\{customerName\}/g, orderRecord.customerName)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, orderRecord.guests.toString())
          .replace(/\{days\}/g, orderRecord.days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
          .replace(/\{magicLink\}/g, magicLinkUrl)
        
        emailSubject = paypalTemplate.subject
          .replace(/\{customerName\}/g, orderRecord.customerName)
          .replace(/\{qrCode\}/g, qrCodeId)
        
        emailSent = await sendEmail({
          to: orderRecord.customerEmail,
          subject: emailSubject,
          html: emailHtml
        })
        
        console.log(`📧 PayPal email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
        
        if (emailSent) {
          await prisma.qRCodeAnalytics.updateMany({
            where: { qrCodeId: qrCode.id },
            data: { welcomeEmailSent: true }
          })
          console.log('📊 Analytics updated - email marked as sent')
        }
      } else {
        console.log('⚠️ No PayPal template found - falling back to default template')
        
        // Fallback to default template
        const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { isDefault: true },
          orderBy: { createdAt: 'desc' }
        })
        
        if (defaultTemplate && defaultTemplate.customHTML) {
          console.log('📧 Using default branded template as fallback')
          
          const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
          
          const emailHtml = defaultTemplate.customHTML
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, orderRecord.guests.toString())
            .replace(/\{days\}/g, orderRecord.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          const emailSubject = defaultTemplate.subject
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
          
          const emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log(`📧 PayPal fallback email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
          
          if (emailSent) {
            await prisma.qRCodeAnalytics.updateMany({
              where: { qrCodeId: qrCode.id },
              data: { welcomeEmailSent: true }
            })
            console.log('📊 Analytics updated - fallback email marked as sent')
          }
        } else {
          console.log('⚠️ No default template found - using generic template')
          
          const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
          
          const emailHtml = createWelcomeEmailHtml({
            customerName: orderRecord.customerName,
            qrCode: qrCodeId,
            guests: orderRecord.guests,
            days: orderRecord.days,
            expiresAt: formattedExpirationDate,
            customerPortalUrl: magicLinkUrl,
            language: customerLanguage,
            deliveryMethod: 'DIRECT'
          })
          
          const emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: 'Your ELocalPass is Ready - Immediate Access',
            html: emailHtml
          })
          
          console.log(`📧 PayPal generic email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
          
          if (emailSent) {
            await prisma.qRCodeAnalytics.updateMany({
              where: { qrCodeId: qrCode.id },
              data: { welcomeEmailSent: true }
            })
            console.log('📊 Analytics updated - generic email marked as sent')
          }
        }
      }
    }
    
    console.log('✅ QR CODE AND EMAIL PROCESSED:', qrCode.id)
    
  } catch (error) {
    console.error('❌ QR CODE CREATION ERROR:', error)
  }
}

async function scheduleQRCode(orderRecord: any) {
  try {
    console.log('📅 SCHEDULING QR CODE FOR ORDER:', orderRecord.id)
    
    // Calculate delivery date and time
    const deliveryDateTime = orderRecord.deliveryDate ? new Date(orderRecord.deliveryDate) : new Date()
    
    // Create scheduled QR configuration using our existing system
    // For PayPal orders, always use the default system seller ID to ensure consistent seller info
    const scheduledQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: deliveryDateTime,
        clientName: orderRecord.customerName,
        clientEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        amount: orderRecord.amount, // Store the cost for tracking
        sellerId: 'cmc4ha7l000086a96ef0e06qq', // Always use default PayPal seller for consistency
        configurationId: 'default',
        deliveryMethod: 'DIRECT',
        isProcessed: false
      }
    })
    
    console.log('✅ QR CODE SCHEDULED:', scheduledQR.id)
    
    // Use our existing QStash system for exact-time scheduling
    const delay = deliveryDateTime.getTime() - Date.now()
    
    if (delay > 0 && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      try {
        // Schedule exact processing with Upstash QStash V2 (same as seller dashboard)
        const qstashResponse = await fetch(`https://qstash.upstash.io/v2/publish/${process.env.NEXTAUTH_URL}/api/scheduled-qr/process-single`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_CURRENT_SIGNING_KEY}`,
            'Content-Type': 'application/json',
            'Upstash-Delay': `${delay}ms`
          },
          body: JSON.stringify({
            scheduledQRId: scheduledQR.id
          })
        })
        
        if (qstashResponse.ok) {
          const qstashData = await qstashResponse.json()
          console.log(`📅 PAYPAL QR: QStash job created for exact time: ${deliveryDateTime}`)
          console.log(`🆔 QStash Message ID: ${qstashData.messageId}`)
        } else {
          console.error('❌ QStash scheduling failed:', await qstashResponse.text())
        }
      } catch (qstashError) {
        console.error('❌ QStash error:', qstashError)
      }
    }
    
  } catch (error) {
    console.error('❌ QR CODE SCHEDULING ERROR:', error)
  }
}

async function handlePayPalIPN(body: string) {
  try {
    // Parse URL-encoded IPN data
    const params = new URLSearchParams(body)
    const ipnData: Record<string, string> = {}
    
    params.forEach((value, key) => {
      ipnData[key] = value
    })
    
    console.log('📨 PayPal IPN Data:', ipnData)
    
    // Check payment status
    if (ipnData.payment_status === 'Completed') {
      console.log('💰 PayPal IPN: Payment completed')
      
      // Extract custom data
      let customData = null
      if (ipnData.custom) {
        try {
          customData = JSON.parse(ipnData.custom)
        } catch (e) {
          console.error('Error parsing custom data:', e)
        }
      }
      
      if (customData) {
        console.log('📋 Custom order data:', customData)
        
        // Handle both old and new custom data formats for backward compatibility
        const customerEmail = customData.email || customData.customerEmail
        const customerName = customData.name || customData.customerName
        const passType = customData.type || customData.passType
        const guests = customData.g || customData.guests
        const days = customData.d || customData.days
        
        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: ipnData.txn_id,
            amount: parseFloat(ipnData.mc_gross),
            currency: ipnData.mc_currency,
            customerEmail: customerEmail,
            customerName: customerName,
            passType: passType,
            guests: guests,
            days: days,
            deliveryType: 'now', // Default to immediate for webhook
            deliveryDate: null,
            deliveryTime: null,
            discountCode: null, // Will be handled by success route
            sellerId: null, // Will be handled by success route
            status: 'PAID'
          }
        })
        
        console.log('📝 ORDER CREATED FROM IPN:', orderRecord.id)
        
        // Handle QR code creation
        if (customData.deliveryType === 'now') {
          await createQRCode(orderRecord)
        } else {
          await scheduleQRCode(orderRecord)
        }
        
        return NextResponse.json({ 
          success: true, 
          orderId: orderRecord.id 
        })
      }
    }
    
    return NextResponse.json({ success: true, message: 'IPN processed' })
  } catch (error) {
    console.error('❌ PayPal IPN processing error:', error)
    return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 })
  }
}

 