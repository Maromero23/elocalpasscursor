const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPaypalRebuyTemplate() {
  try {
    console.log('🔍 SEARCHING FOR "Paypal Rebuy default email" TEMPLATE\n');
    
    // Search for the specific template by name
    const paypalTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: {
        name: {
          contains: 'Paypal',
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!paypalTemplate) {
      console.log('❌ Paypal Rebuy template not found. Let me check all recent templates...\n');
      
      // Get all templates sorted by most recent
      const allTemplates = await prisma.rebuyEmailTemplate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log('📊 RECENT REBUY TEMPLATES:');
      allTemplates.forEach((template, index) => {
        console.log(`${index + 1}. "${template.name}" - Created: ${template.createdAt} - ${template.customHTML?.length || 0} chars`);
      });
      
      return;
    }

    console.log('✅ PAYPAL REBUY TEMPLATE FOUND!');
    console.log(`- Name: "${paypalTemplate.name}"`);
    console.log(`- ID: ${paypalTemplate.id}`);
    console.log(`- Is Default: ${paypalTemplate.isDefault ? '✅ YES' : '❌ NO'}`);
    console.log(`- Created: ${paypalTemplate.createdAt}`);
    console.log(`- Subject: ${paypalTemplate.subject}`);
    console.log(`- HTML Length: ${paypalTemplate.customHTML?.length || 0} characters`);

    if (paypalTemplate.customHTML) {
      console.log('\n🔍 COMPONENT ANALYSIS:');
      
      const html = paypalTemplate.customHTML;
      
      // Check for all the components we're looking for
      const hasGrandOpening = html.includes('GRAND OPENING');
      const hasPromoVideo = html.includes('promotional') || html.toLowerCase().includes('video') || html.includes('Watch Video');
      const hasCountdown = html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining') || html.includes('hours left');
      const hasPartners = html.includes('Featured Partners') || html.includes('partners');
      const hasSpecialOffer = html.includes('Special') && html.includes('OFF');
      const hasGetAnother = html.includes('Get Another') || html.includes('rebuyUrl');
      
      console.log(`- GRAND OPENING section: ${hasGrandOpening ? '✅ YES' : '❌ NO'}`);
      console.log(`- Promotional Video: ${hasPromoVideo ? '✅ YES' : '❌ NO'}`);
      console.log(`- Countdown Timer: ${hasCountdown ? '✅ YES' : '❌ NO'}`);
      console.log(`- Featured Partners: ${hasPartners ? '✅ YES' : '❌ NO'}`);
      console.log(`- Special Offer: ${hasSpecialOffer ? '✅ YES' : '❌ NO'}`);
      console.log(`- Get Another Button: ${hasGetAnother ? '✅ YES' : '❌ NO'}`);
      
      const totalComponents = [hasGrandOpening, hasPromoVideo, hasCountdown, hasPartners, hasSpecialOffer, hasGetAnother].filter(Boolean).length;
      console.log(`\n🎯 TOTAL COMPONENTS: ${totalComponents}/6`);
      
      if (totalComponents >= 4) {
        console.log('🎉 THIS LOOKS LIKE THE COMPLETE TEMPLATE!');
      } else {
        console.log('⚠️ This template might be missing some components.');
      }
      
      console.log('\n📄 FIRST 800 CHARACTERS:');
      console.log(html.substring(0, 800));
      console.log('\n📄 LAST 500 CHARACTERS:');
      console.log(html.substring(Math.max(0, html.length - 500)));
      
      // Look for specific sections
      if (hasGrandOpening) {
        const grandOpeningIndex = html.indexOf('GRAND OPENING');
        console.log('\n🎯 GRAND OPENING SECTION FOUND:');
        console.log(html.substring(Math.max(0, grandOpeningIndex - 50), grandOpeningIndex + 200));
      }
      
      if (hasCountdown) {
        const countdownIndex = html.toLowerCase().indexOf('countdown') || html.toLowerCase().indexOf('timer') || html.indexOf('Time Remaining');
        if (countdownIndex !== -1) {
          console.log('\n🎯 COUNTDOWN SECTION FOUND:');
          console.log(html.substring(Math.max(0, countdownIndex - 100), countdownIndex + 200));
        }
      }
      
    } else {
      console.log('❌ No HTML content in template!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPaypalRebuyTemplate(); 