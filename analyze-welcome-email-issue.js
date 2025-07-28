const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeWelcomeEmails() {
  try {
    console.log('🔍 ANALYZING WELCOME EMAIL BEHAVIOR\n');
    
    const qrCodes = [
      'EL-1753676431819-31jy3vvgl', // Immediate - NO welcome
      'EL-1753676136433-z85mp7f35', // Immediate - NO welcome  
      'EL-1753676281067-ijyjpproa'  // Future - YES welcome
    ];

    for (const qrCode of qrCodes) {
      console.log(`🔍 ANALYZING: ${qrCode}`);
      
      // Get QR code details
      const qrData = await prisma.qRCode.findFirst({
        where: { code: qrCode },
        include: {
          analytics: true,
          seller: {
            include: {
              savedConfig: true
            }
          }
        }
      });

      if (!qrData) {
        console.log(`❌ QR Code not found: ${qrCode}\n`);
        continue;
      }

      console.log(`✅ QR CODE FOUND:`);
      console.log(`   - Code: ${qrData.code}`);
      console.log(`   - Customer: ${qrData.customerName} (${qrData.customerEmail})`);
      console.log(`   - Created: ${qrData.createdAt}`);
      console.log(`   - Seller: ${qrData.seller?.name || 'Unknown'}`);
      console.log(`   - Cost: $${qrData.cost}`);
      console.log(`   - Days: ${qrData.days}`);
      console.log(`   - Guests: ${qrData.guests}`);

      // Check analytics
      if (qrData.analytics) {
        console.log(`   - Welcome Email Sent: ${qrData.analytics.welcomeEmailSent ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Rebuy Scheduled: ${qrData.analytics.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`   - Analytics: ❌ No analytics record`);
      }

      // Check seller configuration
      if (qrData.seller?.savedConfig) {
        try {
          const config = JSON.parse(qrData.seller.savedConfig.config);
          console.log(`   - Config Name: ${qrData.seller.savedConfig.configurationName}`);
          console.log(`   - Welcome Email Enabled: ${config.button1SendWelcomeEmail ? '✅ YES' : '❌ NO/UNDEFINED'}`);
          console.log(`   - Rebuy Email Enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO/UNDEFINED'}`);
        } catch (error) {
          console.log(`   - Config: ❌ Parse error`);
        }
      } else {
        console.log(`   - Config: ❌ No saved configuration`);
      }

      // Check if this was created via scheduled system
      const scheduledQR = await prisma.scheduledQRCode.findFirst({
        where: {
          clientEmail: qrData.customerEmail,
          clientName: qrData.customerName,
          createdAt: {
            gte: new Date(qrData.createdAt.getTime() - 5 * 60 * 1000), // 5 minutes before
            lte: new Date(qrData.createdAt.getTime() + 5 * 60 * 1000)  // 5 minutes after
          }
        }
      });

      if (scheduledQR) {
        console.log(`   - Created via: 📅 SCHEDULED SYSTEM (future delivery)`);
        console.log(`   - Scheduled for: ${scheduledQR.scheduledFor}`);
        console.log(`   - Processed: ${scheduledQR.isProcessed ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`   - Created via: ⚡ IMMEDIATE SYSTEM (seller generate-qr)`);
      }

      console.log('');
    }

    console.log('🎯 ANALYSIS SUMMARY:');
    console.log('- Immediate QR codes: Created via /api/seller/generate-qr');
    console.log('- Future QR codes: Created via scheduled system');
    console.log('- Welcome email behavior likely differs between these two creation paths');
    
    // Now check and fix Lawrence Taylor's configuration
    console.log('\n🔧 CHECKING LAWRENCE TAYLOR\'S CONFIGURATION...');
    
    const seller = await prisma.user.findFirst({
      where: { 
        name: 'Lawrence Taylor'
      },
      include: {
        savedConfig: true
      }
    });

    if (seller && seller.savedConfig) {
      const config = JSON.parse(seller.savedConfig.config);
      console.log(`📋 Current welcome email setting: ${config.button1SendWelcomeEmail ? '✅ TRUE' : '❌ FALSE/UNDEFINED'}`);
      
      if (config.button1SendWelcomeEmail !== true) {
        console.log('🔧 FIXING: Setting button1SendWelcomeEmail to true...');
        config.button1SendWelcomeEmail = true;
        
        await prisma.savedQRConfiguration.update({
          where: { id: seller.savedConfig.id },
          data: {
            config: JSON.stringify(config)
          }
        });
        
        console.log('✅ FIXED: Welcome email is now enabled for Lawrence Taylor');
      } else {
        console.log('✅ Welcome email is already enabled');
      }
    } else {
      console.log('❌ Lawrence Taylor or his configuration not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWelcomeEmails(); 