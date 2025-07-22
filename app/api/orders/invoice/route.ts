import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`📄 Generating invoice URL for order: ${orderId}`)
    
    // Generate the invoice URL pointing to our PDF route
    const baseUrl = process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'
    const invoiceUrl = `${baseUrl}/api/orders/invoice/${orderId}/pdf`
    
    console.log(`✅ Invoice URL generated: ${invoiceUrl}`)
    
    return NextResponse.json({
      success: true,
      invoiceUrl: invoiceUrl
    })
    
  } catch (error) {
    console.error('❌ Error generating invoice URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
} 