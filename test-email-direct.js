// Direct email test using nodemailer
const nodemailer = require('nodemailer')

async function testDirectEmail() {
  console.log('🧪 DIRECT EMAIL TEST')
  console.log('===================')
  
  // Check environment variables
  console.log('Environment Check:')
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Not set'}`)
  console.log(`GMAIL_PASS: ${process.env.GMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
  console.log(`EMAIL_FROM_ADDRESS: ${process.env.EMAIL_FROM_ADDRESS ? '✅ Set' : '❌ Not set'}`)
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log('❌ Missing Gmail credentials - cannot test email sending')
    return
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
    
    console.log('\n📧 Sending test email...')
    
    // Send test email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER,
      to: 'jorgeruiz23@gmail.com',
      subject: '🧪 ELocalPass Email Test - Direct SMTP',
      html: `
        <h2>🎉 Email Service Test Successful!</h2>
        <p>This is a direct test of the ELocalPass email system.</p>
        <p><strong>From:</strong> ${process.env.EMAIL_FROM_ADDRESS || process.env.GMAIL_USER}</p>
        <p><strong>Service:</strong> Gmail SMTP</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>If you received this email, the SMTP configuration is working correctly!</p>
      `
    })
    
    console.log('✅ Email sent successfully!')
    console.log(`📬 Message ID: ${result.messageId}`)
    console.log('📧 Check jorgeruiz23@gmail.com inbox (and spam folder)')
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message)
    console.error('Full error:', error)
  }
}

// Set environment variables for testing (use your Vercel values)
process.env.GMAIL_USER = 'info@elocalpass.com'
process.env.GMAIL_PASS = 'xvzuemigaxgkmxfv'
process.env.EMAIL_FROM_ADDRESS = 'info@elocalpass.com'

testDirectEmail() 