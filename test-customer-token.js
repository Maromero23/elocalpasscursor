const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testToken() {
  try {
    const token = 'cc0cc89822df42a6e6bdc005cbdd9559e175332088455189171d2f0ee209ab9f';
    
    console.log('🔍 Testing token:', token.substring(0, 20) + '...');
    
    // Find the access token
    const accessToken = await prisma.customerAccessToken.findUnique({
      where: { token },
      include: {
        qrCode: true
      }
    });

    if (accessToken) {
      console.log('✅ Token found!');
      console.log('📧 Customer email:', accessToken.customerEmail);
      console.log('👤 Customer name:', accessToken.customerName);
      console.log('⏰ Created:', accessToken.createdAt);
      console.log('⏰ Expires:', accessToken.expiresAt);
      console.log('🔗 QR Code ID:', accessToken.qrCodeId);
      console.log('✅ Token valid:', new Date() < accessToken.expiresAt);
      
      // Get all QR codes for this customer
      const qrCodes = await prisma.qRCode.findMany({
        where: {
          customerEmail: accessToken.customerEmail
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n🎫 QR Codes for this customer:');
      qrCodes.forEach((qr, index) => {
        console.log(`  ${index + 1}. ${qr.code}`);
        console.log(`     Name: ${qr.customerName}`);
        console.log(`     Email: ${qr.customerEmail}`);
        console.log(`     Guests: ${qr.guests}, Days: ${qr.days}`);
        console.log(`     Active: ${qr.isActive}`);
        console.log(`     Expires: ${qr.expiresAt}`);
        console.log(`     Created: ${qr.createdAt}`);
        console.log('');
      });
      
    } else {
      console.log('❌ Token not found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testToken();
