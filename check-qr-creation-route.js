const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQRCreation() {
  try {
    console.log('🔍 ANALYZING QR CODE CREATION ROUTES\n');
    
    // Check the recent EL- QR code
    const elQR = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753668721361-7n65cbbat'
      },
      include: {
        seller: true,
        analytics: true
      }
    });

    if (elQR) {
      console.log('🚨 RECENT EL- QR CODE (BROKEN):');
      console.log(`- Code: ${elQR.code}`);
      console.log(`- Seller ID: ${elQR.sellerId}`);
      console.log(`- Customer: ${elQR.customerName} (${elQR.customerEmail})`);
      console.log(`- Created: ${elQR.createdAt}`);
      console.log(`- Cost: $${elQR.cost}`);
      console.log(`- Days: ${elQR.days}`);
      console.log(`- Guests: ${elQR.guests}`);
    }

    // Check a working PASS_ QR code
    const passQR = await prisma.qRCode.findFirst({
      where: {
        code: {
          startsWith: 'PASS_'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        seller: true,
        analytics: true
      }
    });

    if (passQR) {
      console.log('\n✅ WORKING PASS_ QR CODE:');
      console.log(`- Code: ${passQR.code}`);
      console.log(`- Seller ID: ${passQR.sellerId}`);
      console.log(`- Customer: ${passQR.customerName} (${passQR.customerEmail})`);
      console.log(`- Created: ${passQR.createdAt}`);
      console.log(`- Cost: $${passQR.cost}`);
      console.log(`- Days: ${passQR.days}`);
      console.log(`- Guests: ${passQR.guests}`);
    }

    // Check orders table for both
    if (elQR) {
      const elOrder = await prisma.order.findFirst({
        where: {
          customerEmail: elQR.customerEmail,
          customerName: elQR.customerName,
          createdAt: {
            gte: new Date(elQR.createdAt.getTime() - 5 * 60 * 1000), // 5 minutes before QR
            lte: new Date(elQR.createdAt.getTime() + 5 * 60 * 1000)  // 5 minutes after QR
          }
        }
      });

      console.log('\n🔍 EL- QR ORDER RECORD:');
      if (elOrder) {
        console.log(`- Order ID: ${elOrder.id}`);
        console.log(`- Payment ID: ${elOrder.paymentId || 'None'}`);
        console.log(`- Status: ${elOrder.status}`);
        console.log(`- Created: ${elOrder.createdAt}`);
        console.log(`- Delivery Type: ${elOrder.deliveryType}`);
      } else {
        console.log('- No order record found (likely created via landing page)');
      }
    }

    if (passQR) {
      const passOrder = await prisma.order.findFirst({
        where: {
          customerEmail: passQR.customerEmail,
          customerName: passQR.customerName,
          createdAt: {
            gte: new Date(passQR.createdAt.getTime() - 5 * 60 * 1000),
            lte: new Date(passQR.createdAt.getTime() + 5 * 60 * 1000)
          }
        }
      });

      console.log('\n🔍 PASS_ QR ORDER RECORD:');
      if (passOrder) {
        console.log(`- Order ID: ${passOrder.id}`);
        console.log(`- Payment ID: ${passOrder.paymentId || 'None'}`);
        console.log(`- Status: ${passOrder.status}`);
        console.log(`- Created: ${passOrder.createdAt}`);
        console.log(`- Delivery Type: ${passOrder.deliveryType}`);
      } else {
        console.log('- No order record found');
      }
    }

    console.log('\n🎯 ANALYSIS:');
    console.log('- PASS_ QR codes are created by PayPal success/webhook routes');
    console.log('- EL- QR codes are created by landing page submit route');
    console.log('- The passes page now goes through landing page route instead of PayPal route');
    console.log('- This is why rebuy emails are truncated - different creation path!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRCreation(); 