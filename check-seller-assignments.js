const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentSellerConfigs() {
  try {
    console.log('🔍 CHECKING CURRENT SELLER CONFIGURATION ASSIGNMENTS...\n');
    
    // Get all sellers with their configurations
    const sellers = await prisma.user.findMany({
      where: {
        role: 'SELLER',
        savedConfigId: { not: null }
      },
      include: {
        savedConfig: true
      }
    });
    
    console.log('📊 SELLERS WITH CONFIGURATIONS:');
    console.log('Count:', sellers.length);
    
    const configUsage = new Map();
    
    sellers.forEach((seller, index) => {
      console.log(`\nSeller ${index + 1}:`);
      console.log('- Name:', seller.name);
      console.log('- Email:', seller.email);
      console.log('- Config ID:', seller.savedConfigId);
      console.log('- Config Name:', seller.savedConfig?.name);
      
      if (seller.savedConfig) {
        try {
          const config = JSON.parse(seller.savedConfig.config);
          console.log('- Rebuy Enabled:', config.button5SendRebuyEmail);
          
          // Track config usage
          const configId = seller.savedConfigId;
          if (!configUsage.has(configId)) {
            configUsage.set(configId, {
              name: seller.savedConfig.name,
              rebuyEnabled: config.button5SendRebuyEmail,
              sellers: []
            });
          }
          configUsage.get(configId).sellers.push(seller.name);
          
        } catch (e) {
          console.log('- Error parsing config');
        }
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONFIGURATION USAGE SUMMARY:');
    
    configUsage.forEach((usage, configId) => {
      console.log(`\n📋 ${usage.name} (ID: ${configId})`);
      console.log('- Rebuy Enabled:', usage.rebuyEnabled ? '✅ YES' : '❌ NO');
      console.log('- Used by', usage.sellers.length, 'sellers:');
      usage.sellers.forEach(sellerName => {
        console.log(`  - ${sellerName}`);
      });
      
      if (!usage.rebuyEnabled && usage.sellers.length > 0) {
        console.log('- 💡 SUGGESTION: Enable rebuy on this config to test rebuy emails');
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RECOMMENDATIONS:');
    console.log('1. Enable rebuy email on configurations that sellers are currently using');
    console.log('2. OR assign sellers to existing rebuy-enabled configurations');
    console.log('3. Test rebuy email system by creating QR codes after configuration changes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSellerConfigs(); 