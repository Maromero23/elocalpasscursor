const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfigDiscrepancy() {
  try {
    console.log('🔍 CHECKING CONFIGURATION DISCREPANCY\n');
    
    // Find Maria Playa's saved config
    const mariaConfig = await prisma.savedQRConfiguration.findFirst({
      where: {
        name: 'Test rebuy email'
      }
    });
    
    if (!mariaConfig) {
      console.log('❌ Configuration "Test rebuy email" not found');
      return;
    }
    
    console.log('✅ Found configuration:');
    console.log(`- Name: ${mariaConfig.name}`);
    console.log(`- ID: ${mariaConfig.id}`);
    console.log(`- Created: ${mariaConfig.createdAt}`);
    console.log(`- Updated: ${mariaConfig.updatedAt}`);
    
    // Parse and display the actual config
    try {
      const config = JSON.parse(mariaConfig.config);
      console.log('\n📋 ACTUAL CONFIGURATION DATA:');
      console.log(`- button1SendWelcomeEmail: ${config.button1SendWelcomeEmail}`);
      console.log(`- button5SendRebuyEmail: ${config.button5SendRebuyEmail}`);
      
      // Check email templates
      if (mariaConfig.emailTemplates) {
        const emailTemplates = JSON.parse(mariaConfig.emailTemplates);
        console.log('\n📧 EMAIL TEMPLATES:');
        console.log(`- Has welcomeEmail: ${!!emailTemplates.welcomeEmail}`);
        console.log(`- Has rebuyEmail: ${!!emailTemplates.rebuyEmail}`);
        
        if (emailTemplates.welcomeEmail) {
          console.log(`- Welcome email subject: ${emailTemplates.welcomeEmail.subject || 'Not set'}`);
          console.log(`- Welcome template length: ${emailTemplates.welcomeEmail.customHTML?.length || 0} chars`);
        }
      }
      
      // Show all button configurations
      console.log('\n🔘 ALL BUTTON CONFIGURATIONS:');
      Object.keys(config).forEach(key => {
        if (key.startsWith('button') && key.includes('Send')) {
          console.log(`- ${key}: ${config[key]}`);
        }
      });
      
    } catch (parseError) {
      console.log('❌ Error parsing configuration:', parseError.message);
    }
    
    // Now check the QR codes and see which config they're actually using
    console.log('\n\n🔍 CHECKING QR CODES CONFIGURATION USAGE:');
    
    const qrCodes = [
      'EL-1753665722262-4ru5rvxiy',
      'EL-1753666043206-cd20onklu'
    ];
    
    for (const qrCodeStr of qrCodes) {
      console.log(`\n📋 QR Code: ${qrCodeStr}`);
      
      const qr = await prisma.qRCode.findFirst({
        where: { code: qrCodeStr },
        include: {
          seller: {
            include: {
              savedConfig: true
            }
          }
        }
      });
      
      if (qr && qr.seller?.savedConfig) {
        console.log(`- Using config: ${qr.seller.savedConfig.name}`);
        console.log(`- Config ID: ${qr.seller.savedConfig.id}`);
        
        // Check if this is the same config we found above
        if (qr.seller.savedConfig.id === mariaConfig.id) {
          console.log('✅ Using the SAME config as "Test rebuy email"');
        } else {
          console.log('⚠️ Using a DIFFERENT config!');
          
          // Parse this config too
          try {
            const qrConfig = JSON.parse(qr.seller.savedConfig.config);
            console.log(`- Welcome email enabled in QR config: ${qrConfig.button1SendWelcomeEmail}`);
          } catch (e) {
            console.log('❌ Error parsing QR config');
          }
        }
      }
    }
    
    console.log('\n🔍 POSSIBLE ISSUES:');
    console.log('1. Configuration might have been updated after QR creation');
    console.log('2. QR codes might be using a cached/old version of the config');
    console.log('3. There might be multiple configs with similar names');
    console.log('4. Welcome email API might not be getting called during QR creation');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfigDiscrepancy(); 