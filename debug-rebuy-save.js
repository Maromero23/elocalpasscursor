const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRebuySave() {
  try {
    console.log('🔍 Debugging rebuy configuration save process...');
    
    // First, let's see what's currently in "new new new" config
    const config = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: {
          contains: 'new new new',
          mode: 'insensitive'
        }
      }
    });
    
    if (!config) {
      console.log('❌ Config "new new new" not found');
      return;
    }
    
    console.log('\n=== CURRENT CONFIG IN DATABASE ===');
    console.log(`Config ID: ${config.id}`);
    console.log(`Name: ${config.name}`);
    
    if (config.emailTemplates) {
      const emailTemplates = JSON.parse(config.emailTemplates);
      if (emailTemplates.rebuyEmail?.rebuyConfig) {
        const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig;
        console.log('\n=== CURRENT REBUY COLORS ===');
        console.log(`Header Background: ${rebuyConfig.emailHeaderColor}`);
        console.log(`Header Text: ${rebuyConfig.emailHeaderTextColor || 'undefined'}`);
        console.log(`Primary Color: ${rebuyConfig.emailPrimaryColor}`);
        console.log(`Secondary Color: ${rebuyConfig.emailSecondaryColor}`);
      }
    }
    
    console.log('\n=== SIMULATING CORRECT SAVE ===');
    console.log('What SHOULD be saved based on user interface:');
    console.log('- Header Background (emailHeaderColor): #d70fff (purple)');
    console.log('- Header Text (emailHeaderTextColor): #16f4f8 (cyan)');
    
    // Let's test if we can manually save the correct values
    if (config.emailTemplates) {
      const emailTemplates = JSON.parse(config.emailTemplates);
      
      if (emailTemplates.rebuyEmail?.rebuyConfig) {
        // Update with correct colors
        emailTemplates.rebuyEmail.rebuyConfig.emailHeaderColor = '#d70fff';  // Purple background
        emailTemplates.rebuyEmail.rebuyConfig.emailHeaderTextColor = '#16f4f8';  // Cyan text
        
        // Save back to database
        await prisma.savedQRConfiguration.update({
          where: { id: config.id },
          data: {
            emailTemplates: JSON.stringify(emailTemplates),
            updatedAt: new Date()
          }
        });
        
        console.log('\n✅ TEST SAVE COMPLETED');
        console.log('Updated database with correct colors');
        
        // Verify the save worked
        const updatedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: config.id }
        });
        
        if (updatedConfig?.emailTemplates) {
          const verifyTemplates = JSON.parse(updatedConfig.emailTemplates);
          if (verifyTemplates.rebuyEmail?.rebuyConfig) {
            const verifyRebuyConfig = verifyTemplates.rebuyEmail.rebuyConfig;
            console.log('\n=== VERIFICATION ===');
            console.log(`Header Background: ${verifyRebuyConfig.emailHeaderColor}`);
            console.log(`Header Text: ${verifyRebuyConfig.emailHeaderTextColor}`);
            
            if (verifyRebuyConfig.emailHeaderColor === '#d70fff' && 
                verifyRebuyConfig.emailHeaderTextColor === '#16f4f8') {
              console.log('✅ Colors saved correctly!');
              console.log('\nNow test a rebuy email to see if it uses these colors.');
            } else {
              console.log('❌ Colors not saved correctly');
            }
          }
        }
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugRebuySave(); 