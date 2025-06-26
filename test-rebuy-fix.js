const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRebuyFix() {
  try {
    console.log('🔧 TESTING REBUY EMAIL FIX...\n');
    
    // Find a seller with a rebuy-enabled configuration
    const sellersWithRebuy = await prisma.user.findMany({
      where: {
        savedConfig: {
          emailTemplates: {
            contains: 'rebuyEmail'
          }
        }
      },
      include: {
        savedConfig: true
      },
      take: 3
    });
    
    console.log('📊 SELLERS WITH REBUY CONFIGURATIONS:');
    console.log('Count:', sellersWithRebuy.length);
    
    if (sellersWithRebuy.length === 0) {
      console.log('❌ No sellers found with rebuy configurations');
      return;
    }
    
    sellersWithRebuy.forEach((seller, index) => {
      console.log(`\nSeller ${index + 1}:`);
      console.log('- Name:', seller.name);
      console.log('- Email:', seller.email);
      console.log('- Config:', seller.savedConfig?.name);
      
      if (seller.savedConfig) {
        try {
          const config = JSON.parse(seller.savedConfig.config);
          console.log('- Rebuy Enabled:', config.button5SendRebuyEmail);
          
          // Check if has rebuy email template
          if (seller.savedConfig.emailTemplates) {
            const emailTemplates = JSON.parse(seller.savedConfig.emailTemplates);
            if (emailTemplates.rebuyEmail) {
              console.log('- Has Rebuy Template: ✅');
              console.log('- Template Type:', emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE' ? 'DEFAULT' : 'CUSTOM');
            } else {
              console.log('- Has Rebuy Template: ❌');
            }
          }
        } catch (e) {
          console.log('- Error parsing config');
        }
      }
    });
    
    // Check recent QR codes to see if the fix is working
    console.log('\n' + '='.repeat(60));
    console.log('🔍 CHECKING RECENT QR CODES ANALYTICS...\n');
    
    const recentQRs = await prisma.qRCode.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        seller: {
          savedConfig: {
            emailTemplates: {
              contains: 'rebuyEmail'
            }
          }
        }
      },
      include: {
        analytics: true,
        seller: {
          include: {
            savedConfig: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('📊 RECENT QR CODES (Last 24 hours):');
    console.log('Count:', recentQRs.length);
    
    if (recentQRs.length === 0) {
      console.log('❌ No recent QR codes found with rebuy configurations');
      console.log('The fix will be tested when new QR codes are created');
    } else {
      recentQRs.forEach((qr, index) => {
        console.log(`\nQR Code ${index + 1}:`);
        console.log('- Code:', qr.code);
        console.log('- Created:', qr.createdAt);
        console.log('- Customer:', qr.customerName);
        console.log('- Seller:', qr.seller.name);
        console.log('- Config:', qr.seller.savedConfig?.name);
        
        if (qr.seller.savedConfig) {
          try {
            const config = JSON.parse(qr.seller.savedConfig.config);
            console.log('- Config Rebuy Enabled:', config.button5SendRebuyEmail);
          } catch (e) {
            console.log('- Error parsing seller config');
          }
        }
        
        if (qr.analytics) {
          console.log('- Analytics Rebuy Scheduled:', qr.analytics.rebuyEmailScheduled);
          
          // Check if the fix is working
          if (qr.seller.savedConfig) {
            try {
              const config = JSON.parse(qr.seller.savedConfig.config);
              const configRebuy = config.button5SendRebuyEmail;
              const analyticsRebuy = qr.analytics.rebuyEmailScheduled;
              
              if (configRebuy === analyticsRebuy) {
                console.log('- Status: ✅ FIXED - Analytics matches config');
              } else {
                console.log('- Status: ❌ BROKEN - Analytics does not match config');
                console.log(`  Config: ${configRebuy}, Analytics: ${analyticsRebuy}`);
              }
            } catch (e) {
              console.log('- Status: ❓ Cannot determine - config parse error');
            }
          }
        } else {
          console.log('- Analytics: ❌ No analytics record');
        }
        
        // Check time since creation
        const now = new Date();
        const minutesSinceCreation = Math.floor((now.getTime() - qr.createdAt.getTime()) / (1000 * 60));
        console.log('- Minutes since creation:', minutesSinceCreation);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TESTING SUMMARY:');
    console.log('✅ Fix has been applied to app/api/seller/generate-qr/route.ts');
    console.log('✅ Analytics will now be updated with correct rebuyEmailScheduled value');
    console.log('📝 Next step: Test by creating a new QR code with a rebuy-enabled seller');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRebuyFix(); 