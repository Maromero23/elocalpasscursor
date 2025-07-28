const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllConfigs() {
  try {
    console.log('🔍 CHECKING ALL SELLER CONFIGURATIONS FOR WELCOME EMAIL SETTINGS\n');
    
    // Get all saved configurations
    const allConfigs = await prisma.savedQRConfiguration.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${allConfigs.length} total configurations\n`);
    
    let needsFixing = 0;
    let alreadyFixed = 0;
    let hasErrors = 0;
    
    for (const config of allConfigs) {
      console.log(`📋 Configuration: ${config.name}`);
      console.log(`- ID: ${config.id}`);
      console.log(`- Created: ${config.createdAt}`);
      
      try {
        const parsedConfig = JSON.parse(config.config);
        const welcomeEnabled = parsedConfig.button1SendWelcomeEmail;
        
        console.log(`- button1SendWelcomeEmail: ${welcomeEnabled}`);
        
        if (welcomeEnabled === true) {
          console.log(`✅ Already configured correctly`);
          alreadyFixed++;
        } else if (welcomeEnabled === false) {
          console.log(`⚠️ Explicitly DISABLED - user choice`);
          alreadyFixed++;
        } else {
          console.log(`❌ NEEDS FIXING (undefined/missing)`);
          needsFixing++;
        }
        
      } catch (parseError) {
        console.log(`❌ ERROR parsing configuration: ${parseError.message}`);
        hasErrors++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('\n📈 SUMMARY:');
    console.log(`✅ Correctly configured: ${alreadyFixed}`);
    console.log(`❌ Need fixing: ${needsFixing}`);
    console.log(`💥 Parse errors: ${hasErrors}`);
    console.log(`📊 Total: ${allConfigs.length}`);
    
    if (needsFixing > 0) {
      console.log('\n🔧 RECOMMENDATION:');
      console.log('Run a bulk fix script to set button1SendWelcomeEmail: true for undefined configurations');
      console.log('This will enable welcome emails for all configurations that don\'t explicitly disable them');
    } else {
      console.log('\n🎉 ALL CONFIGURATIONS ARE PROPERLY SET!');
    }
    
    // Also check which sellers are using these configurations
    console.log('\n👥 CHECKING SELLER USAGE:');
    
    const sellersWithConfigs = await prisma.user.findMany({
      where: {
        role: 'SELLER',
        savedConfigId: {
          not: null
        }
      },
      include: {
        savedConfig: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${sellersWithConfigs.length} sellers with configurations:`);
    
    for (const seller of sellersWithConfigs) {
      console.log(`👤 ${seller.name}: Using "${seller.savedConfig?.name}" (${seller.savedConfig?.id})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllConfigs(); 