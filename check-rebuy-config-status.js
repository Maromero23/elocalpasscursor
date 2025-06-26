const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyEmailConfigs() {
  try {
    console.log('🔍 CHECKING REBUY EMAIL CONFIGURATIONS STATUS...\n');
    
    // Get recent configurations with rebuy email templates
    const configs = await prisma.savedQRConfiguration.findMany({
      where: {
        emailTemplates: {
          contains: 'rebuyEmail'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('📊 RECENT REBUY EMAIL CONFIGURATIONS:');
    console.log('Count:', configs.length);
    
    configs.forEach((config, index) => {
      console.log(`\nConfig ${index + 1}:`);
      console.log('- Name:', config.name);
      console.log('- ID:', config.id);
      console.log('- Created:', config.createdAt.toLocaleDateString());
      console.log('- button5SendRebuyEmail:', config.button5SendRebuyEmail);
      
      // Parse config to check the actual setting
      try {
        const configData = JSON.parse(config.config);
        console.log('- Config.button5SendRebuyEmail:', configData.button5SendRebuyEmail);
      } catch (e) {
        console.log('- Error parsing config:', e.message);
      }
      
      // Check if has rebuy email template
      try {
        const emailTemplates = JSON.parse(config.emailTemplates || '{}');
        console.log('- Has rebuy template:', !!emailTemplates.rebuyEmail);
        if (emailTemplates.rebuyEmail) {
          console.log('- Template type:', emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE' ? 'DEFAULT' : 'CUSTOM');
        }
      } catch (e) {
        console.log('- Error parsing email templates');
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ISSUE ANALYSIS:');
    
    const undefinedConfigs = configs.filter(c => c.button5SendRebuyEmail === undefined);
    const trueConfigs = configs.filter(c => c.button5SendRebuyEmail === true);
    const falseConfigs = configs.filter(c => c.button5SendRebuyEmail === false);
    
    console.log('- Configs with undefined rebuy email:', undefinedConfigs.length);
    console.log('- Configs with rebuy email = true:', trueConfigs.length);
    console.log('- Configs with rebuy email = false:', falseConfigs.length);
    
    if (undefinedConfigs.length > 0) {
      console.log('\n❌ PROBLEM: Configurations have rebuy email templates but button5SendRebuyEmail is undefined');
      console.log('This prevents the rebuy email API from processing these configurations');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRebuyEmailConfigs(); 