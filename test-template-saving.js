const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTemplateSaving() {
  try {
    console.log('🔍 TESTING EMAIL TEMPLATE SAVING TO DATABASE...')
    
    // Check current templates in database
    const allTemplates = await prisma.welcomeEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📊 CURRENT TEMPLATES IN DATABASE:')
    console.log('- Total templates:', allTemplates.length)
    
    allTemplates.forEach((template, index) => {
      console.log(`  ${index + 1}. "${template.name}" (ID: ${template.id})`)
      console.log(`     - Subject: ${template.subject}`)
      console.log(`     - Is Default: ${template.isDefault}`)
      console.log(`     - Created: ${template.createdAt}`)
      console.log(`     - Has customHTML: ${!!template.customHTML}`)
      console.log(`     - HTML length: ${template.customHTML?.length || 0}`)
      console.log('')
    })
    
    // Check for default template specifically
    const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('🎯 DEFAULT TEMPLATE STATUS:')
    if (defaultTemplate) {
      console.log('✅ Default template found:')
      console.log(`   - Name: ${defaultTemplate.name}`)
      console.log(`   - Subject: ${defaultTemplate.subject}`)
      console.log(`   - Created: ${defaultTemplate.createdAt}`)
      console.log(`   - HTML length: ${defaultTemplate.customHTML?.length || 0}`)
    } else {
      console.log('❌ No default template found')
    }
    
    console.log('\n📝 NEXT STEPS FOR TESTING:')
    console.log('1. Go to: https://elocalpasscursor.vercel.app/admin/qr-config/email-config?mode=default')
    console.log('2. Create a new template and click "Save Current Email as Template"')
    console.log('3. Name it "Welcome Email Paypal 2323"')
    console.log('4. Run this script again to see if it appears in the database')
    console.log('5. Also test "Save as Default Template" button')
    
  } catch (error) {
    console.error('❌ Error testing template saving:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTemplateSaving() 