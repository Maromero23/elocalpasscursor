const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...')

    // Check if Distributor table exists and has data
    try {
      const distributors = await prisma.distributor.findMany()
      console.log('✅ Distributor table exists with', distributors.length, 'records')
      if (distributors.length > 0) {
        console.log('📋 Sample distributor:', distributors[0])
      }
    } catch (error) {
      console.log('❌ Error accessing Distributor table:', error.message)
    }

    // Check if Location table exists and has data
    try {
      const locations = await prisma.location.findMany()
      console.log('✅ Location table exists with', locations.length, 'records')
      if (locations.length > 0) {
        console.log('📋 Sample location:', locations[0])
      }
    } catch (error) {
      console.log('❌ Error accessing Location table:', error.message)
    }

    // Check users with roles
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: ['DISTRIBUTOR', 'LOCATION', 'SELLER']
          }
        }
      })
      console.log('✅ Found', users.length, 'users with hierarchy roles')
      users.forEach(user => {
        console.log(`  - ${user.role}: ${user.name} (${user.email})`)
      })
    } catch (error) {
      console.log('❌ Error accessing User table:', error.message)
    }

  } catch (error) {
    console.error('❌ Database check failed:', error)
  }
}

checkDatabaseStructure()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
