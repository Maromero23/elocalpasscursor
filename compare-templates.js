const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function compareTemplates() {
  try {
    console.log('🔍 Comparing default template with custom landing page configuration...\n')
    
    // Get the default template
    const defaultTemplate = await prisma.landingPageTemplate.findFirst({
      where: { isDefault: true }
    })
    
    if (defaultTemplate) {
      console.log('📋 DEFAULT TEMPLATE ("DEFAULT LANDING PAGE 1"):')
      console.log('Name:', defaultTemplate.name)
      console.log('Header:', defaultTemplate.headerText)
      console.log('Description:', defaultTemplate.descriptionText)
      console.log('CTA Button:', defaultTemplate.ctaButtonText)
      console.log('Primary Color:', defaultTemplate.primaryColor)
      console.log('Secondary Color:', defaultTemplate.secondaryColor)
      console.log('Background Color:', defaultTemplate.backgroundColor)
      console.log('Logo URL:', defaultTemplate.logoUrl)
      console.log('')
    } else {
      console.log('❌ No default template found')
    }
    
    // Get the custom landing page configuration
    const customConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmdnsqmxj0000umvkekdgjw1l' }
    })
    
    if (customConfig) {
      console.log('📋 CUSTOM CONFIGURATION ("landing page custom"):')
      console.log('Name:', customConfig.name)
      console.log('Description:', customConfig.description)
      
      if (customConfig.landingPageConfig) {
        try {
          const landingConfig = typeof customConfig.landingPageConfig === 'string' 
            ? JSON.parse(customConfig.landingPageConfig) 
            : customConfig.landingPageConfig
          
          console.log('Landing Page Config:')
          console.log('  Header:', landingConfig.headerText)
          console.log('  Description:', landingConfig.descriptionText)
          console.log('  CTA Button:', landingConfig.ctaButtonText)
          console.log('  Primary Color:', landingConfig.primaryColor)
          console.log('  Secondary Color:', landingConfig.secondaryColor)
          console.log('  Background Color:', landingConfig.backgroundColor)
          console.log('  Logo URL:', landingConfig.logoUrl)
          console.log('  Form Title:', landingConfig.formTitleText)
          console.log('  Form Instructions:', landingConfig.formInstructionsText)
          console.log('  Footer Disclaimer:', landingConfig.footerDisclaimerText)
          console.log('  Default Guests:', landingConfig.defaultGuests)
          console.log('  Default Days:', landingConfig.defaultDays)
          
          if (landingConfig.temporaryUrls && landingConfig.temporaryUrls.length > 0) {
            console.log('  Temporary URLs:')
            landingConfig.temporaryUrls.forEach((url, index) => {
              console.log(`    ${index + 1}. ${url.name} - ${url.description}`)
            })
          }
        } catch (error) {
          console.log('❌ Error parsing landing page config:', error.message)
        }
      } else {
        console.log('❌ No landing page config found')
      }
      
      console.log('')
    } else {
      console.log('❌ Custom configuration not found')
    }
    
    // Also check what's in the current problematic configuration
    const currentConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: 'cmdntbcw00000uqcc1eephq8y' }
    })
    
    if (currentConfig) {
      console.log('📋 CURRENT PROBLEMATIC CONFIGURATION:')
      console.log('Name:', currentConfig.name)
      
      if (currentConfig.landingPageConfig) {
        try {
          const landingConfig = typeof currentConfig.landingPageConfig === 'string' 
            ? JSON.parse(currentConfig.landingPageConfig) 
            : currentConfig.landingPageConfig
          
          console.log('Current Landing Page Config:')
          console.log('  Header:', landingConfig.headerText)
          console.log('  Description:', landingConfig.descriptionText)
          console.log('  CTA Button:', landingConfig.ctaButtonText)
          console.log('  Primary Color:', landingConfig.primaryColor)
          console.log('  Secondary Color:', landingConfig.secondaryColor)
          console.log('  Background Color:', landingConfig.backgroundColor)
          console.log('  Logo URL:', landingConfig.logoUrl)
        } catch (error) {
          console.log('❌ Error parsing current landing page config:', error.message)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareTemplates() 