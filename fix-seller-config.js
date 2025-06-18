const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSellerConfig() {
  try {
    console.log('🔧 Fixing seller configuration...');
    
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@elocalpass.com',
        role: 'SELLER'
      }
    });
    
    if (!seller) {
      console.log('❌ Seller not found');
      return;
    }
    
    console.log('📋 Current seller data:');
    console.log('- configurationId:', seller.configurationId);
    console.log('- configurationName:', seller.configurationName);
    console.log('- savedConfigId:', seller.savedConfigId);
    
    if (seller.configurationId && !seller.savedConfigId) {
      console.log('🔄 Setting savedConfigId to match configurationId...');
      
      await prisma.user.update({
        where: { id: seller.id },
        data: {
          savedConfigId: seller.configurationId
        }
      });
      
      console.log('✅ Fixed! savedConfigId set to:', seller.configurationId);
    } else if (seller.savedConfigId) {
      console.log('✅ Seller already has savedConfigId set');
    } else {
      console.log('⚠️ No configurationId found to copy');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSellerConfig(); 