import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderData } = await request.json()
    
    console.log('📝 CREATING PAYPAL ORDER:', orderData)
    
    // This endpoint is not actually needed for the test page
    // The PayPal SDK handles order creation directly
    // But we'll return a success response for compatibility
    
    return NextResponse.json({ 
      success: true, 
      orderId: `test-order-${Date.now()}`,
      message: 'Order creation handled by PayPal SDK'
    })
    
  } catch (error) {
    console.error('❌ CREATE ORDER ERROR:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
} 