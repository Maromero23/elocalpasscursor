const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicateDefaults() {
  try {
    console.log('🧹 Cleaning up duplicate default landing page templates...')
    
    // Find all templates named "DEFAULT LANDING PAGE 1"
    const defaultTemplates = await prisma.landingPageTemplate.findMany({
      where: { name: 'DEFAULT LANDING PAGE 1' },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${defaultTemplates.length} templates named "DEFAULT LANDING PAGE 1"`)
    
    if (defaultTemplates.length > 1) {
      // Keep the most recent one, delete the rest
      const keepTemplate = defaultTemplates[0]
      const deleteTemplates = defaultTemplates.slice(1)
      
      console.log(`Keeping template: ${keepTemplate.id} (created: ${keepTemplate.createdAt})`)
      console.log(`Deleting ${deleteTemplates.length} duplicate templates...`)
      
      // Delete the duplicates
      for (const template of deleteTemplates) {
        await prisma.landingPageTemplate.delete({
          where: { id: template.id }
        })
        console.log(`✅ Deleted duplicate template: ${template.id}`)
      }
      
      // Make sure the kept template is marked as default
      await prisma.landingPageTemplate.update({
        where: { id: keepTemplate.id },
        data: { isDefault: true }
      })
      
      console.log(`✅ Set template ${keepTemplate.id} as the default`)
      console.log('🎯 Cleanup completed successfully!')
      
    } else if (defaultTemplates.length === 1) {
      console.log('✅ Only one default template found, no cleanup needed')
      
      // Make sure it's marked as default
      await prisma.landingPageTemplate.update({
        where: { id: defaultTemplates[0].id },
        data: { isDefault: true }
      })
      
    } else {
      console.log('❌ No default templates found')
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateDefaults() 