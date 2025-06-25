const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDefaultTemplates() {
  try {
    console.log('🔍 CHECKING ALL DEFAULT REBUY TEMPLATES...\n');
    
    // Get ALL default templates (there should only be one)
    const allDefaultTemplates = await prisma.rebuyEmailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log('📊 ALL DEFAULT TEMPLATES:');
    console.log('Count:', allDefaultTemplates.length);
    
    allDefaultTemplates.forEach((template, index) => {
      console.log(`\nTemplate ${index + 1}:`);
      console.log('- ID:', template.id);
      console.log('- Subject:', template.subject);
      console.log('- HTML Length:', template.customHTML?.length || 0, 'characters');
      console.log('- Created:', template.createdAt);
      console.log('- Updated:', template.updatedAt);
      console.log('- Is Default:', template.isDefault);
    });
    
    // Find the one with actual content (should be the latest)
    const workingTemplate = allDefaultTemplates.find(t => t.customHTML && t.customHTML.length > 100);
    const emptyTemplates = allDefaultTemplates.filter(t => !t.customHTML || t.customHTML.length < 100);
    
    if (workingTemplate && emptyTemplates.length > 0) {
      console.log('\n🔧 FIXING DEFAULT TEMPLATES...');
      console.log('Working template ID:', workingTemplate.id, '(', workingTemplate.customHTML?.length, 'characters )');
      console.log('Empty templates to remove:', emptyTemplates.map(t => t.id));
      
      // Remove empty default templates
      for (const emptyTemplate of emptyTemplates) {
        await prisma.rebuyEmailTemplate.update({
          where: { id: emptyTemplate.id },
          data: { isDefault: false }
        });
        console.log('✅ Removed default flag from empty template:', emptyTemplate.id);
      }
      
      console.log('\n✅ Fixed! Now only the working template is marked as default.');
    } else if (allDefaultTemplates.length === 1) {
      console.log('\n✅ Only one default template found - no fix needed');
    } else {
      console.log('\n⚠️ No working template found or multiple working templates');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDefaultTemplates(); 