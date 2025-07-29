const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndUpdateDefaultTemplate() {
  try {
    console.log('🔍 Checking for real default template data...')
    
    // First, let's see what's currently in the database
    const currentDefault = await prisma.landingPageTemplate.findFirst({
      where: { isDefault: true }
    })
    
    if (currentDefault) {
      console.log('📋 Current default template in database:')
      console.log('Name:', currentDefault.name)
      console.log('Header:', currentDefault.headerText)
      console.log('Description:', currentDefault.descriptionText)
      console.log('Logo URL:', currentDefault.logoUrl)
      console.log('Primary Color:', currentDefault.primaryColor)
      console.log('Secondary Color:', currentDefault.secondaryColor)
      console.log('Background Color:', currentDefault.backgroundColor)
    }
    
    // Now let's check if there are any other landing page templates
    const allTemplates = await prisma.landingPageTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('\n📋 All landing page templates in database:')
    allTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (Default: ${template.isDefault})`)
      console.log(`   Header: ${template.headerText}`)
      console.log(`   Created: ${template.createdAt}`)
      console.log('')
    })
    
    // Let's also check if there are any saved configurations that might have the real template
    const savedConfigs = await prisma.savedQRConfiguration.findMany({
      where: {
        landingPageConfig: {
          not: null
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📋 Recent saved configurations with landing page data:')
    savedConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`)
      try {
        const landingConfig = JSON.parse(config.landingPageConfig)
        if (landingConfig.headerText) {
          console.log(`   Header: ${landingConfig.headerText}`)
        }
        if (landingConfig.descriptionText) {
          console.log(`   Description: ${landingConfig.descriptionText}`)
        }
      } catch (e) {
        console.log(`   Error parsing landing config: ${e.message}`)
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndUpdateDefaultTemplate() 