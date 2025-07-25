const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetRebuyStatus() {
  try {
    console.log('🔄 RESETTING REBUY STATUS FOR TESTING...\n');
    
    // Reset the rebuy status for the QR code
    const result = await prisma.qRCodeAnalytics.updateMany({
      where: {
        qrCode: 'EL-1753467241143-nrb59rjqq'
      },
      data: {
        rebuyEmailScheduled: true // Reset to true so we can test again
      }
    });
    
    console.log(`✅ Updated ${result.count} analytics record(s)`);
    
    // Verify the update
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753467241143-nrb59rjqq'
      },
      include: {
        analytics: true
      }
    });
    
    if (qrCode) {
      console.log(`\n📊 QR Code Status:`);
      console.log(`- Code: ${qrCode.code}`);
      console.log(`- Customer: ${qrCode.customerEmail}`);
      console.log(`- Expires: ${qrCode.expiresAt}`);
      console.log(`- Rebuy scheduled: ${qrCode.analytics?.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      
      const now = new Date();
      const hoursLeft = Math.floor((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      console.log(`- Hours left: ${hoursLeft}`);
      
      console.log('\n🎯 Ready to test rebuy email with countdown timer!');
      console.log('The countdown should now work properly with the qrExpirationTimestamp fix.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetRebuyStatus(); 