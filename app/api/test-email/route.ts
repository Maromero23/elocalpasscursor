import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, createWelcomeEmailHtml } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email service...')
    
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
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0)
    console.log('GMAIL_USER value:', process.env.GMAIL_USER)
    console.log('GMAIL_PASS length:', process.env.GMAIL_PASS?.length || 0)
    
    if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY && !process.env.GMAIL_USER && !process.env.EMAIL_USER) {
      return NextResponse.json({ 
        error: 'No email service configured (Resend, SendGrid, or Gmail)',
        envCheck 
      }, { status: 500 })
    }
    
    // Create simple test email HTML
    const simpleEmailHtml = `
      <h1>🧪 ELocalPass Email Test</h1>
      <p>This is a test email from ELocalPass.</p>
      <p>If you receive this, the email system is working!</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `
    
    // Send test email with detailed error capture
    let emailSent = false
    let emailError = null
    let emailResult = null
    
    try {
      console.log('🚀 Attempting to send email...')
      emailResult = await sendEmail({
        to: 'jorgeruiz23@gmail.com',
        subject: '🧪 Simple Email Test - ELocalPass',
        html: simpleEmailHtml
      })
      emailSent = true
      console.log('✅ Email sent successfully!')
    } catch (error) {
      emailSent = false
      emailError = error instanceof Error ? error.message : 'Unknown email error'
      console.error('❌ Email sending error:', error)
    }
    
    // Determine actual from address being used (same logic as email-service.ts)
    let actualFromAddress = process.env.FROM_EMAIL
    if (false && process.env.RESEND_API_KEY) {
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
      emailResult,
      credentials: {
        service: (false && process.env.RESEND_API_KEY) ? 'Resend' : process.env.SENDGRID_API_KEY ? 'SendGrid' : 'Gmail/SMTP',
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