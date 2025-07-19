import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Handle POST request from PayPal and redirect to payment success page
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    console.log('📨 PayPal Success POST Request:', {
      params: Object.fromEntries(searchParams.entries())
    })
    
    // Build redirect URL to payment success page
    const redirectUrl = new URL('/payment-success', url.origin)
    
    // Copy all search parameters
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    
    console.log('🔄 Redirecting to:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ PayPal success POST error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests the same way
  return POST(request)
} 