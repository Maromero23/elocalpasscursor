const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEmailCountdown() {
  try {
    console.log('🔧 FIXING EMAIL COUNTDOWN FOR EMAIL CLIENT COMPATIBILITY...\n');
    
    // Get Lawrence Taylor's configuration
    const lawrence = await prisma.user.findFirst({
      where: {
        email: 'Taylor56@gmail.com'
      },
      include: {
        savedConfig: true
      }
    });
    
    if (!lawrence || !lawrence.savedConfig) {
      console.log('❌ Lawrence Taylor or config not found');
      return;
    }
    
    console.log(`✅ Found Lawrence Taylor's config: ${lawrence.savedConfig.name}`);
    
    // Parse current email templates
    const emailTemplates = JSON.parse(lawrence.savedConfig.emailTemplates);
    const currentRebuyHTML = emailTemplates.rebuyEmail.customHTML;
    
    console.log(`📧 Current template length: ${currentRebuyHTML.length} characters`);
    
    // Replace JavaScript countdown with email-compatible static countdown
    let updatedHTML = currentRebuyHTML;
    
    // Replace the countdown timer section with email-compatible version
    const countdownTimerRegex = /<div class="countdown-timer">[\s\S]*?<\/script>/g;
    
    const emailCompatibleCountdown = `
            <div class="countdown-timer">
                <p style="text-align: center; color: #dc2626; font-weight: bold; margin: 16px 0 8px 0;">⏰ Time Remaining Until Expiration:</p>
                <div class="countdown-display" style="text-align: center; font-size: 24px; font-weight: bold; color: #dc2626; background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 12px 24px; border-radius: 8px; margin: 8px auto; max-width: 200px; border: 2px solid #dc2626;">
                    {hoursLeft}:00:00
                </div>
                <p class="countdown-label" style="text-align: center; color: #6b7280; font-size: 12px; margin: 8px 0 16px 0;">hrs:min:sec (approximate)</p>
                <div style="text-align: center; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 16px 0;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                        🚨 Your pass expires in approximately {hoursLeft} hours!
                    </p>
                </div>
            </div>`;
    
    // Replace all countdown timer sections
    updatedHTML = updatedHTML.replace(countdownTimerRegex, emailCompatibleCountdown);
    
    // Also replace any remaining JavaScript countdown sections
    const urgencyBoxRegex = /<div class="highlight-box">[\s\S]*?<\/script>[\s\S]*?<\/div>/g;
    const emailCompatibleUrgencyBox = `
            <div class="highlight-box" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                <p style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0;">
                    ⏰ Your ELocalPass expires in approximately {hoursLeft} hours - Don't miss out on amazing local experiences!
                </p>
            </div>`;
    
    updatedHTML = updatedHTML.replace(urgencyBoxRegex, emailCompatibleUrgencyBox);
    
    console.log(`📧 Updated template length: ${updatedHTML.length} characters`);
    console.log(`🔧 Removed JavaScript: ${!updatedHTML.includes('updateCountdown')}`);
    console.log(`✅ Added static countdown: ${updatedHTML.includes('{hoursLeft}:00:00')}`);
    
    // Update the email templates
    emailTemplates.rebuyEmail.customHTML = updatedHTML;
    
    // Save the updated configuration
    await prisma.savedQRConfiguration.update({
      where: { id: lawrence.savedConfig.id },
      data: {
        emailTemplates: JSON.stringify(emailTemplates)
      }
    });
    
    console.log('\n✅ UPDATED LAWRENCE TAYLOR\'S REBUY EMAIL TEMPLATE');
    console.log('📧 Countdown timer is now email-client compatible');
    console.log('⏰ Will show static countdown like "23:00:00 (approximate)"');
    console.log('🚨 Added urgency messaging that works in all email clients');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test the rebuy email again');
    console.log('2. The countdown will now show as static time with urgency messaging');
    console.log('3. This will work in Gmail, Outlook, Apple Mail, and all email clients');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmailCountdown(); 