const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewConfig() {
  try {
    // Check the new config
    const config = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmc70f52700008uxqgeabntza' }
    });
    
    if (config) {
      console.log('✅ Found NEW config for cmc70f52700008uxqgeabntza');
      console.log('📄 Config name:', config.name);
      console.log('📧 emailTemplates field:', config.emailTemplates ? 'EXISTS' : 'NULL');
      
      // Parse the main config
      const mainConfig = JSON.parse(config.config);
      console.log('🔗 Button3 Delivery Method:', mainConfig.button3DeliveryMethod);
      
      // Check email templates
      if (config.emailTemplates) {
        const templates = JSON.parse(config.emailTemplates);
        console.log('📧 Email template status:');
        console.log('   - welcomeEmail exists:', !!templates.welcomeEmail);
        console.log('   - customHTML exists:', !!templates.welcomeEmail?.customHTML);
        console.log('   - customHTML length:', templates.welcomeEmail?.customHTML?.length || 0);
        
        if (templates.welcomeEmail) {
          console.log('   - Template ID:', templates.welcomeEmail.id);
          console.log('   - Template name:', templates.welcomeEmail.name);
          console.log('   - useDefaultEmail:', templates.welcomeEmail.emailConfig?.useDefaultEmail);
        }
      } else {
        console.log('❌ NO email templates found - this is why no email was sent!');
      }
      
      // Check recent QR codes created for this config
      const recentQRs = await prisma.qRCode.findMany({
        where: {
          seller: {
            savedConfigId: 'cmc70f52700008uxqgeabntza'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          code: true,
          customerName: true,
          customerEmail: true,
          createdAt: true
        }
      });
      
      console.log('\n🎫 Recent QR codes for this config:');
      if (recentQRs.length > 0) {
        recentQRs.forEach((qr, index) => {
          console.log(`  ${index + 1}. ${qr.code} - ${qr.customerName} (${qr.customerEmail})`);
          console.log(`     Created: ${qr.createdAt}`);
        });
      } else {
        console.log('  No QR codes found for this config');
      }
      
    } else {
      console.log('❌ Config not found for cmc70f52700008uxqgeabntza');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewConfig();
