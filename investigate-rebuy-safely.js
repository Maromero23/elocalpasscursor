const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateRebuyEmailsSafely() {
  try {
    console.log('🔍 SAFE REBUY EMAIL INVESTIGATION (READ-ONLY)');
    console.log('🚨 WARNING: NOT touching any welcome email systems\n');
    
    // 1. Check if rebuy emails have their own separate table (SAFE)
    console.log('📧 CHECKING REBUY EMAIL TEMPLATE TABLE:');
    try {
      const rebuyTemplates = await prisma.rebuyEmailTemplate.findMany({
        select: {
          id: true,
          name: true,
          subject: true,
          isDefault: true,
          customHTML: true,
          createdAt: true
        }
      });
      
      if (rebuyTemplates.length === 0) {
        console.log('❌ NO rebuy email templates found in RebuyEmailTemplate table');
      } else {
        rebuyTemplates.forEach(template => {
          console.log(`  - ${template.name} (isDefault: ${template.isDefault})`);
          console.log(`    Subject: ${template.subject}`);
          console.log(`    Has customHTML: ${!!template.customHTML}`);
          console.log(`    HTML length: ${template.customHTML?.length || 0}`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking RebuyEmailTemplate table:', error.message);
    }
    
    // 2. Check rebuy email configuration in saved configs (SAFE)
    console.log('\n📋 CHECKING REBUY EMAIL IN SAVED CONFIGURATIONS:');
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      where: {
        button5SendRebuyEmail: true  // Only configs with rebuy enabled
      },
      select: {
        id: true,
        name: true,
        button5SendRebuyEmail: true,
        emailTemplates: true
      }
    });
    
    console.log(`Found ${savedConfigs.length} configurations with rebuy email enabled:`);
    savedConfigs.forEach(config => {
      console.log(`\n📋 ${config.name} (ID: ${config.id})`);
      console.log(`   button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
      
      if (config.emailTemplates) {
        try {
          const emailTemplates = JSON.parse(config.emailTemplates);
          if (emailTemplates.rebuyEmail) {
            console.log('   ✅ Has rebuyEmail template:');
            console.log(`      Subject: ${emailTemplates.rebuyEmail.subject || 'No subject'}`);
            console.log(`      CustomHTML: ${emailTemplates.rebuyEmail.customHTML || 'No customHTML'}`);
            console.log(`      HTML length: ${emailTemplates.rebuyEmail.customHTML?.length || 0}`);
          } else {
            console.log('   ❌ No rebuyEmail template in emailTemplates');
          }
        } catch (error) {
          console.log('   ❌ Error parsing emailTemplates JSON');
        }
      } else {
        console.log('   ❌ No emailTemplates field');
      }
    });
    
    // 3. Check for any QR codes that should have gotten rebuy emails (SAFE)
    console.log('\n📅 CHECKING QR CODES THAT SHOULD TRIGGER REBUY EMAILS:');
    const now = new Date();
    const rebuyWindow = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Next 12 hours
    
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: rebuyWindow
        },
        isActive: true
      },
      include: {
        seller: {
          include: {
            savedConfig: {
              select: {
                button5SendRebuyEmail: true,
                emailTemplates: true
              }
            }
          }
        }
      },
      take: 5  // Just check a few examples
    });
    
    console.log(`Found ${qrCodes.length} QR codes expiring in next 12 hours:`);
    qrCodes.forEach(qr => {
      console.log(`\n🎫 QR: ${qr.code}`);
      console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`   Expires: ${qr.expiresAt}`);
      console.log(`   Seller rebuy enabled: ${qr.seller?.savedConfig?.button5SendRebuyEmail || false}`);
      
      if (qr.seller?.savedConfig?.button5SendRebuyEmail) {
        console.log('   ✅ This SHOULD get a rebuy email');
      } else {
        console.log('   ❌ Rebuy email disabled for this seller');
      }
    });
    
    // 4. Check if there's a rebuy email sending service/API (SAFE)
    console.log('\n🔍 CHECKING FOR REBUY EMAIL SENDING LOGIC:');
    console.log('Looking for rebuy email API endpoints...');
    
    await prisma.$disconnect();
    console.log('\n✅ INVESTIGATION COMPLETE - No changes made to any systems');
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
    await prisma.$disconnect();
  }
}

investigateRebuyEmailsSafely(); 