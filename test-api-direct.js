const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPILogic() {
  try {
    console.log('🧪 Testing API logic directly...')

    // This is exactly what the API route should do
    const distributors = await prisma.distributor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            locations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ API query successful!')
    console.log('📊 Found', distributors.length, 'distributors')
    distributors.forEach(dist => {
      console.log(`  - ${dist.name} (${dist.user?.email}) - ${dist._count.locations} locations`)
    })

    return distributors
  } catch (error) {
    console.error('❌ API query failed:', error.message)
    console.error('📋 Full error:', error)
  }
}

testAPILogic()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
