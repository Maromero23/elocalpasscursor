const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@elocalpass.com' }
    })

    // Create admin user with proper password hashing
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@elocalpass.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@elocalpass.com')
    console.log('🔑 Password: admin123')
    console.log('👤 Role:', adminUser.role)
    console.log('🆔 ID:', adminUser.id)

    // Verify the user can be found
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'admin@elocalpass.com' }
    })
    
    if (verifyUser) {
      console.log('✅ User verification: Found in database')
      console.log('🔐 Password hash length:', verifyUser.password.length)
    } else {
      console.error('❌ User verification: NOT found in database')
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
