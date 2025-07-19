import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Handle POST request from PayPal and process the payment
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    console.log('📨 PayPal Success POST Request:', {
      params: Object.fromEntries(searchParams.entries())
    })

    // Check if we have order data from the return URL
    const orderDataParam = searchParams.get('orderData')
    const amountParam = searchParams.get('amount')
    
    if (orderDataParam) {
      console.log('💰 Processing PayPal payment from return URL...')
      
      try {
        const orderData = JSON.parse(orderDataParam)
        console.log('📋 Order data from URL:', orderData)

        // Generate a transaction ID since PayPal doesn't provide one reliably
        const txnId = `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Check if we already processed this order (by email and amount to avoid duplicates)
        const existingOrder = await prisma.order.findFirst({
          where: { 
            customerEmail: orderData.customerEmail,
            amount: parseFloat(amountParam || orderData.calculatedPrice.toString()),
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
            }
          }
        })

        if (existingOrder) {
          console.log('⚠️ Similar payment found recently, redirecting to success page')
          const redirectUrl = new URL('/payment-success', url.origin)
          redirectUrl.searchParams.set('orderId', existingOrder.id)
          return NextResponse.redirect(redirectUrl)
        }

        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: txnId,
            amount: parseFloat(amountParam || orderData.calculatedPrice.toString()),
            currency: 'USD',
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            passType: orderData.passType,
            guests: orderData.guests,
            days: orderData.days,
            deliveryType: orderData.deliveryType,
            deliveryDate: orderData.deliveryDate,
            deliveryTime: orderData.deliveryTime,
            discountCode: orderData.discountCode,
            sellerId: null, // PayPal orders don't have a specific seller
            status: 'PAID'
          }
        })

        console.log('📝 ORDER CREATED:', orderRecord.id)

        // Handle QR code creation based on delivery type
        if (orderData.deliveryType === 'now') {
          await createQRCode(orderRecord)
        } else {
          await scheduleQRCode(orderRecord)
        }

        // Redirect to payment success page with order ID
        const redirectUrl = new URL('/payment-success', url.origin)
        redirectUrl.searchParams.set('orderId', orderRecord.id)
        console.log('🔄 Redirecting to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)

      } catch (error) {
        console.error('❌ Error processing PayPal payment:', error)
      }
    }

    // Fallback: Check if we can process this payment from PayPal POST data
    const paymentStatus = searchParams.get('payment_status')
    const txnId = searchParams.get('txn_id')
    const customData = searchParams.get('custom')
    const mcGross = searchParams.get('mc_gross')
    const mcCurrency = searchParams.get('mc_currency')
    
    console.log('📊 PayPal Payment Data:', {
      paymentStatus,
      txnId,
      customData,
      mcGross,
      mcCurrency
    })

    if (paymentStatus === 'Completed' && txnId && customData) {
      console.log('💰 Processing completed PayPal payment from POST data...')
      
      try {
        const orderData = JSON.parse(customData)
        console.log('📋 Order data:', orderData)

        // Check if we already processed this transaction
        const existingOrder = await prisma.order.findFirst({
          where: { paymentId: txnId }
        })

        if (existingOrder) {
          console.log('⚠️ Payment already processed, redirecting to success page')
          const redirectUrl = new URL('/payment-success', url.origin)
          redirectUrl.searchParams.set('orderId', existingOrder.id)
          return NextResponse.redirect(redirectUrl)
        }

        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: txnId,
            amount: parseFloat(mcGross || orderData.calculatedPrice.toString()),
            currency: mcCurrency || 'USD',
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            passType: orderData.passType,
            guests: orderData.guests,
            days: orderData.days,
            deliveryType: orderData.deliveryType,
            deliveryDate: orderData.deliveryDate,
            deliveryTime: orderData.deliveryTime,
            discountCode: orderData.discountCode,
            sellerId: null, // PayPal orders don't have a specific seller
            status: 'PAID'
          }
        })

        console.log('📝 ORDER CREATED:', orderRecord.id)

        // Handle QR code creation based on delivery type
        if (orderData.deliveryType === 'now') {
          await createQRCode(orderRecord)
        } else {
          await scheduleQRCode(orderRecord)
        }

        // Redirect to payment success page with order ID
        const redirectUrl = new URL('/payment-success', url.origin)
        redirectUrl.searchParams.set('orderId', orderRecord.id)
        console.log('🔄 Redirecting to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)

      } catch (error) {
        console.error('❌ Error processing PayPal payment:', error)
      }
    }

    // Build redirect URL to payment success page with all parameters
    const redirectUrl = new URL('/payment-success', url.origin)
    
    // Copy all search parameters
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })

    console.log('🔄 Redirecting to:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ PayPal success POST error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests the same way
  return POST(request)
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
    
    // Create analytics record
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
        sellerId: orderRecord.sellerId || 'system',
        sellerName: 'ELocalPass System',
        sellerEmail: 'system@elocalpass.com',
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
        rebuyEmailScheduled: false
      }
    })
    
    // Send welcome email using simple working approach
    let emailSent = false
    try {
      // Import email service and translations
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      const { formatDate } = await import('@/lib/translations')
      
      const customerLanguage = 'en' // Default language for PayPal orders
      const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
      
      console.log('📧 Creating welcome email with working template system...')
      
      // Use the simple working email template
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
      
      console.log(`📧 Generated welcome email HTML - Length: ${emailHtml.length} chars`)

      // Send the email
      emailSent = await sendEmail({
        to: orderRecord.customerEmail,
        subject: 'Your ELocalPass is Ready - Immediate Access',
        html: emailHtml
      })

      if (emailSent) {
        console.log(`✅ Welcome email sent successfully to ${orderRecord.customerEmail}`)
        
        // Update analytics record to reflect email was sent
        await prisma.qRCodeAnalytics.updateMany({
          where: { qrCodeId: qrCode.id },
          data: { welcomeEmailSent: true }
        })
      } else {
        console.error(`❌ Failed to send welcome email to ${orderRecord.customerEmail}`)
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
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
    
    // Use our existing QStash system for exact-time scheduling [[memory:3709459]]
    const delay = deliveryDateTime.getTime() - Date.now()
    
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