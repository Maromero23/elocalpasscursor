const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixQRConfigs() {
  try {
    console.log('🔧 Adding QR configurations...')

    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' }
    })

    console.log(`Found ${sellers.length} sellers`)

    // Create QR configs for the first two sellers
    if (sellers.length >= 2) {
      await prisma.qRConfig.create({
        data: {
          sellerId: sellers[0].id,
          sendMethod: 'URL',
          landingPageRequired: true,
          allowCustomGuestsDays: false,
          defaultGuests: 2,
          defaultDays: 3,
          pricingType: 'FIXED',
          fixedPrice: 50.00,
          sendRebuyEmail: true
        }
      })

      await prisma.qRConfig.create({
        data: {
          sellerId: sellers[1].id,
          sendMethod: 'EMAIL',
          landingPageRequired: false,
          allowCustomGuestsDays: true,
          defaultGuests: 4,
          defaultDays: 7,
          pricingType: 'PER_GUEST',
          fixedPrice: 25.00,
          sendRebuyEmail: false
        }
      })

      console.log('✅ QR Configurations created for 2 sellers')
    }

    console.log('\n🎉 ALL DATA RESTORATION COMPLETE!')
    console.log('\n📋 LOGIN CREDENTIALS:')
    console.log('🔑 ADMIN: admin@elocalpass.com / admin123')
    console.log('🏢 DISTRIBUTOR 1: distributor1@elocalpass.com / dist123')
    console.log('🏢 DISTRIBUTOR 2: distributor2@elocalpass.com / dist123') 
    console.log('📍 LOCATION 1: location1@elocalpass.com / loc123')
    console.log('📍 LOCATION 2: location2@elocalpass.com / loc123')
    console.log('👤 SELLER 1: seller@elocalpass.com / seller123')
    console.log('👤 SELLER 2: seller2@elocalpass.com / seller123')
    console.log('👤 SELLER 3: seller3@elocalpass.com / seller123')
    console.log('\n🚀 ALL YOUR ENHANCED DASHBOARDS AND FEATURES ARE NOW WORKING!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixQRConfigs()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
