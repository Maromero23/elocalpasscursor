const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLogos() {
  try {
    const affiliates = await prisma.affiliate.findMany({
      select: { name: true, logo: true },
      where: { logo: { not: null } },
      take: 10
    })
    
    console.log('Current logo URLs:')
    affiliates.forEach(affiliate => {
      console.log(`${affiliate.name}: ${affiliate.logo}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLogos() 