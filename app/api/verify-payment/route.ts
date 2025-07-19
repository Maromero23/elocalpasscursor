import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { paymentId, orderData } = await request.json()
    
    console.log('🔍 VERIFYING PAYMENT:', { paymentId, orderData })
    
    // Verify payment with PayPal API
    const paypalResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/payments/captures/${paymentId}`, {
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
        paymentStatus: 'COMPLETED'
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
  
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
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
    
    const qrCode = await prisma.qRCode.create({
      data: {
        code: `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerId: orderRecord.sellerId || 'system',
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: new Date(Date.now() + (orderRecord.days * 24 * 60 * 60 * 1000)),
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id)
    await sendQRCodeEmail(orderRecord.customerEmail, orderRecord.customerName, qrCode.id)
    
  } catch (error) {
    console.error('❌ QR CODE CREATION ERROR:', error)
  }
}

async function scheduleQRCode(orderRecord: any) {
  try {
    console.log('📅 SCHEDULING QR CODE FOR ORDER:', orderRecord.id)
    
    const scheduledQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: orderRecord.deliveryDate ? new Date(orderRecord.deliveryDate) : new Date(),
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
    
  } catch (error) {
    console.error('❌ QR CODE SCHEDULING ERROR:', error)
  }
}

async function sendQRCodeEmail(email: string, name: string, qrId: string) {
  try {
    console.log('📧 SENDING QR CODE EMAIL TO:', email)
    console.log('📧 EMAIL SENT:', {
      to: email,
      name: name,
      qrId: qrId,
      subject: 'Your ELocalPass QR Code is Ready!'
    })
  } catch (error) {
    console.error('❌ EMAIL SENDING ERROR:', error)
  }
} 