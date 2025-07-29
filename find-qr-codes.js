const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findQRCodes() {
  console.log('🔍 FINDING QR CODES IN DATABASE')
  
  try {
    // Find QR codes by customer email
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        customerEmail: 'jorgeruiz23@gmail.com'
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`📋 Found ${qrCodes.length} QR codes for jorgeruiz23@gmail.com:`)
    qrCodes.forEach(qr => {
      console.log(`  - ${qr.id}: ${qr.customerName} - Created: ${qr.createdAt}`)
    })
    
    // Check the most recent QR codes
    if (qrCodes.length > 0) {
      console.log('\n🔍 DETAILED CHECK OF MOST RECENT QR CODES:')
      
      for (let i = 0; i < Math.min(3, qrCodes.length); i++) {
        const qr = qrCodes[i]
        console.log(`\n📋 QR ${i + 1}: ${qr.id}`)
        console.log('  Customer:', qr.customerName)
        console.log('  Email:', qr.customerEmail)
        console.log('  Seller:', qr.seller?.name || 'Unknown')
        console.log('  Created:', qr.createdAt)
        
        if (qr.seller?.savedConfig) {
          console.log('  ✅ Has saved config:', {
            button4CustomRebuyEmail: qr.seller.savedConfig.button4CustomRebuyEmail,
            button4UseDefaultRebuyEmail: qr.seller.savedConfig.button4UseDefaultRebuyEmail,
            button4RebuyEmailTemplate: qr.seller.savedConfig.button4RebuyEmailTemplate ? 'Has template' : 'No template'
          })
        } else {
          console.log('  ❌ No saved config')
        }
      }
    }
    
    // Check global configuration
    console.log('\n🌐 GLOBAL CONFIGURATION:')
    const globalConfig = await prisma.qrGlobalConfig.findFirst()
    if (globalConfig) {
      console.log('  ✅ Global config found:', {
        button4CustomRebuyEmail: globalConfig.button4CustomRebuyEmail,
        button4UseDefaultRebuyEmail: globalConfig.button4UseDefaultRebuyEmail,
        button4RebuyEmailTemplate: globalConfig.button4RebuyEmailTemplate ? 'Has template' : 'No template'
      })
    } else {
      console.log('  ❌ No global config found')
    }
    
  } catch (error) {
    console.error('❌ Error finding QR codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findQRCodes() 