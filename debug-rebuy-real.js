const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRebuyReal() {
  try {
    console.log('🔍 Debugging ACTUAL rebuy email template...\n');
    
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
        
        console.log('📧 REBUY EMAIL ANALYSIS:');
        console.log(`   Has rebuyEmail object: ${!!templates.rebuyEmail}`);
        
        if (templates.rebuyEmail) {
          console.log(`   - ID: ${templates.rebuyEmail.id}`);
          console.log(`   - Name: ${templates.rebuyEmail.name}`);
          console.log(`   - Subject: ${templates.rebuyEmail.subject}`);
          console.log(`   - Content: ${templates.rebuyEmail.content}`);
          console.log(`   - Has customHTML: ${!!templates.rebuyEmail.customHTML}`);
          console.log(`   - Has htmlContent: ${!!templates.rebuyEmail.htmlContent}`);
          
          if (templates.rebuyEmail.customHTML) {
            console.log(`   - CustomHTML length: ${templates.rebuyEmail.customHTML.length} characters`);
            
            // Check if it contains the features you showed me
            const hasCountdownTimer = templates.rebuyEmail.customHTML.includes('Time Remaining Until Expiration');
            const hasFeaturedPartners = templates.rebuyEmail.customHTML.includes('Featured Partners');
            const hasAdvancedStyling = templates.rebuyEmail.customHTML.includes('background: linear-gradient');
            const hasYourCustomText = templates.rebuyEmail.customHTML.includes('Don\'t Miss Out! Testing rebuy');
            
            console.log(`   - Contains countdown timer: ${hasCountdownTimer}`);
            console.log(`   - Contains featured partners: ${hasFeaturedPartners}`);
            console.log(`   - Contains advanced styling: ${hasAdvancedStyling}`);
            console.log(`   - Contains your custom text: ${hasYourCustomText}`);
            
            // Show first 500 characters to see what's actually there
            console.log('\n📄 FIRST 500 CHARACTERS OF ACTUAL TEMPLATE:');
            console.log('=' + '='.repeat(60));
            console.log(templates.rebuyEmail.customHTML.substring(0, 500));
            console.log('=' + '='.repeat(60));
          }
          
          if (templates.rebuyEmail.rebuyConfig) {
            console.log('\n⚙️ REBUY CONFIG:');
            console.log(`   - Header text: ${templates.rebuyEmail.rebuyConfig.headerText}`);
            console.log(`   - Message text: ${templates.rebuyEmail.rebuyConfig.messageText}`);
            console.log(`   - Primary color: ${templates.rebuyEmail.rebuyConfig.primaryColor}`);
            console.log(`   - Enable countdown: ${templates.rebuyEmail.rebuyConfig.enableCountdownTimer}`);
            console.log(`   - Enable partners: ${templates.rebuyEmail.rebuyConfig.enableFeaturedPartners}`);
          }
          
          console.log('');
        } else {
          console.log('   ❌ NO rebuyEmail object found\n');
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

debugRebuyReal(); 