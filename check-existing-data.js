const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking existing data...')

    const users = await prisma.user.findMany({
      include: {
        distributorProfile: true,
        locationProfile: true,
        location: true
      }
    })
    
    console.log('Users found:', users.length)
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`)
    })

    const distributors = await prisma.distributor.findMany()
    console.log('\nDistributors found:', distributors.length)
    
    const locations = await prisma.location.findMany()
    console.log('Locations found:', locations.length)

    console.log('\n📋 Current data status complete.')

  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
