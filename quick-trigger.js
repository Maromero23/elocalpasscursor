const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerRebuy() {
  try {
    console.log('🔍 Looking for QR code: PASS_1753841283223_2ef21uhxk');
    
    const qrCode = await prisma.qRCode.findFirst({
      where: { code: 'PASS_1753841283223_2ef21uhxk' }
    });
    
    if (!qrCode) {
      console.log('❌ QR code not found');
      return;
    }
    
    console.log('✅ Found QR code:', qrCode.id);
    console.log('   Customer:', qrCode.customerName, '(' + qrCode.customerEmail + ')');
    
    console.log('🚀 Triggering rebuy email...');
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/test-passes-rebuy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: qrCode.code })
    });
    
    const result = await response.text();
    console.log('📧 API Response:', response.status);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('✅ SUCCESS! Email sent using template:', data.template);
      console.log('📧 Check email:', data.email);
      console.log('⏰ Hours left:', data.hoursLeft);
      console.log('📊 Final HTML length:', data.finalHtmlLength);
    } else {
      console.log('❌ Failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

triggerRebuy();
