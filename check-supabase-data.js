const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== CHECKING SUPABASE DATA ===');
    
    // Check QR codes (mapped to qr_codes table)
    const qrCodes = await prisma.qRCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log('QR Codes in database:', qrCodes.length);
    qrCodes.forEach(qr => {
      console.log('- QR:', qr.code, 'Customer:', qr.customerName, 'Created:', qr.createdAt);
    });
    
    // Check saved configurations
    const configs = await prisma.savedQRConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log('\nSaved Configurations in database:', configs.length);
    configs.forEach(config => {
      console.log('- Config:', config.name, 'Created:', config.createdAt);
    });
    
    // Check users/sellers
    const users = await prisma.user.findMany({
      where: { role: 'SELLER' }
    });
    console.log('\nSellers in database:', users.length);
    users.forEach(user => {
      console.log('- Seller:', user.email, 'Config:', user.savedConfigId || 'None');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 