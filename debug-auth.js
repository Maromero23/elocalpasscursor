const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication...')

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@elocalpass.com' }
    })

    if (!user) {
      console.log('❌ Admin user not found!')
      return
    }

    console.log('✅ User found:')
    console.log('📧 Email:', user.email)
    console.log('👤 Name:', user.name)
    console.log('🔐 Role:', user.role)
    console.log('🔑 Password hash length:', user.password.length)
    console.log('🔑 Password hash start:', user.password.substring(0, 20) + '...')

    // Test multiple passwords
    const testPasswords = ['admin123', 'Admin123', 'ADMIN123']
    
    for (const testPwd of testPasswords) {
      console.log(`\n🧪 Testing password: "${testPwd}"`)
      const isValid = await bcrypt.compare(testPwd, user.password)
      console.log('Result:', isValid ? '✅ VALID' : '❌ INVALID')
    }

    // Create a fresh hash and test it
    console.log('\n🆕 Creating fresh hash for "admin123"...')
    const freshHash = await bcrypt.hash('admin123', 12)
    console.log('Fresh hash:', freshHash.substring(0, 20) + '...')
    
    const freshTest = await bcrypt.compare('admin123', freshHash)
    console.log('Fresh hash test:', freshTest ? '✅ VALID' : '❌ INVALID')

    // Test if current hash is corrupted
    console.log('\n🔍 Hash analysis:')
    console.log('Expected bcrypt format: $2a$ or $2b$')
    console.log('Current hash starts with:', user.password.substring(0, 4))
    console.log('Is valid bcrypt format:', user.password.startsWith('$2'))

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugAuth()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
