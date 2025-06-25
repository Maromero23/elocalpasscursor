/**
 * 🔍 CHECK SELLER REBUY CONFIGURATIONS
 * 
 * This will check which sellers have rebuy enabled and why QR codes
 * might not be getting rebuyEmailScheduled = true
 * READ-ONLY - No database changes.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSellerRebuyConfig() {
  try {
    console.log('🔍 CHECKING SELLER REBUY CONFIGURATIONS (READ-ONLY)\n');
    
    // Get the QR codes we found that failed
    const failedQRCodes = [
      'EL-1750833015794-4r5vnflxw',
      'EL-1750833151179-nf10759m6', 
      'EL-1750833189727-zwjnbrqpq'
    ];
    
    for (const qrCode of failedQRCodes) {
      console.log(`\n🎫 CHECKING QR: ${qrCode}`);
      
      const qr = await prisma.qRCode.findUnique({
        where: { code: qrCode },
        include: {
          seller: {
            include: {
              savedConfig: true
            }
          },
          analytics: true
        }
      });
      
      if (!qr) {
        console.log('   ❌ QR code not found');
        continue;
      }
      
      console.log(`   Seller ID: ${qr.sellerId}`);
      console.log(`   Has Analytics: ${!!qr.analytics}`);
      
      if (qr.analytics) {
        console.log(`   rebuyEmailScheduled: ${qr.analytics.rebuyEmailScheduled}`);
      }
      
      // Check seller configuration
      if (qr.seller?.savedConfig) {
        console.log(`   Seller has saved config: ${qr.seller.savedConfig.name}`);
        
        try {
          const configData = JSON.parse(qr.seller.savedConfig.config);
          console.log(`   button5SendRebuyEmail: ${configData.button5SendRebuyEmail}`);
          
          // Check if this config has rebuy email templates
          if (qr.seller.savedConfig.emailTemplates) {
            const emailTemplates = JSON.parse(qr.seller.savedConfig.emailTemplates);
            if (emailTemplates.rebuyEmail) {
              console.log('   ✅ Has rebuy email template configured');
            } else {
              console.log('   ❌ No rebuy email template configured');
            }
          } else {
            console.log('   ❌ No email templates at all');
          }
          
        } catch (error) {
          console.log('   ❌ Error parsing seller config');
        }
      } else {
        console.log('   ❌ Seller has no saved configuration');
        
        // Check if seller has a direct configuration
        const seller = await prisma.user.findUnique({
          where: { id: qr.sellerId },
          select: {
            id: true,
            email: true,
            configurationId: true,
            configurationName: true,
            savedConfigId: true
          }
        });
        
        console.log('   Seller details:');
        console.log(`     Email: ${seller?.email}`);
        console.log(`     configurationId: ${seller?.configurationId}`);
        console.log(`     configurationName: ${seller?.configurationName}`);
        console.log(`     savedConfigId: ${seller?.savedConfigId}`);
      }
    }
    
    // Check all sellers with rebuy enabled configurations
    console.log('\n\n📊 ALL SELLERS WITH REBUY ENABLED:');
    
    const rebuyConfigs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true,
        assignedUsers: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    rebuyConfigs.forEach(config => {
      try {
        const configData = JSON.parse(config.config);
        if (configData.button5SendRebuyEmail) {
          console.log(`\n✅ REBUY ENABLED: ${config.name}`);
          console.log(`   Config ID: ${config.id}`);
          console.log(`   Assigned to ${config.assignedUsers.length} sellers:`);
          config.assignedUsers.forEach(user => {
            console.log(`     - ${user.email} (ID: ${user.id})`);
          });
          
          // Check if has rebuy email template
          if (config.emailTemplates) {
            const emailTemplates = JSON.parse(config.emailTemplates);
            if (emailTemplates.rebuyEmail) {
              console.log('   📧 Has rebuy email template ✅');
            } else {
              console.log('   📧 Missing rebuy email template ❌');
            }
          }
        }
      } catch (error) {
        console.log(`❌ Error parsing config ${config.name}`);
      }
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

checkSellerRebuyConfig(); 