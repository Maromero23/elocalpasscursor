const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllRebuyTemplates() {
  try {
    console.log('🔍 CHECKING ALL REBUY EMAIL TEMPLATES IN DATABASE\n');
    
    // Get ALL rebuy email templates
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📧 FOUND ${allTemplates.length} REBUY EMAIL TEMPLATES:\n`);
    
    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. "${template.name}"`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Is Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   Has customHTML: ${!!template.customHTML}`);
      console.log(`   HTML Length: ${template.customHTML?.length || 0} characters`);
      console.log(`   Created: ${template.createdAt.toLocaleDateString()} ${template.createdAt.toLocaleTimeString()}`);
      console.log(`   Updated: ${template.updatedAt.toLocaleDateString()} ${template.updatedAt.toLocaleTimeString()}`);
      
      if (template.customHTML && template.customHTML.length > 0) {
        console.log(`   HTML Preview: ${template.customHTML.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ HTML is empty or null`);
      }
      console.log('');
    });
    
    // Find which one is marked as default
    const defaultTemplate = allTemplates.find(t => t.isDefault);
    if (defaultTemplate) {
      console.log(`🎯 DEFAULT TEMPLATE: "${defaultTemplate.name}"`);
      console.log(`   HTML Length: ${defaultTemplate.customHTML?.length || 0} characters`);
      console.log(`   Has Content: ${defaultTemplate.customHTML && defaultTemplate.customHTML.length > 0 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ NO TEMPLATE MARKED AS DEFAULT');
    }
    
    // Check if we need to update the default flag
    const latestTemplate = allTemplates.find(t => t.name.includes('default Rebuy Email (saved'));
    if (latestTemplate && !latestTemplate.isDefault) {
      console.log(`\n🔧 FOUND YOUR NEW TEMPLATE: "${latestTemplate.name}"`);
      console.log(`   This template is NOT marked as default`);
      console.log(`   HTML Length: ${latestTemplate.customHTML?.length || 0} characters`);
      console.log(`   Would you like to mark this as the default template?`);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkAllRebuyTemplates(); 