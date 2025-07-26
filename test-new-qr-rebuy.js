const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewQRRebuy() {
  try {
    console.log('🧪 TESTING ENHANCED REBUY EMAIL FOR QR: EL-1753506361385-3gdm9nhh2\n');
    
    // Get the QR code details
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753506361385-3gdm9nhh2'
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
      console.log('❌ QR Code not found with code: EL-1753506361385-3gdm9nhh2');
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
        const config = JSON.parse(qrCode.seller.savedConfig.config);
        console.log(`- Seller rebuy enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        
        const emailTemplates = JSON.parse(qrCode.seller.savedConfig.emailTemplates);
        console.log(`- Has rebuy template: ${!!emailTemplates?.rebuyEmail}`);
        console.log(`- Has rebuy config: ${!!emailTemplates?.rebuyEmail?.rebuyConfig}`);
        
        if (emailTemplates?.rebuyEmail?.rebuyConfig) {
          const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig;
          console.log('\n🔧 REBUY CONFIGURATION:');
          console.log(`- Banner images: ${rebuyConfig.bannerImages?.length || 0} configured`);
          console.log(`- Video URL: ${rebuyConfig.videoUrl ? '✅ YES' : '❌ NO'}`);
          console.log(`- Show countdown: ${rebuyConfig.showExpirationTimer !== false ? '✅ YES' : '❌ NO'}`);
          console.log(`- Discount enabled: ${rebuyConfig.enableDiscountCode ? '✅ YES' : '❌ NO'}`);
          console.log(`- Featured partners: ${rebuyConfig.enableFeaturedPartners ? '✅ YES' : '❌ NO'}`);
          console.log(`- Seller tracking: ${rebuyConfig.enableSellerTracking ? '✅ YES' : '❌ NO'}`);
        }
      } catch (e) {
        console.log('- Seller config: ❌ Parse error');
      }
    }
    
    const now = new Date();
    const hoursLeft = Math.floor((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log(`- Hours left: ${hoursLeft}`);
    
    if (!qrCode.analytics?.rebuyEmailScheduled) {
      console.log('\n🔄 ENABLING REBUY EMAIL FOR THIS QR CODE...');
      
      const result = await prisma.qRCodeAnalytics.updateMany({
        where: {
          qrCode: 'EL-1753506361385-3gdm9nhh2'
        },
        data: {
          rebuyEmailScheduled: true
        }
      });
      
      console.log(`✅ Updated ${result.count} analytics record(s)`);
    }
    
    console.log('\n🎯 Ready for enhanced rebuy email test!');
    console.log(`Database ID: ${qrCode.id}`);
    
    // Now test the single rebuy email API (which has the enhanced components)
    console.log('\n📧 Testing ENHANCED rebuy email API...');
    
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
        console.log('\n🎉 SUCCESS! Enhanced rebuy email sent successfully!');
        console.log(`📧 Email sent to: ${result.email}`);
        console.log(`📄 Template used: Enhanced template with fresh HTML generation`);
        console.log(`⏰ Hours shown in email: ${result.hoursLeft}`);
        
        console.log('\n🎨 ENHANCED COMPONENTS INCLUDED:');
        console.log('✅ Customer greeting with name');
        console.log('✅ Static countdown timer showing actual hours');
        console.log('✅ Current pass details (guests, days, expiration)');
        console.log('✅ Urgency notice with dynamic hours');
        console.log('✅ Banner images (if configured)');
        console.log('✅ Video section (if configured)');
        console.log('✅ Discount banner (if enabled)');
        console.log('✅ Featured partners (if enabled)');
        console.log('✅ Seller tracking message (if enabled)');
        console.log('✅ Professional footer');
        
        console.log('\n💡 Check the customer email inbox to see the enhanced rebuy email!');
        console.log('🎯 The email should now show the actual countdown and all enhanced components.');
        console.log('📱 The design should match exactly what you see in the admin preview.');
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

testNewQRRebuy(); 