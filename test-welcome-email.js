const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWelcomeEmail() {
  try {
    console.log('🔍 Testing welcome email template system...\n');
    
    // Check recent QR codes and their welcome email configurations
    const recentQRs = await prisma.qRCode.findMany({
      where: {
        customerEmail: 'jorgeruiz23@gmail.com',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    console.log(`Found ${recentQRs.length} recent QR codes:\n`);
    
    recentQRs.forEach((qr, index) => {
      console.log(`${index + 1}. QR Code: ${qr.code}`);
      console.log(`   Created: ${qr.createdAt}`);
      console.log(`   Config: "${qr.seller.savedConfig?.name}" (ID: ${qr.seller.savedConfig?.id})`);
      
      if (qr.seller.savedConfig?.emailTemplates) {
        try {
          const templates = JSON.parse(qr.seller.savedConfig.emailTemplates);
          console.log(`   📧 Has welcome email template: ${!!templates.welcomeEmail}`);
          
          if (templates.welcomeEmail) {
            console.log(`   🎨 Has welcome customHTML: ${!!templates.welcomeEmail.customHTML}`);
            console.log(`   📄 Has welcome htmlContent: ${!!templates.welcomeEmail.htmlContent}`);
            
            if (templates.welcomeEmail.customHTML) {
              console.log(`   📏 Welcome customHTML length: ${templates.welcomeEmail.customHTML.length} characters`);
              
              // Check if it contains expected welcome email content
              const hasCustomHeader = templates.welcomeEmail.customHTML.includes('Welcome to Your ELocalPass');
              const hasCustomStyling = templates.welcomeEmail.customHTML.includes('background-color');
              
              console.log(`   ✅ Contains custom welcome header: ${hasCustomHeader}`);
              console.log(`   ✅ Contains custom styling: ${hasCustomStyling}`);
            }
            
            if (templates.welcomeEmail.emailConfig) {
              console.log(`   ⚙️  useDefaultEmail: ${templates.welcomeEmail.emailConfig.useDefaultEmail}`);
            }
          }
          
          // Also check rebuy email for comparison
          if (templates.rebuyEmail) {
            console.log(`   📧 Has rebuy email template: ${!!templates.rebuyEmail}`);
            console.log(`   🎨 Has rebuy customHTML: ${!!templates.rebuyEmail.customHTML}`);
          }
          
        } catch (e) {
          console.log(`   ❌ Error parsing email templates: ${e.message}`);
        }
      } else {
        console.log(`   ❌ No email templates found`);
      }
      console.log('');
    });
    
    // Check if there are any configurations with welcome email templates
    console.log('🔍 Checking all configurations with welcome email templates...\n');
    
    const configsWithWelcome = await prisma.savedQRConfiguration.findMany({
      where: {
        emailTemplates: {
          contains: 'welcomeEmail'
        }
      },
      select: {
        id: true,
        name: true,
        emailTemplates: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${configsWithWelcome.length} configurations with welcome email templates:\n`);
    
    configsWithWelcome.forEach((config, index) => {
      console.log(`${index + 1}. Config: "${config.name}" (ID: ${config.id})`);
      console.log(`   Updated: ${config.updatedAt}`);
      
      try {
        const templates = JSON.parse(config.emailTemplates);
        if (templates.welcomeEmail) {
          console.log(`   📧 Welcome email configured: YES`);
          console.log(`   🎨 Has customHTML: ${!!templates.welcomeEmail.customHTML}`);
          console.log(`   📄 Has htmlContent: ${!!templates.welcomeEmail.htmlContent}`);
          
          if (templates.welcomeEmail.customHTML) {
            console.log(`   📏 CustomHTML length: ${templates.welcomeEmail.customHTML.length} characters`);
          }
        }
      } catch (e) {
        console.log(`   ❌ Error parsing templates: ${e.message}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomeEmail(); 