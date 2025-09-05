const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDistributorsSafe() {
  try {
    console.log('🚨 SAFE DELETION OPERATION STARTING...\n');

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

    // Get current state
    const allDistributors = await prisma.distributor.findMany({
      include: {
        user: true,
        _count: {
          select: { locations: true }
        }
      }
    });

    const distributorsToDelete = allDistributors.filter(d => d.id !== keepDistributor.id);

    console.log(`🎯 DISTRIBUTORS TO DELETE: ${distributorsToDelete.length}`);
    distributorsToDelete.forEach((dist, index) => {
      console.log(`   ${index + 1}. ${dist.name} (${dist._count.locations} locations)`);
    });

    console.log('\n⏳ Starting safe deletion process...\n');

    let deletedCount = 0;

    // Delete distributors one by one - let cascade do the work
    for (const distributor of distributorsToDelete) {
      try {
        console.log(`🗑️  Deleting: ${distributor.name}`);
        
        // Simply delete the distributor - cascade should handle locations, sellers, etc.
        await prisma.distributor.delete({
          where: { id: distributor.id }
        });
        
        deletedCount++;
        console.log(`   ✅ Deleted: ${distributor.name}`);
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${distributor.name}:`, error.message);
        // Continue with next distributor
      }
    }

    console.log(`\n🎉 DELETION COMPLETED!`);
    console.log(`📊 Successfully deleted ${deletedCount} distributors`);

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
    if (remainingDistributors.length === 0) {
      console.log('   ⚠️  NO DISTRIBUTORS REMAIN!');
    } else {
      remainingDistributors.forEach((dist, index) => {
        console.log(`   ${index + 1}. ${dist.name} - ${dist._count.locations} locations`);
      });
    }

    if (remainingDistributors.length === 1 && remainingDistributors[0].id === keepDistributor.id) {
      console.log('\n✅ SUCCESS: Only "Prueba ditribuidor Jorge" remains!');
    } else if (remainingDistributors.length === 0) {
      console.log('\n❌ ERROR: All distributors were deleted including the one to keep!');
    } else {
      console.log('\n⚠️  WARNING: Unexpected number of remaining distributors!');
    }

    // Show final counts
    const finalCounts = {
      distributors: await prisma.distributor.count(),
      locations: await prisma.location.count(),
      users: await prisma.user.count(),
      qrCodes: await prisma.qRCode.count()
    };

    console.log('\n📊 FINAL DATABASE COUNTS:');
    console.log(`   - Distributors: ${finalCounts.distributors}`);
    console.log(`   - Locations: ${finalCounts.locations}`);
    console.log(`   - Users: ${finalCounts.users}`);
    console.log(`   - QR Codes: ${finalCounts.qrCodes}`);

  } catch (error) {
    console.error('❌ ERROR during deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the deletion
deleteDistributorsSafe();

