const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificRebuyConfig() {
  try {
    console.log('🔍 CHECKING SPECIFIC REBUY EMAIL CONFIGURATION\n');
    
    const configId = 'cmcbmgj9h0000ey1y1zyd0t6j';
    console.log(`Looking for config ID: ${configId}`);
    console.log(`Config name: "rebuy email testing"\n`);
    
    // Check in SavedQRConfiguration table
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: configId }
    });
    
    if (!savedConfig) {
      console.log('❌ Configuration not found in SavedQRConfiguration table');
      
      // Check in QRConfig table (legacy)
      const qrConfig = await prisma.qRConfig.findUnique({
        where: { id: configId }
      });
      
      if (qrConfig) {
        console.log('✅ Found in QRConfig table (legacy)');
        console.log(`   Name: ${qrConfig.name || 'No name'}`);
        console.log(`   Has emailTemplates: ${!!qrConfig.emailTemplates}`);
        
        if (qrConfig.emailTemplates) {
          try {
            const templates = JSON.parse(qrConfig.emailTemplates);
            console.log(`   Has rebuy email: ${!!templates.rebuyEmail}`);
            
            if (templates.rebuyEmail) {
              console.log(`   Rebuy email customHTML length: ${templates.rebuyEmail.customHTML?.length || 0}`);
              console.log(`   Rebuy email subject: ${templates.rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
              
              if (templates.rebuyEmail.customHTML && templates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
                console.log(`   HTML Preview: ${templates.rebuyEmail.customHTML.substring(0, 100)}...`);
              } else if (templates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
                console.log(`   Uses default template marker: ✅ YES`);
              }
            }
          } catch (e) {
            console.log(`   ❌ Error parsing emailTemplates: ${e.message}`);
          }
        }
      } else {
        console.log('❌ Configuration not found in either table');
      }
      
    } else {
      console.log('✅ Found in SavedQRConfiguration table');
      console.log(`   Name: ${savedConfig.name}`);
      console.log(`   Has emailTemplates: ${!!savedConfig.emailTemplates}`);
      console.log(`   Has config: ${!!savedConfig.config}`);
      
      // Check the main config
      if (savedConfig.config) {
        try {
          const config = JSON.parse(savedConfig.config);
          console.log(`   Rebuy enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        } catch (e) {
          console.log(`   ❌ Error parsing config: ${e.message}`);
        }
      }
      
      // Check email templates
      if (savedConfig.emailTemplates) {
        try {
          const templates = JSON.parse(savedConfig.emailTemplates);
          console.log(`   Has rebuy email template: ${!!templates.rebuyEmail}`);
          
          if (templates.rebuyEmail) {
            console.log(`   Rebuy email customHTML length: ${templates.rebuyEmail.customHTML?.length || 0}`);
            console.log(`   Rebuy email subject: ${templates.rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
            
            if (templates.rebuyEmail.customHTML && templates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
              console.log(`   Template Type: 🎨 CUSTOM TEMPLATE`);
              console.log(`   HTML Preview: ${templates.rebuyEmail.customHTML.substring(0, 100)}...`);
            } else if (templates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
              console.log(`   Template Type: 🎯 DEFAULT TEMPLATE MARKER`);
            } else {
              console.log(`   Template Type: ❌ NO TEMPLATE CONTENT`);
            }
          }
        } catch (e) {
          console.log(`   ❌ Error parsing emailTemplates: ${e.message}`);
        }
      }
    }
    
    // Also check all rebuy email templates again
    console.log('\n\n📧 ALL REBUY EMAIL TEMPLATES IN DATABASE:');
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    allTemplates.forEach((template, index) => {
      console.log(`\n${index + 1}. "${template.name}"`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Is Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   HTML Length: ${template.customHTML?.length || 0} characters`);
      console.log(`   Updated: ${template.updatedAt.toLocaleString()}`);
      
      if (template.customHTML && template.customHTML.length > 0) {
        console.log(`   ✅ Has HTML content`);
      } else {
        console.log(`   ❌ No HTML content`);
      }
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkSpecificRebuyConfig(); 