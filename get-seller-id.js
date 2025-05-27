const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getSellerId() {
  try {
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@elocalpass.com',
        role: 'SELLER'
      },
      select: {
        id: true,
        email: true
      }
    })
    
    if (seller) {
      console.log(`Seller ID: ${seller.id}`)
      console.log(`Email: ${seller.email}`)
    } else {
      console.log('No seller found with email seller@elocalpass.com')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

getSellerId()
