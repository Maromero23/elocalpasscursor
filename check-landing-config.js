const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLandingConfig() {
  try {
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmc70f52700008uxqgeabntza' }
    });
    
    if (config && config.landingPageConfig) {
      const landingConfig = JSON.parse(config.landingPageConfig);
      console.log('🌐 Landing Page Configuration:');
      console.log('📝 Header Text:', landingConfig.headerText);
      console.log('📝 Description Text:', landingConfig.descriptionText);
      console.log('📝 CTA Button Text:', landingConfig.ctaButtonText);
      console.log('📝 Form Title Text:', landingConfig.formTitleText);
      console.log('📝 Form Instructions Text:', landingConfig.formInstructionsText);
      console.log('📝 Footer Disclaimer Text:', landingConfig.footerDisclaimerText);
      
      // Check if there are URL-specific customizations
      if (landingConfig.temporaryUrls && landingConfig.temporaryUrls.length > 0) {
        console.log('\n🔗 URL-specific customizations:');
        landingConfig.temporaryUrls.forEach((url, index) => {
          console.log(`  ${index + 1}. URL ID: ${url.id}`);
          if (url.headerText) console.log(`     Custom Header: ${url.headerText}`);
          if (url.descriptionText) console.log(`     Custom Description: ${url.descriptionText}`);
        });
      }
    } else {
      console.log('❌ No landing page config found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLandingConfig();
