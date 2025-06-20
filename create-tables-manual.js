#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function createTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Connecting to Supabase...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    console.log('📋 Creating tables manually...');
    
    // Create a simple test table first
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('✅ Test table created!');
    
    // Insert test data
    await prisma.$executeRaw`
      INSERT INTO test_table (name) VALUES ('Test Entry') 
      ON CONFLICT DO NOTHING;
    `;
    
    console.log('✅ Test data inserted!');
    
    // Check if it worked
    const result = await prisma.$queryRaw`SELECT COUNT(*) FROM test_table;`;
    console.log('📊 Test table has', result[0].count, 'rows');
    
    console.log('\n🎉 Manual table creation successful!');
    console.log('Now let\'s try Prisma push again...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTables(); 