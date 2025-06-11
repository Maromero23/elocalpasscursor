const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function recreateData() {
  try {
    console.log('🔧 Recreating basic data structure...')

    // 1. Create Admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@elocalpass.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      }
    })
    console.log('✅ Created admin user:', admin.email)

    // 2. Create Distributor
    const distributor = await prisma.distributor.create({
      data: {
        name: 'Test Distributor',
        userId: admin.id,
        contactPerson: 'Test Contact',
        email: 'distributor@test.com',
        telephone: '1234567890',
        isActive: true
      }
    })
    console.log('✅ Created distributor:', distributor.name)

    // 3. Create Location under distributor
    const location = await prisma.location.create({
      data: {
        name: 'Test Location - Cancun',
        distributorId: distributor.id,
        userId: admin.id,
        contactPerson: 'Location Manager',
        email: 'location@test.com',
        telephone: '0987654321',
        isActive: true
      }
    })
    console.log('✅ Created location:', location.name)

    // 4. Create Seller under location
    const sellerPassword = await bcrypt.hash('seller123', 12)
    const seller = await prisma.user.create({
      data: {
        email: 'seller@riucancun.com',
        password: sellerPassword,
        name: 'Pedrita Gomez',
        role: 'SELLER',
        telephone: '123456789',
        whatsapp: '00000000000',
        notes: 'Vendedora Riu Cancun',
        locationId: location.id,
        isActive: true
      }
    })
    console.log('✅ Created seller:', seller.email)

    // 5. Create a Global QR Configuration
    const globalConfig = await prisma.qRGlobalConfig.create({
      data: {
        button1GuestsDefault: 2,
        button1DaysDefault: 3,
        button2PricingType: 'FIXED',
        button2FixedPrice: 50.0,
        button3DeliveryMethod: 'DIRECT',
        button4LandingPageRequired: true,
        button5SendRebuyEmail: false
      }
    })
    console.log('✅ Created global QR config:', globalConfig.id)

    console.log('\n🎉 Basic data structure recreated successfully!')
    console.log('\nLogin credentials:')
    console.log('Admin: admin@elocalpass.com / admin123')
    console.log('Seller: seller@riucancun.com / seller123')

  } catch (error) {
    console.error('❌ Error recreating data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateData()
