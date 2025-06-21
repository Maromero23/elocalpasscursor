// Test email functionality for jorgeruiz23@gmail.com
const { sendEmail, createWelcomeEmailHtml } = require('./lib/email-service')

async function testEmailToJorge() {
  console.log('🧪 Testing Email Service for jorgeruiz23@gmail.com\n')
  
  // Check environment variables
  console.log('📋 Environment Check:')
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`)
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log()
  
  // Test email data for Jorge
  const testData = {
    customerName: 'Jorge Ruiz',
    qrCode: 'EL-TEST-JORGE-123456',
    guests: 4,
    days: 5,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    customerPortalUrl: 'https://elocalpasscursor.vercel.app/customer/access?token=test-token-jorge',
    language: 'en',
    deliveryMethod: 'URLS'
  }
  
  // Create email HTML
  console.log('📧 Creating email template for Jorge...')
  const emailHtml = createWelcomeEmailHtml(testData)
  console.log('✅ Email template created')
  
  // Send test email to Jorge
  const testEmail = 'jorgeruiz23@gmail.com'
  
  console.log(`📤 Sending test email to: ${testEmail}`)
  
  try {
    const success = await sendEmail({
      to: testEmail,
      subject: 'Test ELocalPass - Your Pass is Ready!',
      html: emailHtml
    })
    
    if (success) {
      console.log('✅ SUCCESS! Email sent to jorgeruiz23@gmail.com')
      console.log('📧 Check your email inbox!')
    } else {
      console.log('❌ FAILED! Email could not be sent')
      console.log('🔧 Check your email configuration')
    }
  } catch (error) {
    console.error('💥 ERROR sending email:', error)
  }
}

// Run the test
testEmailToJorge().catch(console.error) 