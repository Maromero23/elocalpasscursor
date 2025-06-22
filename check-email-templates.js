const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
  try {
    // Check the config that's actually being used
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmc6lrdw80000a8og3saipbuc' }
    });
    
    if (config) {
      console.log('✅ Found config for cmc6lrdw80000a8og3saipbuc');
      console.log('📧 emailTemplates field:', config.emailTemplates ? 'EXISTS' : 'NULL');
      
      if (config.emailTemplates) {
        const templates = JSON.parse(config.emailTemplates);
        console.log('📧 welcomeEmail exists:', !!templates.welcomeEmail);
        console.log('📧 customHTML exists:', !!templates.welcomeEmail?.customHTML);
        console.log('📧 customHTML length:', templates.welcomeEmail?.customHTML?.length || 0);
      }
    } else {
      console.log('❌ Config not found for cmc6lrdw80000a8og3saipbuc');
    }
    
    // Also check the other config
    const otherConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmc6mw7vi0000w6he6qnekh4a' }
    });
    
    if (otherConfig) {
      console.log('\n✅ Found config for cmc6mw7vi0000w6he6qnekh4a');
      console.log('📧 emailTemplates field:', otherConfig.emailTemplates ? 'EXISTS' : 'NULL');
      
      if (otherConfig.emailTemplates) {
        const templates = JSON.parse(otherConfig.emailTemplates);
        console.log('📧 welcomeEmail exists:', !!templates.welcomeEmail);
        console.log('�� customHTML exists:', !!templates.welcomeEmail?.customHTML);
        console.log('📧 customHTML length:', templates.welcomeEmail?.customHTML?.length || 0);
      }
    } else {
      console.log('\n❌ Config not found for cmc6mw7vi0000w6he6qnekh4a');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
