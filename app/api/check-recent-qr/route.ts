import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING RECENT QR CODE CREATION...')
    
    // Get the most recent QR code (should be the one you just created)
    const recentQR = await prisma.qRCode.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        analytics: true
      }
    })
    
    if (!recentQR) {
      return NextResponse.json({ error: 'No QR codes found' }, { status: 404 })
    }
    
    console.log('📋 Most recent QR code:', recentQR.code)
    
    // Check if this QR has analytics (which includes email status)
    const analytics = recentQR.analytics
    
    // Also check if there are any recent orders
    const recentOrder = await prisma.order.findFirst({
      where: {
        customerEmail: recentQR.customerEmail || undefined
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const result = {
      qrCode: {
        code: recentQR.code,
        customerName: recentQR.customerName,
        customerEmail: recentQR.customerEmail,
        cost: recentQR.cost,
        createdAt: recentQR.createdAt,
        sellerId: recentQR.sellerId
      },
      analytics: analytics ? {
        welcomeEmailSent: analytics.welcomeEmailSent,
        deliveryMethod: analytics.deliveryMethod
      } : null,
      recentOrder: recentOrder ? {
        id: recentOrder.id,
        paymentId: recentOrder.paymentId,
        status: recentOrder.status,
        createdAt: recentOrder.createdAt
      } : null,
      message: `QR Code: ${recentQR.code} - Email sent: ${analytics?.welcomeEmailSent ? 'YES' : 'NO'}`
    }
    
    console.log('📧 Recent QR analysis:', result)
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error checking recent QR:', error)
    return NextResponse.json(
      { error: 'Failed to check recent QR', details: error } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 