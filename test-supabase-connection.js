const { PrismaClient } = require('@prisma/client');

// Test Supabase connection
const testSupabaseConnection = async () => {
  console.log('🧪 Testing Supabase PostgreSQL connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:basededatos23@db.jthbuhmygodmzjbhoplo.supabase.co:5432/postgres"
      }
    }
  });

  try {
    // Test basic connection
    console.log('📡 Attempting to connect to Supabase...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test if we can query users
    console.log('🔍 Checking users table...');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in Supabase database:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name || 'No name'}`);
    });
    
    // Test if we can query distributors
    console.log('🏢 Checking distributors table...');
    const distributors = await prisma.distributor.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${distributors.length} distributors in Supabase database:`);
    distributors.forEach(dist => {
      console.log(`  - ${dist.name} (${dist.email})`);
    });
    
    await prisma.$disconnect();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
    await prisma.$disconnect();
  }
};

testSupabaseConnection(); 