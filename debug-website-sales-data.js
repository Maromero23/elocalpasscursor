const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugWebsiteSalesData() {
  try {
    console.log('🔍 Debugging Website Sales Data...')
    
    // Get all QR codes
    const allQRCodes = await prisma.qRCode.findMany({
      select: {
        id: true,
        code: true,
        customerName: true,
        customerEmail: true,
        cost: true,
        createdAt: true,
        sellerId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    console.log(`📊 Total QR codes in database: ${allQRCodes.length}`)
    console.log('\n🔍 Recent QR codes analysis:')
    
    let paypalCount = 0
    let sellerCount = 0
    let freeCount = 0
    
    allQRCodes.forEach((qr, index) => {
      const hasCustomerInfo = qr.customerEmail !== null && qr.customerName !== null
      const hasCost = qr.cost > 0
      const isPayPalPurchase = hasCustomerInfo && hasCost
      
      if (isPayPalPurchase) paypalCount++
      if (!hasCustomerInfo) sellerCount++
      if (qr.cost === 0) freeCount++
      
      console.log(`${index + 1}. ${qr.code}`)
      console.log(`   Customer: ${qr.customerName || 'NULL'} (${qr.customerEmail || 'NULL'})`)
      console.log(`   Cost: $${qr.cost}`)
      console.log(`   Seller ID: ${qr.sellerId}`)
      console.log(`   Created: ${qr.createdAt.toISOString()}`)
      console.log(`   PayPal Purchase: ${isPayPalPurchase ? '✅ YES' : '❌ NO'}`)
      console.log('')
    })
    
    console.log('📊 Summary:')
    console.log(`   PayPal Purchases (customerEmail + customerName + cost > 0): ${paypalCount}`)
    console.log(`   Seller Created (no customer info): ${sellerCount}`)
    console.log(`   Free QR codes (cost = 0): ${freeCount}`)
    
    // Check for orders
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        paymentId: true,
        customerEmail: true,
        customerName: true,
        amount: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`\n💳 PayPal Orders in database: ${orders.length}`)
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.paymentId}`)
      console.log(`   Customer: ${order.customerName} (${order.customerEmail})`)
      console.log(`   Amount: $${order.amount}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Created: ${order.createdAt.toISOString()}`)
      console.log('')
    })
    
    // Test the exact filtering logic from the API
    console.log('\n🔧 Testing API filtering logic...')
    const filteredQRCodes = allQRCodes.filter(qr => 
      qr.customerEmail !== null && 
      qr.customerName !== null && 
      qr.cost > 0
    )
    
    console.log(`📊 QR codes that should appear in Website Sales: ${filteredQRCodes.length}`)
    filteredQRCodes.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.code} - ${qr.customerName} ($${qr.cost})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugWebsiteSalesData() 