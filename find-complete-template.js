const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCompleteTemplate() {
  try {
    console.log('🔍 SEARCHING FOR COMPLETE REBUY TEMPLATE\n');
    
    // Get ALL rebuy templates
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 TOTAL REBUY TEMPLATES: ${allTemplates.length}\n`);

    let completeTemplate = null;
    
    allTemplates.forEach((template, index) => {
      const html = template.customHTML || '';
      const hasGrandOpening = html.includes('GRAND OPENING');
      const hasVideo = html.toLowerCase().includes('video') || html.includes('promotional');
      const hasCountdown = html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining');
      const hasPartners = html.includes('Featured Partners') || html.includes('partners');
      
      const completeness = [hasGrandOpening, hasVideo, hasCountdown, hasPartners].filter(Boolean).length;
      
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   - ID: ${template.id}`);
      console.log(`   - Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Created: ${template.createdAt}`);
      console.log(`   - HTML Length: ${html.length} chars`);
      console.log(`   - GRAND OPENING: ${hasGrandOpening ? '✅' : '❌'}`);
      console.log(`   - Video/Promotional: ${hasVideo ? '✅' : '❌'}`);
      console.log(`   - Countdown/Timer: ${hasCountdown ? '✅' : '❌'}`);
      console.log(`   - Featured Partners: ${hasPartners ? '✅' : '❌'}`);
      console.log(`   - Completeness: ${completeness}/4 components`);
      
      if (completeness >= 3) {
        console.log(`   🎯 POTENTIAL COMPLETE TEMPLATE!`);
        completeTemplate = template;
      }
      
      console.log('');
    });

    if (completeTemplate) {
      console.log('🎉 FOUND POTENTIAL COMPLETE TEMPLATE:');
      console.log(`- Name: ${completeTemplate.name}`);
      console.log(`- ID: ${completeTemplate.id}`);
      console.log(`- Is Default: ${completeTemplate.isDefault}`);
      console.log(`- HTML Length: ${completeTemplate.customHTML?.length || 0} characters`);
      
      console.log('\n📄 FIRST 1000 CHARACTERS OF COMPLETE TEMPLATE:');
      console.log(completeTemplate.customHTML?.substring(0, 1000) || 'No content');
    } else {
      console.log('❌ NO COMPLETE TEMPLATE FOUND');
      console.log('The complete template with all components may need to be recreated.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCompleteTemplate(); 