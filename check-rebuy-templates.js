const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRebuyTemplates() {
  try {
    console.log('🔍 Checking saved QR configurations for rebuy email templates...\n');
    
    const configs = await prisma.savedQRConfiguration.findMany({
      select: {
        id: true,
        name: true,
        emailTemplates: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${configs.length} saved configurations:\n`);
    
    configs.forEach((config, index) => {
      console.log(`${index + 1}. Config: "${config.name}" (ID: ${config.id})`);
      console.log(`   Created: ${config.createdAt}`);
      
      if (config.emailTemplates) {
        try {
          const templates = JSON.parse(config.emailTemplates);
          console.log(`   ✅ Has emailTemplates: YES`);
          console.log(`   📧 Has rebuyEmail: ${!!templates.rebuyEmail}`);
          
          if (templates.rebuyEmail) {
            console.log(`   🎨 Has rebuyEmail.customHTML: ${!!templates.rebuyEmail.customHTML}`);
            console.log(`   📄 Has rebuyEmail.htmlContent: ${!!templates.rebuyEmail.htmlContent}`);
            
            if (templates.rebuyEmail.customHTML) {
              console.log(`   📏 CustomHTML length: ${templates.rebuyEmail.customHTML.length} characters`);
              console.log(`   🔤 CustomHTML preview: ${templates.rebuyEmail.customHTML.substring(0, 100)}...`);
            }
            
            if (templates.rebuyEmail.rebuyConfig) {
              console.log(`   ⚙️  Has rebuyConfig: YES`);
              console.log(`   📬 Email subject: ${templates.rebuyEmail.rebuyConfig.emailSubject || 'Not set'}`);
            }
          }
        } catch (parseError) {
          console.log(`   ❌ Error parsing emailTemplates: ${parseError.message}`);
        }
      } else {
        console.log(`   ❌ Has emailTemplates: NO`);
      }
      console.log('');
    });
    
    // Also check recent QR codes to see which configs they're using
    console.log('🎯 Checking recent QR codes and their configurations...\n');
    
    const recentQRs = await prisma.qRCode.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${recentQRs.length} QR codes created in the last 30 minutes:\n`);
    
    recentQRs.forEach((qr, index) => {
      console.log(`${index + 1}. QR Code: ${qr.code}`);
      console.log(`   Created: ${qr.createdAt}`);
      console.log(`   Customer: ${qr.customerEmail}`);
      
      if (qr.seller.savedConfig) {
        console.log(`   Config: "${qr.seller.savedConfig.name}" (ID: ${qr.seller.savedConfig.id})`);
        
        if (qr.seller.savedConfig.emailTemplates) {
          try {
            const templates = JSON.parse(qr.seller.savedConfig.emailTemplates);
            console.log(`   📧 Has rebuy email template: ${!!templates.rebuyEmail}`);
            console.log(`   🎨 Has custom HTML: ${!!templates.rebuyEmail?.customHTML}`);
          } catch (e) {
            console.log(`   ❌ Error parsing templates: ${e.message}`);
          }
        } else {
          console.log(`   ❌ No email templates`);
        }
      } else {
        console.log(`   ❌ No saved config`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRebuyTemplates(); 