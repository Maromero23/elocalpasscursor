import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return handlePayPalReturn(request)
}

export async function POST(request: NextRequest) {
  return handlePayPalReturn(request)
}

async function handlePayPalReturn(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // Log all PayPal return parameters
    console.log('📨 PayPal Return Data:', {
      method: request.method,
      params: Object.fromEntries(searchParams.entries())
    })
    
    // Extract PayPal parameters
    const paypalTxId = searchParams.get('tx')
    const paypalStatus = searchParams.get('st')
    const paypalAmount = searchParams.get('amt')
    const payerId = searchParams.get('PayerID')
    const paymentStatus = searchParams.get('payment_status')
    
    // Build redirect URL with PayPal parameters
    const redirectUrl = new URL('/payment-success', url.origin)
    
    if (paypalTxId) redirectUrl.searchParams.set('tx', paypalTxId)
    if (paypalStatus) redirectUrl.searchParams.set('st', paypalStatus)
    if (paypalAmount) redirectUrl.searchParams.set('amt', paypalAmount)
    if (payerId) redirectUrl.searchParams.set('PayerID', payerId)
    if (paymentStatus) redirectUrl.searchParams.set('payment_status', paymentStatus)
    
    console.log('🔄 Redirecting to:', redirectUrl.toString())
    
    // Redirect to payment success page with parameters
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ PayPal return processing error:', error)
    
    // Fallback redirect to payment success page
    const fallbackUrl = new URL('/payment-success', request.url)
    return NextResponse.redirect(fallbackUrl)
  }
} 