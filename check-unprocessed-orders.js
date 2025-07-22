const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUnprocessedOrders() {
  try {
    console.log('🔍 Checking for unprocessed orders...');
    
    // Get orders from the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyMinutesAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${recentOrders.length} orders in the last 30 minutes:`);
    
    for (const order of recentOrders) {
      console.log(`\n📋 Order ID: ${order.id}`);
      console.log(`   Payment ID: ${order.paymentId}`);
      console.log(`   Customer: ${order.customerName} (${order.customerEmail})`);
      console.log(`   Amount: $${order.amount}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Delivery Type: ${order.deliveryType}`);
      
      // Check if QR code exists
      const qrCode = await prisma.qRCode.findFirst({
        where: { 
          customerEmail: order.customerEmail,
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 2 * 60 * 1000), // Within 2 minutes
            lte: new Date(order.createdAt.getTime() + 2 * 60 * 1000)
          }
        }
      });
      
      if (qrCode) {
        console.log(`   ✅ QR Code: ${qrCode.code}`);
        
        // Check if analytics exists
        const analytics = await prisma.qRCodeAnalytics.findUnique({
          where: { qrCodeId: qrCode.id }
        });
        
        if (analytics) {
          console.log(`   ✅ Analytics: EXISTS (Email sent: ${analytics.welcomeEmailSent})`);
        } else {
          console.log(`   ❌ Analytics: NOT CREATED`);
        }
      } else {
        console.log(`   ❌ QR Code: NOT CREATED`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnprocessedOrders(); 