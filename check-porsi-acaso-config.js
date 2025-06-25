const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPorsiAcasoConfig() {
  try {
    console.log('🔍 CHECKING CONFIGURATION: porsi acaso');
    console.log('ID: cmcboqdba00018lqupx55na0p\n');
    
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmcboqdba00018lqupx55na0p' }
    });
    
    if (config) {
      console.log('✅ Configuration Found:');
      console.log('- Name:', config.name);
      console.log('- ID:', config.id);
      console.log('- Created:', config.createdAt);
      console.log('- Rebuy Email Enabled:', config.button5SendRebuyEmail);
      console.log('- Has emailTemplates field:', !!config.emailTemplates);
      
      if (config.emailTemplates) {
        try {
          const templates = JSON.parse(config.emailTemplates);
          console.log('\n📧 EMAIL TEMPLATES ANALYSIS:');
          console.log('- Has rebuyEmail:', !!templates.rebuyEmail);
          
          if (templates.rebuyEmail) {
            console.log('\n🎯 REBUY EMAIL DETAILS:');
            console.log('- customHTML value:', templates.rebuyEmail.customHTML);
            console.log('- customHTML type:', typeof templates.rebuyEmail.customHTML);
            console.log('- customHTML length:', templates.rebuyEmail.customHTML?.length || 0, 'characters');
            console.log('- Is USE_DEFAULT_TEMPLATE?', templates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE');
            
            if (templates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
              console.log('✅ This configuration uses the DEFAULT TEMPLATE marker');
            } else if (templates.rebuyEmail.customHTML && templates.rebuyEmail.customHTML.length > 100) {
              console.log('📝 This configuration has CUSTOM HTML content');
              console.log('- HTML Preview (first 200 chars):');
              console.log(templates.rebuyEmail.customHTML.substring(0, 200) + '...');
            } else {
              console.log('⚠️ This configuration has minimal or no HTML content');
            }
            
            // Check other properties
            console.log('\n📋 OTHER TEMPLATE PROPERTIES:');
            console.log('- Has name:', !!templates.rebuyEmail.name);
            console.log('- Name value:', templates.rebuyEmail.name);
            console.log('- Has rebuyConfig:', !!templates.rebuyEmail.rebuyConfig);
            
            if (templates.rebuyEmail.rebuyConfig) {
              console.log('- Email Subject:', templates.rebuyEmail.rebuyConfig.emailSubject);
              console.log('- Email Header:', templates.rebuyEmail.rebuyConfig.emailHeader);
              console.log('- Email Message:', templates.rebuyEmail.rebuyConfig.emailMessage);
              console.log('- CTA Button:', templates.rebuyEmail.rebuyConfig.emailCta);
              console.log('- Discount Enabled:', templates.rebuyEmail.rebuyConfig.enableDiscountCode);
              console.log('- Discount Value:', templates.rebuyEmail.rebuyConfig.discountValue);
            }
          } else {
            console.log('❌ NO rebuy email template found in this configuration');
          }
        } catch (e) {
          console.log('❌ Error parsing emailTemplates:', e.message);
          console.log('Raw emailTemplates field length:', config.emailTemplates?.length || 0);
        }
      } else {
        console.log('❌ No emailTemplates field found');
      }
    } else {
      console.log('❌ Configuration not found with ID: cmcboqdba00018lqupx55na0p');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPorsiAcasoConfig(); 