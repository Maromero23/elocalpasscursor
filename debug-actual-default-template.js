const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDefaultTemplate() {
  try {
    console.log('🔍 DEBUGGING DEFAULT REBUY TEMPLATE\n');
    
    // Get the default rebuy template
    const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!defaultTemplate) {
      console.log('❌ No default rebuy template found!');
      return;
    }

    console.log('✅ DEFAULT REBUY TEMPLATE FOUND:');
    console.log(`- Name: ${defaultTemplate.name}`);
    console.log(`- ID: ${defaultTemplate.id}`);
    console.log(`- Is Default: ${defaultTemplate.isDefault}`);
    console.log(`- Created: ${defaultTemplate.createdAt}`);
    console.log(`- Subject: ${defaultTemplate.subject}`);
    console.log(`- HTML Length: ${defaultTemplate.customHTML?.length || 0} characters`);

    if (defaultTemplate.customHTML) {
      console.log('\n🔍 CONTENT ANALYSIS:');
      
      // Check for key sections
      const html = defaultTemplate.customHTML;
      
      console.log(`- Contains "GRAND OPENING": ${html.includes('GRAND OPENING') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "promotional": ${html.includes('promotional') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "video": ${html.includes('video') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "countdown": ${html.includes('countdown') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "timer": ${html.includes('timer') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Time Remaining": ${html.includes('Time Remaining') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Featured Partners": ${html.includes('Featured Partners') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "partners": ${html.includes('partners') ? '✅ YES' : '❌ NO'}`);
      
      console.log('\n📄 FIRST 500 CHARACTERS:');
      console.log(html.substring(0, 500));
      console.log('\n📄 LAST 500 CHARACTERS:');
      console.log(html.substring(Math.max(0, html.length - 500)));
      
      // Look for specific sections
      const grandOpeningIndex = html.indexOf('GRAND OPENING');
      if (grandOpeningIndex !== -1) {
        console.log('\n🎯 GRAND OPENING SECTION FOUND AT INDEX:', grandOpeningIndex);
        console.log('Context around GRAND OPENING:');
        console.log(html.substring(Math.max(0, grandOpeningIndex - 100), grandOpeningIndex + 200));
      }
      
      const videoIndex = html.toLowerCase().indexOf('video');
      if (videoIndex !== -1) {
        console.log('\n🎯 VIDEO SECTION FOUND AT INDEX:', videoIndex);
        console.log('Context around video:');
        console.log(html.substring(Math.max(0, videoIndex - 100), videoIndex + 200));
      }
    } else {
      console.log('❌ No HTML content in template!');
    }

    // Also check if there are multiple default templates
    const allDefaults = await prisma.rebuyEmailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 TOTAL DEFAULT TEMPLATES: ${allDefaults.length}`);
    if (allDefaults.length > 1) {
      console.log('⚠️ Multiple default templates found:');
      allDefaults.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name} - ${template.customHTML?.length || 0} chars - ${template.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDefaultTemplate(); 