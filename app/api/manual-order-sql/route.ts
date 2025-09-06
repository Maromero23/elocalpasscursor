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
    
    console.log('📝 CREATING MANUAL ORDER WITH SQL:', {
      paymentId,
      amount,
      customerEmail,
      customerName,
      passType,
      guests,
      days,
      deliveryType
    })
    
    // Create order record using raw SQL
    const orderResult = await prisma.$executeRaw`
      INSERT INTO orders (id, "paymentId", amount, currency, "customerEmail", "customerName", "passType", guests, days, "deliveryType", "sellerId", status, "createdAt", "updatedAt")
      VALUES (
        ${`order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`},
        ${paymentId || `MANUAL_${Date.now()}`},
        ${parseFloat(amount)},
        'USD',
        ${customerEmail},
        ${customerName},
        ${passType},
        ${parseInt(guests)},
        ${parseInt(days)},
        ${deliveryType},
        'manual-test',
        'PAID',
        NOW(),
        NOW()
      )
    `
    
    console.log('✅ ORDER CREATED WITH SQL:', orderResult)
    
    // Create QR code using Prisma (this model works)
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
      orderId: `manual_${Date.now()}`,
      qrCodeId: qrCode.id,
      qrCode: qrCode.code,
      method: 'raw_sql'
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('❌ MANUAL ORDER SQL ERROR:', error)
    return NextResponse.json({ 
      error: 'Failed to create manual order with SQL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
} 