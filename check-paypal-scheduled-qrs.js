const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayPalScheduledQRs() {
  try {
    console.log('🔍 CHECKING PAYPAL SCHEDULED QRs IN PRODUCTION DATABASE\n');
    
    // Get all scheduled QR codes (both processed and unprocessed)
    const allScheduled = await prisma.scheduledQRCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`📋 Found ${allScheduled.length} total scheduled QR codes (last 20):`);
    
    const now = new Date();
    let overdueCount = 0;
    let pendingCount = 0;
    let processedCount = 0;
    
    allScheduled.forEach((qr, index) => {
      const timeDiff = Math.round((qr.scheduledFor.getTime() - now.getTime()) / 1000 / 60);
      let status = 'processed';
      
      if (!qr.isProcessed) {
        if (timeDiff < 0) {
          status = 'OVERDUE';
          overdueCount++;
        } else {
          status = 'pending';
          pendingCount++;
        }
      } else {
        processedCount++;
      }
      
      console.log(`${index + 1}. ${status.toUpperCase()}`);
      console.log(`   ID: ${qr.id}`);
      console.log(`   Email: ${qr.clientEmail}`);
      console.log(`   Scheduled: ${qr.scheduledFor.toISOString()}`);
      console.log(`   Config: ${qr.configurationId}`);
      console.log(`   Seller: ${qr.sellerId}`);
      if (qr.isProcessed) {
        console.log(`   Processed: ${qr.processedAt?.toISOString()}`);
        console.log(`   Created QR: ${qr.createdQRCodeId}`);
      } else {
        console.log(`   Time: ${Math.abs(timeDiff)} min ${timeDiff < 0 ? 'overdue' : 'remaining'}`);
      }
      console.log('');
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`⏳ Pending: ${pendingCount}`);
    console.log(`❌ Overdue: ${overdueCount}`);
    
    // Check for PayPal-specific patterns
    const paypalScheduled = allScheduled.filter(qr => 
      qr.configurationId === 'default' || qr.sellerId === 'system'
    );
    
    console.log(`\n💰 PayPal-related scheduled QRs: ${paypalScheduled.length}`);
    
    // Check recent orders to see if any have future delivery
    console.log('\n🔍 Checking recent PayPal orders...');
    const recentOrders = await prisma.order.findMany({
      where: {
        deliveryType: 'future'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📋 Found ${recentOrders.length} recent orders with future delivery:`);
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.id}`);
      console.log(`   Email: ${order.customerEmail}`);
      console.log(`   Delivery Date: ${order.deliveryDate?.toISOString()}`);
      console.log(`   Created: ${order.createdAt.toISOString()}`);
      console.log('');
    });
    
    console.log('\n🎯 DIAGNOSIS:');
    if (overdueCount > 0) {
      console.log(`❌ ISSUE CONFIRMED: ${overdueCount} overdue scheduled QRs need processing`);
      console.log('   This explains why customers aren\'t receiving QR codes');
      console.log('   Solution: Process overdue QRs using fallback processor');
    } else if (pendingCount > 0) {
      console.log(`✅ System appears healthy: ${pendingCount} QRs scheduled for future`);
      console.log('   QStash should process these automatically');
    } else {
      console.log('✅ No unprocessed scheduled QRs - system working correctly');
    }
    
    if (recentOrders.length > 0) {
      console.log(`💰 PayPal future delivery orders found: ${recentOrders.length}`);
      console.log('   These should have created scheduled QR records');
    } else {
      console.log('📋 No recent PayPal future delivery orders found');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayPalScheduledQRs(); 