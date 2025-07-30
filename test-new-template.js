const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewTemplate() {
  try {
    console.log('🔍 Looking for QR code: PASS_1753816588990_uitoi0cny');
    
    // Find the QR code by the code field
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'PASS_1753816588990_uitoi0cny'
      }
    });
    
    if (!qrCode) {
      console.log('❌ QR code not found');
      return;
    }
    
    console.log('✅ Found QR code:', qrCode.id);
    console.log('   Customer Email:', qrCode.customerEmail);
    
    // Check the new template in database
    console.log('🔍 Checking "Paypal Rebuy Email 3" template...');
    const template = await prisma.rebuyEmailTemplate.findFirst({
      where: { 
        name: { contains: 'Paypal Rebuy Email 3' }
      }
    });
    
    if (template) {
      console.log('✅ Found template:', template.name);
      console.log('   HTML Length:', template.customHTML.length);
      
      // Parse the config to see what's saved
      try {
        const config = JSON.parse(template.headerText);
        console.log('   emailHeader:', config.emailHeader);
        console.log('   emailSubject:', config.emailSubject);
        console.log('   Contains Don\'t Miss Out in HTML:', template.customHTML.includes('Don\'t Miss Out'));
      } catch (e) {
        console.log('   Could not parse config');
      }
    } else {
      console.log('❌ Template not found');
    }
    
    // Now trigger the rebuy email via API
    console.log('🚀 Triggering rebuy email via API...');
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/test-passes-rebuy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrCode: qrCode.code
      })
    });
    
    const result = await response.text();
    console.log('📧 API Response:', response.status, result);
    
    if (response.ok) {
      console.log('✅ Rebuy email triggered successfully!');
      console.log('📧 Check your email:', qrCode.customerEmail);
    } else {
      console.log('❌ Failed to trigger rebuy email');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewTemplate();
