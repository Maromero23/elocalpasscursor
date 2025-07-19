import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTING EMAIL SERVICE...')
    
    // Import email service
    const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
    
    // Test email data
    const testEmailData = {
      customerName: 'Test User',
      qrCode: 'TEST_QR_123',
      guests: 1,
      days: 1,
      expiresAt: 'July 20, 2025',
      customerPortalUrl: 'https://example.com/portal',
      language: 'en',
      deliveryMethod: 'DIRECT'
    }
    
    console.log('📧 Creating test email HTML...')
    const emailHtml = createWelcomeEmailHtml(testEmailData)
    console.log(`📧 Email HTML generated - Length: ${emailHtml.length} chars`)
    
    console.log('📧 Attempting to send test email...')
    
    // Try to send test email
    const emailSent = await sendEmail({
      to: 'jorgeruiz23@gmail.com', // Test email address
      subject: 'TEST: ELocalPass Email Service',
      html: emailHtml
    })
    
    console.log(`📧 Email sent result: ${emailSent}`)
    
    return NextResponse.json({
      success: true,
      emailSent: emailSent,
      message: emailSent ? 'Test email sent successfully' : 'Test email failed to send',
      emailHtmlLength: emailHtml.length
    })
    
  } catch (error) {
    console.error('❌ TEST EMAIL ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 