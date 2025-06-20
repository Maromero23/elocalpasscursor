#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test if tables exist by counting users
    const userCount = await prisma.user.count();
    console.log(`✅ Database schema exists! Found ${userCount} users.`);
    
    // Test if we can query other tables
    const distributorCount = await prisma.distributor.count();
    console.log(`✅ Found ${distributorCount} distributors.`);
    
    const locationCount = await prisma.location.count();
    console.log(`✅ Found ${locationCount} locations.`);
    
    const qrCodeCount = await prisma.qRCode.count();
    console.log(`✅ Found ${qrCodeCount} QR codes.`);
    
    console.log('\n🎉 SUCCESS: Supabase is fully connected and working!');
    console.log('📊 Your database is ready for production testing.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 