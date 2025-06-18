const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSellerConfig() {
  try {
    console.log('🔧 Debugging seller configuration...');
    
    const seller = await prisma.user.findFirst({
      where: {
        email: 'seller@elocalpass.com',
        role: 'SELLER'
      },
      include: {
        savedConfig: true
      }
    });
    
    if (!seller) {
      console.log('❌ Seller not found');
      return;
    }
    
    console.log('📋 Seller data:');
    console.log('- ID:', seller.id);
    console.log('- Email:', seller.email);
    console.log('- savedConfigId:', seller.savedConfigId);
    console.log('- savedConfig found:', !!seller.savedConfig);
    
    if (seller.savedConfig) {
      console.log('\n📋 Saved Configuration:');
      console.log('- Config ID:', seller.savedConfig.id);
      console.log('- Config Name:', seller.savedConfig.name);
      console.log('- Description:', seller.savedConfig.description);
      
      // Parse the configuration data
      const config = JSON.parse(seller.savedConfig.config);
      const landingPageConfig = seller.savedConfig.landingPageConfig ? JSON.parse(seller.savedConfig.landingPageConfig) : null;
      const selectedUrlIds = seller.savedConfig.selectedUrlIds ? JSON.parse(seller.savedConfig.selectedUrlIds) : [];
      
      console.log('\n📋 Configuration Details:');
      console.log('- button3DeliveryMethod:', config.button3DeliveryMethod);
      console.log('- selectedUrlIds:', selectedUrlIds);
      console.log('- selectedUrlIds length:', selectedUrlIds.length);
      
      if (landingPageConfig) {
        console.log('\n📋 Landing Page Config:');
        console.log('- temporaryUrls:', landingPageConfig.temporaryUrls);
        console.log('- temporaryUrls length:', landingPageConfig.temporaryUrls?.length || 0);
        
        if (landingPageConfig.temporaryUrls) {
          console.log('\n📋 Temporary URLs:');
          landingPageConfig.temporaryUrls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url.name} (${url.id})`);
            console.log(`     URL: ${url.url}`);
            console.log(`     Description: ${url.description || 'None'}`);
          });
        }
        
        // Filter URLs that match selectedUrlIds
        if (selectedUrlIds.length > 0 && landingPageConfig.temporaryUrls) {
          const matchingUrls = landingPageConfig.temporaryUrls.filter(url => selectedUrlIds.includes(url.id));
          console.log('\n📋 Matching URLs for selectedUrlIds:');
          matchingUrls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url.name} (${url.id})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSellerConfig(); 