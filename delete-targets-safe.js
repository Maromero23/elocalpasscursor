const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTargetsSafe() {
  try {
    console.log('🚨 SAFE DELETION OF TORNEO DE VOLLEY AND INDEPENDIENTE VENDEDOR\n');
    
    let deletedCount = {
      distributors: 0,
      users: 0
    };
    
    // Method 1: Delete by user IDs directly
    console.log('🗑️  DELETING TARGET USERS:');
    
    const targetUsers = [
      'luisyah@gmail.com',      // Torneo de Volley
      'luisyah1@gmail.com',     // Torneo de Volley Playa / Luis Zamora
      'josewalker@gmail.com'    // independente vendedor / Jose Walker
    ];
    
    for (const email of targetUsers) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email },
          include: {
            distributorProfile: true,
            locationProfile: true
          }
        });
        
        if (!user) {
          console.log(`   ⚠️  User not found: ${email}`);
          continue;
        }
        
        console.log(`   Processing: ${email} - ${user.name} (${user.role})`);
        
        // Delete associated QR codes first
        await prisma.qRCode.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete analytics
        await prisma.qRCodeAnalytics.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete configurations
        await prisma.qRConfig.deleteMany({
          where: { sellerId: user.id }
        });
        
        // If this user has a distributor profile, delete it
        if (user.distributorProfile) {
          await prisma.distributor.delete({
            where: { id: user.distributorProfile.id }
          });
          deletedCount.distributors++;
          console.log(`     ✅ Deleted distributor: ${user.distributorProfile.name}`);
        }
        
        // If this user has a location profile, delete it
        if (user.locationProfile) {
          await prisma.location.delete({
            where: { id: user.locationProfile.id }
          });
          console.log(`     ✅ Deleted location: ${user.locationProfile.name}`);
        }
        
        // Delete the user (this should cascade to related records)
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        deletedCount.users++;
        console.log(`   ✅ Deleted user: ${email}`);
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${email}:`, error.message);
        // Continue with next user
      }
    }
    
    console.log('\n🎉 DELETION COMPLETED!');
    console.log('\n📊 DELETION SUMMARY:');
    console.log(`   - Distributors deleted: ${deletedCount.distributors}`);
    console.log(`   - Users deleted: ${deletedCount.users}`);
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    
    const remainingDistributors = await prisma.distributor.findMany({
      include: {
        user: true,
        _count: { select: { locations: true } }
      }
    });
    
    console.log(`\nRemaining Distributors (${remainingDistributors.length}):`);
    remainingDistributors.forEach((dist, i) => {
      console.log(`   ${i+1}. ${dist.name} - ${dist.user.email} (${dist._count.locations} locations)`);
    });
    
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    
    console.log(`\nRemaining Users (${allUsers.length}):`);
    allUsers.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} - ${user.name} (${user.role})`);
    });
    
    const finalCounts = {
      distributors: await prisma.distributor.count(),
      locations: await prisma.location.count(),
      users: await prisma.user.count()
    };
    
    console.log(`\nFinal Database Counts:`);
    console.log(`   - Distributors: ${finalCounts.distributors}`);
    console.log(`   - Locations: ${finalCounts.locations}`);
    console.log(`   - Users: ${finalCounts.users}`);
    
    if (finalCounts.distributors === 1 && remainingDistributors[0]?.name === 'Prueba ditribuidor Jorge') {
      console.log('\n✅ SUCCESS: Only Jorge distributor remains!');
    } else {
      console.log('\n⚠️  Review needed - check remaining distributors');
    }
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTargetsSafe();

