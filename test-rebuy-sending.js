const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRebuySending() {
  try {
    console.log('🧪 TESTING REBUY EMAIL SENDING\n');
    
    // Check one of your rebuy-enabled configurations
    const rebuyConfig = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: 'testing rebuy email' // One of your configs with rebuy enabled
      },
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true
      }
    });
    
    if (rebuyConfig) {
      console.log('✅ Found rebuy configuration:');
      console.log(`Name: ${rebuyConfig.name}`);
      console.log(`ID: ${rebuyConfig.id}`);
      
      // Parse config to check rebuy settings
      const configData = JSON.parse(rebuyConfig.config);
      console.log(`Rebuy enabled: ${configData.button5SendRebuyEmail}`);
      
      // Parse email templates to check rebuy template
      if (rebuyConfig.emailTemplates) {
        const emailTemplates = JSON.parse(rebuyConfig.emailTemplates);
        
        if (emailTemplates.rebuyEmail) {
          console.log('\n📧 REBUY EMAIL TEMPLATE DETAILS:');
          console.log(`Has customHTML: ${!!emailTemplates.rebuyEmail.customHTML}`);
          console.log(`CustomHTML type: ${typeof emailTemplates.rebuyEmail.customHTML}`);
          console.log(`CustomHTML length: ${emailTemplates.rebuyEmail.customHTML?.length || 0}`);
          
          if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
            console.log('❌ Uses default template (which is empty)');
          } else if (emailTemplates.rebuyEmail.customHTML && emailTemplates.rebuyEmail.customHTML.length > 0) {
            console.log('✅ Has custom HTML content');
            console.log('First 100 characters:', emailTemplates.rebuyEmail.customHTML.substring(0, 100) + '...');
          } else {
            console.log('❌ No HTML content found');
          }
          
          // Check subject
          if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
            console.log(`Subject: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject}`);
          } else {
            console.log('No custom subject found');
          }
        } else {
          console.log('❌ No rebuyEmail template found in emailTemplates');
        }
      } else {
        console.log('❌ No emailTemplates field found');
      }
    } else {
      console.log('❌ Configuration "testing rebuy email" not found');
    }
    
    // Now let's manually trigger the rebuy email API to test
    console.log('\n🚀 MANUAL REBUY EMAIL API TEST:');
    console.log('You can test rebuy emails by calling:');
    console.log('GET https://elocalpasscursor.vercel.app/api/rebuy-emails/send');
    console.log('OR');
    console.log('POST https://elocalpasscursor.vercel.app/api/rebuy-emails/send');
    
    // Check for recent QR codes that should trigger rebuy emails
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000));
    const twentyFiveMinutesAgo = new Date(now.getTime() - (25 * 60 * 1000));
    
    const testQRCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: twentyFiveMinutesAgo,
          lte: twoMinutesAgo
        },
        customerEmail: {
          not: null
        }
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      },
      take: 3
    });
    
    console.log(`\n🎫 Found ${testQRCodes.length} QR codes in testing window (2-25 minutes old):`);
    
    testQRCodes.forEach(qr => {
      const minutesOld = Math.floor((now.getTime() - qr.createdAt.getTime()) / (1000 * 60));
      console.log(`- QR ${qr.code}: ${minutesOld} minutes old, email: ${qr.customerEmail}`);
      console.log(`  Rebuy scheduled: ${qr.analytics?.rebuyEmailScheduled || false}`);
      
      if (qr.seller?.savedConfig) {
        try {
          const sellerConfig = JSON.parse(qr.seller.savedConfig.config);
          console.log(`  Seller rebuy enabled: ${sellerConfig.button5SendRebuyEmail || false}`);
        } catch (error) {
          console.log(`  Error parsing seller config`);
        }
      }
    });
    
    if (testQRCodes.length > 0) {
      console.log('\n✅ You have QR codes ready for rebuy email testing!');
      console.log('Call the API to test: GET /api/rebuy-emails/send');
    } else {
      console.log('\n❌ No QR codes in testing window. Create a new QR code and wait 2-3 minutes.');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Test preparation complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

testRebuySending(); 