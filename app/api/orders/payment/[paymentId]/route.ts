import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params
    
    console.log(`📋 Fetching order by payment ID: ${paymentId}`)
    
    const order = await prisma.order.findUnique({
      where: { paymentId: paymentId }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Calculate discount amount if discount code was used
    let discountAmount = 0
    if (order.discountCode) {
      // This would need to be calculated based on your discount logic
      // For now, we'll set it to 0
      discountAmount = 0
    }
    
    const orderDetails = {
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.amount,
      currency: order.currency,
      guests: order.guests,
      days: order.days,
      deliveryType: order.deliveryType,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      discountCode: order.discountCode,
      discountAmount: discountAmount,
      status: order.status,
      createdAt: order.createdAt
    }
    
    console.log(`✅ Order details retrieved for payment ID: ${paymentId}`)
    
    return NextResponse.json({
      success: true,
      order: orderDetails
    })
    
  } catch (error) {
    console.error('❌ Error fetching order by payment ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 