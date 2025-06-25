const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleRebuyCheck() {
  try {
    console.log('🔍 CHECKING YOUR 12 SAVED CONFIGURATIONS FOR REBUY EMAILS\n');
    
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    console.log(`Found ${savedConfigs.length} saved configurations:\n`);
    
    savedConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`);
      
      try {
        const configData = JSON.parse(config.config);
        const rebuyEnabled = configData.button5SendRebuyEmail;
        
        console.log(`   Rebuy Email: ${rebuyEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        
        if (rebuyEnabled && config.emailTemplates) {
          const emailTemplates = JSON.parse(config.emailTemplates);
          if (emailTemplates.rebuyEmail) {
            console.log(`   Template: ✅ CONFIGURED`);
          } else {
            console.log(`   Template: ❌ MISSING`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error parsing config`);
      }
      
      console.log('');
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

simpleRebuyCheck(); 