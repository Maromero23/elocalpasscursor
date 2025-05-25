const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function restoreAllData() {
  try {
    console.log('🔄 Starting complete data restoration...')

    // 1. CREATE ADMIN USER
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@elocalpass.com',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true
      }
    })
    console.log('✅ Admin user created: admin@elocalpass.com / admin123')

    // 2. CREATE DISTRIBUTOR USERS & DISTRIBUTORS
    const dist1Password = await bcrypt.hash('dist123', 12)
    const dist1User = await prisma.user.create({
      data: {
        name: 'Mexico Central Manager',
        email: 'distributor1@elocalpass.com',
        password: dist1Password,
        role: 'DISTRIBUTOR',
        isActive: true
      }
    })

    const dist2Password = await bcrypt.hash('dist123', 12)
    const dist2User = await prisma.user.create({
      data: {
        name: 'Mexico North Manager',
        email: 'distributor2@elocalpass.com',
        password: dist2Password,
        role: 'DISTRIBUTOR',
        isActive: true
      }
    })

    const distributor1 = await prisma.distributor.create({
      data: {
        name: 'Mexico Central Distribution',
        userId: dist1User.id,
        isActive: true,
        contactPerson: 'Carlos Rodriguez',
        email: 'contact@mexicocentral.com',
        telephone: '+52-55-1234-5678',
        notes: 'Main distribution center for central Mexico'
      }
    })

    const distributor2 = await prisma.distributor.create({
      data: {
        name: 'Mexico North Distribution',
        userId: dist2User.id,
        isActive: true,
        contactPerson: 'Maria Gonzalez',
        email: 'contact@mexiconorth.com',
        telephone: '+52-81-9876-5432',
        notes: 'Distribution center for northern Mexico'
      }
    })

    console.log('✅ Distributors created:')
    console.log('   - Mexico Central Distribution (distributor1@elocalpass.com / dist123)')
    console.log('   - Mexico North Distribution (distributor2@elocalpass.com / dist123)')

    // 3. CREATE LOCATION USERS & LOCATIONS
    const loc1Password = await bcrypt.hash('loc123', 12)
    const loc1User = await prisma.user.create({
      data: {
        name: 'Cancun Resort Manager',
        email: 'location1@elocalpass.com',
        password: loc1Password,
        role: 'LOCATION',
        isActive: true
      }
    })

    const loc2Password = await bcrypt.hash('loc123', 12)
    const loc2User = await prisma.user.create({
      data: {
        name: 'Playa Center Manager',
        email: 'location2@elocalpass.com',
        password: loc2Password,
        role: 'LOCATION',
        isActive: true
      }
    })

    const location1 = await prisma.location.create({
      data: {
        name: 'Cancun Beach Resort',
        distributorId: distributor1.id,
        userId: loc1User.id,
        isActive: true,
        contactPerson: 'Ana Martinez',
        email: 'resort@cancunbeach.com',
        telephone: '+52-998-123-4567',
        notes: 'Premium beach resort in Cancun'
      }
    })

    const location2 = await prisma.location.create({
      data: {
        name: 'Playa del Carmen Center',
        distributorId: distributor2.id,
        userId: loc2User.id,
        isActive: true,
        contactPerson: 'Jose Lopez',
        email: 'center@playacarmen.com',
        telephone: '+52-984-765-4321',
        notes: 'Tourist center in Playa del Carmen'
      }
    })

    console.log('✅ Locations created:')
    console.log('   - Cancun Beach Resort under Mexico Central (location1@elocalpass.com / loc123)')
    console.log('   - Playa del Carmen Center under Mexico North (location2@elocalpass.com / loc123)')

    // 4. CREATE SELLER USERS
    const seller1Password = await bcrypt.hash('seller123', 12)
    const seller1 = await prisma.user.create({
      data: {
        name: 'Seller User',
        email: 'seller@elocalpass.com',
        password: seller1Password,
        role: 'SELLER',
        isActive: true,
        locationId: location1.id
      }
    })

    const seller2Password = await bcrypt.hash('seller123', 12)
    const seller2 = await prisma.user.create({
      data: {
        name: 'Test Seller 2',
        email: 'seller2@elocalpass.com',
        password: seller2Password,
        role: 'SELLER',
        isActive: true,
        locationId: location2.id
      }
    })

    const seller3Password = await bcrypt.hash('seller123', 12)
    const seller3 = await prisma.user.create({
      data: {
        name: 'Beach Seller 3',
        email: 'seller3@elocalpass.com',
        password: seller3Password,
        role: 'SELLER',
        isActive: true,
        locationId: location1.id
      }
    })

    console.log('✅ Sellers created:')
    console.log('   - Seller User at Cancun Beach Resort (seller@elocalpass.com / seller123)')
    console.log('   - Test Seller 2 at Playa del Carmen Center (seller2@elocalpass.com / seller123)')
    console.log('   - Beach Seller 3 at Cancun Beach Resort (seller3@elocalpass.com / seller123)')

    // 5. CREATE SOME QR CONFIGURATIONS
    await prisma.qRConfig.create({
      data: {
        userId: seller1.id,
        sendMethod: 'URL',
        landingPageRequired: true,
        allowCustomGuests: false,
        allowCustomDays: false,
        defaultGuests: 2,
        defaultDays: 3,
        pricingType: 'FIXED',
        fixedPrice: 50.00,
        sendRebuyEmail: true
      }
    })

    await prisma.qRConfig.create({
      data: {
        userId: seller2.id,
        sendMethod: 'EMAIL',
        landingPageRequired: false,
        allowCustomGuests: true,
        allowCustomDays: true,
        defaultGuests: 4,
        defaultDays: 7,
        pricingType: 'PER_GUEST',
        fixedPrice: 25.00,
        sendRebuyEmail: false
      }
    })

    console.log('✅ QR Configurations created for sellers')

    console.log('\n🎉 COMPLETE DATA RESTORATION FINISHED!')
    console.log('\n📋 LOGIN CREDENTIALS:')
    console.log('🔑 ADMIN: admin@elocalpass.com / admin123')
    console.log('🏢 DISTRIBUTOR 1: distributor1@elocalpass.com / dist123')
    console.log('🏢 DISTRIBUTOR 2: distributor2@elocalpass.com / dist123') 
    console.log('📍 LOCATION 1: location1@elocalpass.com / loc123')
    console.log('📍 LOCATION 2: location2@elocalpass.com / loc123')
    console.log('👤 SELLER 1: seller@elocalpass.com / seller123')
    console.log('👤 SELLER 2: seller2@elocalpass.com / seller123')
    console.log('👤 SELLER 3: seller3@elocalpass.com / seller123')

  } catch (error) {
    console.error('❌ Error during restoration:', error)
  }
}

restoreAllData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
