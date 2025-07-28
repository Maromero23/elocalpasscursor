const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMariaWelcomeConfig() {
  try {
    console.log('🔧 FIXING MARIA\'S WELCOME EMAIL CONFIGURATION\n');
    
    // Find Maria's "Test rebuy email" configuration
    const mariaConfig = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: 'Test rebuy email'
      }
    });
    
    if (!mariaConfig) {
      console.log('❌ Configuration "Test rebuy email" not found');
      return;
    }
    
    console.log('✅ Found configuration:');
    console.log(`- Name: ${mariaConfig.name}`);
    console.log(`- ID: ${mariaConfig.id}`);
    
    // Parse current configuration
    const currentConfig = JSON.parse(mariaConfig.config);
    console.log(`\n📋 CURRENT CONFIGURATION:`);
    console.log(`- button1SendWelcomeEmail: ${currentConfig.button1SendWelcomeEmail}`);
    console.log(`- button5SendRebuyEmail: ${currentConfig.button5SendRebuyEmail}`);
    
    // Update configuration to explicitly enable welcome emails
    const updatedConfig = {
      ...currentConfig,
      button1SendWelcomeEmail: true
    };
    
    console.log(`\n🔄 UPDATING CONFIGURATION:`);
    console.log(`- Setting button1SendWelcomeEmail: true`);
    
    // Update the configuration in the database
    await prisma.savedQRConfiguration.update({
      where: { id: mariaConfig.id },
      data: {
        config: JSON.stringify(updatedConfig)
      }
    });
    
    console.log(`\n✅ CONFIGURATION UPDATED SUCCESSFULLY!`);
    console.log(`\n📋 NEW CONFIGURATION:`);
    console.log(`- button1SendWelcomeEmail: ${updatedConfig.button1SendWelcomeEmail}`);
    console.log(`- button5SendRebuyEmail: ${updatedConfig.button5SendRebuyEmail}`);
    
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`1. Create a new QR code using Maria's seller profile`);
    console.log(`2. Welcome email should now be sent automatically`);
    console.log(`3. Check that welcomeEmailSent is true in analytics`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMariaWelcomeConfig(); 