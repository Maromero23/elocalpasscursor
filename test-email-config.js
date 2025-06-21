// Simple email configuration test
console.log('🔍 EMAIL CONFIGURATION CHECK')
console.log('================================')

// Check environment variables
console.log('Environment Variables:')
console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Not set'}`)
console.log(`GMAIL_PASS: ${process.env.GMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_FROM_ADDRESS: ${process.env.EMAIL_FROM_ADDRESS ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST ? '✅ Set' : '❌ Not set'}`)
console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT ? '✅ Set' : '❌ Not set'}`)
console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`)
console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`)

console.log('\n📧 RECOMMENDED EMAIL SETUP:')
console.log('================================')
console.log('For info@elocalpass.com, you need to configure:')
console.log('1. Gmail SMTP (if using Gmail):')
console.log('   EMAIL_HOST=smtp.gmail.com')
console.log('   EMAIL_PORT=587')
console.log('   EMAIL_USER=info@elocalpass.com')
console.log('   EMAIL_PASS=your_app_password')
console.log('   FROM_EMAIL=info@elocalpass.com')
console.log('')
console.log('2. Or use SendGrid API:')
console.log('   SENDGRID_API_KEY=your_sendgrid_api_key')
console.log('   FROM_EMAIL=info@elocalpass.com')
console.log('')
console.log('3. Or use Resend API:')
console.log('   RESEND_API_KEY=your_resend_api_key')
console.log('   FROM_EMAIL=info@elocalpass.com')

// Determine current status
const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_PASS
const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS
const hasSendGrid = process.env.SENDGRID_API_KEY
const hasResend = process.env.RESEND_API_KEY

console.log('\n🔍 CURRENT EMAIL SERVICE STATUS:')
console.log('================================')
if (hasGmailConfig) {
  console.log('✅ Gmail SMTP Configuration Found!')
  console.log(`   User: ${process.env.GMAIL_USER}`)
  console.log(`   From: ${process.env.EMAIL_FROM_ADDRESS || 'Not set'}`)
} else if (hasEmailConfig) {
  console.log('✅ Generic SMTP Configuration Found!')
  console.log(`   User: ${process.env.EMAIL_USER}`)
} else if (hasSendGrid) {
  console.log('✅ SendGrid Configuration Found!')
} else if (hasResend) {
  console.log('✅ Resend Configuration Found!')
} else {
  console.log('🚨 NO EMAIL SERVICE CONFIGURED')
  console.log('This is why welcome emails are not being sent!')
} 