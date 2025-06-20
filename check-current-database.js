const { PrismaClient } = require('@prisma/client');

// Check current local database
const checkCurrentDatabase = async () => {
  console.log('🧪 Checking current local SQLite database...');
  
  const prisma = new PrismaClient();

  try {
    console.log('📡 Connecting to current database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Look for the new entries you mentioned
    console.log('\n🔍 Looking for new distributor: jonyunitas@gmail.com');
    const newDistributor = await prisma.distributor.findFirst({
      where: {
        email: {
          contains: 'jonyunitas'
        }
      },
      include: {
        user: true
      }
    });
    
    if (newDistributor) {
      console.log('✅ Found new distributor:', newDistributor);
    } else {
      console.log('❌ New distributor not found');
    }
    
    console.log('\n🔍 Looking for new location: marlon@gmail.com');
    const newLocation = await prisma.location.findFirst({
      where: {
        email: {
          contains: 'marlon'
        }
      },
      include: {
        user: true
      }
    });
    
    if (newLocation) {
      console.log('✅ Found new location:', newLocation);
    } else {
      console.log('❌ New location not found');
    }
    
    console.log('\n🔍 Looking for new seller: Taylor56@gmail.com');
    const newSeller = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'Taylor56'
        }
      }
    });
    
    if (newSeller) {
      console.log('✅ Found new seller:', newSeller);
    } else {
      console.log('❌ New seller not found');
    }
    
    // Show all recent entries
    console.log('\n📊 Recent distributors:');
    const recentDistributors = await prisma.distributor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        email: true,
        createdAt: true
      }
    });
    recentDistributors.forEach(d => console.log(`  - ${d.name} (${d.email}) - ${d.createdAt}`));
    
    console.log('\n📊 Recent users:');
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    recentUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) - ${u.name} - ${u.createdAt}`));
    
    await prisma.$disconnect();
    console.log('\n✅ Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
};

checkCurrentDatabase(); 