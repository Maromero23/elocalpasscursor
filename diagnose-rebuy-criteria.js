/**
 * 🔍 DIAGNOSE REBUY EMAIL CRITERIA
 * 
 * This will check WHY the 5 QR codes found aren't qualifying for rebuy emails.
 * READ-ONLY - No database changes.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseRebuyCriteria() {
  try {
    console.log('🔍 DIAGNOSING REBUY EMAIL CRITERIA (READ-ONLY)\n');
    
    // Use the same criteria as the rebuy API
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000));
    const twentyFiveMinutesAgo = new Date(now.getTime() - (25 * 60 * 1000));
    
    console.log('⏰ TESTING WINDOW:');
    console.log(`From: ${twentyFiveMinutesAgo.toLocaleString()}`);
    console.log(`To: ${twoMinutesAgo.toLocaleString()}`);
    console.log(`Current time: ${now.toLocaleString()}\n`);
    
    // Get QR codes in the testing window (same as API)
    const qrCodes = await prisma.qRCode.findMany({
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
      }
    });
    
    console.log(`📊 Found ${qrCodes.length} QR codes in testing window:`);
    
    if (qrCodes.length === 0) {
      console.log('❌ No QR codes found in the 2-25 minute window');
      console.log('💡 To test rebuy emails:');
      console.log('1. Create a new QR code');
      console.log('2. Wait 2-3 minutes');
      console.log('3. Run the rebuy API test again');
      return;
    }
    
    // Check each QR code against rebuy criteria
    qrCodes.forEach((qr, index) => {
      const minutesOld = Math.floor((now.getTime() - qr.createdAt.getTime()) / (1000 * 60));
      
      console.log(`\n🎫 QR CODE ${index + 1}: ${qr.code}`);
      console.log(`   Created: ${qr.createdAt.toLocaleString()} (${minutesOld} minutes ago)`);
      console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`   Active: ${qr.isActive}`);
      
      // Check criteria 1: Analytics rebuyEmailScheduled
      if (!qr.analytics) {
        console.log('   ❌ FAIL: No analytics record found');
        return;
      }
      
      if (!qr.analytics.rebuyEmailScheduled) {
        console.log('   ❌ FAIL: rebuyEmailScheduled = false');
        console.log('   💡 This means rebuy email was not scheduled when QR was created');
        return;
      } else {
        console.log('   ✅ PASS: rebuyEmailScheduled = true');
      }
      
      // Check criteria 2: Seller has saved config
      if (!qr.seller?.savedConfig) {
        console.log('   ❌ FAIL: Seller has no saved configuration');
        return;
      } else {
        console.log('   ✅ PASS: Seller has saved configuration');
      }
      
      // Check criteria 3: Rebuy email enabled in config
      try {
        const configData = JSON.parse(qr.seller.savedConfig.config);
        if (!configData.button5SendRebuyEmail) {
          console.log('   ❌ FAIL: button5SendRebuyEmail = false in seller config');
          return;
        } else {
          console.log('   ✅ PASS: button5SendRebuyEmail = true');
        }
      } catch (error) {
        console.log('   ❌ FAIL: Error parsing seller config JSON');
        return;
      }
      
      // If we get here, this QR code should have gotten a rebuy email
      console.log('   🎯 RESULT: This QR code SHOULD receive rebuy email!');
      
      // Check email template
      if (qr.seller.savedConfig.emailTemplates) {
        try {
          const emailTemplates = JSON.parse(qr.seller.savedConfig.emailTemplates);
          if (emailTemplates.rebuyEmail) {
            if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
              console.log('   📧 Email: Uses DEFAULT template (might be empty)');
            } else if (emailTemplates.rebuyEmail.customHTML) {
              console.log('   📧 Email: Uses CUSTOM template (should work)');
            } else {
              console.log('   📧 Email: No customHTML found');
            }
          } else {
            console.log('   📧 Email: No rebuyEmail template configured');
          }
        } catch (error) {
          console.log('   📧 Email: Error parsing emailTemplates');
        }
      } else {
        console.log('   📧 Email: No emailTemplates field');
      }
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Diagnosis complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

diagnoseRebuyCriteria(); 