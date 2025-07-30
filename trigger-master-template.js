const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerMasterTemplate() {
  try {
    console.log('🔍 Looking for QR code: PASS_1753840791144_k8qqx1jia');
    
    // Find the QR code by the code field
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'PASS_1753840791144_k8qqx1jia'
      }
    });
    
    if (!qrCode) {
      console.log('❌ QR code not found');
      return;
    }
    
    console.log('✅ Found QR code:', qrCode.id);
    console.log('   Customer Email:', qrCode.customerEmail);
    console.log('   Customer Name:', qrCode.customerName);
    console.log('   Created:', qrCode.createdAt);
    
    // Check if MASTER PAYPAL DEFAULT REBUY EMAIL template exists
    console.log('🔍 Checking "MASTER PAYPAL DEFAULT REBUY EMAIL" template...');
    const template = await prisma.rebuyEmailTemplate.findFirst({
      where: { 
        name: { contains: 'MASTER PAYPAL DEFAULT REBUY EMAIL' }
      }
    });
    
    if (template) {
      console.log('✅ Found master template:', template.name);
      console.log('   HTML Length:', template.customHTML.length);
      
      // Parse the config to see what's saved
      try {
        const config = JSON.parse(template.headerText);
        console.log('   emailHeader:', config.emailHeader);
        console.log('   emailSubject:', config.emailSubject);
      } catch (e) {
        console.log('   Could not parse config');
      }
    } else {
      console.log('❌ MASTER PAYPAL DEFAULT REBUY EMAIL template not found');
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

triggerMasterTemplate();
