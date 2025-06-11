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
        name: 'RIU Hotels & Resorts',
        userId: admin.id,
        contactPerson: 'Carlos Martinez',
        email: 'carlos@riu.com',
        telephone: '1234567890',
        whatsapp: '1234567890',
        notes: 'Main distributor for RIU properties',
        isActive: true
      }
    })
    console.log('✅ Created distributor:', distributor.name)

    // 3. Create Location under distributor
    const location = await prisma.location.create({
      data: {
        name: 'RIU Cancun',
        distributorId: distributor.id,
        userId: admin.id,
        contactPerson: 'Maria Garcia',
        email: 'maria@riucancun.com',
        telephone: '0987654321',
        whatsapp: '0987654321',
        notes: 'RIU Cancun resort location',
        isActive: true
      }
    })
    console.log('✅ Created location:', location.name)

    // 4. Create Seller under location
    const sellerPassword = await bcrypt.hash('seller123', 12)
    const seller = await prisma.user.create({
      data: {
        email: 'pedrita@riucancun.com',
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

    console.log('\n🎉 Basic data structure recreated successfully!')
    console.log('\nHierarchy: Admin → Distributor → Location → Seller')
    console.log('- Admin: admin@elocalpass.com / admin123')
    console.log('- Distributor: RIU Hotels & Resorts') 
    console.log('- Location: RIU Cancun')
    console.log('- Seller: pedrita@riucancun.com / seller123')
    console.log('\nYou can now login and create QR configurations to test pairing!')

  } catch (error) {
    console.error('❌ Error recreating data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateData()
