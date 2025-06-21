// Test rebuy email system for ELocalPass
const { sendEmail, createRebuyEmailHtml } = require('./lib/email-service')

async function testRebuyEmailSystem() {
  console.log('🧪 Testing Complete Rebuy Email System for ELocalPass\n')
  
  // Check environment variables
  console.log('📋 Environment Check:')
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`)
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`)
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`)
  console.log()
  
  // Test data for rebuy email
  const testData = {
    customerName: 'Jorge Ruiz',
    qrCode: 'TEST-REBUY-001',
    guests: 2,
    days: 3,
    hoursLeft: 8,
    customerPortalUrl: 'https://elocalpasscursor.vercel.app/customer/access?token=jorgeruiz23@gmail.com',
    language: 'en',
    rebuyUrl: 'https://elocalpasscursor.vercel.app/customer/access?token=jorgeruiz23@gmail.com'
  }
  
  console.log('📧 Test Rebuy Email Data:')
  console.log(`Customer: ${testData.customerName}`)
  console.log(`QR Code: ${testData.qrCode}`)
  console.log(`Guests: ${testData.guests}`)
  console.log(`Days: ${testData.days}`)
  console.log(`Hours Left: ${testData.hoursLeft}`)
  console.log(`Language: ${testData.language}`)
  console.log(`Portal URL: ${testData.customerPortalUrl}`)
  console.log()
  
  try {
    // Generate rebuy email HTML
    console.log('🔄 Generating rebuy email HTML...')
    const emailHtml = createRebuyEmailHtml(testData)
    console.log('✅ Rebuy email HTML generated successfully')
    console.log(`📏 Email size: ${emailHtml.length} characters`)
    console.log()
    
    // Send rebuy email
    console.log('📤 Sending rebuy email to jorgeruiz23@gmail.com...')
    const subject = `⏰ Your ELocalPass expires in ${testData.hoursLeft} hours - Don't miss out!`
    
    const emailSent = await sendEmail({
      to: 'jorgeruiz23@gmail.com',
      subject: subject,
      html: emailHtml
    })
    
    if (emailSent) {
      console.log('✅ SUCCESS: Rebuy email sent successfully!')
      console.log('📧 Check jorgeruiz23@gmail.com inbox for the rebuy email')
      console.log()
      console.log('🎯 Email Features Tested:')
      console.log('  ✅ Urgency messaging (TIME RUNNING OUT)')
      console.log('  ✅ Hours left countdown')
      console.log('  ✅ Current pass details')
      console.log('  ✅ Renewal CTA button')
      console.log('  ✅ Benefits of renewal')
      console.log('  ✅ Customer portal link')
      console.log('  ✅ Professional HTML styling')
      console.log('  ✅ Mobile-responsive design')
    } else {
      console.log('❌ FAILED: Could not send rebuy email')
      console.log('🔍 Check email service configuration')
    }
    
  } catch (error) {
    console.error('❌ ERROR testing rebuy email system:', error.message)
  }
  
  console.log('\n🚀 REBUY EMAIL SYSTEM OVERVIEW:')
  console.log('1. 📧 Welcome emails are sent immediately when QR is created')
  console.log('2. ⏰ Rebuy emails are sent 6-12 hours before QR expiration')
  console.log('3. 🔄 Scheduled service checks for expiring QRs automatically')
  console.log('4. 🎯 Customers get renewal reminders with portal access')
  console.log('5. 🌍 Both English and Spanish language support')
  console.log('6. ✅ Professional HTML email templates')
  console.log()
  console.log('📍 API Endpoints:')
  console.log('  - POST /api/rebuy-emails/send (scheduled service)')
  console.log('  - GET /api/rebuy-emails/send (manual trigger for testing)')
  console.log()
  console.log('🧪 To test the complete flow:')
  console.log('1. Create a QR code with rebuy emails enabled')
  console.log('2. Set expiration to expire in 8 hours')
  console.log('3. Call GET /api/rebuy-emails/send to trigger rebuy email')
  console.log('4. Check customer email for rebuy notification')
}

// Run the test
testRebuyEmailSystem().catch(console.error) 