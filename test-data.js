const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      password: await bcrypt.hash('password', 10),
      role: 'ADMIN',
      isActive: true
    }
  })

  // Create distributor
  const distributor = await prisma.distributor.create({
    data: {
      name: 'Test Distributor',
      userId: adminUser.id,
      isActive: true,
      contactPerson: 'John Doe',
      email: 'distributor@test.com',
      telephone: '123-456-7890'
    }
  })

  // Create seller user
  const sellerUser = await prisma.user.create({
    data: {
      name: 'Seller User',
      email: 'seller@test.com',
      password: await bcrypt.hash('password', 10),
      role: 'SELLER',
      isActive: true
    }
  })

  // Create location
  const location = await prisma.location.create({
    data: {
      name: 'Test Location',
      distributorId: distributor.id,
      userId: sellerUser.id,
      isActive: true,
      contactPerson: 'Jane Smith',
      email: 'location@test.com',
      telephone: '098-765-4321'
    }
  })

  console.log('Test data created successfully!')
  console.log('Admin user:', adminUser.email, 'password: password')
  console.log('Seller user:', sellerUser.email, 'password: password')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
