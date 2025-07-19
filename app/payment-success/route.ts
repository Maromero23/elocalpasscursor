import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Handle POST request to payment-success
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    console.log('📨 Payment Success POST Request:', {
      params: Object.fromEntries(searchParams.entries())
    })
    
    // Redirect to GET version of the same URL
    return NextResponse.redirect(url, 302)
    
  } catch (error) {
    console.error('❌ Payment success POST error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  }
}

export async function GET(request: NextRequest) {
  // For GET requests, let the page component handle it
  return NextResponse.next()
} 