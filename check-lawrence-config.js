const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLawrenceConfig() {
  try {
    console.log('🔍 CHECKING LAWRENCE TAYLOR\'S CONFIGURATION\n');
    
    // Find Lawrence Taylor's seller record
    const seller = await prisma.seller.findFirst({
      where: { 
        name: 'Lawrence Taylor'
      },
      include: {
        savedConfig: true
      }
    });

    if (!seller) {
      console.log('❌ Lawrence Taylor seller not found');
      return;
    }

    console.log(`✅ SELLER FOUND:`);
    console.log(`   - Name: ${seller.name}`);
    console.log(`   - Email: ${seller.email}`);
    console.log(`   - ID: ${seller.id}`);

    if (seller.savedConfig) {
      console.log(`   - Config Name: ${seller.savedConfig.configurationName}`);
      console.log(`   - Config ID: ${seller.savedConfig.id}`);
      
      try {
        const config = JSON.parse(seller.savedConfig.config);
        console.log('\n📋 CONFIGURATION DETAILS:');
        console.log(`   - Welcome Email (button1SendWelcomeEmail): ${config.button1SendWelcomeEmail ? '✅ TRUE' : '❌ FALSE/UNDEFINED'}`);
        console.log(`   - Rebuy Email (button5SendRebuyEmail): ${config.button5SendRebuyEmail ? '✅ TRUE' : '❌ FALSE/UNDEFINED'}`);
        
        // Show the actual value for debugging
        console.log(`\n🔍 RAW VALUES:`);
        console.log(`   - button1SendWelcomeEmail: ${JSON.stringify(config.button1SendWelcomeEmail)}`);
        console.log(`   - button5SendRebuyEmail: ${JSON.stringify(config.button5SendRebuyEmail)}`);
        
        // Show button1 configuration
        if (config.button1) {
          console.log(`\n🔘 BUTTON1 CONFIG:`);
          console.log(`   - Text: ${config.button1.text}`);
          console.log(`   - Price: ${config.button1.price}`);
          console.log(`   - Days: ${config.button1.days}`);
        }
        
      } catch (error) {
        console.log(`❌ Error parsing config: ${error.message}`);
      }
    } else {
      console.log('❌ No saved configuration found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLawrenceConfig(); 