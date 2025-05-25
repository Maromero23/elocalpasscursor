import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLandingTemplates() {
  console.log('🌱 Seeding landing page templates...')

  try {
    // Create default template based on elocalpass.com style
    const defaultTemplate = await prisma.landingPageTemplate.upsert({
      where: { id: 'default-template' },
      update: {},
      create: {
        id: 'default-template',
        name: 'eLocalPass Default',
        logoUrl: null,
        primaryColor: '#f97316', // Orange primary
        secondaryColor: '#fb923c', // Orange secondary
        backgroundColor: '#fef3f2', // Light orange background
        headerText: '¡Bienvenido a tu eLocalPass!',
        descriptionText: 'Tu pase local para descubrir experiencias increíbles en nuestra ciudad. Válido para múltiples establecimientos y experiencias únicas. Disfruta de descuentos especiales, acceso preferencial y mucho más.',
        ctaButtonText: 'Confirmar mi Pass',
        showPayPal: true,
        showContactForm: true,
        customCSS: null,
        isDefault: true
      }
    })

    // Create a premium template variation
    const premiumTemplate = await prisma.landingPageTemplate.upsert({
      where: { id: 'premium-template' },
      update: {},
      create: {
        id: 'premium-template',
        name: 'Premium Experience',
        logoUrl: null,
        primaryColor: '#1d4ed8', // Blue primary
        secondaryColor: '#3b82f6', // Blue secondary
        backgroundColor: '#eff6ff', // Light blue background
        headerText: '🌟 Premium eLocalPass Experience',
        descriptionText: 'Eleva tu experiencia local con acceso VIP a los mejores lugares de la ciudad. Incluye beneficios exclusivos, atención personalizada y experiencias que no encontrarás en ningún otro lugar.',
        ctaButtonText: 'Activar Pass Premium',
        showPayPal: true,
        showContactForm: true,
        customCSS: `
          .premium-glow {
            box-shadow: 0 0 20px rgba(29, 78, 216, 0.3);
          }
          .premium-badge {
            background: linear-gradient(45deg, #1d4ed8, #3b82f6);
            animation: pulse 2s ease-in-out infinite alternate;
          }
        `,
        isDefault: false
      }
    })

    // Create a minimal template
    const minimalTemplate = await prisma.landingPageTemplate.upsert({
      where: { id: 'minimal-template' },
      update: {},
      create: {
        id: 'minimal-template',
        name: 'Clean & Minimal',
        logoUrl: null,
        primaryColor: '#374151', // Gray primary
        secondaryColor: '#6b7280', // Gray secondary
        backgroundColor: '#f9fafb', // Light gray background
        headerText: 'Tu Pass está listo',
        descriptionText: 'Acceso simple y directo a experiencias locales. Sin complicaciones, solo disfruta.',
        ctaButtonText: 'Activar',
        showPayPal: false,
        showContactForm: false,
        customCSS: `
          .minimal-card {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
        `,
        isDefault: false
      }
    })

    console.log('✅ Landing page templates seeded successfully!')
    console.log(`• Default template: ${defaultTemplate.name}`)
    console.log(`• Premium template: ${premiumTemplate.name}`)
    console.log(`• Minimal template: ${minimalTemplate.name}`)

  } catch (error) {
    console.error('❌ Error seeding landing page templates:', error)
    throw error
  }
}

async function main() {
  await seedLandingTemplates()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
