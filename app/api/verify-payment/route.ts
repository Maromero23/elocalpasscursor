import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderData } = await request.json()
    
    console.log('🔍 VERIFYING PAYMENT:', { paymentId, orderData })
    
    // Verify payment with PayPal API
    const paypalResponse = await fetch(`https://api-m.paypal.com/v2/payments/captures/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!paypalResponse.ok) {
      console.error('❌ PayPal API error:', paypalResponse.status)
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 400 })
    }
    
    const paymentDetails = await paypalResponse.json()
    console.log('💰 PAYMENT DETAILS:', paymentDetails)
    
    // Check if payment is completed
    if (paymentDetails.status === 'COMPLETED') {
      console.log('✅ PAYMENT VERIFIED AS COMPLETED')
      
      // Create order record
      const orderRecord = await prisma.order.create({
        data: {
          paymentId: paymentId,
          amount: parseFloat(paymentDetails.amount.value),
          currency: paymentDetails.amount.currency_code,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          passType: orderData.passType,
          guests: orderData.guests,
          days: orderData.days,
          deliveryType: orderData.deliveryType,
          deliveryDate: orderData.deliveryDate,
          deliveryTime: orderData.deliveryTime,
          discountCode: orderData.discountCode,
          sellerId: orderData.sellerId,
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
      
      return NextResponse.json({ 
        success: true, 
        orderId: orderRecord.id,
        paymentStatus: 'COMPLETED',
        redirectUrl: `${process.env.NEXTAUTH_URL}/payment-success?orderId=${orderRecord.id}`
      })
    } else {
      console.log('❌ PAYMENT NOT COMPLETED:', paymentDetails.status)
      return NextResponse.json({ 
        success: false, 
        paymentStatus: paymentDetails.status 
      })
    }
    
  } catch (error) {
    console.error('❌ PAYMENT VERIFICATION ERROR:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}

async function getPayPalAccessToken() {
  const clientId = 'AVhVRUYbs8mzjMm4X6_BwvaA9dT4-9KOImWI5gN3kQCPawuDdTx1IRAOeeyzE3lh81_MJsiHsg8Q2Mn9'
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'your-client-secret'
  
      const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  return data.access_token
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
        sellerId: orderRecord.sellerId || 'system',
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
    
    // Send welcome email using the proper email service with default template
    const { sendWelcomeEmailWithTemplates } = await import('@/lib/email-service')
    
    const customerLanguage = 'en' // Default language for PayPal orders
    
    const emailSent = await sendWelcomeEmailWithTemplates({
      customerName: orderRecord.customerName,
      customerEmail: orderRecord.customerEmail,
      qrCode: qrCodeId,
      guests: orderRecord.guests,
      days: orderRecord.days,
      expiresAt: expiresAt,
      magicLinkUrl: magicLinkUrl,
      customerLanguage: customerLanguage,
      deliveryMethod: 'DIRECT',
      savedConfigId: 'default' // This will trigger the default template
    })
    
    if (emailSent) {
      await prisma.qRCodeAnalytics.updateMany({
        where: { qrCodeId: qrCode.id },
        data: { welcomeEmailSent: true }
      })
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

 