const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableRebuyOnConfig() {
  try {
    console.log('🔧 ENABLING REBUY EMAIL ON SELLER CONFIGURATION...\n');
    
    const configId = 'cmcbfbh2t000412nvcbui8isi'; // 'creating a default email ?'
    
    // Get the configuration
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: configId }
    });
    
    if (!config) {
      console.log('❌ Configuration not found');
      return;
    }
    
    console.log('📋 CONFIGURATION TO UPDATE:');
    console.log('- Name:', config.name);
    console.log('- ID:', config.id);
    
    // Parse the config JSON
    const configData = JSON.parse(config.config);
    console.log('- Current rebuy enabled:', configData.button5SendRebuyEmail);
    
    // Enable rebuy email
    configData.button5SendRebuyEmail = true;
    
    // Update the configuration
    await prisma.savedQRConfiguration.update({
      where: { id: configId },
      data: {
        config: JSON.stringify(configData)
      }
    });
    
    console.log('\n✅ REBUY EMAIL ENABLED!');
    console.log('- Configuration updated successfully');
    console.log('- button5SendRebuyEmail set to true');
    
    // Add a default rebuy email template
    let emailTemplates = {};
    if (config.emailTemplates) {
      emailTemplates = JSON.parse(config.emailTemplates);
    }
    
    // Add default rebuy email template
    emailTemplates.rebuyEmail = {
      customHTML: 'USE_DEFAULT_TEMPLATE',
      subject: 'Your ELocalPass expires soon - Don\'t miss out!',
      rebuyConfig: {
        triggerHoursBefore: 12,
        enableRebuyEmail: true
      }
    };
    
    // Update email templates
    await prisma.savedQRConfiguration.update({
      where: { id: configId },
      data: {
        emailTemplates: JSON.stringify(emailTemplates)
      }
    });
    
    console.log('✅ DEFAULT REBUY EMAIL TEMPLATE ADDED!');
    console.log('- Template type: USE_DEFAULT_TEMPLATE');
    console.log('- Will use database default template');
    
    console.log('\n📊 AFFECTED SELLERS:');
    console.log('- Maria Playa (seller@playahotels.com)');
    console.log('- Seller User (seller@elocalpass.com)');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. These sellers can now create QR codes with rebuy emails enabled');
    console.log('2. Test by creating a QR code as one of these sellers');
    console.log('3. Check that rebuyEmailScheduled = true in analytics');
    console.log('4. Run rebuy email API to test email sending');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableRebuyOnConfig(); 