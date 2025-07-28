const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPassesQR() {
  try {
    console.log('🔍 DEBUGGING PASSES/PAYPAL QR CODE: EL-1753668721361-7n65cbbat\n');
    
    // Get the QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753668721361-7n65cbbat'
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    });

    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }

    console.log('✅ QR Code found:');
    console.log(`- Database ID: ${qrCode.id}`);
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
    console.log(`- Created: ${qrCode.createdAt}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    console.log(`- Is Active: ${qrCode.isActive}`);
    console.log(`- Seller ID: ${qrCode.sellerId}`);
    console.log(`- Seller: ${qrCode.seller?.name || 'NULL'}`);
    
    if (!qrCode.seller) {
      console.log('\n❌ ISSUE FOUND: QR code has no seller associated!');
      console.log('This explains why rebuy email fails - it needs a seller with configuration.');
      
      // Check if this QR was created via passes/PayPal route
      const order = await prisma.order.findFirst({
        where: {
          customerEmail: qrCode.customerEmail,
          createdAt: {
            gte: new Date(qrCode.createdAt.getTime() - 60000), // Within 1 minute
            lte: new Date(qrCode.createdAt.getTime() + 60000)
          }
        }
      });
      
      if (order) {
        console.log('\n📋 FOUND RELATED ORDER:');
        console.log(`- Order ID: ${order.id}`);
        console.log(`- Payment ID: ${order.paymentId}`);
        console.log(`- Amount: $${order.amount}`);
        console.log(`- Status: ${order.status}`);
        console.log(`- Seller ID in order: ${order.sellerId}`);
        
        if (order.sellerId) {
          console.log('\n🔧 ORDER HAS SELLER ID - QR should have been linked!');
          
          // Check if the seller exists
          const seller = await prisma.user.findUnique({
            where: { id: order.sellerId },
            include: { savedConfig: true }
          });
          
          if (seller) {
            console.log(`✅ Seller found: ${seller.name}`);
            console.log(`- Has saved config: ${!!seller.savedConfig}`);
            
            if (seller.savedConfig) {
              console.log(`- Config name: ${seller.savedConfig.name}`);
              
              // Fix the QR code by linking it to the seller
              console.log('\n🔧 FIXING QR CODE - Linking to seller...');
              
              await prisma.qRCode.update({
                where: { id: qrCode.id },
                data: { sellerId: seller.id }
              });
              
              console.log('✅ QR code updated with seller ID');
              
              // Also check if seller config has rebuy emails enabled
              try {
                const config = JSON.parse(seller.savedConfig.config);
                console.log(`\n📋 SELLER CONFIGURATION:`);
                console.log(`- button1SendWelcomeEmail: ${config.button1SendWelcomeEmail}`);
                console.log(`- button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
                
                if (config.button5SendRebuyEmail !== true) {
                  console.log('\n🔧 ENABLING REBUY EMAILS IN SELLER CONFIG...');
                  
                  const updatedConfig = {
                    ...config,
                    button1SendWelcomeEmail: true,
                    button5SendRebuyEmail: true
                  };
                  
                  await prisma.savedQRConfiguration.update({
                    where: { id: seller.savedConfig.id },
                    data: { config: JSON.stringify(updatedConfig) }
                  });
                  
                  console.log('✅ Seller configuration updated with rebuy emails enabled');
                }
                
              } catch (configError) {
                console.log('❌ Error parsing seller configuration');
              }
              
            } else {
              console.log('❌ Seller has no saved configuration');
            }
          } else {
            console.log('❌ Seller not found in database');
          }
        } else {
          console.log('\n⚠️ Order has no seller ID - this is a direct purchase');
        }
      } else {
        console.log('\n❌ No related order found');
      }
    } else {
      console.log(`\n✅ QR code is properly linked to seller: ${qrCode.seller.name}`);
      
      if (qrCode.seller.savedConfig) {
        console.log(`- Config: ${qrCode.seller.savedConfig.name}`);
        
        try {
          const config = JSON.parse(qrCode.seller.savedConfig.config);
          console.log(`- button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
        } catch (e) {
          console.log('- Config parse error');
        }
      } else {
        console.log('- No saved configuration');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPassesQR(); 