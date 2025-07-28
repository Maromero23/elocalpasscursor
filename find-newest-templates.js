const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findNewestTemplates() {
  try {
    console.log('🔍 SEARCHING FOR NEWEST REBUY TEMPLATES\n');
    
    // Get all templates sorted by most recent, including any created in the last hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    console.log(`⏰ Current time: ${now}`);
    console.log(`⏰ Looking for templates created after: ${oneHourAgo}\n`);
    
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20 // Get more templates to be sure
    });

    console.log(`📊 TOTAL REBUY TEMPLATES FOUND: ${allTemplates.length}\n`);

    let foundPaypalTemplate = false;
    
    allTemplates.forEach((template, index) => {
      const isRecent = template.createdAt > oneHourAgo;
      const isPaypalRelated = template.name.toLowerCase().includes('paypal') || 
                             template.name.toLowerCase().includes('pass') ||
                             template.name.toLowerCase().includes('default');
      
      console.log(`${index + 1}. "${template.name}"`);
      console.log(`   - ID: ${template.id}`);
      console.log(`   - Created: ${template.createdAt} ${isRecent ? '🆕 RECENT!' : ''}`);
      console.log(`   - Is Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - HTML Length: ${template.customHTML?.length || 0} chars`);
      
      if (isPaypalRelated) {
        console.log(`   🎯 POTENTIAL PAYPAL TEMPLATE!`);
        
        if (template.customHTML) {
          const html = template.customHTML;
          const hasGrandOpening = html.includes('GRAND OPENING');
          const hasVideo = html.toLowerCase().includes('video') || html.includes('promotional');
          const hasCountdown = html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining');
          const hasPartners = html.includes('Featured Partners') || html.includes('partners');
          
          console.log(`   - GRAND OPENING: ${hasGrandOpening ? '✅' : '❌'}`);
          console.log(`   - Video: ${hasVideo ? '✅' : '❌'}`);
          console.log(`   - Countdown: ${hasCountdown ? '✅' : '❌'}`);
          console.log(`   - Partners: ${hasPartners ? '✅' : '❌'}`);
          
          const completeness = [hasGrandOpening, hasVideo, hasCountdown, hasPartners].filter(Boolean).length;
          console.log(`   - Completeness: ${completeness}/4 components`);
          
          if (completeness >= 3) {
            console.log(`   🎉 THIS LOOKS COMPLETE!`);
            foundPaypalTemplate = true;
          }
        }
      }
      
      console.log('');
    });

    if (!foundPaypalTemplate) {
      console.log('❌ No PayPal rebuy template found yet.');
      console.log('💡 The template might still be saving. Please try again in a moment.');
      console.log('💡 Or check if it was saved with a different name.');
    }

    // Also search by partial name matches
    console.log('\n🔍 SEARCHING BY PARTIAL NAME MATCHES:');
    
    const searchTerms = ['paypal', 'rebuy', 'pass', 'email', 'default'];
    
    for (const term of searchTerms) {
      const matches = await prisma.rebuyEmailTemplate.findMany({
        where: {
          name: {
            contains: term,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      if (matches.length > 0) {
        console.log(`\n📝 Templates containing "${term}":`);
        matches.forEach(template => {
          console.log(`   - "${template.name}" (${template.createdAt})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findNewestTemplates(); 