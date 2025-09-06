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
    
    console.log('📝 CREATING SIMPLE MANUAL ORDER:', {
      paymentId,
      amount,
      customerEmail,
      customerName,
      passType,
      guests,
      days,
      deliveryType
    })
    
    // Get the first available seller
    const firstSeller = await prisma.user.findFirst({
      where: { role: 'SELLER' }
    })
    
    const validSellerId = firstSeller ? firstSeller.id : 'system'
    console.log('🔍 Using seller ID:', validSellerId)

    // Create QR code
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

    // Generate magic link token
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

    const magicLinkUrl = `https://elocalpasscursor.vercel.app/customer/access?token=${accessToken}`
    console.log('🔗 Magic link created:', magicLinkUrl)

    // Send simple welcome email
    let emailSent = false
    try {
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      
      const emailHtml = createWelcomeEmailHtml({
        customerName: customerName,
        qrCode: qrCodeString,
        guests: parseInt(guests),
        days: parseInt(days),
        expiresAt: expiresAt.toLocaleDateString(),
        customerPortalUrl: magicLinkUrl,
        language: 'en',
        deliveryMethod: 'DIRECT'
      })
      
      emailSent = await sendEmail({
        to: customerEmail,
        subject: 'Your ELocalPass is Ready!',
        html: emailHtml
      })
      
      console.log(`📧 Welcome email sent: ${emailSent ? 'SUCCESS' : 'FAILED'}`)
      
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId: `manual_${Date.now()}`,
      qrCodeId: qrCode.id,
      qrCode: qrCodeString,
      magicLink: magicLinkUrl,
      emailSent: emailSent,
      method: 'simple'
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ SIMPLE MANUAL ORDER ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to create simple manual order',
      details: error instanceof Error ? error.message : 'Unknown error'
    } finally {
    await prisma.$disconnect()
  }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
} 