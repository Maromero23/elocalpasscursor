const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateWelcomeChange() {
  try {
    console.log('🕵️ INVESTIGATING WELCOME EMAIL SYSTEM CHANGES\n');
    
    // Get recent QR codes to see when welcome emails stopped working
    console.log('📊 ANALYZING RECENT QR CODES (Last 10):');
    console.log('='.repeat(60));
    
    const recentQRs = await prisma.qRCode.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    });
    
    for (const qr of recentQRs) {
      console.log(`\n📋 ${qr.code}`);
      console.log(`- Created: ${qr.createdAt}`);
      console.log(`- Customer: ${qr.customerName} (${qr.customerEmail})`);
      console.log(`- Seller: ${qr.seller?.name || 'Unknown'}`);
      
      if (qr.analytics) {
        console.log(`- Welcome email sent: ${qr.analytics.welcomeEmailSent ? '✅ YES' : '❌ NO'}`);
      } else {
        console.log(`- Analytics: ❌ MISSING`);
      }
      
      // Check seller config
      if (qr.seller?.savedConfig) {
        try {
          const config = JSON.parse(qr.seller.savedConfig.config);
          console.log(`- Config: ${qr.seller.savedConfig.name}`);
          console.log(`- Welcome enabled: ${config.button1SendWelcomeEmail === true ? '✅ YES' : config.button1SendWelcomeEmail === false ? '❌ NO' : '⚠️ UNDEFINED'}`);
        } catch (e) {
          console.log(`- Config: ❌ PARSE ERROR`);
        }
      } else {
        console.log(`- Config: ❌ MISSING`);
      }
    }
    
    // Check if there are any recent code changes to welcome email APIs
    console.log('\n\n🔍 CHECKING WELCOME EMAIL API ENDPOINTS:');
    console.log('='.repeat(50));
    
    // Test if the welcome email API exists and is working
    console.log('📡 Testing welcome email API endpoint...');
    
    try {
      const response = await fetch('https://elocalpasscursor.vercel.app/api/send-welcome-email', {
        method: 'GET'
      });
      
      console.log(`- API Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log('❌ CRITICAL: Welcome email API endpoint not found!');
        console.log('   This could explain why welcome emails stopped working.');
      } else if (response.status === 405) {
        console.log('✅ API endpoint exists (Method Not Allowed is expected for GET)');
      } else {
        const text = await response.text();
        console.log(`- Response: ${text.substring(0, 200)}...`);
      }
      
    } catch (fetchError) {
      console.log(`❌ Network error testing API: ${fetchError.message}`);
    }
    
    // Check for patterns in when welcome emails stopped working
    console.log('\n\n📈 PATTERN ANALYSIS:');
    console.log('='.repeat(40));
    
    const workingEmails = recentQRs.filter(qr => qr.analytics?.welcomeEmailSent);
    const notWorkingEmails = recentQRs.filter(qr => qr.analytics && !qr.analytics.welcomeEmailSent);
    
    console.log(`✅ QR codes with welcome emails sent: ${workingEmails.length}`);
    console.log(`❌ QR codes without welcome emails: ${notWorkingEmails.length}`);
    
    if (workingEmails.length > 0) {
      const lastWorking = workingEmails[0];
      console.log(`\n📅 Last working welcome email:`);
      console.log(`- QR Code: ${lastWorking.code}`);
      console.log(`- Created: ${lastWorking.createdAt}`);
    }
    
    if (notWorkingEmails.length > 0) {
      const firstNotWorking = notWorkingEmails[notWorkingEmails.length - 1];
      console.log(`\n📅 First non-working welcome email:`);
      console.log(`- QR Code: ${firstNotWorking.code}`);
      console.log(`- Created: ${firstNotWorking.createdAt}`);
    }
    
    // Check if the issue is with a specific seller configuration
    console.log('\n\n👥 SELLER CONFIGURATION ANALYSIS:');
    console.log('='.repeat(45));
    
    const sellerStats = {};
    for (const qr of recentQRs) {
      const sellerName = qr.seller?.name || 'Unknown';
      if (!sellerStats[sellerName]) {
        sellerStats[sellerName] = { total: 0, working: 0 };
      }
      sellerStats[sellerName].total++;
      if (qr.analytics?.welcomeEmailSent) {
        sellerStats[sellerName].working++;
      }
    }
    
    Object.entries(sellerStats).forEach(([seller, stats]) => {
      console.log(`📊 ${seller}: ${stats.working}/${stats.total} welcome emails sent`);
    });
    
    console.log('\n🔍 POSSIBLE CAUSES:');
    console.log('1. Welcome email API endpoint was moved/deleted');
    console.log('2. QR creation process stopped calling welcome email API');
    console.log('3. Email service configuration changed');
    console.log('4. Seller configuration was modified');
    console.log('5. Database schema change affected welcome email logic');
    console.log('6. Recent deployment broke welcome email functionality');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateWelcomeChange(); 