const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebsiteSalesAPI() {
  try {
    console.log('Testing Website Sales API Logic...\n');
    
    // Test the same query logic as the API
    const whereClause = {
      customerEmail: {
        not: null
      }
    };
    
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    
    const qrCodes = await prisma.qRCode.findMany({
      where: whereClause,
      include: {
        seller: {
          include: {
            location: {
              include: {
                distributor: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${qrCodes.length} QR codes with customerEmail not null`);
    
    qrCodes.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.code} - ${qr.customerName} (${qr.customerEmail}) - $${qr.cost}`);
    });
    
    // Check if our specific QR code is included
    const ourQR = qrCodes.find(qr => qr.code === 'PASS_1752891876199_gry1b12op');
    if (ourQR) {
      console.log('\n✅ Our QR code is included in the results');
    } else {
      console.log('\n❌ Our QR code is NOT included in the results');
      
      // Check why it might not be included
      const allQRs = await prisma.qRCode.findMany({
        where: { code: 'PASS_1752891876199_gry1b12op' }
      });
      
      if (allQRs.length > 0) {
        const qr = allQRs[0];
        console.log('QR Code data:', {
          code: qr.code,
          customerEmail: qr.customerEmail,
          customerName: qr.customerName,
          cost: qr.cost
        });
        
        if (qr.customerEmail === null) {
          console.log('❌ customerEmail is null - this is why it\'s not showing up');
        } else {
          console.log('✅ customerEmail is not null - should be included');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebsiteSalesAPI(); 