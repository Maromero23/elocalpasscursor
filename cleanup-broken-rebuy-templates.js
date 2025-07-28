const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupBrokenTemplates() {
  try {
    console.log('🧹 CLEANING UP BROKEN REBUY TEMPLATES\n');
    
    // Get all templates
    const allTemplates = await prisma.rebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${allTemplates.length} total templates\n`);

    // Identify broken templates (those with invalid JSON in headerText)
    const brokenTemplates = [];
    const validTemplates = [];

    for (const template of allTemplates) {
      if (template.headerText) {
        try {
          JSON.parse(template.headerText);
          validTemplates.push(template);
          console.log(`✅ Valid: "${template.name}" (${template.id})`);
        } catch (error) {
          brokenTemplates.push(template);
          console.log(`❌ Broken: "${template.name}" (${template.id}) - Invalid JSON`);
        }
      } else {
        validTemplates.push(template);
        console.log(`⚠️ No config: "${template.name}" (${template.id}) - No headerText`);
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`- Valid templates: ${validTemplates.length}`);
    console.log(`- Broken templates: ${brokenTemplates.length}`);

    if (brokenTemplates.length === 0) {
      console.log('\n✅ No broken templates found! Database is clean.');
      return;
    }

    console.log(`\n🗑️ DELETING ${brokenTemplates.length} BROKEN TEMPLATES:`);

    for (const template of brokenTemplates) {
      if (template.isDefault) {
        console.log(`⚠️ Skipping default template: "${template.name}" (${template.id})`);
        continue;
      }

      console.log(`🗑️ Deleting: "${template.name}" (${template.id})`);
      
      await prisma.rebuyEmailTemplate.delete({
        where: { id: template.id }
      });
      
      console.log(`✅ Deleted: "${template.name}"`);
    }

    console.log('\n🎉 CLEANUP COMPLETE!');
    
    // Verify cleanup
    const remainingTemplates = await prisma.rebuyEmailTemplate.findMany();
    console.log(`📊 Remaining templates: ${remainingTemplates.length}`);
    
    remainingTemplates.forEach((template, index) => {
      console.log(`${index + 1}. "${template.name}" - ${template.isDefault ? 'DEFAULT' : 'CUSTOM'} (${template.id})`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBrokenTemplates(); 