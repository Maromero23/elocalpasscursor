const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDuplicateQR() {
  try {
    console.log('🔍 Debugging duplicate QR code issue...');
    
    // Check the specific QR code that's duplicated
    const duplicateQRCode = 'PASS_1753203951769_zoz7cnz5k';
    
    console.log(`\n🔍 Checking QR code: ${duplicateQRCode}`);
    
    const qrCode = await prisma.qRCode.findFirst({
      where: { code: duplicateQRCode }
    });
    
    if (qrCode) {
      console.log(`✅ QR Code found:`);
      console.log(`   ID: ${qrCode.id}`);
      console.log(`   Code: ${qrCode.code}`);
      console.log(`   Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
      console.log(`   Created: ${qrCode.createdAt}`);
      console.log(`   Amount: $${qrCode.cost}`);
      
      // Check analytics for this QR code
      const analytics = await prisma.qRCodeAnalytics.findUnique({
        where: { qrCodeId: qrCode.id }
      });
      
      if (analytics) {
        console.log(`\n📊 Analytics for this QR code:`);
        console.log(`   Analytics ID: ${analytics.id}`);
        console.log(`   Customer: ${analytics.customerName} (${analytics.customerEmail})`);
        console.log(`   Seller: ${analytics.sellerName} (${analytics.sellerEmail})`);
        console.log(`   Created: ${analytics.createdAt}`);
        console.log(`   Welcome Email Sent: ${analytics.welcomeEmailSent}`);
      }
      
      // Check all orders that might be related to this QR code
      console.log(`\n📋 Checking related orders...`);
      const relatedOrders = await prisma.order.findMany({
        where: {
          customerEmail: qrCode.customerEmail,
          createdAt: {
            gte: new Date(qrCode.createdAt.getTime() - 5 * 60 * 1000), // Within 5 minutes before
            lte: new Date(qrCode.createdAt.getTime() + 5 * 60 * 1000)  // Within 5 minutes after
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      console.log(`📊 Found ${relatedOrders.length} related orders:`);
      relatedOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order.id}`);
        console.log(`   Payment ID: ${order.paymentId}`);
        console.log(`   Customer: ${order.customerName} (${order.customerEmail})`);
        console.log(`   Amount: $${order.amount}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Time diff from QR: ${Math.round((order.createdAt.getTime() - qrCode.createdAt.getTime()) / 1000)}s`);
      });
      
      // Check if there are multiple QR codes with the same timestamp
      console.log(`\n🔍 Checking for QR codes with similar timestamps...`);
      const similarQRCodes = await prisma.qRCode.findMany({
        where: {
          createdAt: {
            gte: new Date(qrCode.createdAt.getTime() - 10 * 1000), // Within 10 seconds
            lte: new Date(qrCode.createdAt.getTime() + 10 * 1000)
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      console.log(`📊 Found ${similarQRCodes.length} QR codes with similar timestamps:`);
      similarQRCodes.forEach((qr, index) => {
        console.log(`\n${index + 1}. QR Code: ${qr.code}`);
        console.log(`   ID: ${qr.id}`);
        console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
        console.log(`   Created: ${qr.createdAt}`);
        console.log(`   Time diff: ${Math.round((qr.createdAt.getTime() - qrCode.createdAt.getTime()) / 1000)}s`);
      });
      
    } else {
      console.log(`❌ QR code ${duplicateQRCode} not found`);
    }

  } catch (error) {
    console.error('❌ Error debugging duplicate QR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDuplicateQR(); 