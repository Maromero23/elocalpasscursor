const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificConfig() {
  try {
    console.log('🔍 CHECKING CONFIGURATION: cmcbd4jo3000013tvjkkah8kr\n');
    
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmcbd4jo3000013tvjkkah8kr' },
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    if (!config) {
      console.log('❌ Configuration not found');
      return;
    }
    
    console.log(`✅ Found: ${config.name}`);
    console.log(`ID: ${config.id}\n`);
    
    // Check main config for rebuy settings
    try {
      const configData = JSON.parse(config.config);
      console.log('🔧 MAIN CONFIG:');
      console.log(`button5SendRebuyEmail: ${configData.button5SendRebuyEmail}`);
      
      if (configData.button5SendRebuyEmail) {
        console.log('✅ Rebuy emails are ENABLED\n');
      } else {
        console.log('❌ Rebuy emails are DISABLED\n');
      }
      
    } catch (error) {
      console.log('❌ Error parsing main config\n');
    }
    
    // Check email templates
    if (config.emailTemplates) {
      try {
        const emailTemplates = JSON.parse(config.emailTemplates);
        
        console.log('📧 EMAIL TEMPLATES:');
        
        // Check welcome email
        if (emailTemplates.welcomeEmail) {
          console.log('Welcome Email: ✅ CONFIGURED');
          if (emailTemplates.welcomeEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
            console.log('  Type: DEFAULT TEMPLATE');
          } else {
            console.log('  Type: CUSTOM TEMPLATE');
          }
        } else {
          console.log('Welcome Email: ❌ NOT CONFIGURED');
        }
        
        // Check rebuy email
        if (emailTemplates.rebuyEmail) {
          console.log('Rebuy Email: ✅ CONFIGURED');
          if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
            console.log('  Type: DEFAULT TEMPLATE');
          } else if (emailTemplates.rebuyEmail.customHTML) {
            console.log('  Type: CUSTOM TEMPLATE');
            console.log(`  HTML Length: ${emailTemplates.rebuyEmail.customHTML.length} characters`);
          } else {
            console.log('  Type: UNKNOWN (no customHTML)');
          }
          
          // Check rebuy subject
          if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
            console.log(`  Subject: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject}`);
          } else {
            console.log('  Subject: Not configured');
          }
          
        } else {
          console.log('Rebuy Email: ❌ NOT CONFIGURED');
        }
        
      } catch (error) {
        console.log('❌ Error parsing email templates');
      }
    } else {
      console.log('📧 EMAIL TEMPLATES: ❌ NOT CONFIGURED');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkSpecificConfig();
