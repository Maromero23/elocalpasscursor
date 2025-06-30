const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugScheduledQRs() {
  try {
    console.log('🔍 DEBUGGING SCHEDULED QR CODES\n');
    
    const now = new Date();
    console.log(`Current time: ${now.toISOString()} (${now.toLocaleString()})`);
    console.log(`Current timestamp: ${now.getTime()}\n`);
    
    // 1. Check all scheduled QR codes (processed and unprocessed)
    console.log('📋 ALL SCHEDULED QR CODES:');
    const allScheduled = await prisma.scheduledQRCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${allScheduled.length} total scheduled QR codes:`);
    allScheduled.forEach((qr, index) => {
      const scheduledTime = new Date(qr.scheduledFor);
      const timeDiff = (now.getTime() - scheduledTime.getTime()) / (1000 * 60); // minutes
      const status = qr.isProcessed ? '✅ PROCESSED' : '⏳ PENDING';
      
      console.log(`${index + 1}. ${status}`);
      console.log(`   ID: ${qr.id}`);
      console.log(`   Email: ${qr.clientEmail}`);
      console.log(`   Scheduled for: ${scheduledTime.toISOString()} (${scheduledTime.toLocaleString()})`);
      console.log(`   Time diff: ${timeDiff.toFixed(1)} minutes ${timeDiff > 0 ? 'ago' : 'in the future'}`);
      console.log(`   Processed: ${qr.isProcessed}`);
      console.log(`   Created: ${qr.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // 2. Check what the processor query would find
    console.log('\n🔍 PROCESSOR QUERY SIMULATION:');
    const processorQuery = await prisma.scheduledQRCode.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        isProcessed: false
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });
    
    console.log(`Processor would find: ${processorQuery.length} QR codes ready for processing`);
    processorQuery.forEach((qr, index) => {
      const scheduledTime = new Date(qr.scheduledFor);
      const timeDiff = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
      console.log(`${index + 1}. ${qr.clientEmail} - scheduled ${timeDiff.toFixed(1)} minutes ago`);
    });
    
    // 3. Check recent QR codes (last 15 minutes)
    console.log('\n📅 RECENT SCHEDULED QR CODES (last 15 minutes):');
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentScheduled = await prisma.scheduledQRCode.findMany({
      where: {
        createdAt: {
          gte: fifteenMinutesAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${recentScheduled.length} QR codes created in the last 15 minutes:`);
    recentScheduled.forEach((qr, index) => {
      const scheduledTime = new Date(qr.scheduledFor);
      const createdMinutesAgo = (now.getTime() - qr.createdAt.getTime()) / (1000 * 60);
      const scheduledMinutesFromNow = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
      
      console.log(`${index + 1}. ${qr.clientEmail}`);
      console.log(`   Created: ${createdMinutesAgo.toFixed(1)} minutes ago`);
      console.log(`   Scheduled for: ${scheduledTime.toLocaleString()}`);
      console.log(`   Time until scheduled: ${scheduledMinutesFromNow.toFixed(1)} minutes`);
      console.log(`   Processed: ${qr.isProcessed}`);
      console.log('');
    });
    
    // 4. Check if there are any QR codes that should have been processed
    console.log('\n⚠️ QR CODES THAT SHOULD BE PROCESSED:');
    const shouldBeProcessed = await prisma.scheduledQRCode.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        isProcessed: false
      }
    });
    
    if (shouldBeProcessed.length > 0) {
      console.log(`🚨 FOUND ${shouldBeProcessed.length} QR codes that should be processed but haven't been!`);
      shouldBeProcessed.forEach((qr, index) => {
        const scheduledTime = new Date(qr.scheduledFor);
        const overdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
        console.log(`${index + 1}. ${qr.clientEmail} - OVERDUE by ${overdue.toFixed(1)} minutes`);
      });
    } else {
      console.log('✅ No QR codes are overdue for processing');
    }
    
  } catch (error) {
    console.error('❌ Error debugging scheduled QRs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugScheduledQRs(); 