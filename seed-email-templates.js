const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedEmailTemplates() {
  try {
    // Check if default Welcome Email Template exists
    let welcomeTemplate = await prisma.welcomeEmailTemplate.findFirst({
      where: { isDefault: true }
    })

    if (!welcomeTemplate) {
      welcomeTemplate = await prisma.welcomeEmailTemplate.create({
        data: {
          name: 'Default Welcome Template',
          subject: 'Welcome to ELocalPass! Your Pass is Ready',
          logoUrl: null,
          headerText: 'Welcome to Your ELocalPass Experience!',
          bodyText: 'Thank you for choosing ELocalPass. Your pass is ready to use and will give you access to amazing local experiences. Present this pass at participating businesses to enjoy exclusive benefits.',
          footerText: 'Enjoy your local experiences with ELocalPass!',
          primaryColor: '#f97316',
          backgroundColor: '#ffffff',
          buttonColor: '#f97316',
          buttonText: 'View Your Pass',
          customHTML: null,
          isDefault: true
        }
      })
    }

    // Check if default Rebuy Email Template exists
    let rebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true }
    })

    if (!rebuyTemplate) {
      rebuyTemplate = await prisma.rebuyEmailTemplate.create({
        data: {
          name: 'Default Rebuy Template',
          subject: 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
          logoUrl: null,
          headerText: 'Don\'t Let Your Local Adventure End!',
          bodyText: 'Your ELocalPass expires in 12 hours. Don\'t let your local adventure end here! Get another pass to continue discovering amazing local experiences in your area.',
          footerText: 'Thank you for choosing ELocalPass - your local experience partner!',
          primaryColor: '#f97316',
          backgroundColor: '#ffffff',
          buttonColor: '#f97316',
          buttonText: 'Get Another Pass',
          customHTML: null,
          isDefault: true
        }
      })
    }

    console.log('✅ Email templates seeded successfully!')
    console.log(`Welcome Template ID: ${welcomeTemplate.id}`)
    console.log(`Rebuy Template ID: ${rebuyTemplate.id}`)

  } catch (error) {
    console.error('❌ Error seeding email templates:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedEmailTemplates()
