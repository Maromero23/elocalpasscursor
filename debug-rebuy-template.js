const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRebuyTemplate() {
  try {
    console.log('🔍 DEBUGGING DEFAULT REBUY EMAIL TEMPLATE\n');
    
    // Get the default rebuy template
    const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!defaultRebuyTemplate) {
      console.log('❌ No default rebuy template found in database');
      return;
    }

    console.log('✅ DEFAULT REBUY TEMPLATE FOUND:');
    console.log(`- ID: ${defaultRebuyTemplate.id}`);
    console.log(`- Name: ${defaultRebuyTemplate.name}`);
    console.log(`- Subject: ${defaultRebuyTemplate.subject}`);
    console.log(`- HTML Length: ${defaultRebuyTemplate.customHTML?.length || 0} characters`);
    console.log(`- Created: ${defaultRebuyTemplate.createdAt}`);
    console.log(`- Is Default: ${defaultRebuyTemplate.isDefault}`);

    if (defaultRebuyTemplate.customHTML) {
      console.log('\n📧 TEMPLATE CONTENT ANALYSIS:');
      
      // Check for key sections in the template
      const html = defaultRebuyTemplate.customHTML;
      
      console.log(`- Contains "Don't Miss Out": ${html.includes("Don't Miss Out!") ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains promotional video: ${html.includes('promotional') || html.includes('video') || html.includes('Watch') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains countdown timer: ${html.includes('countdown') || html.includes('timer') || html.includes('Time Remaining') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains featured partners: ${html.includes('Featured Partners') || html.includes('partners') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains {hoursLeft} placeholder: ${html.includes('{hoursLeft}') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains {customerName} placeholder: ${html.includes('{customerName}') ? '✅ YES' : '❌ NO'}`);
      console.log(`- Contains {qrCode} placeholder: ${html.includes('{qrCode}') ? '✅ YES' : '❌ NO'}`);
      
      // Show first 1000 characters
      console.log('\n📄 TEMPLATE HTML (First 1000 chars):');
      console.log('=' .repeat(80));
      console.log(html.substring(0, 1000));
      console.log('=' .repeat(80));
      
      // Show last 1000 characters
      console.log('\n📄 TEMPLATE HTML (Last 1000 chars):');
      console.log('=' .repeat(80));
      console.log(html.substring(Math.max(0, html.length - 1000)));
      console.log('=' .repeat(80));
      
      // Look for potential issues
      console.log('\n🔍 POTENTIAL ISSUES:');
      const issues = [];
      
      if (html.length < 2000) {
        issues.push('Template is very short (< 2000 chars) - might be incomplete');
      }
      
      if (!html.includes('</html>')) {
        issues.push('Template missing closing </html> tag');
      }
      
      if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        issues.push('Template missing HTML document structure');
      }
      
      const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
      if (Math.abs(openTags - closeTags) > 5) {
        issues.push(`Potential unclosed HTML tags (${openTags} open, ${closeTags} close)`);
      }
      
      if (issues.length === 0) {
        console.log('✅ No obvious issues found with template structure');
      } else {
        issues.forEach(issue => console.log(`❌ ${issue}`));
      }
    }

    // Now test the actual processing
    console.log('\n🧪 TESTING PLACEHOLDER REPLACEMENT:');
    
    const testData = {
      customerName: 'peres petiros',
      qrCode: 'EL-1753668721361-7n65cbbat',
      guests: 2,
      days: 1,
      hoursLeft: 24,
      qrExpirationTimestamp: new Date().toISOString(),
      customerPortalUrl: 'https://elocalpasscursor.vercel.app/customer/access?token=test',
      rebuyUrl: 'https://elocalpasscursor.vercel.app/passes'
    };

    let processedHtml = defaultRebuyTemplate.customHTML
      .replace(/\{customerName\}/g, testData.customerName)
      .replace(/\{qrCode\}/g, testData.qrCode)
      .replace(/\{guests\}/g, testData.guests.toString())
      .replace(/\{days\}/g, testData.days.toString())
      .replace(/\{hoursLeft\}/g, testData.hoursLeft.toString())
      .replace(/\{qrExpirationTimestamp\}/g, testData.qrExpirationTimestamp)
      .replace(/\{customerPortalUrl\}/g, testData.customerPortalUrl)
      .replace(/\{rebuyUrl\}/g, testData.rebuyUrl);

    console.log(`- Original length: ${defaultRebuyTemplate.customHTML.length} chars`);
    console.log(`- Processed length: ${processedHtml.length} chars`);
    console.log(`- Length difference: ${processedHtml.length - defaultRebuyTemplate.customHTML.length} chars`);
    
    // Check if placeholders were replaced
    const remainingPlaceholders = (processedHtml.match(/\{[^}]+\}/g) || []);
    console.log(`- Remaining placeholders: ${remainingPlaceholders.length}`);
    if (remainingPlaceholders.length > 0) {
      console.log(`- Unreplaced placeholders: ${remainingPlaceholders.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRebuyTemplate(); 