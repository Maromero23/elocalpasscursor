const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPassesRebuy() {
  try {
    console.log('🧪 TESTING PASSES/PAYPAL REBUY EMAIL FOR QR: EL-1753668721361-7n65cbbat\n');
    
    // Get the QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753668721361-7n65cbbat'
      },
      include: {
        analytics: true
      }
    });

    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }

    console.log('✅ QR Code found:');
    console.log(`- Database ID: ${qrCode.id}`);
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
    console.log(`- Created: ${qrCode.createdAt}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    console.log(`- Is Active: ${qrCode.isActive}`);
    
    if (qrCode.analytics) {
      console.log(`- Rebuy scheduled: ${qrCode.analytics.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
    }
    
    const now = new Date();
    const hoursLeft = Math.floor((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);
    
    // Enable rebuy email scheduling if not already enabled
    if (!qrCode.analytics?.rebuyEmailScheduled) {
      console.log('\n🔄 ENABLING REBUY EMAIL SCHEDULING...');
      
      const result = await prisma.qRCodeAnalytics.updateMany({
        where: {
          qrCode: 'EL-1753668721361-7n65cbbat'
        },
        data: {
          rebuyEmailScheduled: true
        }
      });
      
      console.log(`✅ Updated ${result.count} analytics record(s)`);
    }
    
    console.log('\n📧 Testing BATCH rebuy email API (for passes/PayPal QR codes)...');
    
    // Use the batch rebuy email API instead of single
    const response = await fetch('https://elocalpasscursor.vercel.app/api/rebuy-emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // This API processes all eligible QR codes, not a specific one
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
      
      if (result.success || result.results) {
        console.log('\n🎉 BATCH REBUY EMAIL SYSTEM TRIGGERED!');
        console.log('📧 The system will process all eligible QR codes including passes/PayPal ones');
        console.log('🎯 Check the email inbox for rebuy emails from this batch process');
      } else {
        console.log('\n⚠️ No emails were sent in this batch');
        console.log('This might be because the QR code doesn\'t meet the timing criteria (6-12 hours before expiration)');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
    }
    
    console.log('\n💡 NOTE: Passes/PayPal QR codes use the batch rebuy system, not individual triggers');
    console.log('The system automatically processes QR codes that are 6-12 hours from expiration');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassesRebuy(); 