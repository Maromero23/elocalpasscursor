const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificConfigs() {
  try {
    console.log('🔍 CHECKING YOUR TWO NEW CONFIGURATIONS\n');
    
    const configIds = [
      'cmcbn554q00009w03344jxk0h', // probando rebuy defualt template
      'cmcbn64lb0000q88hi04s2ube'  // probando rebuy email custom
    ];
    
    for (const configId of configIds) {
      console.log(`\n📋 CHECKING CONFIG: ${configId}`);
      console.log('=' + '='.repeat(50));
      
      // Check in SavedQRConfiguration table
      const config = await prisma.savedQRConfiguration.findUnique({
        where: { id: configId },
        select: {
          id: true,
          name: true,
          config: true,
          emailTemplates: true,
          createdAt: true
        }
      });
      
      if (!config) {
        console.log('❌ Configuration not found in database');
        continue;
      }
      
      console.log(`✅ Found configuration: "${config.name}"`);
      console.log(`   ID: ${config.id}`);
      console.log(`   Created: ${config.createdAt.toLocaleString()}`);
      
      // Check if rebuy email is enabled in main config
      if (config.config) {
        try {
          const mainConfig = JSON.parse(config.config);
          console.log(`   Rebuy Email Enabled: ${mainConfig.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        } catch (e) {
          console.log('   ❌ Error parsing main config');
        }
      }
      
      // Check email templates
      if (config.emailTemplates) {
        try {
          const emailTemplates = JSON.parse(config.emailTemplates);
          console.log(`   Has email templates: ✅ YES`);
          
          if (emailTemplates.rebuyEmail) {
            console.log(`   Has rebuy email template: ✅ YES`);
            
            const rebuyEmail = emailTemplates.rebuyEmail;
            
            // Check template type
            if (rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
              console.log(`   Template Type: 🎯 DEFAULT TEMPLATE`);
              console.log(`   Uses database default template: ✅ YES`);
              console.log(`   Subject: ${rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
              
              // Check if default template exists in database
              const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
                where: { isDefault: true }
              });
              
              if (defaultTemplate) {
                console.log(`   Default template in database: ✅ FOUND`);
                console.log(`   Default template HTML length: ${defaultTemplate.customHTML?.length || 0} characters`);
                if (defaultTemplate.customHTML && defaultTemplate.customHTML.length > 0) {
                  console.log(`   Default template preview: ${defaultTemplate.customHTML.substring(0, 100)}...`);
                } else {
                  console.log(`   ⚠️ Default template has no HTML content`);
                }
              } else {
                console.log(`   ❌ No default template found in database`);
              }
              
            } else if (rebuyEmail.customHTML && rebuyEmail.customHTML.length > 0) {
              console.log(`   Template Type: 🎨 CUSTOM TEMPLATE`);
              console.log(`   Custom HTML length: ${rebuyEmail.customHTML.length} characters`);
              console.log(`   Subject: ${rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
              console.log(`   HTML preview: ${rebuyEmail.customHTML.substring(0, 100)}...`);
              
              // Check rebuy config details
              if (rebuyEmail.rebuyConfig) {
                console.log(`   Has rebuy config: ✅ YES`);
                console.log(`   Email header: ${rebuyEmail.rebuyConfig.emailHeader || 'Not set'}`);
                console.log(`   Email message: ${rebuyEmail.rebuyConfig.emailMessage?.substring(0, 50) || 'Not set'}...`);
                console.log(`   CTA button: ${rebuyEmail.rebuyConfig.emailCta || 'Not set'}`);
                console.log(`   Discount enabled: ${rebuyEmail.rebuyConfig.enableDiscountCode ? '✅ YES' : '❌ NO'}`);
                if (rebuyEmail.rebuyConfig.enableDiscountCode) {
                  console.log(`   Discount: ${rebuyEmail.rebuyConfig.discountValue}${rebuyEmail.rebuyConfig.discountType === 'percentage' ? '%' : '$'} off`);
                }
              }
              
            } else if (rebuyEmail.htmlContent) {
              console.log(`   Template Type: 🎨 CUSTOM TEMPLATE (legacy format)`);
              console.log(`   HTML length: ${rebuyEmail.htmlContent.length} characters`);
              console.log(`   HTML preview: ${rebuyEmail.htmlContent.substring(0, 100)}...`);
              
            } else {
              console.log(`   Template Type: ❌ NO TEMPLATE CONTENT`);
              console.log(`   ⚠️ Rebuy email is configured but has no HTML content`);
            }
            
          } else {
            console.log(`   Has rebuy email template: ❌ NO`);
          }
          
        } catch (e) {
          console.log(`   ❌ Error parsing email templates: ${e.message}`);
        }
      } else {
        console.log(`   Has email templates: ❌ NO`);
      }
    }
    
    // Also check the current default template in database
    console.log('\n\n🎯 CURRENT DEFAULT REBUY TEMPLATE IN DATABASE:');
    console.log('=' + '='.repeat(50));
    
    const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });
    
    if (defaultTemplate) {
      console.log(`✅ Default template found: "${defaultTemplate.name}"`);
      console.log(`   ID: ${defaultTemplate.id}`);
      console.log(`   Subject: ${defaultTemplate.subject}`);
      console.log(`   HTML length: ${defaultTemplate.customHTML?.length || 0} characters`);
      console.log(`   Created: ${defaultTemplate.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${defaultTemplate.updatedAt.toLocaleString()}`);
      
      if (defaultTemplate.customHTML && defaultTemplate.customHTML.length > 0) {
        console.log(`   ✅ Has HTML content`);
        console.log(`   HTML preview: ${defaultTemplate.customHTML.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ No HTML content`);
      }
    } else {
      console.log('❌ No default rebuy template found in database');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkSpecificConfigs(); 