const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAnalytics() {
  try {
    console.log('🔍 Checking analytics records...');
    
    const analytics = await prisma.qRCodeAnalytics.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${analytics.length} analytics records:`);
    
    analytics.forEach((record, index) => {
      console.log(`\n${index + 1}. Analytics ID: ${record.id}`);
      console.log(`   QR Code ID: ${record.qrCodeId}`);
      console.log(`   QR Code: ${record.qrCode}`);
      console.log(`   Customer: ${record.customerName} (${record.customerEmail})`);
      console.log(`   Seller: ${record.sellerName} (${record.sellerEmail})`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Welcome Email Sent: ${record.welcomeEmailSent}`);
    });

    // Check for QR codes without analytics
    console.log('\n🔍 Checking QR codes without analytics...');
    const qrCodes = await prisma.qRCode.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    for (const qr of qrCodes) {
      const analytics = await prisma.qRCodeAnalytics.findUnique({
        where: { qrCodeId: qr.id }
      });
      
      if (!analytics) {
        console.log(`❌ QR Code ${qr.code} (${qr.id}) has NO analytics record`);
      } else {
        console.log(`✅ QR Code ${qr.code} (${qr.id}) has analytics record`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking analytics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnalytics(); 