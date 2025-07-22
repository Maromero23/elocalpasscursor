const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEnvironmentVariables() {
  try {
    console.log('🔍 CHECKING ENVIRONMENT VARIABLES\n');
    
    // Check all relevant environment variables
    const envVars = {
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL || 'NOT SET',
      'NODE_ENV': process.env.NODE_ENV || 'NOT SET',
      'VERCEL': process.env.VERCEL || 'NOT SET',
      'QSTASH_CURRENT_SIGNING_KEY': process.env.QSTASH_CURRENT_SIGNING_KEY ? 'SET' : 'NOT SET',
      'EMAIL_SERVICE': process.env.EMAIL_SERVICE || 'NOT SET',
      'EMAIL_USER': process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      'EMAIL_PASS': process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
    };
    
    console.log('📋 Environment Variables:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Test if we can access the production database (confirms we're using production env)
    console.log('\n🔍 Testing database connection...');
    const recentOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (recentOrder) {
      console.log('✅ Database connection successful');
      console.log(`📋 Most recent order: ${recentOrder.id} (${recentOrder.createdAt.toISOString()})`);
    } else {
      console.log('⚠️ No orders found in database');
    }
    
    // Check if there are any unprocessed scheduled QRs
    console.log('\n🔍 Checking for unprocessed scheduled QRs...');
    const unprocessedQRs = await prisma.scheduledQRCode.findMany({
      where: { isProcessed: false },
      orderBy: { scheduledFor: 'asc' },
      take: 5
    });
    
    console.log(`📋 Found ${unprocessedQRs.length} unprocessed scheduled QRs:`);
    unprocessedQRs.forEach((qr, index) => {
      const now = new Date();
      const isOverdue = qr.scheduledFor < now;
      const timeDiff = Math.round((qr.scheduledFor.getTime() - now.getTime()) / 1000 / 60);
      
      console.log(`${index + 1}. ID: ${qr.id}`);
      console.log(`   Email: ${qr.clientEmail}`);
      console.log(`   Scheduled: ${qr.scheduledFor.toISOString()}`);
      console.log(`   Status: ${isOverdue ? 'OVERDUE' : 'PENDING'} (${Math.abs(timeDiff)} min ${timeDiff < 0 ? 'overdue' : 'remaining'})`);
      console.log(`   Configuration: ${qr.configurationId}`);
      console.log('');
    });
    
    console.log('\n🎯 CONCLUSION:');
    if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
      console.log('✅ QSTASH_CURRENT_SIGNING_KEY is available - scheduling should work');
      if (unprocessedQRs.length > 0) {
        const overdueCount = unprocessedQRs.filter(qr => qr.scheduledFor < new Date()).length;
        if (overdueCount > 0) {
          console.log(`❌ BUT: ${overdueCount} QRs are overdue and unprocessed - QStash jobs may have failed`);
        } else {
          console.log('✅ All unprocessed QRs are scheduled for future times - system working correctly');
        }
      } else {
        console.log('✅ No unprocessed QRs - system appears to be working correctly');
      }
    } else {
      console.log('❌ QSTASH_CURRENT_SIGNING_KEY is missing - this explains why scheduling fails');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnvironmentVariables(); 