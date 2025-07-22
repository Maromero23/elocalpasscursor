const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentOrders() {
  try {
    console.log('🔍 Checking recent orders...');
    
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${recentOrders.length} recent orders:`);
    
    for (const order of recentOrders) {
      console.log(`\n📋 Order ID: ${order.id}`);
      console.log(`   Payment ID: ${order.paymentId}`);
      console.log(`   Customer: ${order.customerName} (${order.customerEmail})`);
      console.log(`   Amount: $${order.amount}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Delivery Type: ${order.deliveryType}`);
      console.log(`   Seller ID: ${order.sellerId || 'null'}`);
      
      // Check if QR code exists for this order
      const qrCode = await prisma.qRCode.findFirst({
        where: { 
          customerEmail: order.customerEmail,
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 5 * 60 * 1000), // Within 5 minutes
            lte: new Date(order.createdAt.getTime() + 5 * 60 * 1000)
          }
        }
      });
      
      console.log(`   QR Code: ${qrCode ? qrCode.code : 'NOT CREATED'}`);
      
      // Check if analytics exists
      const analytics = await prisma.qRCodeAnalytics.findFirst({
        where: { 
          customerEmail: order.customerEmail,
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 5 * 60 * 1000),
            lte: new Date(order.createdAt.getTime() + 5 * 60 * 1000)
          }
        }
      });
      
      console.log(`   Analytics: ${analytics ? 'EXISTS' : 'NOT CREATED'}`);
    }

    // Check for QR codes without orders
    console.log('\n🔍 Checking recent QR codes...');
    const recentQRCodes = await prisma.qRCode.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${recentQRCodes.length} recent QR codes:`);
    recentQRCodes.forEach((qr, index) => {
      console.log(`\n${index + 1}. QR Code: ${qr.code}`);
      console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`   Created: ${qr.createdAt}`);
      console.log(`   Active: ${qr.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentOrders(); 