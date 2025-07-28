const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyDatabase() {
  try {
    console.log('🔍 CHECKING REBUY TEMPLATES IN DATABASE DIRECTLY\n');
    
    // Get all rebuy templates
    const templates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 TOTAL REBUY TEMPLATES IN DATABASE: ${templates.length}\n`);

    if (templates.length === 0) {
      console.log('❌ NO TEMPLATES FOUND IN DATABASE');
      return;
    }

    templates.forEach((template, index) => {
      console.log(`${index + 1}. "${template.name}"`);
      console.log(`   - ID: ${template.id}`);
      console.log(`   - Is Default: ${template.isDefault ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Created: ${template.createdAt}`);
      console.log(`   - Subject: ${template.subject}`);
      console.log(`   - HTML Length: ${template.customHTML?.length || 0} chars`);
      
      // Check if headerText is valid JSON
      if (template.headerText) {
        try {
          const config = JSON.parse(template.headerText);
          console.log(`   - Config Data: ✅ Valid JSON (${template.headerText.length} chars)`);
        } catch (error) {
          console.log(`   - Config Data: ❌ Invalid JSON - ${error.message}`);
          console.log(`   - Raw headerText (first 200 chars): ${template.headerText.substring(0, 200)}...`);
        }
      } else {
        console.log(`   - Config Data: ❌ No headerText`);
      }
      
      // Check for key components in HTML
      if (template.customHTML) {
        const html = template.customHTML;
        const hasGrandOpening = html.includes('GRAND OPENING');
        const hasVideo = html.toLowerCase().includes('video') || html.includes('promotional');
        const hasCountdown = html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining');
        const hasPartners = html.includes('Featured Partners') || html.includes('partners');
        
        console.log(`   - Components: GRAND OPENING ${hasGrandOpening ? '✅' : '❌'} | Video ${hasVideo ? '✅' : '❌'} | Countdown ${hasCountdown ? '✅' : '❌'} | Partners ${hasPartners ? '✅' : '❌'}`);
      }
      
      console.log('');
    });

    // Check for any templates created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTemplates = templates.filter(t => t.createdAt > oneHourAgo);
    
    if (recentTemplates.length > 0) {
      console.log(`🆕 RECENT TEMPLATES (last hour): ${recentTemplates.length}`);
      recentTemplates.forEach(template => {
        console.log(`   - "${template.name}" created at ${template.createdAt}`);
      });
    } else {
      console.log('⏰ NO RECENT TEMPLATES - All templates are older than 1 hour');
      console.log('💡 This means your new templates are not being saved to the database yet');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRebuyDatabase(); 