const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyTemplates() {
  try {
    console.log('🔍 CHECKING REBUY EMAIL TEMPLATES (READ-ONLY)\n');
    
    // 1. Check RebuyEmailTemplate database table
    console.log('📧 REBUY EMAIL TEMPLATE DATABASE TABLE:');
    const rebuyTemplates = await prisma.rebuyEmailTemplate.findMany({
      select: {
        id: true,
        name: true,
        subject: true,
        isDefault: true,
        customHTML: true,
        createdAt: true
      }
    });
    
    if (rebuyTemplates.length === 0) {
      console.log('❌ No rebuy email templates found in database');
    } else {
      rebuyTemplates.forEach((template, index) => {
        console.log(`\n${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Subject: ${template.subject}`);
        console.log(`   Is Default: ${template.isDefault}`);
        console.log(`   Has customHTML: ${!!template.customHTML}`);
        console.log(`   HTML Length: ${template.customHTML?.length || 0} characters`);
        console.log(`   Created: ${template.createdAt.toLocaleDateString()}`);
        
        if (template.customHTML && template.customHTML.length > 0) {
          console.log(`   HTML Preview: ${template.customHTML.substring(0, 100)}...`);
        } else {
          console.log(`   ❌ HTML is empty or null`);
        }
      });
    }
    
    // 2. Check saved configurations with rebuy emails
    console.log('\n\n📋 SAVED CONFIGURATIONS WITH REBUY EMAILS:');
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    let rebuyEnabledCount = 0;
    let defaultTemplateCount = 0;
    let customTemplateCount = 0;
    let noTemplateCount = 0;
    
    savedConfigs.forEach((config, index) => {
      try {
        const configData = JSON.parse(config.config);
        if (configData.button5SendRebuyEmail) {
          rebuyEnabledCount++;
          
          console.log(`\n${rebuyEnabledCount}. ${config.name}`);
          console.log(`   Config ID: ${config.id}`);
          console.log(`   Rebuy Enabled: ✅ YES`);
          
          if (config.emailTemplates) {
            const emailTemplates = JSON.parse(config.emailTemplates);
          
            if (emailTemplates.rebuyEmail) {
              console.log(`   Has rebuy email template: ✅ YES`);
              
              if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
                defaultTemplateCount++;
                console.log(`   Template Type: 🎯 DEFAULT TEMPLATE`);
                console.log(`   Subject: ${emailTemplates.rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
              } else if (emailTemplates.rebuyEmail.customHTML) {
                customTemplateCount++;
                console.log(`   Template Type: 🎨 CUSTOM TEMPLATE`);
                console.log(`   HTML Length: ${emailTemplates.rebuyEmail.customHTML.length} characters`);
                console.log(`   Subject: ${emailTemplates.rebuyEmail.rebuyConfig?.emailSubject || 'Not set'}`);
                console.log(`   HTML Preview: ${emailTemplates.rebuyEmail.customHTML.substring(0, 100)}...`);
              } else if (emailTemplates.rebuyEmail.htmlContent) {
                customTemplateCount++;
                console.log(`   Template Type: 🎨 CUSTOM TEMPLATE (legacy htmlContent)`);
                console.log(`   HTML Length: ${emailTemplates.rebuyEmail.htmlContent.length} characters`);
                console.log(`   HTML Preview: ${emailTemplates.rebuyEmail.htmlContent.substring(0, 100)}...`);
      } else {
                noTemplateCount++;
                console.log(`   Template Type: ❌ NO TEMPLATE CONTENT`);
      }
            } else {
              noTemplateCount++;
              console.log(`   Has rebuy email template: ❌ NO`);
            }
          } else {
            noTemplateCount++;
            console.log(`   Has email templates: ❌ NO`);
        }
        }
      } catch (error) {
        console.log(`❌ Error parsing config ${config.name}:`, error.message);
      }
    });
    
    // 3. Summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`Total configurations with rebuy enabled: ${rebuyEnabledCount}`);
    console.log(`Configurations using DEFAULT template: ${defaultTemplateCount}`);
    console.log(`Configurations using CUSTOM template: ${customTemplateCount}`);
    console.log(`Configurations with NO template: ${noTemplateCount}`);
      
    if (noTemplateCount > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      console.log(`${noTemplateCount} configurations have rebuy enabled but no email template!`);
      console.log('These will use generic fallback template.');
    }
    
    if (rebuyTemplates.length > 0) {
      const defaultTemplate = rebuyTemplates.find(t => t.isDefault);
      if (defaultTemplate && (!defaultTemplate.customHTML || defaultTemplate.customHTML.length === 0)) {
        console.log('\n🚨 DEFAULT TEMPLATE ISSUE:');
        console.log('Default rebuy template in database has no HTML content!');
        console.log('Configurations using default template will fall back to generic template.');
        }
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkRebuyTemplates(); 