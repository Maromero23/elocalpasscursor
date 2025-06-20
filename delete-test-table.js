#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function deleteTestTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Connecting to Supabase...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    console.log('🗑️ Deleting test_table...');
    
    // Drop the test table
    await prisma.$executeRaw`DROP TABLE IF EXISTS test_table;`;
    
    console.log('✅ test_table deleted successfully!');
    
    // Verify it's gone by trying to query it
    try {
      await prisma.$executeRaw`SELECT * FROM test_table LIMIT 1;`;
      console.log('❌ Table still exists');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('✅ Confirmed: test_table no longer exists');
      } else {
        console.log('❓ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

deleteTestTable(); 