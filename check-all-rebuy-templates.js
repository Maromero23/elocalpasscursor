const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllRebuyTemplates() {
  try {
    console.log('🔍 CHECKING ALL REBUY EMAIL TEMPLATES IN DATABASE\n');
    
    // Get all rebuy templates
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${allTemplates.length} rebuy email templates:\n`);

    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. TEMPLATE: ${template.name}`);
      console.log(`   - ID: ${template.id}`);
      console.log(`   - Subject: ${template.subject}`);
      console.log(`   - HTML Length: ${template.customHTML?.length || 0} characters`);
      console.log(`   - Is Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Created: ${template.createdAt}`);
      
      if (template.customHTML) {
        const html = template.customHTML;
        console.log(`   - Contains promotional video: ${html.includes('promotional') || html.includes('video') || html.includes('Watch') ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Contains countdown timer: ${html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining') ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Contains featured partners: ${html.includes('Featured Partners') || html.includes('partners') ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Contains GRAND OPENING: ${html.includes('GRAND OPENING') ? '✅ YES' : '❌ NO'}`);
      }
      console.log('');
    });

    // Look for the template that matches screenshot 2
    console.log('🎯 LOOKING FOR COMPLETE TEMPLATE (with video, countdown, partners):');
    
    const completeTemplate = allTemplates.find(template => {
      if (!template.customHTML) return false;
      const html = template.customHTML;
      return (html.includes('promotional') || html.includes('video') || html.includes('Watch')) &&
             (html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining')) &&
             (html.includes('Featured Partners') || html.includes('partners'));
    });

    if (completeTemplate) {
      console.log(`✅ FOUND COMPLETE TEMPLATE: ${completeTemplate.name}`);
      console.log(`   - ID: ${completeTemplate.id}`);
      console.log(`   - Is Default: ${completeTemplate.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - HTML Length: ${completeTemplate.customHTML.length} characters`);
      
      if (!completeTemplate.isDefault) {
        console.log('\n💡 SOLUTION: This complete template should be set as default!');
        console.log('The current default template is incomplete.');
      }
    } else {
      console.log('❌ No complete template found with video, countdown, and partners');
      console.log('💡 The template in screenshot 2 might be from a different source');
    }

    // Look for templates with GRAND OPENING (from screenshot 2)
    const grandOpeningTemplate = allTemplates.find(template => {
      return template.customHTML && template.customHTML.includes('GRAND OPENING');
    });

    if (grandOpeningTemplate) {
      console.log(`\n🎪 FOUND GRAND OPENING TEMPLATE: ${grandOpeningTemplate.name}`);
      console.log(`   - ID: ${grandOpeningTemplate.id}`);
      console.log(`   - Is Default: ${grandOpeningTemplate.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - This matches screenshot 2!`);
      
      if (!grandOpeningTemplate.isDefault) {
        console.log('\n🔧 RECOMMENDATION: Set this as the default template');
        console.log('This template contains all the components from screenshot 2');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRebuyTemplates(); 