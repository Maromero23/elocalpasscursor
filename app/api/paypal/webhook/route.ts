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
            sellerId: null, // PayPal orders don't have a specific seller
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
    
    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: 'cmc4ha7l000086a96ef0e06qq', // Use existing seller for PayPal orders
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
    
    console.log('✅ QR CODE CREATED:', qrCode.id)
    
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
    
    // Determine seller information for PayPal orders
    let sellerId = 'cmc4ha7l000086a96ef0e06qq' // Default system seller ID
    let sellerName = 'Direct Purchase'
    let sellerEmail = 'directsale@elocalpass.com'
    
    // Check if customer came from a specific seller (rebuy email or discount code)
    if (orderRecord.sellerId) {
      console.log('🔍 PayPal webhook: Customer came from seller:', orderRecord.sellerId)
      
      // Get seller details from database
      const sellerDetails = await prisma.user.findUnique({
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
      }
    } else {
      console.log('📋 PayPal webhook: Direct purchase from passes page')
    }
    
    // Create analytics record with proper seller information and Cancun timezone
    const now = new Date()
    const cancunTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Cancun"}))
    
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
        locationId: null,
        locationName: null,
        distributorId: null,
        distributorName: null,
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
        rebuyEmailScheduled: false,
        createdAt: cancunTime, // Use Cancun timezone
        updatedAt: cancunTime
      }
    })
    
    // Send welcome email using the proper email service with PayPal-specific template
    const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
    
    const customerLanguage = 'en' // Default language for PayPal orders
    
    // Get the PayPal-specific template (NEWEST one if multiple exist)
    const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { 
        name: {
          contains: 'Paypal welcome email template'
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
      const emailHtml = paypalTemplate.customHTML
        .replace(/\{customerName\}/g, orderRecord.customerName)
        .replace(/\{qrCode\}/g, qrCodeId)
        .replace(/\{guests\}/g, orderRecord.guests.toString())
        .replace(/\{days\}/g, orderRecord.days.toString())
        .replace(/\{expirationDate\}/g, formattedExpirationDate)
        .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
        .replace(/\{magicLink\}/g, magicLinkUrl)
      
      const emailSubject = paypalTemplate.subject
        .replace(/\{customerName\}/g, orderRecord.customerName)
        .replace(/\{qrCode\}/g, qrCodeId)
      
      // Send email
      const emailSent = await sendEmail({
        to: orderRecord.customerEmail,
        subject: emailSubject,
        html: emailHtml
      })
      
      console.log(`📧 PayPal welcome email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
      
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
    const scheduledQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: deliveryDateTime,
        clientName: orderRecord.customerName,
        clientEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        sellerId: orderRecord.sellerId || 'system',
        configurationId: 'default',
        deliveryMethod: 'DIRECT',
        isProcessed: false
      }
    })
    
    console.log('✅ QR CODE SCHEDULED:', scheduledQR.id)
    
    // Use our existing QStash system for exact-time scheduling
    const delay = deliveryDateTime.getTime() - Date.now()
    
    if (delay > 0 && process.env.QSTASH_TOKEN) {
      try {
        // Schedule exact processing with Upstash QStash V2 (same as seller dashboard)
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
        
        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: ipnData.txn_id,
            amount: parseFloat(ipnData.mc_gross),
            currency: ipnData.mc_currency,
            customerEmail: customData.customerEmail,
            customerName: customData.customerName,
            passType: customData.passType,
            guests: customData.guests,
            days: customData.days,
            deliveryType: customData.deliveryType,
            deliveryDate: customData.deliveryDate,
            deliveryTime: customData.deliveryTime,
            discountCode: customData.discountCode,
            sellerId: null, // PayPal orders don't have a specific seller
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

 