const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getQRId() {
  try {
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753467241143-nrb59rjqq'
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

    if (qrCode) {
      console.log('✅ QR Code found:');
      console.log(`- Database ID: ${qrCode.id}`);
      console.log(`- Code: ${qrCode.code}`);
      console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
      console.log(`- Seller: ${qrCode.seller?.name || 'Unknown'}`);
      console.log(`- Created: ${qrCode.createdAt}`);
      console.log(`- Expires: ${qrCode.expiresAt}`);
      console.log(`- Rebuy scheduled: ${qrCode.analytics?.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      
      if (qrCode.seller?.savedConfig) {
        try {
          const configData = JSON.parse(qrCode.seller.savedConfig.config);
          console.log(`- Seller rebuy enabled: ${configData.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        } catch (e) {
          console.log('- Seller config: ❌ Parse error');
        }
      }
      
      console.log('\n🎯 Ready for rebuy email test!');
      console.log(`Use this ID: ${qrCode.id}`);
    } else {
      console.log('❌ QR Code not found with code: EL-1753467241143-nrb59rjqq');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getQRId(); 