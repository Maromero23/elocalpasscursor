const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRebuyHTML() {
  try {
    console.log('🔍 DEBUGGING REBUY EMAIL HTML GENERATION...\n');
    
    // Get the QR code and simulate the rebuy email generation
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753467241143-nrb59rjqq'
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    });
    
    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }
    
    console.log(`✅ Found QR Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerEmail}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    console.log(`- Seller: ${qrCode.seller?.name}`);
    
    // Calculate hours left
    const now = new Date();
    const hoursLeft = Math.floor((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);
    
    // Get seller's email templates
    const sellerConfig = qrCode.seller.savedConfig;
    const emailTemplates = sellerConfig?.emailTemplates ? JSON.parse(sellerConfig.emailTemplates) : null;
    
    console.log('\n📧 EMAIL TEMPLATE ANALYSIS:');
    console.log(`- Has emailTemplates: ${!!emailTemplates}`);
    console.log(`- Has rebuyEmail: ${!!emailTemplates?.rebuyEmail}`);
    console.log(`- Has customHTML: ${!!emailTemplates?.rebuyEmail?.customHTML}`);
    
    if (emailTemplates?.rebuyEmail?.customHTML) {
      const originalTemplate = emailTemplates.rebuyEmail.customHTML;
      console.log(`- Original template length: ${originalTemplate.length} characters`);
      
      // Simulate the customer portal URL construction
      const customerPortalUrl = `https://elocalpasscursor.vercel.app/passes?seller_id=${qrCode.sellerId}&discount=REBUY15`;
      
      // Simulate the exact same replacements as the API
      let processedTemplate = originalTemplate
        .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
        .replace(/\{qrCode\}/g, qrCode.code)
        .replace(/\{guests\}/g, qrCode.guests.toString())
        .replace(/\{days\}/g, qrCode.days.toString())
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())
        .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
        .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
        .replace(/\{rebuyUrl\}/g, customerPortalUrl);
      
      console.log('\n🔧 PROCESSING RESULTS:');
      console.log(`- Processed template length: ${processedTemplate.length} characters`);
      console.log(`- Contains countdown-timer: ${processedTemplate.includes('countdown-timer')}`);
      console.log(`- Contains updateCountdown: ${processedTemplate.includes('updateCountdown')}`);
      console.log(`- Contains qrExpirationTimestamp: ${processedTemplate.includes('qrExpirationTimestamp')}`);
      console.log(`- QR expiration ISO: ${qrCode.expiresAt.toISOString()}`);
      
      // Check if the timestamp replacement worked
      const timestampPattern = /new Date\(['"`]([^'"`]+)['"`]\)/g;
      const timestampMatches = processedTemplate.match(timestampPattern);
      if (timestampMatches) {
        console.log(`- Found timestamp patterns: ${timestampMatches.length}`);
        timestampMatches.forEach((match, index) => {
          console.log(`  ${index + 1}: ${match}`);
        });
      } else {
        console.log(`- No timestamp patterns found in HTML`);
      }
      
      // Look for the specific countdown timer JavaScript
      if (processedTemplate.includes('updateCountdown')) {
        console.log('\n✅ COUNTDOWN TIMER JAVASCRIPT FOUND');
        
        // Extract the countdown timer section
        const countdownStart = processedTemplate.indexOf('<script>');
        const countdownEnd = processedTemplate.indexOf('</script>') + 9;
        
        if (countdownStart !== -1 && countdownEnd !== -1) {
          const countdownScript = processedTemplate.substring(countdownStart, countdownEnd);
          console.log('\n📜 COUNTDOWN SCRIPT PREVIEW:');
          console.log(countdownScript.substring(0, 500) + '...');
          
          // Check if the timestamp is properly replaced in the script
          if (countdownScript.includes(qrCode.expiresAt.toISOString())) {
            console.log('\n✅ TIMESTAMP PROPERLY REPLACED IN SCRIPT');
          } else {
            console.log('\n❌ TIMESTAMP NOT FOUND IN SCRIPT');
            console.log(`Looking for: ${qrCode.expiresAt.toISOString()}`);
          }
        }
      } else {
        console.log('\n❌ COUNTDOWN TIMER JAVASCRIPT NOT FOUND');
        console.log('This explains why the countdown is static!');
      }
      
      // Save a sample of the processed HTML for inspection
      console.log('\n💾 SAVING PROCESSED HTML SAMPLE...');
      const fs = require('fs');
      fs.writeFileSync('debug-rebuy-email.html', processedTemplate);
      console.log('✅ Saved to debug-rebuy-email.html for inspection');
      
    } else {
      console.log('❌ No custom HTML template found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRebuyHTML(); 