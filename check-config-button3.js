const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
  try {
    console.log('🔍 Checking saved configurations for button3LandingPageChoice...');
    
    const configs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        config: true
      }
    });
    
    console.log(`📋 Found ${configs.length} saved configurations:`);
    
    configs.forEach((config, index) => {
      try {
        const parsedConfig = JSON.parse(config.config);
        const hasButton3Choice = parsedConfig.button3LandingPageChoice;
        const deliveryMethod = parsedConfig.button3DeliveryMethod;
        
        console.log(`\n${index + 1}. ${config.name}`);
        console.log(`   ID: ${config.id}`);
        console.log(`   button3DeliveryMethod: ${deliveryMethod}`);
        console.log(`   button3LandingPageChoice: ${hasButton3Choice || 'NOT SET'}`);
        
        if (hasButton3Choice === 'DEFAULT') {
          console.log(`   ✅ This config should work with the fix!`);
        } else if (deliveryMethod === 'URLS' || deliveryMethod === 'BOTH') {
          console.log(`   ⚠️ This config uses URLs but no landing page choice set`);
        }
      } catch (error) {
        console.log(`   ❌ Error parsing config: ${error.message}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking configurations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig(); 