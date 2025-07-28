const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPassesRebuyConfig() {
  try {
    console.log('🔍 CHECKING PASSES/PAYPAL QR CODE REBUY CONFIGURATION\n');
    
    const qrCodeString = 'EL-1753668721361-7n65cbbat';
    
    // Get the QR code with all related data
    const qrCode = await prisma.qRCode.findFirst({
      where: { code: qrCodeString },
      include: {
        analytics: true,
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    });

    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }

    console.log('✅ QR CODE DETAILS:');
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
    console.log(`- Seller ID: ${qrCode.sellerId}`);
    console.log(`- Seller Name: ${qrCode.seller?.name || 'Unknown'}`);
    console.log(`- Created: ${qrCode.createdAt}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    
    const now = new Date();
    const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);

    console.log('\n📊 ANALYTICS:');
    if (qrCode.analytics) {
      console.log(`- Rebuy scheduled: ${qrCode.analytics.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      console.log(`- Welcome sent: ${qrCode.analytics.welcomeEmailSent ? '✅ YES' : '❌ NO'}`);
      console.log(`- Language: ${qrCode.analytics.language || 'Not set'}`);
    } else {
      console.log('- No analytics record found');
    }

    console.log('\n🔧 SELLER CONFIGURATION:');
    if (qrCode.seller?.savedConfig) {
      try {
        const config = JSON.parse(qrCode.seller.savedConfig.config);
        console.log(`- Has saved config: ✅ YES`);
        console.log(`- Config name: ${qrCode.seller.savedConfig.configurationName}`);
        console.log(`- Rebuy enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        console.log(`- Welcome enabled: ${config.button1SendWelcomeEmail ? '✅ YES' : '❌ NO'}`);
        
        // Check email templates
        if (qrCode.seller.savedConfig.emailTemplates) {
          const emailTemplates = JSON.parse(qrCode.seller.savedConfig.emailTemplates);
          console.log(`- Has email templates: ✅ YES`);
          console.log(`- Has welcome template: ${emailTemplates.welcomeEmail ? '✅ YES' : '❌ NO'}`);
          console.log(`- Has rebuy template: ${emailTemplates.rebuyEmail ? '✅ YES' : '❌ NO'}`);
          
          if (emailTemplates.rebuyEmail?.rebuyConfig) {
            console.log(`- Has rebuy config: ✅ YES`);
            console.log(`- Seller tracking: ${emailTemplates.rebuyEmail.rebuyConfig.enableSellerTracking ? '✅ YES' : '❌ NO'}`);
            console.log(`- Discount enabled: ${emailTemplates.rebuyEmail.rebuyConfig.enableDiscountCode ? '✅ YES' : '❌ NO'}`);
          }
        } else {
          console.log(`- Has email templates: ❌ NO`);
        }
      } catch (e) {
        console.log(`- Config parse error: ${e.message}`);
      }
    } else {
      console.log('- No saved configuration found');
      console.log('- This is likely a passes/PayPal QR code with default settings');
    }

    console.log('\n🎯 DIAGNOSIS:');
    
    // Check if this QR code is eligible for rebuy emails
    const isEligible = qrCode.analytics?.rebuyEmailScheduled && 
                      qrCode.seller?.savedConfig && 
                      JSON.parse(qrCode.seller.savedConfig.config).button5SendRebuyEmail;

    if (isEligible) {
      console.log('✅ This QR code IS eligible for rebuy emails');
      console.log('📧 It should be processed by the rebuy email system');
    } else {
      console.log('❌ This QR code is NOT eligible for rebuy emails');
      console.log('💡 REASONS:');
      
      if (!qrCode.analytics?.rebuyEmailScheduled) {
        console.log('   - Analytics rebuyEmailScheduled is false');
      }
      
      if (!qrCode.seller?.savedConfig) {
        console.log('   - No seller configuration (typical for passes/PayPal QRs)');
      } else {
        const config = JSON.parse(qrCode.seller.savedConfig.config);
        if (!config.button5SendRebuyEmail) {
          console.log('   - Seller configuration has rebuy emails disabled');
        }
      }
    }

    console.log('\n🔧 SOLUTION FOR PASSES/PAYPAL QR CODES:');
    console.log('The rebuy email system needs to be modified to handle QR codes without seller configurations.');
    console.log('These QR codes should use a default/fallback rebuy email template.');
    console.log('The system currently only processes QR codes with seller configurations.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassesRebuyConfig(); 