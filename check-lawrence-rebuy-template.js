const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLawrenceRebuyTemplate() {
  try {
    console.log('🔍 CHECKING LAWRENCE TAYLOR\'S REBUY TEMPLATE...\n');
    
    // Get Lawrence Taylor's configuration
    const lawrence = await prisma.user.findFirst({
      where: {
        email: 'Taylor56@gmail.com'
      },
      include: {
        savedConfig: true
      }
    });
    
    if (!lawrence) {
      console.log('❌ Lawrence Taylor not found');
      return;
    }
    
    console.log(`✅ Found Lawrence Taylor: ${lawrence.name}`);
    console.log(`- Email: ${lawrence.email}`);
    console.log(`- Has saved config: ${!!lawrence.savedConfig}`);
    
    if (lawrence.savedConfig) {
      console.log(`- Config ID: ${lawrence.savedConfig.id}`);
      console.log(`- Config name: ${lawrence.savedConfig.name}`);
      
      // Parse the configuration
      const config = JSON.parse(lawrence.savedConfig.config);
      console.log(`- Rebuy enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
      
      // Check email templates
      const emailTemplates = lawrence.savedConfig.emailTemplates ? JSON.parse(lawrence.savedConfig.emailTemplates) : null;
      
      console.log('\n📧 EMAIL TEMPLATES:');
      console.log(`- Has emailTemplates: ${!!emailTemplates}`);
      console.log(`- Has rebuyEmail: ${!!emailTemplates?.rebuyEmail}`);
      console.log(`- Has customHTML: ${!!emailTemplates?.rebuyEmail?.customHTML}`);
      
      if (emailTemplates?.rebuyEmail?.customHTML) {
        console.log(`- CustomHTML length: ${emailTemplates.rebuyEmail.customHTML.length} characters`);
        console.log(`- CustomHTML type: ${typeof emailTemplates.rebuyEmail.customHTML}`);
        console.log(`- Is USE_DEFAULT_TEMPLATE: ${emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE'}`);
        
        if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
          console.log('\n🔍 CHECKING DEFAULT REBUY TEMPLATE IN DATABASE:');
          
          const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
            where: { isDefault: true }
          });
          
          if (defaultTemplate) {
            console.log(`✅ Found default rebuy template:`);
            console.log(`- ID: ${defaultTemplate.id}`);
            console.log(`- Subject: ${defaultTemplate.subject}`);
            console.log(`- HTML length: ${defaultTemplate.customHTML?.length || 0} characters`);
            console.log(`- Has headerText: ${!!defaultTemplate.headerText}`);
            
            if (defaultTemplate.customHTML) {
              const hasCountdownTimer = defaultTemplate.customHTML.includes('countdown-timer') || defaultTemplate.customHTML.includes('updateCountdown');
              console.log(`- Has countdown timer: ${hasCountdownTimer ? '✅ YES' : '❌ NO'}`);
              
              const hasTimestampPlaceholder = defaultTemplate.customHTML.includes('{qrExpirationTimestamp}');
              console.log(`- Has timestamp placeholder: ${hasTimestampPlaceholder ? '✅ YES' : '❌ NO'}`);
              
              if (!hasCountdownTimer) {
                console.log('\n⚠️ DEFAULT TEMPLATE MISSING COUNTDOWN TIMER!');
                console.log('This explains why the countdown is not working in actual emails.');
              }
              
              console.log('\n📄 TEMPLATE PREVIEW (first 500 chars):');
              console.log(defaultTemplate.customHTML.substring(0, 500) + '...');
            }
          } else {
            console.log('❌ No default rebuy template found in database');
          }
        } else {
          console.log('\n📄 CUSTOM TEMPLATE PREVIEW (first 500 chars):');
          console.log(emailTemplates.rebuyEmail.customHTML.substring(0, 500) + '...');
          
          const hasCountdownTimer = emailTemplates.rebuyEmail.customHTML.includes('countdown-timer') || emailTemplates.rebuyEmail.customHTML.includes('updateCountdown');
          console.log(`\n- Has countdown timer: ${hasCountdownTimer ? '✅ YES' : '❌ NO'}`);
          
          const hasTimestampPlaceholder = emailTemplates.rebuyEmail.customHTML.includes('{qrExpirationTimestamp}');
          console.log(`- Has timestamp placeholder: ${hasTimestampPlaceholder ? '✅ YES' : '❌ NO'}`);
        }
      }
      
      // Check rebuy configuration
      if (emailTemplates?.rebuyEmail?.rebuyConfig) {
        console.log('\n🔧 REBUY CONFIG:');
        console.log(`- Email subject: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject || 'Not set'}`);
        console.log(`- Enable seller tracking: ${emailTemplates.rebuyEmail.rebuyConfig.enableSellerTracking || false}`);
        console.log(`- Enable discount: ${emailTemplates.rebuyEmail.rebuyConfig.enableDiscountCode || false}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLawrenceRebuyTemplate(); 