const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTorneoAndIndependiente() {
  try {
    console.log('🚨 DELETING TORNEO DE VOLLEY AND INDEPENDIENTE VENDEDOR\n');
    
    // First, create backup of targets
    const targetsBackup = {
      timestamp: new Date().toISOString(),
      torneoDistributors: await prisma.distributor.findMany({
        where: {
          name: {
            contains: 'Torneo de Volley',
            mode: 'insensitive'
          }
        },
        include: {
          user: true,
          locations: {
            include: {
              user: true,
              sellers: true
            }
          }
        }
      }),
      independienteUser: await prisma.user.findFirst({
        where: {
          email: 'josewalker@gmail.com'
        }
      })
    };
    
    console.log('📦 Created backup of targets to delete');
    
    let deletedCount = {
      distributors: 0,
      locations: 0,
      sellers: 0,
      users: 0
    };
    
    // Delete Torneo de Volley distributors
    console.log('\n🗑️  DELETING TORNEO DE VOLLEY DISTRIBUTORS:');
    
    const torneoDistributors = await prisma.distributor.findMany({
      where: {
        name: {
          contains: 'Torneo de Volley',
          mode: 'insensitive'
        }
      },
      include: {
        user: true,
        locations: {
          include: {
            user: true,
            sellers: true
          }
        }
      }
    });
    
    for (const distributor of torneoDistributors) {
      console.log(`   Processing: ${distributor.name} (${distributor.user.email})`);
      
      // Delete locations and their sellers first
      for (const location of distributor.locations) {
        console.log(`     Deleting location: ${location.name}`);
        
        // Delete sellers in this location
        for (const seller of location.sellers) {
          console.log(`       Deleting seller: ${seller.email}`);
          
          // Delete QR codes for seller
          await prisma.qRCode.deleteMany({
            where: { sellerId: seller.id }
          });
          
          // Delete analytics for seller
          await prisma.qRCodeAnalytics.deleteMany({
            where: { sellerId: seller.id }
          });
          
          // Delete seller
          await prisma.user.delete({
            where: { id: seller.id }
          });
          
          deletedCount.sellers++;
          deletedCount.users++;
        }
        
        // Delete location user
        if (location.user) {
          await prisma.user.delete({
            where: { id: location.user.id }
          });
          deletedCount.users++;
        }
        
        // Delete location
        await prisma.location.delete({
          where: { id: location.id }
        });
        deletedCount.locations++;
      }
      
      // Delete distributor user
      await prisma.user.delete({
        where: { id: distributor.user.id }
      });
      deletedCount.users++;
      
      // Delete distributor
      await prisma.distributor.delete({
        where: { id: distributor.id }
      });
      deletedCount.distributors++;
      
      console.log(`   ✅ Deleted distributor: ${distributor.name}`);
    }
    
    // Delete Independiente vendedor
    console.log('\n🗑️  DELETING INDEPENDIENTE VENDEDOR:');
    
    const independienteUser = await prisma.user.findFirst({
      where: {
        email: 'josewalker@gmail.com'
      }
    });
    
    if (independienteUser) {
      console.log(`   Processing: ${independienteUser.email} (${independienteUser.name})`);
      
      // Delete QR codes for this user
      await prisma.qRCode.deleteMany({
        where: { sellerId: independienteUser.id }
      });
      
      // Delete analytics for this user
      await prisma.qRCodeAnalytics.deleteMany({
        where: { sellerId: independienteUser.id }
      });
      
      // Delete configurations
      await prisma.qRConfig.deleteMany({
        where: { sellerId: independienteUser.id }
      });
      
      // Delete the user
      await prisma.user.delete({
        where: { id: independienteUser.id }
      });
      
      deletedCount.users++;
      console.log(`   ✅ Deleted independent seller: ${independienteUser.email}`);
    } else {
      console.log('   ⚠️  Independiente vendedor not found');
    }
    
    console.log('\n🎉 DELETION COMPLETED!');
    console.log('\n📊 DELETION SUMMARY:');
    console.log(`   - Distributors deleted: ${deletedCount.distributors}`);
    console.log(`   - Locations deleted: ${deletedCount.locations}`);
    console.log(`   - Sellers deleted: ${deletedCount.sellers}`);
    console.log(`   - Total users deleted: ${deletedCount.users}`);
    
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
    
    const remainingUsers = await prisma.user.count();
    const remainingLocations = await prisma.location.count();
    
    console.log(`\nFinal counts:`);
    console.log(`   - Users: ${remainingUsers}`);
    console.log(`   - Distributors: ${remainingDistributors.length}`);
    console.log(`   - Locations: ${remainingLocations}`);
    
    if (remainingDistributors.length === 1 && remainingDistributors[0].name === 'Prueba ditribuidor Jorge') {
      console.log('\n✅ SUCCESS: Only Jorge distributor remains!');
    } else {
      console.log('\n⚠️  Review needed - unexpected remaining distributors');
    }
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTorneoAndIndependiente();

