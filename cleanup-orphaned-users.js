const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedUsers() {
  try {
    console.log('🧹 CLEANING UP ORPHANED USERS\n');
    
    // Get Jorge's distributor and his location/seller info
    const jorgeDistributor = await prisma.distributor.findFirst({
      where: {
        name: {
          contains: 'Prueba ditribuidor Jorge',
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
    
    if (!jorgeDistributor) {
      console.error('❌ ERROR: Jorge distributor not found!');
      return;
    }
    
    console.log('✅ JORGE\'S LEGITIMATE USERS:');
    const legitimateUserIds = new Set();
    
    // Jorge's distributor user
    legitimateUserIds.add(jorgeDistributor.user.id);
    console.log(`   - Distributor: ${jorgeDistributor.user.email}`);
    
    // Jorge's location users and sellers
    jorgeDistributor.locations.forEach(location => {
      if (location.user) {
        legitimateUserIds.add(location.user.id);
        console.log(`   - Location User: ${location.user.email}`);
      }
      
      location.sellers.forEach(seller => {
        legitimateUserIds.add(seller.id);
        console.log(`   - Seller: ${seller.email}`);
      });
    });
    
    // Always keep admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    adminUsers.forEach(admin => {
      legitimateUserIds.add(admin.id);
      console.log(`   - Admin: ${admin.email}`);
    });
    
    console.log(`\n🎯 TOTAL LEGITIMATE USERS: ${legitimateUserIds.size}`);
    
    // Find all users that should be deleted (not in legitimate set)
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(legitimateUserIds)
        }
      }
    });
    
    console.log(`\n🗑️  USERS TO DELETE: ${usersToDelete.length}`);
    usersToDelete.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} - ${user.name} - Role: ${user.role}`);
    });
    
    if (usersToDelete.length === 0) {
      console.log('\n✅ No orphaned users to delete!');
      return;
    }
    
    console.log('\n⏳ Starting cleanup...');
    
    let deletedCount = 0;
    
    // Delete users one by one
    for (const user of usersToDelete) {
      try {
        // First delete any QR codes they might have
        await prisma.qRCode.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete any analytics
        await prisma.qRCodeAnalytics.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete any configurations
        await prisma.qRConfig.deleteMany({
          where: { sellerId: user.id }
        });
        
        // Delete the user
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        console.log(`   ✅ Deleted: ${user.email} (${user.role})`);
        deletedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${user.email}:`, error.message);
      }
    }
    
    console.log(`\n🎉 CLEANUP COMPLETED!`);
    console.log(`📊 Successfully deleted ${deletedCount} orphaned users`);
    
    // Final verification
    const finalUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, isActive: true }
    });
    
    console.log(`\n🔍 FINAL USER LIST (${finalUsers.length} total):`);
    const finalByRole = {};
    finalUsers.forEach(user => {
      if (!finalByRole[user.role]) finalByRole[user.role] = [];
      finalByRole[user.role].push(user);
    });
    
    Object.keys(finalByRole).forEach(role => {
      console.log(`\n${role} (${finalByRole[role].length}):`);
      finalByRole[role].forEach((user, i) => {
        console.log(`   ${i+1}. ${user.email} - ${user.name || 'No name'}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedUsers();

