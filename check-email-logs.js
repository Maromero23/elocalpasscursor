const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailLogs() {
  try {
    // Check the most recent QR code for your email
    const recentQR = await prisma.qRCode.findFirst({
      where: {
        customerEmail: 'jorgeruiz23@gmail.com',
        customerName: 'Jony begood'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    });
    
    if (recentQR) {
      console.log('🎫 Found your recent QR submission:');
      console.log('   Code:', recentQR.code);
      console.log('   Email:', recentQR.customerEmail);
      console.log('   Created:', recentQR.createdAt);
      console.log('   Seller ID:', recentQR.sellerId);
      console.log('   Config ID:', recentQR.seller?.savedConfigId);
      
      // Check if there's a magic link token for this QR
      const magicToken = await prisma.customerAccessToken.findFirst({
        where: {
          qrCodeId: recentQR.id,
          customerEmail: 'jorgeruiz23@gmail.com'
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (magicToken) {
        console.log('🔗 Magic link token created:');
        console.log('   Token:', magicToken.token.substring(0, 20) + '...');
        console.log('   Created:', magicToken.createdAt);
        console.log('   Expires:', magicToken.expiresAt);
        console.log('   Magic Link URL: https://elocalpasscursor.vercel.app/customer/access?token=' + magicToken.token);
      } else {
        console.log('❌ No magic link token found - this might be the issue!');
      }
      
    } else {
      console.log('❌ No recent QR found for jorgeruiz23@gmail.com with name "Jony begood"');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailLogs();
