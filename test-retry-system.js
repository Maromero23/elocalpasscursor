const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRetrySystem() {
  try {
    console.log('🧪 TESTING RETRY SYSTEM\n');
    
    // 1. Create a test overdue QR
    console.log('📝 Creating test overdue QR...');
    const testQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        clientName: 'Test Customer',
        clientEmail: 'test@example.com',
        guests: 2,
        days: 3,
        sellerId: 'system',
        configurationId: 'default',
        deliveryMethod: 'DIRECT',
        isProcessed: false,
        retryCount: 0
      }
    });
    
    console.log(`✅ Created test QR: ${testQR.id}`);
    console.log(`📅 Scheduled for: ${testQR.scheduledFor.toLocaleString()}`);
    console.log(`⏰ Overdue by: ${Math.round((Date.now() - testQR.scheduledFor.getTime()) / 1000 / 60)} minutes\n`);
    
    // 2. Check overdue QRs
    console.log('🔍 Checking for overdue QRs...');
    const overdueQRs = await prisma.scheduledQRCode.findMany({
      where: {
        scheduledFor: {
          lt: new Date()
        },
        isProcessed: false
      }
    });
    
    console.log(`📋 Found ${overdueQRs.length} overdue QRs:`);
    overdueQRs.forEach((qr, index) => {
      const overdueMinutes = Math.round((Date.now() - qr.scheduledFor.getTime()) / 1000 / 60);
      console.log(`${index + 1}. ${qr.clientName} (${qr.clientEmail}) - ${overdueMinutes} minutes overdue`);
    });
    
    // 3. Test retry endpoint
    console.log('\n🔄 Testing retry endpoint...');
    const retryResponse = await fetch('http://localhost:3000/api/scheduled-qr/retry-overdue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const retryResult = await retryResponse.json();
    console.log('📊 Retry result:', retryResult);
    
    // 4. Check if QR was processed
    console.log('\n✅ Checking if QR was processed...');
    const updatedQR = await prisma.scheduledQRCode.findUnique({
      where: { id: testQR.id }
    });
    
    if (updatedQR.isProcessed) {
      console.log(`✅ QR was successfully processed!`);
      console.log(`🆔 Created QR Code: ${updatedQR.createdQRCodeId}`);
      console.log(`📧 Email sent: ${updatedQR.processedAt}`);
    } else {
      console.log(`❌ QR was not processed`);
      console.log(`🔄 Retry count: ${updatedQR.retryCount}`);
    }
    
    // 5. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.scheduledQRCode.delete({
      where: { id: testQR.id }
    });
    console.log('✅ Test QR deleted');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRetrySystem(); 