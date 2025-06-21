import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, createWelcomeEmailHtml } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Resend email service with default domain...')
    
    // Check environment variables
    const envCheck = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_PASS: !!process.env.GMAIL_PASS,
      EMAIL_FROM_ADDRESS: !!process.env.EMAIL_FROM_ADDRESS,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
    }
    
    console.log('Environment variables check:', envCheck)
    
    if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY && !process.env.GMAIL_USER && !process.env.EMAIL_USER) {
      return NextResponse.json({ 
        error: 'No email service configured (Resend, SendGrid, or Gmail)',
        envCheck 
      }, { status: 500 })
    }
    
    // Create test email HTML
    const emailHtml = createWelcomeEmailHtml({
      customerName: 'Test User',
      qrCode: 'TEST-123456',
      guests: 2,
      days: 3,
      expiresAt: new Date().toLocaleDateString(),
      customerPortalUrl: 'https://elocalpasscursor.vercel.app/customer/access?token=test',
      language: 'en',
      deliveryMethod: 'PORTAL'
    })
    
    // Send test email with detailed error capture
    let emailSent = false
    let emailError = null
    
    try {
      emailSent = await sendEmail({
        to: 'jorgeruiz23@gmail.com',
        subject: '🧪 Production Email Test - ELocalPass',
        html: emailHtml
      })
      emailSent = true // If no error was thrown, email was sent successfully
    } catch (error) {
      emailSent = false
      emailError = error instanceof Error ? error.message : 'Unknown email error'
      console.error('Email sending error:', error)
    }
    
    // Determine actual from address being used (same logic as email-service.ts)
    let actualFromAddress = process.env.FROM_EMAIL
    if (process.env.RESEND_API_KEY) {
      actualFromAddress = 'ELocalPass <onboarding@resend.dev>'
    } else if (!actualFromAddress) {
      actualFromAddress = process.env.EMAIL_FROM_ADDRESS || 'info@elocalpass.com'
    }

    return NextResponse.json({
      success: emailSent,
      message: emailSent 
        ? 'Test email sent successfully! Check jorgeruiz23@gmail.com' 
        : 'Failed to send test email',
      envCheck,
      emailError,
      credentials: {
        service: process.env.RESEND_API_KEY ? 'Resend' : process.env.SENDGRID_API_KEY ? 'SendGrid' : 'Gmail/SMTP',
        user: process.env.GMAIL_USER || process.env.EMAIL_USER || 'resend',
        hasPass: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.GMAIL_PASS || process.env.EMAIL_PASS),
        fromAddress: actualFromAddress,
        usingGmailVars: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS)
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 