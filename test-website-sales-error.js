const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testWebsiteSalesAPI() {
  try {
    console.log('🔍 Testing Website Sales API logic...')
    
    // Test 1: Check if we can connect to the database
    console.log('📊 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test 2: Check if QR codes with customerEmail exist
    console.log('🔍 Checking QR codes with customerEmail...')
    const qrCodesWithEmail = await prisma.qRCode.findMany({
      where: {
        customerEmail: {
          not: null
        }
      },
      select: {
        id: true,
        code: true,
        customerName: true,
        customerEmail: true,
        cost: true,
        createdAt: true
      },
      take: 5
    })
    
    console.log(`📊 Found ${qrCodesWithEmail.length} QR codes with customerEmail:`)
    qrCodesWithEmail.forEach(qr => {
      console.log(`  - ${qr.code}: ${qr.customerName} (${qr.customerEmail}) - $${qr.cost}`)
    })
    
    // Test 3: Check if scheduled QR codes with clientEmail exist
    console.log('🔍 Checking scheduled QR codes with clientEmail...')
    const scheduledQRCodesWithEmail = await prisma.scheduledQRCode.findMany({
      where: {
        clientEmail: {
          not: null
        }
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        createdAt: true
      },
      take: 5
    })
    
    console.log(`📅 Found ${scheduledQRCodesWithEmail.length} scheduled QR codes with clientEmail:`)
    scheduledQRCodesWithEmail.forEach(qr => {
      console.log(`  - ${qr.clientName} (${qr.clientEmail})`)
    })
    
    // Test 4: Test the exact query from the API
    console.log('🔍 Testing exact API query...')
    const whereClause = {
      customerEmail: {
        not: null
      }
    }
    
    console.log('Where clause:', JSON.stringify(whereClause, null, 2))
    
    const testQRCodes = await prisma.qRCode.findMany({
      where: whereClause,
      include: {
        seller: {
          include: {
            location: {
              include: {
                distributor: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`✅ API query successful - found ${testQRCodes.length} QR codes`)
    
    // Test 5: Test summary statistics
    console.log('📈 Testing summary statistics...')
    
    const totalQRCodes = await prisma.qRCode.count({
      where: { customerEmail: { not: null } }
    })
    
    const totalScheduledQRCodes = await prisma.scheduledQRCode.count({
      where: { clientEmail: { not: null } }
    })
    
    const totalRevenue = await prisma.qRCode.aggregate({
      where: { 
        customerEmail: { not: null },
        cost: { gt: 0 }
      },
      _sum: { cost: true }
    })
    
    const activeQRCodes = await prisma.qRCode.count({
      where: {
        customerEmail: { not: null },
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    })
    
    console.log('📊 Summary Statistics:')
    console.log(`  - Total QR Codes: ${totalQRCodes}`)
    console.log(`  - Total Scheduled QR Codes: ${totalScheduledQRCodes}`)
    console.log(`  - Total Revenue: $${totalRevenue._sum.cost || 0}`)
    console.log(`  - Active QR Codes: ${activeQRCodes}`)
    
    console.log('✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Error in test:', error)
    console.error('Error stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testWebsiteSalesAPI() 