const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/elocalpass"
    }
  }
})

async function debugEmailTemplateLoading() {
  try {
    console.log('🔍 Debugging email template loading...')
    
    // Simulate what the email service does
    console.log('\n📧 STEP 1: Finding default template...')
    const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { isDefault: true }
    })
    
    if (defaultTemplate) {
      console.log('✅ Found default template:')
      console.log('- ID:', defaultTemplate.id)
      console.log('- Name:', defaultTemplate.name)
      console.log('- Subject:', defaultTemplate.subject)
      console.log('- Is Default:', defaultTemplate.isDefault)
      console.log('- Custom HTML exists:', !!defaultTemplate.customHTML)
      console.log('- Custom HTML length:', defaultTemplate.customHTML?.length || 0)
      
      if (defaultTemplate.customHTML) {
        console.log('\n📄 Custom HTML preview (first 200 chars):')
        console.log(defaultTemplate.customHTML.substring(0, 200))
        
        // Test the replacement logic
        console.log('\n🔧 Testing replacement logic...')
        let processedTemplate = defaultTemplate.customHTML
          .replace(/\{customerName\}/g, 'Test Customer')
          .replace(/\{qrCode\}/g, 'TEST123')
          .replace(/\{guests\}/g, '2')
          .replace(/\{days\}/g, '3')
          .replace(/\{expirationDate\}/g, '2025-07-24')
          .replace(/\{magicLink\}/g, 'https://test.com')
          .replace(/\{customerPortalUrl\}/g, 'https://test.com')
        
        console.log('✅ Template processed successfully')
        console.log('- Processed length:', processedTemplate.length)
        console.log('- Contains turquoise:', processedTemplate.includes('turquoise') || processedTemplate.includes('#ea15f9'))
        console.log('- Contains pink:', processedTemplate.includes('pink') || processedTemplate.includes('#f915cf'))
      } else {
        console.log('❌ Default template has no customHTML!')
      }
    } else {
      console.log('❌ No default template found!')
    }
    
    // Also check if there are multiple default templates
    console.log('\n📧 STEP 2: Checking for multiple default templates...')
    const allDefaultTemplates = await prisma.welcomeEmailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${allDefaultTemplates.length} default templates:`)
    allDefaultTemplates.forEach((template, index) => {
      console.log(`- Template ${index + 1}:`)
      console.log(`  - ID: ${template.id}`)
      console.log(`  - Name: ${template.name}`)
      console.log(`  - Created: ${template.createdAt}`)
      console.log(`  - HTML length: ${template.customHTML?.length || 0}`)
      console.log(`  - HTML preview: ${template.customHTML?.substring(0, 50) || 'No HTML'}...`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmailTemplateLoading() 