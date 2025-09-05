const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDistributorsExceptJorge() {
  try {
    console.log('🚨 MASSIVE DELETION OPERATION STARTING...\n');
    console.log('⚠️  This will delete ALL distributors except "Prueba ditribuidor Jorge"');
    console.log('⚠️  Including all their locations, sellers, QR codes, and related data\n');

    // First, let's identify the distributor to KEEP
    const keepDistributor = await prisma.distributor.findFirst({
      where: {
        name: {
          contains: 'Prueba ditribuidor Jorge',
          mode: 'insensitive'
        }
      },
      include: {
        user: true
      }
    });

    if (!keepDistributor) {
      console.error('❌ ERROR: Could not find "Prueba ditribuidor Jorge" distributor!');
      console.error('❌ ABORTING DELETION for safety');
      return;
    }

    console.log('✅ Found distributor to KEEP:');
    console.log(`   - Name: ${keepDistributor.name}`);
    console.log(`   - ID: ${keepDistributor.id}`);
    console.log(`   - User: ${keepDistributor.user.email}\n`);

    // Get all distributors to DELETE (everyone except Jorge)
    const distributorsToDelete = await prisma.distributor.findMany({
      where: {
        id: {
          not: keepDistributor.id
        }
      },
      include: {
        user: true,
        locations: {
          include: {
            user: true,
            sellers: {
              include: {
                sellerQRCodes: true,
                analytics: true
              }
            }
          }
        }
      }
    });

    console.log(`🎯 DISTRIBUTORS TO DELETE: ${distributorsToDelete.length}`);
    distributorsToDelete.forEach((dist, index) => {
      console.log(`   ${index + 1}. ${dist.name} (${dist.locations.length} locations)`);
      dist.locations.forEach((loc, locIndex) => {
        console.log(`      Location ${locIndex + 1}: ${loc.name} (${loc.sellers.length} sellers)`);
      });
    });

    console.log('\n⏳ Starting deletion process...\n');

    let totalDeleted = {
      distributors: 0,
      locations: 0,
      sellers: 0,
      users: 0,
      qrCodes: 0
    };

    // Process each distributor for deletion
    for (const distributor of distributorsToDelete) {
      console.log(`🗑️  Processing: ${distributor.name}`);
      
      // Delete all locations and their sellers for this distributor
      for (const location of distributor.locations) {
        console.log(`   📍 Deleting location: ${location.name}`);
        
        // Delete all sellers in this location
        for (const seller of location.sellers) {
          console.log(`      👤 Deleting seller: ${seller.name || seller.email}`);
          
          // Delete QR codes for this seller (will cascade to related data)
          const qrCodeCount = await prisma.qRCode.deleteMany({
            where: { sellerId: seller.id }
          });
          totalDeleted.qrCodes += qrCodeCount.count;
          
          // Delete analytics for this seller
          await prisma.qRCodeAnalytics.deleteMany({
            where: { sellerId: seller.id }
          });
          
          // Delete seller user account
          await prisma.user.delete({
            where: { id: seller.id }
          });
          totalDeleted.sellers++;
          totalDeleted.users++;
        }
        
        // Delete location user account
        if (location.user) {
          await prisma.user.delete({
            where: { id: location.user.id }
          });
          totalDeleted.users++;
        }
        
        // Delete location (should cascade, but being explicit)
        await prisma.location.delete({
          where: { id: location.id }
        });
        totalDeleted.locations++;
      }
      
      // Delete distributor user account
      await prisma.user.delete({
        where: { id: distributor.user.id }
      });
      totalDeleted.users++;
      
      // Delete distributor (should cascade, but being explicit)
      await prisma.distributor.delete({
        where: { id: distributor.id }
      });
      totalDeleted.distributors++;
      
      console.log(`   ✅ Deleted distributor: ${distributor.name}`);
    }

    console.log('\n🎉 DELETION COMPLETED SUCCESSFULLY!');
    console.log('\n📊 DELETION SUMMARY:');
    console.log(`   - Distributors deleted: ${totalDeleted.distributors}`);
    console.log(`   - Locations deleted: ${totalDeleted.locations}`);
    console.log(`   - Sellers deleted: ${totalDeleted.sellers}`);
    console.log(`   - User accounts deleted: ${totalDeleted.users}`);
    console.log(`   - QR codes deleted: ${totalDeleted.qrCodes}`);

    console.log('\n✅ REMAINING DISTRIBUTOR:');
    console.log(`   - ${keepDistributor.name} (${keepDistributor.user.email})`);

    // Verify final state
    const remainingDistributors = await prisma.distributor.findMany({
      include: {
        user: true,
        _count: {
          select: { locations: true }
        }
      }
    });

    console.log('\n🔍 VERIFICATION - Remaining distributors:');
    remainingDistributors.forEach((dist, index) => {
      console.log(`   ${index + 1}. ${dist.name} - ${dist._count.locations} locations`);
    });

    if (remainingDistributors.length === 1 && remainingDistributors[0].id === keepDistributor.id) {
      console.log('\n✅ SUCCESS: Only "Prueba ditribuidor Jorge" remains!');
    } else {
      console.log('\n⚠️  WARNING: Unexpected number of remaining distributors!');
    }

  } catch (error) {
    console.error('❌ ERROR during deletion:', error);
    console.error('❌ Some data may have been partially deleted');
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the deletion
deleteDistributorsExceptJorge();

