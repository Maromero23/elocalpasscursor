const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPayPalFutureDelivery() {
  try {
    console.log('🧪 TESTING PAYPAL FUTURE DELIVERY PROCESS\n');
    
    // 1. Simulate creating an order with future delivery (like PayPal would)
    console.log('1. Creating test order with future delivery...');
    const testOrderData = {
      paymentId: `TEST_FUTURE_${Date.now()}`,
      amount: 15.00,
      currency: 'USD',
      customerEmail: 'test@example.com',
      customerName: 'Test Customer',
      passType: 'day',
      guests: 2,
      days: 1,
      deliveryType: 'future', // This is the key difference
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      deliveryTime: '10:00',
      discountCode: null,
      sellerId: null,
      status: 'PAID'
    };
    
    const orderRecord = await prisma.order.create({
      data: testOrderData
    });
    
    console.log('✅ Order created:', orderRecord.id);
    console.log('📅 Delivery scheduled for:', testOrderData.deliveryDate.toISOString());
    
    // 2. Test the scheduleQRCode function (simulate what PayPal success route does)
    console.log('\n2. Testing scheduleQRCode function...');
    
    const deliveryDateTime = orderRecord.deliveryDate ? new Date(orderRecord.deliveryDate) : new Date();
    console.log('📅 Calculated delivery time:', deliveryDateTime.toISOString());
    
    // Create scheduled QR configuration
    const scheduledQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: deliveryDateTime,
        clientName: orderRecord.customerName,
        clientEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        sellerId: orderRecord.sellerId || 'system',
        configurationId: 'default',
        deliveryMethod: 'DIRECT',
        isProcessed: false
      }
    });
    
    console.log('✅ Scheduled QR created:', scheduledQR.id);
    
    // 3. Check if it appears in the scheduled QRs table
    console.log('\n3. Checking scheduled QRs table...');
    const allScheduled = await prisma.scheduledQRCode.findMany({
      where: { isProcessed: false },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📋 Found ${allScheduled.length} unprocessed scheduled QRs:`);
    allScheduled.forEach((qr, index) => {
      console.log(`${index + 1}. ID: ${qr.id}`);
      console.log(`   Email: ${qr.clientEmail}`);
      console.log(`   Scheduled for: ${qr.scheduledFor.toISOString()}`);
      console.log(`   Configuration: ${qr.configurationId}`);
      console.log('');
    });
    
    // 4. Test QStash scheduling (check if environment is set up)
    console.log('4. Checking QStash configuration...');
    const qstashToken = process.env.QSTASH_TOKEN;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    console.log('🔧 Environment check:');
    console.log(`   QSTASH_TOKEN: ${qstashToken ? 'SET' : 'NOT SET'}`);
    console.log(`   NEXTAUTH_URL: ${nextAuthUrl || 'NOT SET'}`);
    
    if (qstashToken && nextAuthUrl) {
      console.log('✅ QStash configuration appears correct');
      
      // Calculate delay
      const delay = deliveryDateTime.getTime() - Date.now();
      console.log(`⏰ Delay calculation: ${delay}ms (${Math.round(delay / 1000 / 60)} minutes)`);
      
      if (delay > 0) {
        console.log('✅ Delay is positive - QStash scheduling would work');
      } else {
        console.log('❌ Delay is negative - delivery time is in the past');
      }
    } else {
      console.log('❌ QStash configuration incomplete - scheduling would fail');
    }
    
    // 5. Check if there are any existing successful scheduled QRs
    console.log('\n5. Checking for any processed scheduled QRs...');
    const processedQRs = await prisma.scheduledQRCode.findMany({
      where: { isProcessed: true },
      orderBy: { processedAt: 'desc' },
      take: 3
    });
    
    console.log(`📋 Found ${processedQRs.length} processed scheduled QRs:`);
    processedQRs.forEach((qr, index) => {
      console.log(`${index + 1}. ID: ${qr.id}`);
      console.log(`   Email: ${qr.clientEmail}`);
      console.log(`   Scheduled for: ${qr.scheduledFor.toISOString()}`);
      console.log(`   Processed at: ${qr.processedAt?.toISOString()}`);
      console.log(`   Created QR: ${qr.createdQRCodeId}`);
      console.log('');
    });
    
    // 6. Clean up test data
    console.log('6. Cleaning up test data...');
    await prisma.scheduledQRCode.delete({ where: { id: scheduledQR.id } });
    await prisma.order.delete({ where: { id: orderRecord.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('The PayPal future delivery process should:');
    console.log('1. ✅ Create order with deliveryType: "future"');
    console.log('2. ✅ Create scheduled QR record');
    console.log('3. ❓ Schedule QStash job (depends on environment)');
    console.log('4. ❓ Process QR at scheduled time (depends on QStash)');
    console.log('5. ❓ Send welcome email (depends on processing)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPayPalFutureDelivery(); 