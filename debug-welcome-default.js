const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWelcomeDefault() {
  try {
    console.log('🔍 Debugging welcome email default template issue...\n');
    
    // Check your current configuration
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
        
        console.log('📧 WELCOME EMAIL ANALYSIS:');
        console.log(`   Has welcomeEmail object: ${!!templates.welcomeEmail}`);
        
        if (templates.welcomeEmail) {
          console.log(`   - ID: ${templates.welcomeEmail.id}`);
          console.log(`   - Name: ${templates.welcomeEmail.name}`);
          console.log(`   - Subject: ${templates.welcomeEmail.subject}`);
          console.log(`   - Content: ${templates.welcomeEmail.content}`);
          console.log(`   - Has customHTML: ${!!templates.welcomeEmail.customHTML}`);
          console.log(`   - Has htmlContent: ${!!templates.welcomeEmail.htmlContent}`);
          
          if (templates.welcomeEmail.htmlContent) {
            console.log(`   - htmlContent value: "${templates.welcomeEmail.htmlContent}"`);
            console.log(`   - Is USE_DEFAULT_TEMPLATE signal: ${templates.welcomeEmail.htmlContent === 'USE_DEFAULT_TEMPLATE'}`);
          }
          
          if (templates.welcomeEmail.emailConfig) {
            console.log(`   - useDefaultEmail: ${templates.welcomeEmail.emailConfig.useDefaultEmail}`);
          }
          
          console.log('');
        } else {
          console.log('   ❌ NO welcomeEmail object found\n');
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

debugWelcomeDefault(); 