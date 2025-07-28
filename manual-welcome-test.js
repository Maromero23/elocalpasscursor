const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWelcomeEmails() {
  try {
    console.log('🧪 MANUAL WELCOME EMAIL TEST\n');
    
    const qrCodes = [
      'EL-1753665722262-4ru5rvxiy',
      'EL-1753666043206-cd20onklu'
    ];
    
    for (const qrCodeStr of qrCodes) {
      console.log(`\n📧 Testing welcome email for: ${qrCodeStr}`);
      
      // Get QR code
      const qrCode = await prisma.qRCode.findFirst({
        where: { code: qrCodeStr },
        include: {
          seller: {
            include: {
              savedConfig: true
            }
          }
        }
      });
      
      if (!qrCode) {
        console.log(`❌ QR code not found`);
        continue;
      }
      
      console.log(`- Customer: ${qrCode.customerName} (${qrCode.customerEmail})`);
      console.log(`- Seller: ${qrCode.seller?.name}`);
      
      // Test the welcome email API
      console.log(`🔄 Calling welcome email API...`);
      
      try {
        const response = await fetch('https://elocalpasscursor.vercel.app/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            qrCodeId: qrCode.id,
            customerEmail: qrCode.customerEmail,
            customerName: qrCode.customerName,
            qrCode: qrCode.code,
            guests: qrCode.guests,
            days: qrCode.days
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ API Response:`, result);
        } else {
          const errorText = await response.text();
          console.log(`❌ API Error (${response.status}):`, errorText);
        }
        
      } catch (fetchError) {
        console.log(`❌ Network Error:`, fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWelcomeEmails(); 