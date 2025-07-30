const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHTML() {
  try {
    const template = await prisma.rebuyEmailTemplate.findFirst({
      where: { name: { contains: 'Paypal Rebuy Email 3' } }
    });
    
    if (template) {
      console.log('Checking HTML content...');
      console.log('Contains "Don\'t miss out!" (lowercase):', template.customHTML.includes("Don't miss out!"));
      console.log('Contains "Don\'t Miss Out!" (title case):', template.customHTML.includes("Don't Miss Out!"));
      
      // Find the actual header content
      const headerMatch = template.customHTML.match(/<h1[^>]*>(.*?)<\/h1>/);
      if (headerMatch) {
        console.log('Actual header in HTML:', headerMatch[1]);
      } else {
        console.log('No h1 header found');
      }
      
      // Show first 1000 chars to see the structure
      console.log('First 1000 chars of HTML:');
      console.log(template.customHTML.substring(0, 1000));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHTML();
