const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebsiteSales() {
  try {
    console.log('=== CHECKING WEBSITE SALES DATA ===\n');
    
    // Check the specific QR code from the manual order
    const qrCode = 'PASS_1752891876199_gry1b12op';
    
    const qrRecord = await prisma.qRCode.findUnique({
      where: { code: qrCode },
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
      }
    });
    
    if (!qrRecord) {
      console.log('❌ QR code not found:', qrCode);
      return;
    }
    
    console.log('📊 WEBSITE SALE DETAILS:');
    console.log('- QR Code:', qrRecord.code);
    console.log('- Customer Name:', qrRecord.customerName);
    console.log('- Customer Email:', qrRecord.customerEmail);
    console.log('- Amount Paid:', `$${qrRecord.cost}`);
    console.log('- Guests:', qrRecord.guests);
    console.log('- Days:', qrRecord.days);
    console.log('- Expires At:', qrRecord.expiresAt);
    console.log('- Created At:', qrRecord.createdAt);
    console.log('- Is Active:', qrRecord.isActive);
    
    console.log('\n🏪 SELLER INFORMATION:');
    console.log('- Seller ID:', qrRecord.sellerId);
    console.log('- Seller Name:', qrRecord.seller?.name || 'Unknown');
    console.log('- Seller Email:', qrRecord.seller?.email || 'Unknown');
    
    if (qrRecord.seller?.location) {
      console.log('- Location Name:', qrRecord.seller.location.name);
      console.log('- Location ID:', qrRecord.seller.location.id);
      
      if (qrRecord.seller.location.distributor) {
        console.log('- Distributor Name:', qrRecord.seller.location.distributor.name);
        console.log('- Distributor ID:', qrRecord.seller.location.distributor.id);
      }
    }
    
    // Check if this is a future delivery (scheduled QR)
    const scheduledQR = await prisma.scheduledQRCode.findFirst({
      where: { 
        clientEmail: qrRecord.customerEmail,
        clientName: qrRecord.customerName
      }
    });
    
    if (scheduledQR) {
      console.log('\n⏰ FUTURE DELIVERY DETAILS:');
      console.log('- Scheduled For:', scheduledQR.scheduledFor);
      console.log('- Is Processed:', scheduledQR.isProcessed);
      console.log('- Delivery Method:', scheduledQR.deliveryMethod);
    } else {
      console.log('\n✅ IMMEDIATE DELIVERY (QR created immediately)');
    }
    
    // Check all recent website sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = await prisma.qRCode.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
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
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📈 RECENT WEBSITE SALES (Last 30 days):');
    console.log(`Total sales: ${recentSales.length}`);
    
    recentSales.forEach((sale, index) => {
      console.log(`\n${index + 1}. ${sale.customerName} (${sale.customerEmail})`);
      console.log(`   Amount: $${sale.cost}`);
      console.log(`   Seller: ${sale.seller?.name || 'Unknown'} (${sale.seller?.email || 'Unknown'})`);
      console.log(`   Location: ${sale.seller?.location?.name || 'Unknown'}`);
      console.log(`   Distributor: ${sale.seller?.location?.distributor?.name || 'Unknown'}`);
      console.log(`   Created: ${sale.createdAt.toLocaleDateString()}`);
      console.log(`   QR Code: ${sale.code}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWebsiteSales(); 