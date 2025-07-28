const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWelcomeEmails() {
  try {
    console.log('🔍 CHECKING WELCOME EMAIL ISSUES FOR QR CODES\n');
    
    const qrCodes = [
      'EL-1753665722262-4ru5rvxiy',
      'EL-1753666043206-cd20onklu'
    ];
    
    for (const qrCode of qrCodes) {
      console.log(`\n📋 ANALYZING QR CODE: ${qrCode}`);
      console.log('='.repeat(50));
      
      // Get the QR code details
      const qr = await prisma.qRCode.findFirst({
        where: {
          code: qrCode
        },
        include: {
          seller: {
            include: {
              savedConfig: true
            }
          },
          analytics: true
        }
      });

      if (!qr) {
        console.log(`❌ QR Code not found: ${qrCode}`);
        continue;
      }

      console.log(`✅ QR Code found:`);
      console.log(`- Database ID: ${qr.id}`);
      console.log(`- Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`- Seller: ${qr.seller?.name || 'Unknown'}`);
      console.log(`- Created: ${qr.createdAt}`);
      console.log(`- Is Active: ${qr.isActive ? '✅ YES' : '❌ NO'}`);
      console.log(`- Days: ${qr.days}, Guests: ${qr.guests}`);
      
      // Check seller configuration
      if (!qr.seller) {
        console.log(`❌ ISSUE: No seller associated with this QR code`);
        continue;
      }
      
      if (!qr.seller.savedConfig) {
        console.log(`❌ ISSUE: Seller has no saved configuration`);
        continue;
      }
      
      try {
        const config = JSON.parse(qr.seller.savedConfig.config);
        console.log(`\n🔧 SELLER CONFIGURATION:`);
        console.log(`- Config Name: ${qr.seller.savedConfig.name}`);
        console.log(`- Welcome email enabled: ${config.button1SendWelcomeEmail ? '✅ YES' : '❌ NO'}`);
        console.log(`- Rebuy email enabled: ${config.button5SendRebuyEmail ? '✅ YES' : '❌ NO'}`);
        
        if (!config.button1SendWelcomeEmail) {
          console.log(`❌ ISSUE: Welcome emails are DISABLED in seller configuration`);
        }
        
        // Check email templates
        const emailTemplates = qr.seller.savedConfig.emailTemplates ? 
          JSON.parse(qr.seller.savedConfig.emailTemplates) : null;
        
        console.log(`\n📧 EMAIL TEMPLATES:`);
        console.log(`- Has email templates: ${!!emailTemplates}`);
        console.log(`- Has welcome email: ${!!emailTemplates?.welcomeEmail}`);
        console.log(`- Has rebuy email: ${!!emailTemplates?.rebuyEmail}`);
        
        if (emailTemplates?.welcomeEmail) {
          console.log(`- Welcome template length: ${emailTemplates.welcomeEmail.customHTML?.length || 0} chars`);
          console.log(`- Welcome subject: ${emailTemplates.welcomeEmail.subject || 'Not set'}`);
        }
        
      } catch (configError) {
        console.log(`❌ ISSUE: Error parsing seller configuration: ${configError.message}`);
      }
      
      // Check analytics for email tracking
      if (qr.analytics) {
        console.log(`\n📊 ANALYTICS:`);
        console.log(`- Analytics ID: ${qr.analytics.id}`);
        console.log(`- Welcome email sent: ${qr.analytics.welcomeEmailSent ? '✅ YES' : '❌ NO'}`);
        console.log(`- Rebuy email scheduled: ${qr.analytics.rebuyEmailScheduled ? '✅ YES' : '❌ NO'}`);
        console.log(`- Language: ${qr.analytics.language || 'Not set'}`);
      } else {
        console.log(`❌ ISSUE: No analytics record found`);
      }
      
      // Check recent orders for this QR code
      const recentOrders = await prisma.order.findMany({
        where: {
          customerEmail: qr.customerEmail
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      });
      
      console.log(`\n💳 RECENT ORDERS:`);
      if (recentOrders.length === 0) {
        console.log(`- No orders found for this QR code`);
      } else {
        recentOrders.forEach((order, index) => {
          console.log(`- Order ${index + 1}: ${order.id} (${order.status}) - ${order.createdAt}`);
        });
      }
    }
    
    // Check if there are any recent welcome email API calls
    console.log(`\n\n🔍 DEBUGGING SUGGESTIONS:`);
    console.log(`1. Check if welcome emails are enabled in seller configuration`);
    console.log(`2. Verify email templates exist and are valid`);
    console.log(`3. Check if QR creation process calls welcome email API`);
    console.log(`4. Look for email service errors in logs`);
    console.log(`5. Test email delivery manually`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWelcomeEmails(); 