const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDefaultTemplateLoading() {
  try {
    console.log('🧪 TESTING DEFAULT TEMPLATE LOADING (same as rebuy email API)...\n');
    
    // Simulate what the rebuy email API does
    const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    });
    
    console.log('📊 API SIMULATION RESULTS:');
    if (defaultRebuyTemplate) {
      console.log('✅ Default template found:');
      console.log('- ID:', defaultRebuyTemplate.id);
      console.log('- Subject:', defaultRebuyTemplate.subject);
      console.log('- HTML Length:', defaultRebuyTemplate.customHTML?.length || 0, 'characters');
      console.log('- Has HTML content:', !!defaultRebuyTemplate.customHTML);
      
      if (defaultRebuyTemplate.customHTML && defaultRebuyTemplate.customHTML.length > 0) {
        console.log('✅ HTML content available - rebuy emails should work!');
        console.log('- HTML preview (first 200 chars):');
        console.log(defaultRebuyTemplate.customHTML.substring(0, 200) + '...');
      } else {
        console.log('❌ No HTML content - rebuy emails will use fallback');
      }
    } else {
      console.log('❌ No default template found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDefaultTemplateLoading(); 