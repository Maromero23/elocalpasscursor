const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestQR() {
  try {
    const qr = await prisma.qRCode.findFirst({
      where: { code: 'EL-1750899710430-b3dqrgeak' },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    });
    
    if (!qr) {
      console.log('❌ QR code not found');
      return;
    }
    
    console.log('📊 LATEST QR CODE:');
    console.log('- Code:', qr.code);
    console.log('- Customer:', qr.customerName, '(' + qr.customerEmail + ')');
    console.log('- Seller:', qr.seller.name, '(' + qr.seller.email + ')');
    console.log('- Config:', qr.seller.savedConfig?.name);
    console.log('- Config ID:', qr.seller.savedConfig?.id);
    
    if (qr.seller.savedConfig?.emailTemplates) {
      const emailTemplates = JSON.parse(qr.seller.savedConfig.emailTemplates);
      if (emailTemplates.rebuyEmail) {
        console.log('- Template type:', emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE' ? 'DEFAULT' : 'CUSTOM');
        console.log('- Template length:', emailTemplates.rebuyEmail.customHTML?.length || 0, 'characters');
        
        if (emailTemplates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
          console.log('- Has "Don\'t Miss Out!":', emailTemplates.rebuyEmail.customHTML.includes("Don't Miss Out!"));
          console.log('- Has "Featured Partners":', emailTemplates.rebuyEmail.customHTML.includes("Featured Partners"));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestQR(); 