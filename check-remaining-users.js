const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRemainingUsers() {
  try {
    console.log('🔍 CHECKING ALL REMAINING USERS/SELLERS\n');
    
    // Get the Prueba distributor Jorge
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
    
    console.log('✅ JORGE DISTRIBUTOR:');
    if (jorgeDistributor) {
      console.log(`   - Name: ${jorgeDistributor.name}`);
      console.log(`   - User: ${jorgeDistributor.user.email}`);
      console.log(`   - Locations: ${jorgeDistributor.locations.length}`);
      jorgeDistributor.locations.forEach((loc, i) => {
        console.log(`     Location ${i+1}: ${loc.name} (${loc.sellers.length} sellers)`);
      });
    } else {
      console.log('   ❌ Jorge distributor not found!');
    }
    
    console.log('\n📊 ALL USERS IN DATABASE:');
    const allUsers = await prisma.user.findMany({
      orderBy: { role: 'asc' }
    });
    
    const usersByRole = {};
    allUsers.forEach(user => {
      if (!usersByRole[user.role]) usersByRole[user.role] = [];
      usersByRole[user.role].push(user);
    });
    
    Object.keys(usersByRole).forEach(role => {
      console.log(`\n${role} USERS (${usersByRole[role].length}):`);
      usersByRole[role].forEach((user, i) => {
        console.log(`   ${i+1}. ${user.email} - ${user.name || 'No name'} - Active: ${user.isActive}`);
        if (user.locationId) {
          console.log(`      -> LocationId: ${user.locationId}`);
        }
      });
    });
    
    // Get all existing location IDs
    const existingLocations = await prisma.location.findMany({ select: { id: true } });
    const existingLocationIds = existingLocations.map(l => l.id);
    
    // Check for orphaned sellers (sellers without valid locationId)
    const orphanedSellers = await prisma.user.findMany({
      where: {
        role: { in: ['SELLER', 'INDEPENDENT_SELLER'] },
        OR: [
          { locationId: null },
          { 
            locationId: { 
              notIn: existingLocationIds
            }
          }
        ]
      }
    });
    
    console.log(`\n🚨 ORPHANED SELLERS (no valid location): ${orphanedSellers.length}`);
    orphanedSellers.forEach((seller, i) => {
      console.log(`   ${i+1}. ${seller.email} - ${seller.name} - LocationId: ${seller.locationId}`);
    });
    
    // Check total counts
    const counts = {
      admin: await prisma.user.count({ where: { role: 'ADMIN' } }),
      distributors: await prisma.user.count({ where: { role: 'DISTRIBUTOR' } }),
      locations: await prisma.user.count({ where: { role: 'LOCATION' } }),
      sellers: await prisma.user.count({ where: { role: 'SELLER' } }),
      independentSellers: await prisma.user.count({ where: { role: 'INDEPENDENT_SELLER' } }),
      totalUsers: await prisma.user.count()
    };
    
    console.log('\n📊 USER COUNTS BY ROLE:');
    console.log(`   - ADMIN: ${counts.admin}`);
    console.log(`   - DISTRIBUTOR: ${counts.distributors}`);
    console.log(`   - LOCATION: ${counts.locations}`);
    console.log(`   - SELLER: ${counts.sellers}`);
    console.log(`   - INDEPENDENT_SELLER: ${counts.independentSellers}`);
    console.log(`   - TOTAL: ${counts.totalUsers}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRemainingUsers();

