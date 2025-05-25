const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@elocalpass.com' }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:')
    console.log('📧 Email:', user.email)
    console.log('👤 Role:', user.role)
    console.log('🔐 Password hash:', user.password)

    // Test password comparison
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    console.log('🔑 Testing password "admin123":', isValid ? '✅ VALID' : '❌ INVALID')

    // Also test with the same hashing method we used
    const newHash = await bcrypt.hash('admin123', 12)
    console.log('🆕 New hash:', newHash)
    const isNewValid = await bcrypt.compare('admin123', newHash)
    console.log('🔑 New hash test:', isNewValid ? '✅ VALID' : '❌ INVALID')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testLogin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
