const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getPassQRId() {
  try {
    console.log('🔍 FINDING PASS_ QR CODE: PASS_1753673438004_lrjzvcub7\n');
    
    // Get the QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'PASS_1753673438004_lrjzvcub7'
      },
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

    console.log('✅ PASS_ QR CODE FOUND:');
    console.log(`- Database ID: ${qrCode.id}`);
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
    console.log(`- Seller ID: ${qrCode.sellerId}`);
    console.log(`- Created: ${qrCode.createdAt}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    console.log(`- Cost: $${qrCode.cost}`);
    console.log(`- Days: ${qrCode.days}`);
    console.log(`- Guests: ${qrCode.guests}`);
    
    const now = new Date();
    const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);
    
    if (qrCode.analytics) {
      console.log(`- Rebuy scheduled: ${qrCode.analytics.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      console.log(`- Welcome sent: ${qrCode.analytics.welcomeEmailSent ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log(`\n🎯 This is a PASS_ QR code - should get COMPLETE default rebuy email!`);
    console.log(`🎯 Database ID for API call: ${qrCode.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getPassQRId(); 