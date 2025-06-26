const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplateStructure() {
  try {
    console.log('🔍 Checking rebuy email template structure...');
    
    // Find configurations with rebuy email templates
    const configs = await prisma.savedQRConfiguration.findMany({
      where: {
        emailTemplates: {
          not: null
        }
      }
    });
    
    console.log(`\nFound ${configs.length} configurations with email templates`);
    
    for (const config of configs) {
      const templates = JSON.parse(config.emailTemplates);
      
      if (templates.rebuyEmail) {
        console.log(`\n📧 CONFIG: "${config.name}" (${config.id})`);
        console.log('  REBUY EMAIL TEMPLATE:');
        console.log('  - Has customHTML:', !!templates.rebuyEmail.customHTML);
        
        if (templates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
          console.log('  - Type: DEFAULT TEMPLATE');
        } else if (templates.rebuyEmail.customHTML) {
          console.log('  - Type: CUSTOM TEMPLATE');
          console.log(`  - HTML Length: ${templates.rebuyEmail.customHTML.length} chars`);
          console.log('  - HTML Preview:', templates.rebuyEmail.customHTML.substring(0, 300) + '...');
        }
        
        if (templates.rebuyEmail.rebuyConfig?.emailSubject) {
          console.log('  - Subject:', templates.rebuyEmail.rebuyConfig.emailSubject);
        }
      }
    }
    
    // Also check default rebuy template in database
    console.log('\n🗄️ DEFAULT REBUY TEMPLATE IN DATABASE:');
    const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });
    
    if (defaultRebuyTemplate) {
      console.log('  - Found default template');
      console.log('  - Subject:', defaultRebuyTemplate.subject);
      console.log('  - Has customHTML:', !!defaultRebuyTemplate.customHTML);
      if (defaultRebuyTemplate.customHTML) {
        console.log(`  - HTML Length: ${defaultRebuyTemplate.customHTML.length} chars`);
      }
    } else {
      console.log('  - No default template found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkTemplateStructure(); 