import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Handle POST request to payment-success by redirecting to GET
    const url = new URL(request.url)
    console.log('📨 Payment Success POST Request - Redirecting to GET')
    return NextResponse.redirect(url, 302)
  } catch (error) {
    console.error('❌ Payment success POST error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  }
}

// GET requests are handled by the page component
export async function GET(request: NextRequest) {
  return NextResponse.next()
} 