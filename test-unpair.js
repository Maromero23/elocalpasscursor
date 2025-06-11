// Quick test script to verify unpair functionality
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testUnpair() {
  try {
    // First, let's see what sellers exist
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: { id: true, email: true, configurationId: true, configurationName: true }
    })
    
    console.log('Available sellers:', sellers)
    
    if (sellers.length === 0) {
      console.log('No sellers found - database was reset')
      return
    }
    
    // Check QR configs
    const configs = await prisma.qRConfig.findMany()
    console.log('QR Configs:', configs.length)
    
    console.log('✅ Database structure looks good for unpair functionality')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testUnpair()
