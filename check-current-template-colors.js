const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/elocalpass"
    }
  }
})

async function checkCurrentTemplateColors() {
  try {
    console.log('🔍 Checking current default template colors...')
    
    // Get the newest default template
    const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!defaultTemplate) {
      console.log('❌ No default template found')
      return
    }
    
    console.log('📧 Found default template:')
    console.log('- ID:', defaultTemplate.id)
    console.log('- Name:', defaultTemplate.name)
    console.log('- Created:', defaultTemplate.createdAt)
    console.log('- HTML length:', defaultTemplate.customHTML?.length || 0)
    
    if (defaultTemplate.customHTML) {
      console.log('\n🎨 Color Analysis:')
      
      // Check for specific colors
      const hasTurquoise = defaultTemplate.customHTML.includes('#00') || 
                           defaultTemplate.customHTML.includes('turquoise') ||
                           defaultTemplate.customHTML.includes('#40e0d0') ||
                           defaultTemplate.customHTML.includes('#00ced1')
      
      const hasPink = defaultTemplate.customHTML.includes('#ff') ||
                      defaultTemplate.customHTML.includes('pink') ||
                      defaultTemplate.customHTML.includes('#ff69b4') ||
                      defaultTemplate.customHTML.includes('#ff1493')
      
      const hasOrange = defaultTemplate.customHTML.includes('#ff8c00') ||
                        defaultTemplate.customHTML.includes('orange') ||
                        defaultTemplate.customHTML.includes('#ffa500')
      
      const hasBlue = defaultTemplate.customHTML.includes('#0000ff') ||
                      defaultTemplate.customHTML.includes('blue') ||
                      defaultTemplate.customHTML.includes('#3b82f6')
      
      console.log('- Contains turquoise/cyan:', hasTurquoise)
      console.log('- Contains pink/magenta:', hasPink)
      console.log('- Contains orange:', hasOrange)
      console.log('- Contains blue:', hasBlue)
      
      // Extract specific color values
      const colorMatches = defaultTemplate.customHTML.match(/#[0-9a-fA-F]{6}/g) || []
      console.log('\n🎨 Found color codes:')
      colorMatches.forEach(color => {
        console.log(`  - ${color}`)
      })
      
      // Check for specific color patterns
      const headerColorMatch = defaultTemplate.customHTML.match(/\.header\s*\{\s*[^}]*background-color:\s*([^;]+)/)
      const buttonColorMatch = defaultTemplate.customHTML.match(/\.cta-button\s+a\s*\{\s*[^}]*background-color:\s*([^;]+)/)
      
      if (headerColorMatch) {
        console.log('\n🎨 Header background color:', headerColorMatch[1].trim())
      }
      
      if (buttonColorMatch) {
        console.log('🎨 Button background color:', buttonColorMatch[1].trim())
      }
      
      console.log('\n📄 HTML Preview (first 500 chars):')
      console.log(defaultTemplate.customHTML.substring(0, 500))
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentTemplateColors() 