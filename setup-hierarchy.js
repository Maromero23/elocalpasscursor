const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up Distributor and Location hierarchy...')

  // Step 1: Create Distributor Users
  const distributorUser1 = await prisma.user.create({
    data: {
      email: 'distributor1@elocalpass.com',
      password: await bcrypt.hash('dist123', 10),
      name: 'Distributor One',
      role: 'DISTRIBUTOR'
    }
  })

  const distributorUser2 = await prisma.user.create({
    data: {
      email: 'distributor2@elocalpass.com',
      password: await bcrypt.hash('dist123', 10),
      name: 'Distributor Two',
      role: 'DISTRIBUTOR'
    }
  })

  // Step 2: Create Distributor Profiles
  const distributor1 = await prisma.distributor.create({
    data: {
      name: 'Mexico Central Distribution',
      userId: distributorUser1.id
    }
  })

  const distributor2 = await prisma.distributor.create({
    data: {
      name: 'Mexico North Distribution',
      userId: distributorUser2.id
    }
  })

  // Step 3: Create Location Users
  const locationUser1 = await prisma.user.create({
    data: {
      email: 'location1@elocalpass.com',
      password: await bcrypt.hash('loc123', 10),
      name: 'Cancun Location',
      role: 'LOCATION'
    }
  })

  const locationUser2 = await prisma.user.create({
    data: {
      email: 'location2@elocalpass.com',
      password: await bcrypt.hash('loc123', 10),
      name: 'Playa del Carmen Location',
      role: 'LOCATION'
    }
  })

  // Step 4: Create Location Profiles
  const location1 = await prisma.location.create({
    data: {
      name: 'Cancun Beach Resort',
      userId: locationUser1.id,
      distributorId: distributor1.id
    }
  })

  const location2 = await prisma.location.create({
    data: {
      name: 'Playa del Carmen Center',
      userId: locationUser2.id,
      distributorId: distributor2.id
    }
  })

  // Step 5: Get existing sellers and assign them to locations
  const existingSellers = await prisma.user.findMany({
    where: { role: 'SELLER' }
  })

  console.log(`📍 Found ${existingSellers.length} existing sellers to assign...`)

  // Assign sellers to locations (split them between the two locations)
  for (let i = 0; i < existingSellers.length; i++) {
    const seller = existingSellers[i]
    const targetLocationId = i % 2 === 0 ? location1.id : location2.id
    const targetLocationName = i % 2 === 0 ? 'Cancun Beach Resort' : 'Playa del Carmen Center'
    
    await prisma.user.update({
      where: { id: seller.id },
      data: { locationId: targetLocationId }
    })
    
    console.log(`✅ Assigned ${seller.name || seller.email} to ${targetLocationName}`)
  }

  console.log('\n🎉 Hierarchy setup complete!')
  console.log('\n👥 Test Users Created:')
  console.log('🏢 Distributors:')
  console.log('   - distributor1@elocalpass.com / dist123 (Mexico Central)')
  console.log('   - distributor2@elocalpass.com / dist123 (Mexico North)')
  console.log('📍 Locations:')
  console.log('   - location1@elocalpass.com / loc123 (Cancun Beach Resort)')
  console.log('   - location2@elocalpass.com / loc123 (Playa del Carmen Center)')
  console.log(`👤 ${existingSellers.length} existing sellers assigned to locations`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error setting up hierarchy:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
