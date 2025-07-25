const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLawrenceTemplate() {
  try {
    console.log('🔍 CHECKING LAWRENCE TAYLOR\'S REBUY TEMPLATE...\n');
    
    const lawrence = await prisma.user.findFirst({
      where: {
        email: 'Taylor56@gmail.com'
      },
      include: {
        savedConfig: true
      }
    });
    
    if (!lawrence || !lawrence.savedConfig) {
      console.log('❌ Lawrence Taylor or config not found');
      return;
    }
    
    console.log('✅ Found Lawrence Taylor\'s config');
    console.log('- Config ID:', lawrence.savedConfig.id);
    console.log('- Config name:', lawrence.savedConfig.name);
    
    const emailTemplates = JSON.parse(lawrence.savedConfig.emailTemplates);
    console.log('\n📧 Rebuy Email Template Info:');
    console.log('- Has rebuyEmail:', !!emailTemplates?.rebuyEmail);
    console.log('- CustomHTML length:', emailTemplates?.rebuyEmail?.customHTML?.length || 0);
    console.log('- CustomHTML type:', typeof emailTemplates?.rebuyEmail?.customHTML);
    console.log('- Is USE_DEFAULT_TEMPLATE:', emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE');
    
    if (emailTemplates?.rebuyEmail?.customHTML && emailTemplates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
      console.log('\n📄 CURRENT STORED TEMPLATE (first 500 chars):');
      console.log(emailTemplates.rebuyEmail.customHTML.substring(0, 500) + '...');
      
      console.log('\n🔍 TEMPLATE ANALYSIS:');
      const html = emailTemplates.rebuyEmail.customHTML;
      console.log('- Has bannerImages:', html.includes('banner-image') || html.includes('bannerImages'));
      console.log('- Has video section:', html.includes('video') || html.includes('Video'));
      console.log('- Has countdown timer:', html.includes('countdown-timer') || html.includes('updateCountdown'));
      console.log('- Has current pass details:', html.includes('Current ELocalPass Details') || html.includes('details'));
      console.log('- Has urgency notice:', html.includes('highlight-box') || html.includes('urgency'));
      console.log('- Has discount banner:', html.includes('discount-banner') || html.includes('Special'));
      console.log('- Has featured partners:', html.includes('featured-partners') || html.includes('Featured Partners'));
      console.log('- Has seller tracking:', html.includes('Supporting Local Business') || html.includes('seller'));
      
      console.log('\n🚨 PROBLEM IDENTIFIED:');
      console.log('The stored template is OLD and doesn\'t have the enhanced components!');
      console.log('The preview shows the NEW design, but emails use the OLD stored template.');
      
      console.log('\n💡 SOLUTION:');
      console.log('We need to regenerate Lawrence\'s rebuy template with the enhanced design.');
      console.log('This will update the stored template to match the preview.');
    } else if (emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
      console.log('\n📧 Using default template - checking default template...');
      
      const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
        where: { isDefault: true }
      });
      
      if (defaultTemplate) {
        console.log('✅ Found default template');
        console.log('- Template ID:', defaultTemplate.id);
        console.log('- HTML length:', defaultTemplate.customHTML?.length || 0);
        
        if (defaultTemplate.customHTML) {
          const html = defaultTemplate.customHTML;
          console.log('\n🔍 DEFAULT TEMPLATE ANALYSIS:');
          console.log('- Has countdown timer:', html.includes('countdown-timer') || html.includes('updateCountdown'));
          console.log('- Has current pass details:', html.includes('Current ELocalPass Details') || html.includes('details'));
          console.log('- Has enhanced components:', html.includes('banner-images') || html.includes('Featured Partners'));
        }
      } else {
        console.log('❌ No default template found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLawrenceTemplate(); 