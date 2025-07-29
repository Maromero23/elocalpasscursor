const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugEmptyRebuyEmails() {
  console.log('🔍 DEBUGGING EMPTY REBUY EMAILS')
  
  try {
    // Check both QR codes
    const qrCodes = [
      'EL-1753738633665-gokgzt5cu', // immediate
      'EL-1753738980830-4a42f196c'  // future schedule
    ]
    
    for (const qrId of qrCodes) {
      console.log(`\n📋 CHECKING QR: ${qrId}`)
      
      // Find the QR code
      const qrCode = await prisma.qRCode.findUnique({
        where: { id: qrId },
        include: {
          seller: {
            include: {
              savedConfig: true
            }
          }
        }
      })
      
      if (!qrCode) {
        console.log(`❌ QR code ${qrId} not found`)
        continue
      }
      
      console.log('✅ QR Code Details:', {
        id: qrCode.id,
        customerName: qrCode.customerName,
        customerEmail: qrCode.customerEmail,
        sellerName: qrCode.seller?.name || 'Unknown',
        sellerId: qrCode.sellerId
      })
      
      // Check seller's saved configuration
      if (qrCode.seller?.savedConfig) {
        console.log('✅ Seller has saved config:', {
          id: qrCode.seller.savedConfig.id,
          button4CustomRebuyEmail: qrCode.seller.savedConfig.button4CustomRebuyEmail,
          button4UseDefaultRebuyEmail: qrCode.seller.savedConfig.button4UseDefaultRebuyEmail,
          button4RebuyEmailTemplate: qrCode.seller.savedConfig.button4RebuyEmailTemplate
        })
        
        // Check if it's using custom or default template
        if (qrCode.seller.savedConfig.button4CustomRebuyEmail) {
          console.log('📧 Using CUSTOM rebuy email template')
          console.log('Template content:', qrCode.seller.savedConfig.button4RebuyEmailTemplate)
        } else if (qrCode.seller.savedConfig.button4UseDefaultRebuyEmail) {
          console.log('📧 Using DEFAULT rebuy email template')
        } else {
          console.log('❌ No rebuy email configuration found!')
        }
      } else {
        console.log('❌ Seller has NO saved configuration')
      }
      
      // Check global configuration
      const globalConfig = await prisma.qrGlobalConfig.findFirst()
      if (globalConfig) {
        console.log('🌐 Global config rebuy settings:', {
          button4CustomRebuyEmail: globalConfig.button4CustomRebuyEmail,
          button4UseDefaultRebuyEmail: globalConfig.button4UseDefaultRebuyEmail,
          button4RebuyEmailTemplate: globalConfig.button4RebuyEmailTemplate ? 'Has template' : 'No template'
        })
      }
    }
    
    // Check saved rebuy email templates
    console.log('\n📧 CHECKING SAVED REBUY EMAIL TEMPLATES')
    const savedTemplates = await prisma.savedRebuyEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`Found ${savedTemplates.length} saved templates:`)
    savedTemplates.forEach(template => {
      console.log(`  - ${template.id}: ${template.name} - ${template.customHTML ? 'Has content' : 'Empty'}`)
    })
    
  } catch (error) {
    console.error('❌ Error debugging rebuy emails:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmptyRebuyEmails() 