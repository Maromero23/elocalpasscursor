const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplateHTML() {
  try {
    console.log('🔍 CHECKING TEMPLATE HTML CONTENT\n');
    
    // Get the default template
    const template = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });

    if (!template) {
      console.log('❌ No default template found');
      return;
    }

    console.log('✅ DEFAULT TEMPLATE FOUND:');
    console.log(`- Name: ${template.name}`);
    console.log(`- Subject: ${template.subject}`);
    console.log(`- HTML Length: ${template.customHTML?.length || 0} chars`);
    console.log(`- Config Length: ${template.headerText?.length || 0} chars`);

    if (template.customHTML) {
      console.log('\n📄 HTML CONTENT ANALYSIS:');
      
      // Look for various component indicators
      const html = template.customHTML;
      
      // More comprehensive component detection
      const hasGrandOpening = html.includes('GRAND OPENING') || html.includes('Grand Opening') || html.includes('grand opening');
      const hasVideo = html.toLowerCase().includes('video') || html.includes('youtube') || html.includes('watch');
      const hasCountdown = html.includes('countdown') || html.includes('timer') || html.includes('hours left') || html.includes('hoursLeft') || html.includes('Time Remaining');
      const hasPartners = html.includes('Featured Partners') || html.includes('partners') || html.includes('affiliate') || html.includes('discount');
      const hasSpecialOffer = html.includes('Special') && html.includes('OFF');
      const hasBanner = html.includes('banner') || html.includes('Banner');
      
      console.log(`- GRAND OPENING: ${hasGrandOpening ? '✅' : '❌'}`);
      console.log(`- Video/YouTube: ${hasVideo ? '✅' : '❌'}`);
      console.log(`- Countdown/Timer: ${hasCountdown ? '✅' : '❌'}`);
      console.log(`- Partners/Affiliates: ${hasPartners ? '✅' : '❌'}`);
      console.log(`- Special Offer: ${hasSpecialOffer ? '✅' : '❌'}`);
      console.log(`- Banner Images: ${hasBanner ? '✅' : '❌'}`);
      
      console.log('\n📄 HTML SAMPLE (First 500 chars):');
      console.log(html.substring(0, 500));
      
      console.log('\n📄 HTML SAMPLE (Last 300 chars):');
      console.log(html.substring(Math.max(0, html.length - 300)));
    }

    if (template.headerText) {
      console.log('\n⚙️ CONFIGURATION DATA:');
      try {
        const config = JSON.parse(template.headerText);
        console.log(`- Video URL: ${config.videoUrl || 'Not set'}`);
        console.log(`- Show Timer: ${config.showExpirationTimer ? '✅ YES' : '❌ NO'}`);
        console.log(`- Featured Partners: ${config.enableFeaturedPartners ? '✅ YES' : '❌ NO'}`);
        console.log(`- Banner Images: ${config.bannerImages?.length || 0} images`);
        console.log(`- Email Header: ${config.emailHeaderText || config.emailHeader || 'Not set'}`);
        console.log(`- Urgency Message: ${config.urgencyMessage || 'Not set'}`);
      } catch (error) {
        console.log('❌ Error parsing config JSON');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplateHTML(); 