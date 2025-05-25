const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSchema() {
  try {
    console.log('🔧 Checking database schema...')
    
    // Try to add isActive column if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT true`
    console.log('✅ Added isActive column')
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ isActive column already exists')
    } else {
      console.error('❌ Error:', error.message)
    }
  }

  // Verify the admin user exists
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@elocalpass.com' }
    })
    
    if (user) {
      console.log('✅ Admin user found:', user.email)
    } else {
      console.log('❌ Admin user not found')
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message)
  }
}

fixSchema()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
