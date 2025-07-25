const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQRRebuy() {
  try {
    console.log('🧪 TESTING REBUY EMAIL FOR QR: EL-1753472701299-u6guamav2\n');
    
    // Get the QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753472701299-u6guamav2'
      },
      include: {
        analytics: true,
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    });

    if (!qrCode) {
      console.log('❌ QR Code not found with code: EL-1753472701299-u6guamav2');
      return;
    }

    console.log('✅ QR Code found:');
    console.log(`- Database ID: ${qrCode.id}`);
    console.log(`- Code: ${qrCode.code}`);
    console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
    console.log(`- Seller: ${qrCode.seller?.name || 'Unknown'}`);
    console.log(`- Created: ${qrCode.createdAt}`);
    console.log(`- Expires: ${qrCode.expiresAt}`);
    console.log(`- Rebuy scheduled: ${qrCode.analytics?.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
    
    if (qrCode.seller?.savedConfig) {
      try {
        const configData = JSON.parse(qrCode.seller.savedConfig.config);
        console.log(`- Seller rebuy enabled: ${configData.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
      } catch (e) {
        console.log('- Seller config: ❌ Parse error');
      }
    }
    
    const now = new Date();
    const hoursLeft = Math.floor((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);
    
    if (!qrCode.analytics?.rebuyEmailScheduled) {
      console.log('\n❌ This QR code does not have rebuy emails enabled');
      console.log('💡 Make sure the seller configuration has "Send Rebuy Email" enabled (Button 5)');
      return;
    }
    
    console.log('\n🎯 Ready for rebuy email test!');
    console.log(`Database ID: ${qrCode.id}`);
    
    // Now test the single rebuy email API
    console.log('\n📧 Testing rebuy email API...');
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/rebuy-emails/send-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrCodeId: qrCode.id
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 SUCCESS! Rebuy email sent successfully!');
        console.log(`📧 Email sent to: ${result.email}`);
        console.log(`📄 Template used: ${result.templateType || 'Custom seller template'}`);
        console.log('\n💡 Check the customer email inbox to see the enhanced rebuy email design!');
        console.log('🎨 The email should now match the preview you see in the admin interface.');
      } else {
        console.log('\n❌ Failed to send rebuy email');
        console.log(`Error: ${result.error || 'Unknown error'}`);
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQRRebuy(); 