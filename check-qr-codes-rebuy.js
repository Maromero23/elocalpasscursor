const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQRCodesForRebuy() {
  try {
    console.log('🔍 CHECKING QR CODES WITH REBUY EMAIL CONFIGURATIONS...\n');
    
    // Get QR codes from sellers with rebuy email configurations
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        seller: {
          savedConfig: {
            emailTemplates: {
              contains: 'rebuyEmail'
            }
          }
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
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📊 QR CODES WITH REBUY EMAIL CONFIGS:');
    console.log('Count:', qrCodes.length);
    
    if (qrCodes.length > 0) {
      qrCodes.forEach((qr, index) => {
        console.log(`\nQR Code ${index + 1}:`);
        console.log('- Code:', qr.code);
        console.log('- Created:', qr.createdAt);
        console.log('- Customer:', qr.customerName, '(' + qr.customerEmail + ')');
        console.log('- Seller:', qr.seller.name, '(' + qr.seller.email + ')');
        console.log('- Config:', qr.seller.savedConfig?.name);
        console.log('- Has Analytics:', !!qr.analytics);
        
        if (qr.analytics) {
          console.log('- Rebuy Email Scheduled:', qr.analytics.rebuyEmailScheduled);
        }
        
        if (qr.seller.savedConfig) {
          try {
            const config = JSON.parse(qr.seller.savedConfig.config);
            console.log('- Config Rebuy Enabled:', config.button5SendRebuyEmail);
          } catch (e) {
            console.log('- Error parsing config');
          }
        }
        
        // Check time since creation
        const now = new Date();
        const minutesSinceCreation = Math.floor((now.getTime() - qr.createdAt.getTime()) / (1000 * 60));
        console.log('- Minutes since creation:', minutesSinceCreation);
        console.log('- In rebuy window (2-25 min):', minutesSinceCreation >= 2 && minutesSinceCreation <= 25);
      });
    } else {
      console.log('❌ No QR codes found with rebuy email configurations');
      console.log('This means sellers with rebuy configs haven\'t created any QR codes yet');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRCodesForRebuy(); 