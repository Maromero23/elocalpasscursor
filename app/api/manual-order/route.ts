import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const { 
      paymentId, 
      amount, 
      customerEmail, 
      customerName, 
      passType, 
      guests, 
      days, 
      deliveryType 
    } = await request.json()
    
    console.log('📝 CREATING MANUAL ORDER (v2):', {
      paymentId,
      amount,
      customerEmail,
      customerName,
      passType,
      guests,
      days,
      deliveryType
    })
    
    console.log('🔧 Database sync completed, attempting order creation...')
    
    // Create order record manually
    const orderRecord = await prisma.order.create({
      data: {
        paymentId: paymentId || `MANUAL_${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'USD',
        customerEmail: customerEmail,
        customerName: customerName,
        passType: passType,
        guests: parseInt(guests),
        days: parseInt(days),
        deliveryType: deliveryType,
        deliveryDate: null,
        deliveryTime: null,
        discountCode: null,
        sellerId: 'manual-test',
        status: 'PAID'
      }
    })
    
    console.log('✅ ORDER CREATED:', orderRecord.id)
    
    // Get the first available seller or use system
    const firstSeller = await prisma.user.findFirst({
      where: { role: 'SELLER' }
    })
    
    const validSellerId = firstSeller ? firstSeller.id : 'system'
    console.log('🔍 Using seller ID:', validSellerId)

    // Create QR code immediately (for testing)
    const qrCodeString = `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + (parseInt(days) * 24 * 60 * 60 * 1000))
    
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeString,
        sellerId: validSellerId,
        customerName: customerName,
        customerEmail: customerEmail,
        guests: parseInt(guests),
        days: parseInt(days),
        cost: parseFloat(amount),
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id)

    // Generate magic link token for customer access
    const crypto = require('crypto')
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: customerEmail,
        customerName: customerName,
        expiresAt: tokenExpiresAt
      }
    })

    const magicLinkUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${accessToken}`
    console.log('🔗 Magic link created:', magicLinkUrl)

    // Send welcome email using the existing system
    let emailSent = false
    try {
      const { sendWelcomeEmailWithTemplates } = await import('@/lib/email-service')
      
      emailSent = await sendWelcomeEmailWithTemplates({
        customerName: customerName,
        customerEmail: customerEmail,
        qrCode: qrCodeString,
        guests: parseInt(guests),
        days: parseInt(days),
        expiresAt: expiresAt,
        magicLinkUrl: magicLinkUrl,
        customerLanguage: 'en',
        deliveryMethod: 'DIRECT',
        savedConfigId: firstSeller?.savedConfigId || undefined
      })
      
      if (emailSent) {
        console.log('✅ Welcome email sent successfully')
      } else {
        console.log('❌ Welcome email failed to send')
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId: orderRecord.id,
      qrCodeId: qrCode.id,
      qrCode: qrCode.code
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ MANUAL ORDER ERROR:', error)
    return NextResponse.json({ error: 'Failed to create manual order' }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
} 