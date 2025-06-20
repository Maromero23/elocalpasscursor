#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

console.log('🚀 ELocalPass - Simple Supabase Setup');
console.log('=====================================\n');

async function main() {
  try {
    console.log('This script will help you set up Supabase in 3 simple steps:\n');
    console.log('1. Create a Supabase project (in your browser)');
    console.log('2. Get your connection details');
    console.log('3. Update your environment variables\n');

    // Step 1: Guide to create project
    console.log('📋 STEP 1: Create Supabase Project');
    console.log('==================================');
    console.log('1. Go to: https://supabase.com');
    console.log('2. Sign up/login with your email');
    console.log('3. Click "New Project"');
    console.log('4. Choose any organization');
    console.log('5. Project name: "elocalpass-production"');
    console.log('6. Database password: Create a strong password (save it!)');
    console.log('7. Region: Choose closest to you');
    console.log('8. Click "Create new project"\n');

    await ask('Press Enter when you have created your Supabase project...');

    // Step 2: Get connection details
    console.log('\n📋 STEP 2: Get Connection Details');
    console.log('=================================');
    console.log('In your Supabase dashboard:');
    console.log('1. Go to Settings → Database');
    console.log('2. Scroll down to "Connection string"');
    console.log('3. Copy the "URI" connection string');
    console.log('4. It looks like: postgresql://postgres:[YOUR-PASSWORD]@...\n');

    const connectionString = await ask('Paste your connection string here: ');

    if (!connectionString.startsWith('postgresql://')) {
      console.log('❌ That doesn\'t look like a valid connection string.');
      console.log('It should start with: postgresql://postgres:...');
      process.exit(1);
    }

    // Step 3: Update environment
    console.log('\n📋 STEP 3: Update Environment');
    console.log('=============================');

    // Backup existing .env.local
    if (fs.existsSync('.env.local')) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync('.env.local', `.env.local.backup-${timestamp}`);
      console.log('✅ Backed up existing .env.local');
    }

    // Read existing .env.local or create new
    let envContent = '';
    if (fs.existsSync('.env.local')) {
      envContent = fs.readFileSync('.env.local', 'utf8');
    }

    // Update or add DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${connectionString}"`);
    } else {
      envContent += `\nDATABASE_URL="${connectionString}"\n`;
    }

    // Write updated .env.local
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Updated .env.local with Supabase connection');

    // Step 4: Push schema
    console.log('\n📋 STEP 4: Push Database Schema');
    console.log('===============================');
    console.log('Now we\'ll push your database schema to Supabase...\n');

    try {
      console.log('Running: npx prisma db push');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('\n✅ Database schema pushed successfully!');
    } catch (error) {
      console.log('\n❌ Error pushing schema. Let\'s try to fix it...');
      
      // Generate Prisma client
      console.log('Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      
      // Try again
      console.log('Trying schema push again...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('\n✅ Database schema pushed successfully!');
    }

    // Step 5: Test connection
    console.log('\n📋 STEP 5: Test Connection');
    console.log('==========================');
    
    const testConnection = await ask('Would you like to test the connection? (y/n): ');
    if (testConnection.toLowerCase() === 'y') {
      try {
        console.log('Testing database connection...');
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        console.log('✅ Database connection successful!');
        await prisma.$disconnect();
      } catch (error) {
        console.log('❌ Connection test failed:', error.message);
        console.log('But don\'t worry, this might just be a client issue.');
      }
    }

    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================');
    console.log('Your Supabase database is now configured.');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Test your application');
    console.log('3. When ready, deploy to Vercel with the same DATABASE_URL\n');

    console.log('💡 Pro tip: Your Supabase dashboard shows real-time database activity!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main(); 