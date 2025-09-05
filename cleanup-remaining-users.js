const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupRemainingUsers() {
  try {
    console.log('🧹 CLEANING UP REMAINING TARGET USERS\n');
    
    const targetEmails = ['luisyah1@gmail.com', 'josewalker@gmail.com'];
    
    for (const email of targetEmails) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email }
        });
        
        if (!user) {
          console.log(`   ⚠️  User not found: ${email}`);
          continue;
        }
        
        console.log(`   Deleting: ${email} - ${user.name} (${user.role})`);
        
        // Delete associated data first
        await prisma.qRCode.deleteMany({
          where: { sellerId: user.id }
        });
        
        await prisma.qRCodeAnalytics.deleteMany({
          where: { sellerId: user.id }
        });
        
        await prisma.qRConfig.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete the user
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        console.log(`   ✅ Successfully deleted: ${email}`);
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${email}:`, error.message);
      }
    }
    
    // Final verification
    const finalUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    
    console.log(`\n🔍 FINAL USER LIST (${finalUsers.length} total):`);
    finalUsers.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} - ${user.name} (${user.role})`);
    });
    
    const finalCounts = {
      distributors: await prisma.distributor.count(),
      locations: await prisma.location.count(),
      users: await prisma.user.count()
    };
    
    console.log(`\n📊 FINAL COUNTS:`);
    console.log(`   - Distributors: ${finalCounts.distributors}`);
    console.log(`   - Locations: ${finalCounts.locations}`);
    console.log(`   - Users: ${finalCounts.users}`);
    
    if (finalCounts.distributors === 1 && finalCounts.users === 4) {
      console.log('\n✅ SUCCESS: Cleanup completed! Only Jorge and admin users remain.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRemainingUsers();

