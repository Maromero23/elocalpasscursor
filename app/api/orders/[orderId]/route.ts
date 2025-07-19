import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    
    console.log(`📋 Fetching order details for: ${orderId}`)
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
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
    
    console.log(`✅ Order details retrieved for: ${orderId}`)
    
    return NextResponse.json({
      success: true,
      order: orderDetails
    })
    
  } catch (error) {
    console.error('❌ Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 