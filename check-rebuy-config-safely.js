const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyConfigSafely() {
  try {
    console.log('🔍 CHECKING REBUY CONFIGURATION STORAGE (SAFE)\n');
    
    // Check Pedrita's configuration (the one we know works for welcome emails)
    const pedritaConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmcbgg9sv0000s17nxjl73zrf' }, // "lets get welcome eail done"
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    if (pedritaConfig) {
      console.log('📋 PEDRITA\'S CONFIGURATION:');
      console.log(`Name: ${pedritaConfig.name}`);
      
      // Parse the config JSON to see rebuy settings
      try {
        const config = JSON.parse(pedritaConfig.config);
        console.log('\n🔧 CONFIG FIELD (rebuy settings):');
        console.log(`button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
        
        // Parse emailTemplates to see rebuy email template
        if (pedritaConfig.emailTemplates) {
          const emailTemplates = JSON.parse(pedritaConfig.emailTemplates);
          console.log('\n📧 EMAIL TEMPLATES FIELD:');
          console.log('Has welcomeEmail:', !!emailTemplates.welcomeEmail);
          console.log('Has rebuyEmail:', !!emailTemplates.rebuyEmail);
          
          if (emailTemplates.rebuyEmail) {
            console.log('\n✅ REBUY EMAIL TEMPLATE FOUND:');
            console.log(`Subject: ${emailTemplates.rebuyEmail.subject || 'No subject'}`);
            console.log(`CustomHTML: ${emailTemplates.rebuyEmail.customHTML || 'No customHTML'}`);
            console.log(`HTML length: ${emailTemplates.rebuyEmail.customHTML?.length || 0}`);
            
            if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
              console.log('🎯 Uses USE_DEFAULT_TEMPLATE - should load from RebuyEmailTemplate table');
            }
          } else {
            console.log('❌ No rebuyEmail template found');
          }
        }
      } catch (error) {
        console.log('❌ Error parsing config JSON:', error.message);
      }
    }
    
    // Check the RebuyEmailTemplate table more carefully
    console.log('\n📧 REBUY EMAIL TEMPLATE TABLE DETAILS:');
    const rebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });
    
    if (rebuyTemplate) {
      console.log('✅ Found default rebuy template:');
      console.log(`ID: ${rebuyTemplate.id}`);
      console.log(`Name: ${rebuyTemplate.name}`);
      console.log(`Subject: ${rebuyTemplate.subject}`);
      console.log(`Has customHTML: ${!!rebuyTemplate.customHTML}`);
      console.log(`HTML length: ${rebuyTemplate.customHTML?.length || 0}`);
      
      if (!rebuyTemplate.customHTML || rebuyTemplate.customHTML.length === 0) {
        console.log('\n🎯 PROBLEM IDENTIFIED: Default rebuy template has NO HTML content!');
        console.log('This is the same issue we had with welcome emails.');
      }
    }
    
    console.log('\n🔍 CHECKING FOR REBUY EMAIL SENDING API:');
    // This is just checking if the API file exists, not modifying it
    const fs = require('fs');
    const rebuyApiPath = 'app/api/rebuy-emails/send/route.ts';
    
    if (fs.existsSync(rebuyApiPath)) {
      console.log('✅ Found rebuy email API at:', rebuyApiPath);
    } else {
      console.log('❌ No rebuy email sending API found');
      console.log('   Expected location:', rebuyApiPath);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ SAFE INVESTIGATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkRebuyConfigSafely(); 