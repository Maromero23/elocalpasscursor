const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIResponse() {
  try {
    console.log('Testing API Response Format...\n');
    
    // Simulate the API logic
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        customerEmail: {
          not: null
        }
      },
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
      take: 5
    });
    
    // Format like the API does
    const sales = qrCodes.map(qr => ({
      id: qr.id,
      qrCode: qr.code,
      customerName: qr.customerName,
      customerEmail: qr.customerEmail,
      amount: qr.cost,
      guests: qr.guests,
      days: qr.days,
      expiresAt: qr.expiresAt,
      createdAt: qr.createdAt,
      isActive: qr.isActive,
      deliveryType: 'immediate',
      seller: {
        id: qr.seller.id,
        name: qr.seller.name,
        email: qr.seller.email,
        location: qr.seller.location
      }
    }));
    
    console.log('API Response Format:');
    console.log(JSON.stringify(sales, null, 2));
    
    // Check if our QR is in the response
    const ourQR = sales.find(sale => sale.qrCode === 'PASS_1752891876199_gry1b12op');
    if (ourQR) {
      console.log('\n✅ Our QR code is in the API response:');
      console.log('Customer:', ourQR.customerName);
      console.log('Email:', ourQR.customerEmail);
      console.log('Amount:', ourQR.amount);
      console.log('Seller:', ourQR.seller.name);
    } else {
      console.log('\n❌ Our QR code is NOT in the API response');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIResponse(); 