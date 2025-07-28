const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSellerUserConfig() {
  try {
    console.log('🔍 CHECKING SELLER USER CONFIGURATION\n');
    
    // Find Seller User
    const sellerUser = await prisma.user.findFirst({
      where: {
        name: 'Seller User'
      },
      include: {
        savedConfig: true
      }
    });
    
    if (!sellerUser) {
      console.log('❌ Seller User not found');
      return;
    }
    
    console.log('✅ Found Seller User:');
    console.log(`- Name: ${sellerUser.name}`);
    console.log(`- Email: ${sellerUser.email}`);
    console.log(`- Role: ${sellerUser.role}`);
    console.log(`- Saved Config ID: ${sellerUser.savedConfigId}`);
    
    if (!sellerUser.savedConfig) {
      console.log('❌ ISSUE: Seller User has no saved configuration');
      
      // Find the "333" configuration that was mentioned in the earlier analysis
      const config333 = await prisma.savedQRConfiguration.findFirst({
        where: {
          name: '333'
        }
      });
      
      if (config333) {
        console.log(`\n✅ Found "333" configuration: ${config333.id}`);
        console.log('🔧 This should be Seller User\'s configuration');
        
        // Check the configuration
        try {
          const parsedConfig = JSON.parse(config333.config);
          console.log(`\n📋 "333" CONFIGURATION:`);
          console.log(`- button1SendWelcomeEmail: ${parsedConfig.button1SendWelcomeEmail}`);
          console.log(`- button5SendRebuyEmail: ${parsedConfig.button5SendRebuyEmail}`);
          
          // Fix the configuration if needed
          if (parsedConfig.button1SendWelcomeEmail !== true || parsedConfig.button5SendRebuyEmail !== true) {
            console.log(`\n🔧 FIXING "333" CONFIGURATION...`);
            
            const updatedConfig = {
              ...parsedConfig,
              button1SendWelcomeEmail: true,
              button5SendRebuyEmail: true
            };
            
            await prisma.savedQRConfiguration.update({
              where: { id: config333.id },
              data: {
                config: JSON.stringify(updatedConfig)
              }
            });
            
            console.log(`✅ Updated "333" configuration with welcome and rebuy emails enabled`);
          }
          
        } catch (parseError) {
          console.log('❌ Error parsing "333" configuration');
        }
      }
      
      return;
    }
    
    // Check the current configuration
    console.log(`\n✅ Seller User's configuration: ${sellerUser.savedConfig.name}`);
    
    try {
      const config = JSON.parse(sellerUser.savedConfig.config);
      console.log(`\n📋 CURRENT CONFIGURATION:`);
      console.log(`- button1SendWelcomeEmail: ${config.button1SendWelcomeEmail}`);
      console.log(`- button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
      
      // Check email templates
      if (sellerUser.savedConfig.emailTemplates) {
        const emailTemplates = JSON.parse(sellerUser.savedConfig.emailTemplates);
        console.log(`\n📧 EMAIL TEMPLATES:`);
        console.log(`- Has welcomeEmail: ${!!emailTemplates.welcomeEmail}`);
        console.log(`- Has rebuyEmail: ${!!emailTemplates.rebuyEmail}`);
      } else {
        console.log(`\n📧 EMAIL TEMPLATES: None configured`);
      }
      
      // Fix configuration if needed
      if (config.button1SendWelcomeEmail !== true || config.button5SendRebuyEmail !== true) {
        console.log(`\n🔧 FIXING SELLER USER'S CONFIGURATION...`);
        
        const updatedConfig = {
          ...config,
          button1SendWelcomeEmail: true,
          button5SendRebuyEmail: true
        };
        
        await prisma.savedQRConfiguration.update({
          where: { id: sellerUser.savedConfig.id },
          data: {
            config: JSON.stringify(updatedConfig)
          }
        });
        
        console.log(`✅ Updated Seller User's configuration with welcome and rebuy emails enabled`);
      } else {
        console.log(`✅ Configuration is already properly set up`);
      }
      
    } catch (parseError) {
      console.log('❌ Error parsing Seller User\'s configuration');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSellerUserConfig(); 