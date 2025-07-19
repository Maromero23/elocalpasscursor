const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificQR() {
  try {
    console.log('Checking for QR code: PASS_1752891876199_gry1b12op');
    
    const qr = await prisma.qRCode.findFirst({
      where: {
        code: 'PASS_1752891876199_gry1b12op'
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
      }
    });

    if (qr) {
      console.log('✅ Found QR Code:');
      console.log('QR Code:', qr.code);
      console.log('Customer Name:', qr.customerName);
      console.log('Customer Email:', qr.customerEmail);
      console.log('Amount:', qr.cost);
      console.log('Guests:', qr.guests);
      console.log('Days:', qr.days);
      console.log('Created At:', qr.createdAt);
      console.log('Expires At:', qr.expiresAt);
      console.log('Is Active:', qr.isActive);
      
      if (qr.seller) {
        console.log('Seller Name:', qr.seller.name);
        console.log('Seller Email:', qr.seller.email);
        if (qr.seller.location) {
          console.log('Location:', qr.seller.location.name);
          if (qr.seller.location.distributor) {
            console.log('Distributor:', qr.seller.location.distributor.name);
          }
        }
      }
    } else {
      console.log('❌ QR Code not found in database');
      
      // Check if it might be in scheduled QR codes
      const scheduledQR = await prisma.scheduledQRCode.findFirst({
        where: {
          qrCode: 'PASS_1752891876199_gry1b12op'
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
        }
      });
      
      if (scheduledQR) {
        console.log('✅ Found in Scheduled QR Codes:');
        console.log('QR Code:', scheduledQR.qrCode);
        console.log('Scheduled For:', scheduledQR.scheduledFor);
        console.log('Is Processed:', scheduledQR.isProcessed);
        console.log('Created At:', scheduledQR.createdAt);
        
        if (scheduledQR.seller) {
          console.log('Seller Name:', scheduledQR.seller.name);
          console.log('Seller Email:', scheduledQR.seller.email);
          if (scheduledQR.seller.location) {
            console.log('Location:', scheduledQR.seller.location.name);
            if (scheduledQR.seller.location.distributor) {
              console.log('Distributor:', scheduledQR.seller.location.distributor.name);
            }
          }
        }
      } else {
        console.log('❌ Not found in scheduled QR codes either');
      }
    }
    
    // Also check recent QR codes to see what format they use
    console.log('\n📋 Recent QR Codes (last 5):');
    const recentQRs = await prisma.qRCode.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        code: true,
        customerName: true,
        createdAt: true
      }
    });
    
    recentQRs.forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.code} - ${qr.customerName} (${qr.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificQR(); 