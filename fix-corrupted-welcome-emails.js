const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCorruptedWelcomeEmails() {
  try {
    console.log('🔧 FIXING CORRUPTED WELCOME EMAIL CONFIGURATIONS...\n');
    
    // Find all configurations with button4=false but corrupted welcome email data
    const corruptedConfigs = await prisma.savedQRConfiguration.findMany({
      where: {
        config: {
          contains: '"button4LandingPageRequired":false'
        }
      }
    });
    
    console.log(`Found ${corruptedConfigs.length} configurations with button4=false`);
    
    let fixedCount = 0;
    
    for (const config of corruptedConfigs) {
      if (config.emailTemplates) {
        try {
          const templates = JSON.parse(config.emailTemplates);
          
          // Check if welcomeEmail is corrupted (false or missing)
          if (templates.welcomeEmail === false || !templates.welcomeEmail) {
            console.log(`\n🔧 FIXING: "${config.name}" (${config.id})`);
            console.log(`   Current welcomeEmail: ${templates.welcomeEmail}`);
            
            // Create the proper default template structure
            const fixedWelcomeEmail = {
              id: `default-template-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: 'ELocalPass Default Template',
              subject: 'Your ELocalPass is Ready - Instant Access',
              content: 'Default ELocalPass welcome email template',
              customHTML: 'USE_DEFAULT_TEMPLATE',
              htmlContent: 'USE_DEFAULT_TEMPLATE',
              emailConfig: { useDefaultEmail: true },
              createdAt: new Date(),
              isActive: true
            };
            
            // Update the templates
            const fixedTemplates = {
              ...templates,
              welcomeEmail: fixedWelcomeEmail
            };
            
            // Save back to database
            await prisma.savedQRConfiguration.update({
              where: { id: config.id },
              data: {
                emailTemplates: JSON.stringify(fixedTemplates)
              }
            });
            
            console.log(`   ✅ FIXED: Added proper default welcome email template`);
            fixedCount++;
          } else {
            console.log(`\n✅ OK: "${config.name}" - welcomeEmail is properly configured`);
          }
        } catch (parseError) {
          console.log(`\n❌ ERROR parsing templates for "${config.name}": ${parseError.message}`);
        }
      } else {
        console.log(`\n🔧 FIXING: "${config.name}" (${config.id}) - NO emailTemplates field`);
        
        // Create complete email templates structure
        const newTemplates = {
          welcomeEmail: {
            id: `default-template-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: 'ELocalPass Default Template',
            subject: 'Your ELocalPass is Ready - Instant Access',
            content: 'Default ELocalPass welcome email template',
            customHTML: 'USE_DEFAULT_TEMPLATE',
            htmlContent: 'USE_DEFAULT_TEMPLATE',
            emailConfig: { useDefaultEmail: true },
            createdAt: new Date(),
            isActive: true
          }
        };
        
        await prisma.savedQRConfiguration.update({
          where: { id: config.id },
          data: {
            emailTemplates: JSON.stringify(newTemplates)
          }
        });
        
        console.log(`   ✅ FIXED: Created complete emailTemplates structure`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   Total configurations checked: ${corruptedConfigs.length}`);
    console.log(`   Configurations fixed: ${fixedCount}`);
    console.log(`   Welcome email system should now be working! 🎉`);
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCorruptedWelcomeEmails(); 