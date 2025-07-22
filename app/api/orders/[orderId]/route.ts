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
    
    console.log('📋 Order found:', {
      id: order.id,
      customerName: order.customerName,
      paymentId: order.paymentId,
      status: order.status
    })
    
    // NOTE: Welcome emails are sent when QR codes are created in the PayPal success route
    // This route is only for fetching order details for the payment success page display
    
    return NextResponse.json(
      { 
        success: true,
        order: order
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('❌ Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
} 