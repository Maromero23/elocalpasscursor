const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkActualTemplate() {
  try {
    console.log('🔍 CHECKING ACTUAL DEFAULT REBUY TEMPLATE CONTENT\n');
    
    // Get the default rebuy template
    const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!defaultTemplate) {
      console.log('❌ No default rebuy template found');
      return;
    }

    console.log('✅ DEFAULT TEMPLATE FOUND:');
    console.log(`- Name: ${defaultTemplate.name}`);
    console.log(`- Subject: ${defaultTemplate.subject}`);
    console.log(`- HTML Length: ${defaultTemplate.customHTML?.length || 0} characters`);
    console.log(`- Created: ${defaultTemplate.createdAt}`);

    if (defaultTemplate.customHTML) {
      const html = defaultTemplate.customHTML;
      
      console.log('\n🔍 DETAILED CONTENT ANALYSIS:');
      console.log(`- Contains "GRAND OPENING": ${html.includes('GRAND OPENING') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Promotional Video": ${html.includes('Promotional Video') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "promotional": ${html.includes('promotional') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Watch Video": ${html.includes('Watch Video') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Time Remaining": ${html.includes('Time Remaining') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "countdown": ${html.includes('countdown') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "timer": ${html.includes('timer') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Featured Partners": ${html.includes('Featured Partners') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "partners": ${html.includes('partners') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains "Supporting Local Business": ${html.includes('Supporting Local Business') ? '✅ YES' : '❌ NO'}`);

      // Save the full template to a file for inspection
      fs.writeFileSync('actual-rebuy-template.html', html);
      console.log('\n📄 FULL TEMPLATE SAVED TO: actual-rebuy-template.html');

      // Show key sections
      console.log('\n📋 TEMPLATE STRUCTURE:');
      const lines = html.split('\n');
      console.log(`- Total lines: ${lines.length}`);
      
      // Find key sections
      let grandOpeningLine = -1;
      let videoLine = -1;
      let timerLine = -1;
      let partnersLine = -1;
      
      lines.forEach((line, index) => {
        if (line.includes('GRAND OPENING') && grandOpeningLine === -1) {
          grandOpeningLine = index + 1;
        }
        if ((line.includes('Promotional Video') || line.includes('promotional')) && videoLine === -1) {
          videoLine = index + 1;
        }
        if ((line.includes('Time Remaining') || line.includes('countdown')) && timerLine === -1) {
          timerLine = index + 1;
        }
        if ((line.includes('Featured Partners') || line.includes('partners')) && partnersLine === -1) {
          partnersLine = index + 1;
        }
      });

      console.log(`- GRAND OPENING found at line: ${grandOpeningLine > 0 ? grandOpeningLine : 'NOT FOUND'}`);
      console.log(`- Promotional Video found at line: ${videoLine > 0 ? videoLine : 'NOT FOUND'}`);
      console.log(`- Time Remaining found at line: ${timerLine > 0 ? timerLine : 'NOT FOUND'}`);
      console.log(`- Featured Partners found at line: ${partnersLine > 0 ? partnersLine : 'NOT FOUND'}`);

      // Show the actual content around key sections
      if (grandOpeningLine > 0) {
        console.log('\n🎪 GRAND OPENING SECTION:');
        const start = Math.max(0, grandOpeningLine - 3);
        const end = Math.min(lines.length, grandOpeningLine + 3);
        for (let i = start; i < end; i++) {
          console.log(`${i + 1}: ${lines[i]}`);
        }
      }

      if (videoLine > 0) {
        console.log('\n📹 VIDEO SECTION:');
        const start = Math.max(0, videoLine - 3);
        const end = Math.min(lines.length, videoLine + 3);
        for (let i = start; i < end; i++) {
          console.log(`${i + 1}: ${lines[i]}`);
        }
      }

      // Check if template ends abruptly
      console.log('\n🔚 TEMPLATE ENDING:');
      const lastLines = lines.slice(-10);
      lastLines.forEach((line, index) => {
        console.log(`${lines.length - 10 + index + 1}: ${line}`);
      });

      console.log('\n💡 DIAGNOSIS:');
      if (grandOpeningLine === -1 && videoLine === -1 && timerLine === -1 && partnersLine === -1) {
        console.log('❌ The template in the database does NOT contain the components from your preview');
        console.log('🤔 This suggests the preview is showing a different template or cached version');
      } else {
        console.log('✅ The template contains the expected components');
        console.log('🤔 The issue might be in the email sending or processing');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualTemplate(); 