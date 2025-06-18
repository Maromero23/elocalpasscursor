const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSeller() {
  try {
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@elocalpass.com',
        role: 'SELLER'
      },
      include: {
        savedConfig: true
      }
    });
    
    console.log('=== Seller Configuration Debug ===');
    console.log('- ID:', seller?.id);
    console.log('- Email:', seller?.email);
    console.log('- configurationId:', seller?.configurationId);
    console.log('- configurationName:', seller?.configurationName);
    console.log('- savedConfigId:', seller?.savedConfigId);
    console.log('- savedConfig:', seller?.savedConfig ? 'Found' : 'Not found');
    
    if (seller?.savedConfig) {
      console.log('- savedConfig.name:', seller.savedConfig.name);
      console.log('- savedConfig.id:', seller.savedConfig.id);
    }
    
    // Also check recent saved configurations
    console.log('\n=== Recent Saved Configurations ===');
    const recentConfigs = await prisma.savedQrConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    });
    
    recentConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name} (${config.id}) - ${config.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeller(); 