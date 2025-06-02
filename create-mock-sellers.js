const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createMockSellers() {
  try {
    console.log('🔄 Creating mock sellers...')

    // Hash the password for sellers
    const hashedPassword = await bcrypt.hash('seller123', 12)

    // Create mock sellers
    const sellers = [
      {
        name: 'Maria Rodriguez',
        email: 'maria@elocalpass.com',
        password: hashedPassword,
        role: 'SELLER'
      },
      {
        name: 'Carlos Mendez',
        email: 'carlos@elocalpass.com', 
        password: hashedPassword,
        role: 'SELLER'
      },
      {
        name: 'Ana Gutierrez',
        email: 'ana@elocalpass.com',
        password: hashedPassword,
        role: 'SELLER'
      },
      {
        name: 'David Thompson',
        email: 'david@elocalpass.com',
        password: hashedPassword,
        role: 'SELLER'
      }
    ]

    // Create each seller
    for (const sellerData of sellers) {
      try {
        // Check if seller already exists
        const existingSeller = await prisma.user.findUnique({
          where: { email: sellerData.email }
        })

        if (existingSeller) {
          console.log(`⚠️  Seller ${sellerData.email} already exists - skipping`)
          continue
        }

        const seller = await prisma.user.create({
          data: sellerData
        })

        console.log(`✅ Created seller: ${seller.name} (${seller.email})`)
      } catch (error) {
        console.error(`❌ Error creating seller ${sellerData.email}:`, error.message)
      }
    }

    console.log('\n🎉 Mock sellers creation completed!')
    console.log('\n📋 **Login Credentials for Testing:**')
    console.log('Password for all sellers: seller123')
    console.log('\n📧 **Available Sellers:**')
    sellers.forEach(seller => {
      console.log(`   • ${seller.name} - ${seller.email}`)
    })

  } catch (error) {
    console.error('❌ Error creating mock sellers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMockSellers()
