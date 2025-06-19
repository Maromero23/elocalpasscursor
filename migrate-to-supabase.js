#!/usr/bin/env node

/**
 * ELocalPass - Supabase Migration Script
 * 
 * This script helps migrate your ELocalPass database to Supabase PostgreSQL
 * 
 * Usage:
 * 1. Make sure your DATABASE_URL points to your Supabase database
 * 2. Run: node migrate-to-supabase.js
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 ELocalPass Supabase Migration Starting...\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not set');
  console.log('Please set your Supabase DATABASE_URL first:');
  console.log('export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');
console.log('🔄 Generating Prisma client...\n');

// Generate Prisma client
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating Prisma client:', error);
    return;
  }
  
  console.log('✅ Prisma client generated');
  console.log('🔄 Pushing database schema to Supabase...\n');
  
  // Push schema to database
  exec('npx prisma db push', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error pushing schema:', error);
      console.log('\n📋 Manual Steps if this fails:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Run the SQL commands from prisma/migrations manually');
      return;
    }
    
    console.log('✅ Database schema pushed successfully!');
    console.log('🔄 Creating admin user...\n');
    
    // Create admin user
    const createAdminScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@elocalpass.com' },
      update: {},
      create: {
        email: 'admin@elocalpass.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin user created:', admin.email);
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@elocalpass.com');
    console.log('   Password: admin123');
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n�� Next Steps:');
    console.log('1. Update your Vercel environment variables');
    console.log('2. Redeploy your Vercel application');
    console.log('3. Test the login with admin credentials');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
`;
    
    fs.writeFileSync('create-admin.js', createAdminScript);
    exec('node create-admin.js', (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.error('❌ Error creating admin:', error);
      }
      
      // Clean up
      fs.unlinkSync('create-admin.js');
    });
  });
}); 