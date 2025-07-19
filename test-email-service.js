const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEmailService() {
  try {
    console.log('🧪 Testing Email Service...')
    
    // Test 1: Check if default template exists
    console.log('\n1. Checking default welcome email template...')
    const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { isDefault: true }
    })
    
    if (defaultTemplate) {
      console.log('✅ Default template found:')
      console.log(`   - ID: ${defaultTemplate.id}`)
      console.log(`   - Name: ${defaultTemplate.name}`)
      console.log(`   - Subject: ${defaultTemplate.subject}`)
      console.log(`   - HTML Length: ${defaultTemplate.customHTML?.length || 0} chars`)
    } else {
      console.log('❌ No default template found')
    }
    
    // Test 2: Check if we can create a test order
    console.log('\n2. Creating test order...')
    const testOrder = await prisma.order.create({
      data: {
        paymentId: 'TEST_PAYMENT_123',
        amount: 1.00,
        currency: 'USD',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        passType: 'day',
        guests: 1,
        days: 1,
        deliveryType: 'now',
        sellerId: 'system',
        status: 'PAID'
      }
    })
    
    console.log(`✅ Test order created: ${testOrder.id}`)
    
    // Test 3: Check if we can create a QR code
    console.log('\n3. Creating test QR code...')
    const qrCode = await prisma.qRCode.create({
      data: {
        code: 'TEST_QR_123',
        sellerId: 'system',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        guests: 1,
        days: 1,
        cost: 1.00,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log(`✅ Test QR code created: ${qrCode.id}`)
    
    // Test 4: Check environment variables
    console.log('\n4. Checking email environment variables...')
    console.log(`   - SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET'}`)
    console.log(`   - RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'}`)
    console.log(`   - EMAIL_FROM_ADDRESS: ${process.env.EMAIL_FROM_ADDRESS || 'NOT SET'}`)
    console.log(`   - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NOT SET'}`)
    
    console.log('\n✅ Email service test completed')
    
  } catch (error) {
    console.error('❌ Email service test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailService() 