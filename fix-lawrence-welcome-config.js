const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLawrenceWelcomeConfig() {
  try {
    console.log('🔍 CHECKING AND FIXING LAWRENCE TAYLOR\'S WELCOME EMAIL CONFIGURATION\n');
    
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
        console.log('\n📋 CURRENT CONFIGURATION:');
        console.log(`   - Welcome Email (button1SendWelcomeEmail): ${config.button1SendWelcomeEmail ? '✅ TRUE' : '❌ FALSE/UNDEFINED'}`);
        console.log(`   - Rebuy Email (button5SendRebuyEmail): ${config.button5SendRebuyEmail ? '✅ TRUE' : '❌ FALSE/UNDEFINED'}`);
        
        // Check if welcome email is disabled
        if (config.button1SendWelcomeEmail !== true) {
          console.log('\n🔧 FIXING: Setting button1SendWelcomeEmail to true...');
          
          // Update the configuration
          config.button1SendWelcomeEmail = true;
          
          // Save back to database
          await prisma.savedQRConfiguration.update({
            where: { id: seller.savedConfig.id },
            data: {
              config: JSON.stringify(config)
            }
          });
          
          console.log('✅ FIXED: Welcome email is now enabled for Lawrence Taylor');
        } else {
          console.log('\n✅ ALREADY CORRECT: Welcome email is already enabled');
        }
        
        // Show final configuration
        console.log('\n📋 FINAL CONFIGURATION:');
        console.log(`   - Welcome Email (button1SendWelcomeEmail): ✅ TRUE`);
        console.log(`   - Rebuy Email (button5SendRebuyEmail): ${config.button5SendRebuyEmail ? '✅ TRUE' : '❌ FALSE'}`);
        
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

fixLawrenceWelcomeConfig(); 