const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugCurrentWebsiteSales() {
  try {
    console.log('🔍 Debugging current Website Sales API logic...')
    
    // Replicate the exact logic from the API
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
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Found ${allQRCodes.length} total QR codes`)
    
    // Apply the current API filter
    const paypalQRCodes = allQRCodes.filter(qr => 
      qr.customerEmail && 
      qr.customerName && 
      qr.cost > 0
    )
    
    console.log(`💰 Found ${paypalQRCodes.length} QR codes that match current filter`)
    console.log('\n🔍 Analysis of filtered QR codes:')
    
    let realPayPalCount = 0
    let sellerCreatedWithCostCount = 0
    let freeButHasCustomerCount = 0
    
    paypalQRCodes.forEach((qr, index) => {
      // Check if this looks like a real PayPal purchase
      const hasPayPalPattern = qr.code.startsWith('PASS_') && qr.cost > 0
      const isSellerCreated = qr.code.startsWith('EL-') && qr.cost > 0
      const isFree = qr.cost === 0
      
      if (hasPayPalPattern) realPayPalCount++
      if (isSellerCreated) sellerCreatedWithCostCount++
      if (isFree) freeButHasCustomerCount++
      
      if (index < 10) { // Show first 10 for analysis
        console.log(`${index + 1}. ${qr.code}`)
        console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`)
        console.log(`   Cost: $${qr.cost}`)
        console.log(`   Type: ${hasPayPalPattern ? 'PayPal Purchase' : isSellerCreated ? 'Seller Created (Paid)' : 'Other'}`)
        console.log('')
      }
    })
    
    console.log('📊 Breakdown:')
    console.log(`   Real PayPal purchases (PASS_ prefix): ${realPayPalCount}`)
    console.log(`   Seller created with cost (EL- prefix): ${sellerCreatedWithCostCount}`)
    console.log(`   Free but has customer info: ${freeButHasCustomerCount}`)
    
    // Check for orders to compare
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
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\n💳 PayPal Orders in database: ${orders.length}`)
    
    // Suggest better filtering
    console.log('\n💡 Suggestion: Filter by QR code prefix pattern')
    const betterFiltered = allQRCodes.filter(qr => 
      qr.customerEmail && 
      qr.customerName && 
      qr.cost > 0 &&
      qr.code.startsWith('PASS_') // Only QR codes from PayPal flow
    )
    
    console.log(`🎯 Better filter would show: ${betterFiltered.length} QR codes`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugCurrentWebsiteSales() 