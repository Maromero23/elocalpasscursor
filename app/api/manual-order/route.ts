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
    
    console.log('📝 CREATING MANUAL ORDER:', {
      paymentId,
      amount,
      customerEmail,
      customerName,
      passType,
      guests,
      days,
      deliveryType
    })
    
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
    
    // Create QR code immediately (for testing)
    const qrCode = await prisma.qRCode.create({
      data: {
        code: `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sellerId: 'manual-test',
        customerName: customerName,
        customerEmail: customerEmail,
        guests: parseInt(guests),
        days: parseInt(days),
        cost: parseFloat(amount),
        expiresAt: new Date(Date.now() + (parseInt(days) * 24 * 60 * 60 * 1000)),
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id)
    
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