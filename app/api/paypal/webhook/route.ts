import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = request.headers
    
    // Verify PayPal webhook signature (you should implement proper verification)
    // For now, we'll process the webhook directly
    
    const webhookData = JSON.parse(body)
    console.log('🔔 PAYPAL WEBHOOK:', webhookData.event_type)
    
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
            sellerId: customData.sellerId,
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
        
        return NextResponse.json({ success: true, orderId: orderRecord.id })
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
    
    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique code
        sellerId: orderRecord.sellerId || 'system',
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: new Date(Date.now() + (orderRecord.days * 24 * 60 * 60 * 1000)), // days from now
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id)
    
    // Send email with QR code (implement your email service)
    await sendQRCodeEmail(orderRecord.customerEmail, orderRecord.customerName, qrCode.id)
    
  } catch (error) {
    console.error('❌ QR CODE CREATION ERROR:', error)
  }
}

async function scheduleQRCode(orderRecord: any) {
  try {
    console.log('📅 SCHEDULING QR CODE FOR ORDER:', orderRecord.id)
    
    // Create scheduled QR configuration
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
    
    // Implement your email service here
    // For now, just log the action
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