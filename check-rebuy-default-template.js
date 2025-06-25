const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyDefaultTemplate() {
  try {
    console.log('🔍 CHECKING REBUY DEFAULT TEMPLATE IN DATABASE\n');
    
    // Check RebuyEmailTemplate table
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
        console.log('\n❌ PROBLEM: Default rebuy template has NO HTML content!');
        console.log('This means when configs use "USE_DEFAULT_TEMPLATE", they get empty emails.');
        console.log('\n🎯 SOLUTION NEEDED:');
        console.log('1. Add proper HTML content to default rebuy template');
        console.log('2. OR ensure all configurations use custom templates');
      } else {
        console.log('\n✅ Default rebuy template has HTML content');
        console.log('First 100 characters:', rebuyTemplate.customHTML.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ No default rebuy template found in database');
    }
    
    // Check if any saved configurations use default rebuy template
    console.log('\n🔍 CHECKING SAVED CONFIGURATIONS FOR REBUY EMAIL USAGE:');
    
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    let rebuyEnabledConfigs = 0;
    let customTemplateConfigs = 0;
    let defaultTemplateConfigs = 0;
    
    savedConfigs.forEach(config => {
      try {
        const configData = JSON.parse(config.config);
        if (configData.button5SendRebuyEmail) {
          rebuyEnabledConfigs++;
          
          if (config.emailTemplates) {
            const emailTemplates = JSON.parse(config.emailTemplates);
            if (emailTemplates.rebuyEmail) {
              if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
                defaultTemplateConfigs++;
                console.log(`📋 ${config.name} - Uses DEFAULT template`);
              } else {
                customTemplateConfigs++;
                console.log(`📋 ${config.name} - Uses CUSTOM template`);
              }
            } else {
              console.log(`📋 ${config.name} - No rebuy email template configured`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error parsing config ${config.name}:`, error.message);
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total configurations with rebuy enabled: ${rebuyEnabledConfigs}`);
    console.log(`Configurations using CUSTOM templates: ${customTemplateConfigs}`);
    console.log(`Configurations using DEFAULT template: ${defaultTemplateConfigs}`);
    
    if (defaultTemplateConfigs > 0 && (!rebuyTemplate?.customHTML || rebuyTemplate.customHTML.length === 0)) {
      console.log('\n🚨 CRITICAL ISSUE:');
      console.log(`${defaultTemplateConfigs} configurations will send EMPTY rebuy emails!`);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkRebuyDefaultTemplate(); 