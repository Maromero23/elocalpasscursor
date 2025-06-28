const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNewNewNewConfig() {
  try {
    console.log('🔧 Fixing "new new new" configuration colors...');
    
    // Find the "new new new" configuration
    const config = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: {
          contains: 'new new new',
          mode: 'insensitive'
        }
      }
    });
    
    if (!config) {
      console.log('❌ Configuration "new new new" not found');
      return;
    }
    
    console.log(`✅ Found config: ${config.name} (ID: ${config.id})`);
    
    if (config.emailTemplates) {
      const emailTemplates = JSON.parse(config.emailTemplates);
      
      if (emailTemplates.rebuyEmail?.rebuyConfig) {
        const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig;
        
        console.log('\n=== BEFORE FIX ===');
        console.log(`Header Background: ${rebuyConfig.emailHeaderColor}`);
        console.log(`Header Text: ${rebuyConfig.emailHeaderTextColor || 'undefined'}`);
        
        // Fix the colors to match what user sees in interface:
        // Purple header background + Cyan header text
        rebuyConfig.emailHeaderColor = '#d70fff';  // Purple for header background
        rebuyConfig.emailHeaderTextColor = '#16f4f8';  // Cyan for header text
        
        console.log('\n=== AFTER FIX ===');
        console.log(`Header Background: ${rebuyConfig.emailHeaderColor}`);
        console.log(`Header Text: ${rebuyConfig.emailHeaderTextColor}`);
        
        // Update the database
        const updatedEmailTemplates = JSON.stringify(emailTemplates);
        
        await prisma.savedQRConfiguration.update({
          where: { id: config.id },
          data: {
            emailTemplates: updatedEmailTemplates,
            updatedAt: new Date()
          }
        });
        
        console.log('\n✅ Configuration updated successfully!');
        console.log('The rebuy emails should now show:');
        console.log('- Purple header background (#d70fff)');
        console.log('- Cyan header text (#16f4f8)');
        
      } else {
        console.log('❌ No rebuy email config found');
      }
    } else {
      console.log('❌ No email templates found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixNewNewNewConfig(); 