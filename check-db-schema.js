const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkActualSchema() {
  try {
    console.log('🔍 Checking actual database schema...')

    // Try a simple find with specific fields to see what exists
    try {
      const distributor = await prisma.distributor.findFirst({
        select: {
          id: true,
          name: true,
          contactPerson: true,
          email: true,
          telephone: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          // Let's try to access isActive to see if it fails
        }
      })
      console.log('✅ Distributor basic fields work:', distributor)
    } catch (error) {
      console.log('❌ Error with basic fields:', error.message)
    }

    // Now try with isActive specifically
    try {
      const distributorWithActive = await prisma.distributor.findFirst({
        select: {
          id: true,
          name: true,
          isActive: true,
        }
      })
      console.log('✅ isActive field works:', distributorWithActive)
    } catch (error) {
      console.log('❌ isActive field error:', error.message)
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkActualSchema()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
