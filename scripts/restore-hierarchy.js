const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreHierarchy() {
  try {
    console.log('🔄 Starting database hierarchy restoration...\n')
    
    // 1. Create Admin User
    console.log('1. Creating Admin user...')
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@elocalpass.com' },
      update: {},
      create: {
        email: 'admin@elocalpass.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    })
    console.log('✅ Admin created:', admin.email)
    
    // 2. Create Distributors
    console.log('\n2. Creating Distributors...')
    
    // Distributor 1: Mexico Central Distribution
    const dist1Password = await bcrypt.hash('dist123', 12)
    const dist1User = await prisma.user.create({
      data: {
        email: 'distributor1@elocalpass.com',
        name: 'Mexico Central Rep',
        password: dist1Password,
        role: 'DISTRIBUTOR',
      }
    })
    
    const distributor1 = await prisma.distributor.create({
      data: {
        name: 'Mexico Central Distribution',
        contactPerson: 'Carlos Rodriguez',
        email: 'central@mexicodist.com',
        telephone: '+52 55 1234 5678',
        notes: 'Covers central Mexico including Mexico City and surrounding areas',
        userId: dist1User.id
      }
    })
    
    // Distributor 2: Mexico North Distribution  
    const dist2Password = await bcrypt.hash('dist123', 12)
    const dist2User = await prisma.user.create({
      data: {
        email: 'distributor2@elocalpass.com',
        name: 'Mexico North Rep',
        password: dist2Password,
        role: 'DISTRIBUTOR',
      }
    })
    
    const distributor2 = await prisma.distributor.create({
      data: {
        name: 'Mexico North Distribution',
        contactPerson: 'Maria Gonzalez',
        email: 'north@mexicodist.com',
        telephone: '+52 81 9876 5432',
        notes: 'Covers northern Mexico including Cancun and Caribbean coast',
        userId: dist2User.id
      }
    })
    
    console.log('✅ Distributors created:', distributor1.name, '&', distributor2.name)
    
    // 3. Create Locations
    console.log('\n3. Creating Locations...')
    
    // Location 1: Cancun Beach Resort (under Mexico Central)
    const loc1Password = await bcrypt.hash('loc123', 12)
    const loc1User = await prisma.user.create({
      data: {
        email: 'location1@elocalpass.com',
        name: 'Cancun Resort Manager',
        password: loc1Password,
        role: 'LOCATION',
      }
    })
    
    const location1 = await prisma.location.create({
      data: {
        name: 'Cancun Beach Resort',
        contactPerson: 'Ana Martinez',
        email: 'cancun@resorts.com',
        telephone: '+52 998 123 4567',
        notes: 'Premium beachfront resort with 300 rooms',
        distributorId: distributor1.id,
        userId: loc1User.id
      }
    })
    
    // Location 2: Playa del Carmen Center (under Mexico North)
    const loc2Password = await bcrypt.hash('loc123', 12)
    const loc2User = await prisma.user.create({
      data: {
        email: 'location2@elocalpass.com', 
        name: 'Playa del Carmen Manager',
        password: loc2Password,
        role: 'LOCATION',
      }
    })
    
    const location2 = await prisma.location.create({
      data: {
        name: 'Playa del Carmen Center',
        contactPerson: 'Roberto Silva',
        email: 'playa@playahotels.com',
        telephone: '+52 984 567 8901',
        notes: 'Downtown boutique hotel in Playa del Carmen',
        distributorId: distributor2.id,
        userId: loc2User.id
      }
    })
    
    console.log('✅ Locations created:', location1.name, '&', location2.name)
    
    // 4. Create Sellers
    console.log('\n4. Creating Sellers...')
    
    // Seller 1: Pedrita Gomez (under Cancun Beach Resort)
    const pedritaPassword = await bcrypt.hash('pedrita123', 12)
    const pedrita = await prisma.user.create({
      data: {
        email: 'seller@riucancun.com',
        name: 'Pedrita Gomez',
        password: pedritaPassword,
        role: 'SELLER',
        locationId: location1.id,
        // Keep legacy configuration for now
        configurationId: '1749531549893',
        configurationName: 'sisisisisisisinonoo'
      }
    })
    
    // Seller 2: General Seller (under Cancun Beach Resort)
    const sellerPassword = await bcrypt.hash('seller123', 12)
    const seller = await prisma.user.upsert({
      where: { email: 'seller@elocalpass.com' },
      update: {
        locationId: location1.id  // Update to assign to location
      },
      create: {
        email: 'seller@elocalpass.com',
        name: 'Seller User',
        password: sellerPassword,
        role: 'SELLER',
        locationId: location1.id
      }
    })
    
    // Seller 3: Playa Seller (under Playa del Carmen Center)
    const playaSellerPassword = await bcrypt.hash('playa123', 12)
    const playaSeller = await prisma.user.create({
      data: {
        email: 'seller@playahotels.com',
        name: 'Maria Playa',
        password: playaSellerPassword,
        role: 'SELLER',
        locationId: location2.id
      }
    })
    
    console.log('✅ Sellers created:', pedrita.name, ',', seller.name, '&', playaSeller.name)
    
    // 5. Summary
    console.log('\n📊 RESTORATION SUMMARY:')
    console.log('👥 Admin: 1 user')
    console.log('🏢 Distributors: 2 companies')
    console.log('📍 Locations: 2 locations')
    console.log('💼 Sellers: 3 sellers')
    
    console.log('\n🔑 LOGIN CREDENTIALS:')
    console.log('📧 Admin: admin@elocalpass.com / admin123')
    console.log('📧 Pedrita: seller@riucancun.com / pedrita123')
    console.log('📧 General Seller: seller@elocalpass.com / seller123')
    console.log('📧 Playa Seller: seller@playahotels.com / playa123')
    
    console.log('\n🎯 HIERARCHY STRUCTURE:')
    console.log('├── Mexico Central Distribution')
    console.log('│   └── Cancun Beach Resort')
    console.log('│       ├── Pedrita Gomez (with sisisisisisisinonoo config)')
    console.log('│       └── Seller User')
    console.log('└── Mexico North Distribution')
    console.log('    └── Playa del Carmen Center')
    console.log('        └── Maria Playa')
    
    console.log('\n🎉 Database hierarchy restoration completed successfully!')
    
  } catch (error) {
    console.error('❌ Restoration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly
if (require.main === module) {
  restoreHierarchy().catch(console.error)
}

module.exports = { restoreHierarchy }
