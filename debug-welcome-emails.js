const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWelcomeEmails() {
  try {
    console.log('🔍 DEBUGGING WELCOME EMAIL SYSTEM...\n');
    
    // 1. Check recent saved configurations
    console.log('📋 CHECKING SAVED CONFIGURATIONS:');
    const configs = await prisma.savedQRConfiguration.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        config: true,
        emailTemplates: true,
        updatedAt: true
      }
    });
    
    configs.forEach((config, index) => {
      console.log(`\n${index + 1}. "${config.name}" (${config.id})`);
      console.log(`   Updated: ${config.updatedAt}`);
      
      // Parse main config
      try {
        const mainConfig = JSON.parse(config.config);
        console.log(`   Button4 Required: ${mainConfig.button4LandingPageRequired}`);
      } catch (e) {
        console.log(`   ❌ Error parsing main config: ${e.message}`);
      }
      
      // Parse email templates
      if (config.emailTemplates) {
        try {
          const templates = JSON.parse(config.emailTemplates);
          console.log(`   ✅ Has emailTemplates: YES`);
          console.log(`   📧 Has welcomeEmail: ${!!templates.welcomeEmail}`);
          
          if (templates.welcomeEmail) {
            console.log(`   📧 Welcome Email Details:`);
            console.log(`      - ID: ${templates.welcomeEmail.id}`);
            console.log(`      - Name: ${templates.welcomeEmail.name}`);
            console.log(`      - Has customHTML: ${!!templates.welcomeEmail.customHTML}`);
            console.log(`      - Has htmlContent: ${!!templates.welcomeEmail.htmlContent}`);
            console.log(`      - htmlContent value: "${templates.welcomeEmail.htmlContent}"`);
            console.log(`      - useDefaultEmail: ${templates.welcomeEmail.emailConfig?.useDefaultEmail}`);
          }
        } catch (e) {
          console.log(`   ❌ Error parsing emailTemplates: ${e.message}`);
        }
      } else {
        console.log(`   ❌ No emailTemplates field`);
      }
    });
    
    // 2. Check recent QR codes and their email sending
    console.log('\n\n📧 CHECKING RECENT QR CODES:');
    const recentQRs = await prisma.qRCode.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    });
    
    recentQRs.forEach((qr, index) => {
      console.log(`\n${index + 1}. QR ${qr.code}`);
      console.log(`   Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`   Created: ${qr.createdAt}`);
      console.log(`   Seller Config: ${qr.seller.savedConfigId || 'None'}`);
      
      if (qr.seller.savedConfig) {
        try {
          const config = JSON.parse(qr.seller.savedConfig.config);
          console.log(`   Button4 Required: ${config.button4LandingPageRequired}`);
          
          if (qr.seller.savedConfig.emailTemplates) {
            const templates = JSON.parse(qr.seller.savedConfig.emailTemplates);
            console.log(`   Has Welcome Email Template: ${!!templates.welcomeEmail}`);
          }
        } catch (e) {
          console.log(`   ❌ Error parsing seller config: ${e.message}`);
        }
      }
    });
    
    // 3. Check for any database inconsistencies
    console.log('\n\n🔍 CHECKING FOR ISSUES:');
    
    // Check for configs with button4LandingPageRequired = false but no welcome email template
    const problematicConfigs = await prisma.savedQRConfiguration.findMany({
      where: {
        config: {
          contains: '"button4LandingPageRequired":false'
        }
      }
    });
    
    console.log(`\nConfigs with button4=false: ${problematicConfigs.length}`);
    problematicConfigs.forEach(config => {
      console.log(`- ${config.name} (${config.id})`);
      if (config.emailTemplates) {
        try {
          const templates = JSON.parse(config.emailTemplates);
          console.log(`  Welcome Email: ${!!templates.welcomeEmail ? 'YES' : 'NO'}`);
        } catch (e) {
          console.log(`  ❌ Error parsing templates`);
        }
      } else {
        console.log(`  ❌ NO emailTemplates field`);
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWelcomeEmails(); 