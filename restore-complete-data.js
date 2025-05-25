const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function restoreCompleteData() {
  try {
    console.log('🗄️  Restoring complete distributor system data...')

    // 1. Create Distributor User and Profile
    const distributorPassword = await bcrypt.hash('dist123', 12)
    const distributorUser = await prisma.user.create({
      data: {
        email: 'dist2@gmail.com',
        password: distributorPassword,
        name: 'Juan Pecas',
        role: 'DISTRIBUTOR',
      }
    })

    const distributor = await prisma.distributor.create({
      data: {
        name: 'Dist2',
        contactPerson: 'Juan Pecas',
        email: 'pecas@gmail.com',
        telephone: '321432423423',
        userId: distributorUser.id,
      }
    })

    console.log('✅ Created Distributor: Dist2 (Juan Pecas)')

    // 2. Create Location User and Profile
    const locationPassword = await bcrypt.hash('loc123', 12)
    const locationUser = await prisma.user.create({
      data: {
        email: 'pdcentro@gmail.com',
        password: locationPassword,
        name: 'PDC centro',
        role: 'LOCATION',
      }
    })

    const location = await prisma.location.create({
      data: {
        name: 'PDC centro',
        contactPerson: 'PDC centro',
        email: 'ident@gmail.com',
        userId: locationUser.id,
        distributorId: distributor.id,
      }
    })

    console.log('✅ Created Location: PDC centro under Dist2')

    // 3. Create Seller User
    const sellerPassword = await bcrypt.hash('seller123', 12)
    const sellerUser = await prisma.user.create({
      data: {
        email: 'seller2@gmail.com',
        password: sellerPassword,
        name: 'Seller Two',
        role: 'SELLER',
        locationId: location.id,
      }
    })

    console.log('✅ Created Seller: Seller Two under PDC centro')

    // 4. Create QR Configuration for the Seller
    const qrConfig = await prisma.qRConfig.create({
      data: {
        sellerId: sellerUser.id,
        sendMethod: 'URL',
        defaultGuests: 2,
        defaultDays: 7,
        fixedPrice: 25.00,
      }
    })

    console.log('✅ Created QR Configuration for Seller Two')

    console.log('\n🎉 Complete distributor system restored successfully!')
    console.log('\n📊 Current Structure:')
    console.log('├── 🏢 Dist2 (Juan Pecas) - dist2@gmail.com')
    console.log('│   └── 📍 PDC centro - pdcentro@gmail.com')
    console.log('│       └── 👤 Seller Two - seller2@gmail.com')
    console.log('│           └── ⚙️ QR Config: URL, 2 guests, 7 days, $25')

  } catch (error) {
    console.error('❌ Error restoring data:', error)
  }
}

restoreCompleteData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
