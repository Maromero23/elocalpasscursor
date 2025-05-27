const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log(`Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`)
      console.log(`   ID: ${user.id}`)
    })
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
