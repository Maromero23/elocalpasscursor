const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentConfig() {
  try {
    console.log('🔍 Checking current "probando rebuying test" configuration...\n');
    
    const config = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: 'probando rebuying test'
      }
    });
    
    if (!config) {
      console.log('❌ Configuration not found');
      return;
    }
    
    console.log(`📋 Configuration: "${config.name}"`);
    console.log(`🆔 ID: ${config.id}`);
    console.log(`📅 Updated: ${config.updatedAt}\n`);
    
    if (config.emailTemplates) {
      try {
        const templates = JSON.parse(config.emailTemplates);
        
        console.log('📧 EMAIL TEMPLATES CONFIGURED:');
        console.log(`   welcomeEmail: ${!!templates.welcomeEmail ? '✅ YES' : '❌ NO'}`);
        console.log(`   rebuyEmail: ${!!templates.rebuyEmail ? '✅ YES' : '❌ NO'}`);
        console.log('');
        
        if (templates.welcomeEmail) {
          console.log('📧 WELCOME EMAIL DETAILS:');
          console.log(`   - ID: ${templates.welcomeEmail.id}`);
          console.log(`   - Name: ${templates.welcomeEmail.name}`);
          console.log(`   - Subject: ${templates.welcomeEmail.subject}`);
          console.log(`   - Has customHTML: ${!!templates.welcomeEmail.customHTML}`);
          console.log(`   - Has htmlContent: ${!!templates.welcomeEmail.htmlContent}`);
          if (templates.welcomeEmail.customHTML) {
            console.log(`   - CustomHTML length: ${templates.welcomeEmail.customHTML.length} characters`);
          }
          console.log('');
        } else {
          console.log('❌ NO WELCOME EMAIL TEMPLATE CONFIGURED\n');
        }
        
        if (templates.rebuyEmail) {
          console.log('📧 REBUY EMAIL DETAILS:');
          console.log(`   - ID: ${templates.rebuyEmail.id}`);
          console.log(`   - Name: ${templates.rebuyEmail.name}`);
          console.log(`   - Subject: ${templates.rebuyEmail.subject}`);
          console.log(`   - Has customHTML: ${!!templates.rebuyEmail.customHTML}`);
          console.log(`   - Has htmlContent: ${!!templates.rebuyEmail.htmlContent}`);
          if (templates.rebuyEmail.customHTML) {
            console.log(`   - CustomHTML length: ${templates.rebuyEmail.customHTML.length} characters`);
          }
          console.log('');
        }
        
      } catch (e) {
        console.log(`❌ Error parsing email templates: ${e.message}`);
      }
    } else {
      console.log('❌ No email templates found in configuration');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentConfig(); 