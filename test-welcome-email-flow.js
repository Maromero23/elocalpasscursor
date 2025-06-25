const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWelcomeEmailFlow() {
  try {
    console.log('🧪 TESTING WELCOME EMAIL FLOW...\n');
    
    // Test 1: Check if we can find a recent QR code with welcome email config
    console.log('1️⃣ CHECKING RECENT QR CODES WITH WELCOME EMAIL CONFIG:');
    
    const recentQR = await prisma.qRCode.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
        },
        customerEmail: {
          not: null
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
    
    if (!recentQR) {
      console.log('❌ No recent QR codes found');
      return;
    }
    
    console.log(`✅ Found QR: ${recentQR.code}`);
    console.log(`   Customer: ${recentQR.customerName} (${recentQR.customerEmail})`);
    console.log(`   Created: ${recentQR.createdAt}`);
    console.log(`   Seller Config ID: ${recentQR.seller.savedConfigId}`);
    
    if (!recentQR.seller.savedConfig) {
      console.log('❌ No saved config found for seller');
      return;
    }
    
    // Test 2: Parse the configuration and check welcome email setup
    console.log('\n2️⃣ PARSING SELLER CONFIGURATION:');
    
    const config = JSON.parse(recentQR.seller.savedConfig.config);
    console.log(`   Button4 Required: ${config.button4LandingPageRequired}`);
    
    if (recentQR.seller.savedConfig.emailTemplates) {
      const emailTemplates = JSON.parse(recentQR.seller.savedConfig.emailTemplates);
      console.log(`   Has emailTemplates: YES`);
      console.log(`   Has welcomeEmail: ${!!emailTemplates.welcomeEmail}`);
      
      if (emailTemplates.welcomeEmail) {
        console.log(`   Welcome Email Details:`);
        console.log(`      - customHTML exists: ${!!emailTemplates.welcomeEmail.customHTML}`);
        console.log(`      - customHTML value: "${emailTemplates.welcomeEmail.customHTML?.substring(0, 50)}..."`);
        console.log(`      - htmlContent: "${emailTemplates.welcomeEmail.htmlContent}"`);
        console.log(`      - useDefaultEmail: ${emailTemplates.welcomeEmail.emailConfig?.useDefaultEmail}`);
        
        // Test 3: Simulate the email sending logic
        console.log('\n3️⃣ SIMULATING EMAIL SENDING LOGIC:');
        
        const shouldUseCustom = emailTemplates.welcomeEmail.customHTML && 
                               emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE';
        
        console.log(`   Condition: customHTML exists AND customHTML !== 'USE_DEFAULT_TEMPLATE'`);
        console.log(`   customHTML exists: ${!!emailTemplates.welcomeEmail.customHTML}`);
        console.log(`   customHTML !== 'USE_DEFAULT_TEMPLATE': ${emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE'}`);
        console.log(`   Should use custom template: ${shouldUseCustom}`);
        console.log(`   Will use: ${shouldUseCustom ? 'CUSTOM TEMPLATE' : 'DEFAULT TEMPLATE'}`);
        
        if (!shouldUseCustom) {
          console.log('   ✅ This is CORRECT - should use default template for USE_DEFAULT_TEMPLATE marker');
        }
      } else {
        console.log('   ❌ NO welcomeEmail object found');
      }
    } else {
      console.log('   ❌ NO emailTemplates field found');
    }
    
    // Test 4: Check if this QR should have received a welcome email
    console.log('\n4️⃣ CHECKING IF WELCOME EMAIL SHOULD BE SENT:');
    
    const shouldSendWelcome = config.button4LandingPageRequired === false || 
                             (config.button4LandingPageRequired === true && emailTemplates?.welcomeEmail);
    
    console.log(`   Should send welcome email: ${shouldSendWelcome}`);
    console.log(`   Reason: ${config.button4LandingPageRequired === false ? 'Default template selected' : 'Custom template configured'}`);
    
    if (shouldSendWelcome) {
      console.log('   ✅ Welcome email SHOULD be sent for this QR code');
    } else {
      console.log('   ❌ Welcome email should NOT be sent - configuration incomplete');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomeEmailFlow(); 