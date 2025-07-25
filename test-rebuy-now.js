/**
 * 🧪 IMMEDIATE REBUY EMAIL TEST
 * 
 * This script will temporarily modify the rebuy API to test with recent QR codes
 * instead of waiting for the 6-12 hour expiration window.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRebuyNow() {
  try {
    console.log('🧪 IMMEDIATE REBUY EMAIL TEST\n');
    
    // First, let's check what QR codes we have available for testing
    console.log('1️⃣ CHECKING AVAILABLE QR CODES FOR TESTING:');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
    
    const recentQRs = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: oneHourAgo // Last hour
        },
        customerEmail: {
          not: null
        },
        analytics: {
          rebuyEmailScheduled: true // Only those with rebuy enabled
        }
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`📊 Found ${recentQRs.length} recent QR codes with rebuy enabled:`);
    
    if (recentQRs.length === 0) {
      console.log('❌ No recent QR codes found with rebuy enabled');
      console.log('💡 Next steps:');
      console.log('1. Go to seller dashboard as Lawrence Taylor (Taylor56@gmail.com)');
      console.log('2. Create a new QR code with any customer details');
      console.log('3. Run this script again');
      return;
    }
    
    // Show available QR codes
    recentQRs.forEach((qr, index) => {
      const minutesOld = Math.floor((now.getTime() - qr.createdAt.getTime()) / (1000 * 60));
      console.log(`\n${index + 1}. QR Code: ${qr.code}`);
      console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`   Seller: ${qr.seller?.name || 'Unknown'}`);
      console.log(`   Age: ${minutesOld} minutes old`);
      console.log(`   Rebuy scheduled: ${qr.analytics?.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
      
      // Check seller config
      if (qr.seller?.savedConfig) {
        try {
          const configData = JSON.parse(qr.seller.savedConfig.config);
          console.log(`   Seller rebuy enabled: ${configData.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        } catch (e) {
          console.log(`   Seller config: ❌ Parse error`);
        }
      }
    });
    
    console.log('\n2️⃣ TESTING REBUY EMAIL API:');
    console.log('Calling the rebuy email API to see current behavior...\n');
    
    // Test the current API
    const response = await fetch('https://elocalpasscursor.vercel.app/api/rebuy-emails/send', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
      
      if (result.results && result.results.length > 0) {
        console.log('\n📧 REBUY EMAILS SENT:');
        result.results.forEach(email => {
          console.log(`- QR ${email.qrCode}: ${email.status}`);
          if (email.status === 'sent') {
            console.log(`  ✅ Sent to ${email.email}`);
          } else {
            console.log(`  ❌ Failed: ${email.error || 'Unknown error'}`);
          }
        });
      } else {
        console.log('\n📭 No rebuy emails sent - QR codes not in expiration window (6-12 hours)');
        console.log('\n💡 TESTING OPTIONS:');
        console.log('A) Wait for a QR code to reach the 6-12 hour expiration window');
        console.log('B) Temporarily modify the API to test with recent QR codes');
        console.log('C) Use the single QR rebuy API for immediate testing');
        
        if (recentQRs.length > 0) {
          console.log('\n🎯 RECOMMENDED: Test with single QR API');
          console.log(`Try this QR code: ${recentQRs[0].code}`);
          console.log(`Customer: ${recentQRs[0].customerEmail}`);
          console.log('\nCall: POST /api/rebuy-emails/send-single');
          console.log(`Body: {"qrCodeId": "${recentQRs[0].id}"}`);
        }
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRebuyNow(); 