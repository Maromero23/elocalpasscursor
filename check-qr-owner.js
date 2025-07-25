const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQROwner() {
  try {
    console.log('🔍 CHECKING QR CODE OWNERSHIP...\n');
    
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        code: 'EL-1753472701299-u6guamav2'
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
    
    if (!qrCode) {
      console.log('❌ QR Code not found');
      return;
    }
    
    console.log('📋 QR CODE DETAILS:');
    console.log('- QR Code:', qrCode.code);
    console.log('- Customer:', qrCode.customerName, '(' + qrCode.customerEmail + ')');
    console.log('- Seller ID:', qrCode.sellerId);
    console.log('- Seller Name:', qrCode.seller?.name || 'No seller');
    console.log('- Seller Email:', qrCode.seller?.email || 'No email');
    console.log('- Created:', qrCode.createdAt);
    
    console.log('\n🔧 SELLER CONFIGURATION:');
    if (qrCode.seller?.savedConfig) {
      console.log('- Config ID:', qrCode.seller.savedConfig.id);
      console.log('- Config Name:', qrCode.seller.savedConfig.name);
      
      const config = JSON.parse(qrCode.seller.savedConfig.config);
      console.log('- Rebuy enabled:', config.button5SendRebuyEmail ? '✅ YES' : '❌ NO');
      
      const emailTemplates = JSON.parse(qrCode.seller.savedConfig.emailTemplates);
      console.log('- Has rebuy template:', !!emailTemplates?.rebuyEmail);
      console.log('- Template type:', emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE' ? 'Default' : 'Custom');
      
      if (emailTemplates?.rebuyEmail?.customHTML && emailTemplates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
        console.log('- Template length:', emailTemplates.rebuyEmail.customHTML.length, 'characters');
        
        // Check if this is the OLD template or NEW enhanced template
        const html = emailTemplates.rebuyEmail.customHTML;
        const hasEnhancedComponents = {
          bannerImages: html.includes('banner-images') && html.includes('bannerImages.map'),
          videoSection: html.includes('Promotional Video'),
          currentPassDetails: html.includes('Your Current ELocalPass Details'),
          urgencyNotice: html.includes('highlight-box'),
          discountBanner: html.includes('discount-banner'),
          featuredPartners: html.includes('featured-partners'),
          sellerTracking: html.includes('Supporting Local Business')
        };
        
        console.log('\n🔍 TEMPLATE ANALYSIS:');
        Object.entries(hasEnhancedComponents).forEach(([component, hasComponent]) => {
          console.log(`- ${component}:`, hasComponent ? '✅ YES' : '❌ NO');
        });
        
        const enhancedCount = Object.values(hasEnhancedComponents).filter(Boolean).length;
        console.log(`\n📊 Enhanced components: ${enhancedCount}/7`);
        
        if (enhancedCount < 7) {
          console.log('🚨 PROBLEM: This is an OLD template without all enhanced components!');
          console.log('💡 SOLUTION: Need to regenerate with the enhanced template from the rebuy config form.');
        } else {
          console.log('✅ This template has all enhanced components!');
        }
      }
    } else {
      console.log('- No saved configuration found');
    }
    
    console.log('\n🎯 WHO CREATED THIS QR?');
    if (qrCode.sellerId) {
      console.log('✅ This QR was created by seller:', qrCode.seller?.name);
      console.log('📧 Using seller\'s custom email template configuration');
      console.log('🔧 Template source: seller\'s savedConfig.emailTemplates.rebuyEmail');
    } else {
      console.log('✅ This QR was created via PayPal/passes route (no seller)');
      console.log('📧 Would use PayPal template (but PayPal QRs don\'t send rebuy emails)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQROwner(); 