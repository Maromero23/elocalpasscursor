const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSavedConfig() {
  try {
    console.log('🔍 Checking the actual saved rebuy configuration...');
    
    // Find the configuration that was used for the test email
    const config = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: {
          contains: 'starting trsting rebuy email'
        }
      }
    });
    
    if (config && config.emailTemplates) {
      const templates = JSON.parse(config.emailTemplates);
      
      if (templates.rebuyEmail && templates.rebuyEmail.rebuyConfig) {
        console.log('\n📧 REBUY EMAIL CONFIGURATION SAVED:');
        console.log('  - emailSubject:', templates.rebuyEmail.rebuyConfig.emailSubject);
        console.log('  - emailHeader:', templates.rebuyEmail.rebuyConfig.emailHeader);
        console.log('  - emailMessage:', templates.rebuyEmail.rebuyConfig.emailMessage);
        console.log('  - emailCta:', templates.rebuyEmail.rebuyConfig.emailCta);
        console.log('  - emailFooter:', templates.rebuyEmail.rebuyConfig.emailFooter);
        console.log('  - customAffiliateMessage:', templates.rebuyEmail.rebuyConfig.customAffiliateMessage);
        console.log('  - logoUrl:', templates.rebuyEmail.rebuyConfig.logoUrl);
        console.log('  - bannerImages:', templates.rebuyEmail.rebuyConfig.bannerImages);
        
        console.log('\n🎨 COLORS & STYLING:');
        console.log('  - emailPrimaryColor:', templates.rebuyEmail.rebuyConfig.emailPrimaryColor);
        console.log('  - emailSecondaryColor:', templates.rebuyEmail.rebuyConfig.emailSecondaryColor);
        console.log('  - emailHeaderColor:', templates.rebuyEmail.rebuyConfig.emailHeaderColor);
        console.log('  - emailCtaBackgroundColor:', templates.rebuyEmail.rebuyConfig.emailCtaBackgroundColor);
      }
      
      console.log('\n📝 CUSTOM HTML PREVIEW:');
      if (templates.rebuyEmail.customHTML) {
        const html = templates.rebuyEmail.customHTML;
        console.log('  - HTML Length:', html.length);
        
        // Check for specific text patterns
        if (html.includes('EDITED HERE')) {
          console.log('  - ⚠️  Found "EDITED HERE" in HTML template');
          
          // Show lines containing EDITED HERE
          const lines = html.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('EDITED HERE')) {
              console.log(`    Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
        
        // Check for proper variable placeholders
        const variables = ['{customerName}', '{qrCode}', '{guests}', '{days}', '{hoursLeft}'];
        variables.forEach(variable => {
          if (html.includes(variable)) {
            console.log(`  - ✅ Found variable: ${variable}`);
          } else {
            console.log(`  - ❌ Missing variable: ${variable}`);
          }
        });
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkSavedConfig(); 