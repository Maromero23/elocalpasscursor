// Test email functionality for production deployment
const { sendEmail, createWelcomeEmailHtml } = require('./lib/email-service')

async function testEmailService() {
  console.log('🧪 Testing Email Service\n')
  
  // Check environment variables
  console.log('📋 Environment Check:')
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`)
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log()
  
  // Test email data
  const testData = {
    customerName: 'Test Customer',
    qrCode: 'EL-TEST-123456',
    guests: 2,
    days: 3,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    customerPortalUrl: 'https://your-app.vercel.app/customer/access?token=test-token',
    language: 'en',
    deliveryMethod: 'URLS'
  }
  
  // Create email HTML
  console.log('📧 Creating email template...')
  const emailHtml = createWelcomeEmailHtml(testData)
  console.log('✅ Email template created')
  
  // Test email address (replace with your test email)
  const testEmail = process.env.TEST_EMAIL || 'your-test-email@example.com'
  
  if (testEmail === 'your-test-email@example.com') {
    console.log('⚠️  Please set TEST_EMAIL environment variable to test email sending')
    console.log('   Example: TEST_EMAIL=your-email@gmail.com node test-email-production.js')
    return
  }
  
  console.log(`📤 Sending test email to: ${testEmail}`)
  
  try {
    const success = await sendEmail({
      to: testEmail,
      subject: '🧪 ELocalPass Test Email',
      html: emailHtml
    })
    
    if (success) {
      console.log('✅ Email sent successfully!')
      console.log('📬 Check your inbox and spam folder')
    } else {
      console.log('❌ Email sending failed')
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message)
  }
}

// Run test if called directly
if (require.main === module) {
  testEmailService()
    .then(() => {
      console.log('\n🏁 Email test completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Email test failed:', error)
      process.exit(1)
    })
}

module.exports = { testEmailService } 