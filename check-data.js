const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('📊 Checking current database data...\n')

    // Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    console.log('👥 USERS:', users.length)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name}`)
    })

    // Check Distributors
    const distributors = await prisma.distributor.findMany({
      include: {
        user: true,
        _count: {
          select: { locations: true }
        }
      }
    })
    console.log(`\n🏢 DISTRIBUTORS: ${distributors.length}`)
    distributors.forEach(dist => {
      console.log(`  - ${dist.name} (${dist._count.locations} locations) - User: ${dist.user.email}`)
    })

    // Check Locations
    const locations = await prisma.location.findMany({
      include: {
        user: true,
        distributor: true,
        _count: {
          select: { sellers: true }
        }
      }
    })
    console.log(`\n📍 LOCATIONS: ${locations.length}`)
    locations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc._count.sellers} sellers) - Distributor: ${loc.distributor?.name || 'None'}`)
    })

    // Check QR Configs
    const qrConfigs = await prisma.qRConfig.findMany({
      include: {
        seller: true
      }
    })
    console.log(`\n⚙️ QR CONFIGS: ${qrConfigs.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
