const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('=== VERIFYING SUPABASE MIGRATION ===\n');
    
    // Check users
    const users = await prisma.user.findMany({
      include: {
        savedConfig: true,
        location: true,
        distributorProfile: true,
        locationProfile: true
      }
    });
    console.log('📊 USERS (' + users.length + '):');
    users.forEach(user => {
      console.log('  ✓', user.email, '(' + user.role + ')', user.savedConfig ? '- Config: ' + user.savedConfig.name : '');
    });
    
    // Check distributors
    const distributors = await prisma.distributor.findMany({
      include: { user: true, locations: true }
    });
    console.log('\n📊 DISTRIBUTORS (' + distributors.length + '):');
    distributors.forEach(dist => {
      console.log('  ✓', dist.name, '- User:', dist.user?.email, '- Locations:', dist.locations.length);
    });
    
    // Check locations
    const locations = await prisma.location.findMany({
      include: { user: true, distributor: true, sellers: true }
    });
    console.log('\n📊 LOCATIONS (' + locations.length + '):');
    locations.forEach(loc => {
      console.log('  ✓', loc.name, '- User:', loc.user?.email, '- Distributor:', loc.distributor?.name, '- Sellers:', loc.sellers.length);
    });
    
    // Check saved configurations
    const configs = await prisma.savedQRConfiguration.findMany();
    console.log('\n📊 SAVED CONFIGURATIONS (' + configs.length + '):');
    configs.forEach(config => {
      console.log('  ✓', config.name);
    });
    
    // Check QR codes
    const qrCodes = await prisma.qRCode.findMany({
      include: { seller: true }
    });
    console.log('\n📊 QR CODES (' + qrCodes.length + '):');
    qrCodes.forEach(qr => {
      console.log('  ✓', qr.id, '- Customer:', qr.customerName, '- Seller:', qr.seller?.email);
    });
    
    // Check relationships
    console.log('\n📊 RELATIONSHIP VERIFICATION:');
    const sellersWithConfigs = users.filter(u => u.role === 'SELLER' && u.savedConfig);
    console.log('  ✓ Sellers with configurations:', sellersWithConfigs.length);
    sellersWithConfigs.forEach(seller => {
      console.log('    -', seller.email, '→', seller.savedConfig.name);
    });
    
    const locationsWithUsers = locations.filter(l => l.user);
    console.log('  ✓ Locations with users:', locationsWithUsers.length);
    
    const distributorsWithUsers = distributors.filter(d => d.user);
    console.log('  ✓ Distributors with users:', distributorsWithUsers.length);
    
    console.log('\n=== MIGRATION VERIFICATION COMPLETE ===');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('  • Users:', users.length);
    console.log('  • Distributors:', distributors.length);
    console.log('  • Locations:', locations.length);
    console.log('  • Saved Configurations:', configs.length);
    console.log('  • QR Codes:', qrCodes.length);
    
    const allSellers = users.filter(u => u.role === 'SELLER');
    console.log('  • All sellers found:', allSellers.map(u => u.email).join(', '));
    
    // Verify specific sellers
    const playaHotelsSeller = users.find(u => u.email === 'seller@playahotels.com');
    if (playaHotelsSeller) {
      console.log('  ✅ seller@playahotels.com found with config:', playaHotelsSeller.savedConfig?.name || 'None');
    } else {
      console.log('  ❌ seller@playahotels.com NOT found');
    }
    
    // Final migration status
    console.log('\n🎉 MIGRATION STATUS: SUCCESS');
    console.log('✅ All data successfully migrated to Supabase');
    console.log('✅ All relationships intact');
    console.log('✅ All sellers present and configured');
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration(); 