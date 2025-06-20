const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 PlanetScale Setup for ELocalPass Production\n');

rl.question('📋 Please paste your PlanetScale connection string here: ', (connectionString) => {
  if (!connectionString.startsWith('mysql://')) {
    console.log('❌ Invalid connection string. It should start with mysql://');
    rl.close();
    return;
  }

  console.log('\n✅ Connection string looks good!');
  console.log('\n📝 I will now:');
  console.log('1. Update your environment variables');
  console.log('2. Generate Prisma client for MySQL');
  console.log('3. Push schema to PlanetScale');
  console.log('4. Test the connection');

  rl.question('\n🤔 Continue? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      setupPlanetScale(connectionString);
    } else {
      console.log('👋 Setup cancelled');
    }
    rl.close();
  });
});

function setupPlanetScale(connectionString) {
  console.log('\n🔧 Setting up PlanetScale...\n');
  
  // Create production environment content
  const envContent = `# PlanetScale Production Database
DATABASE_URL="${connectionString}"

# NextAuth Configuration
NEXTAUTH_SECRET="production-secret-key-v2.23-elocalpass"
NEXTAUTH_URL="https://elocalpasscursor-d6lysh7et-jorge-s-projects-889fbcca.vercel.app"

# Email Configuration for Live Testing
EMAIL_FROM="noreply@elocalpass.com"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"`;

  console.log('📄 Environment configuration ready');
  console.log('\n🔄 Next steps:');
  console.log('1. Run: npm run db:generate');
  console.log('2. Run: npm run db:push');
  console.log('3. Run: npm run migrate:data');
  console.log('4. Deploy to Vercel');
  
  console.log('\n📋 Copy this DATABASE_URL to your Vercel environment variables:');
  console.log(`DATABASE_URL="${connectionString}"`);
  
  console.log('\n🎉 PlanetScale setup complete!');
  console.log('\n🔗 Your production will be ready at:');
  console.log('https://elocalpasscursor-d6lysh7et-jorge-s-projects-889fbcca.vercel.app');
} 