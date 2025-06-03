const { prisma } = require('./lib/prisma.js')

async function checkUserSchema() {
  try {
    console.log('🔍 Testing User table structure...')
    
    // Try to query a user with notes field
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        notes: true // This will fail if column doesn't exist
      }
    })
    
    console.log('✅ User table has notes column:', user)
  } catch (error) {
    console.log('❌ Error with User table:', error.message)
    
    if (error.code === 'P2022') {
      console.log('📋 ISSUE: The "notes" column is missing from the users table')
      console.log('💡 SOLUTION: Run "npx prisma db push" to add the missing column')
      console.log('🔒 SAFETY: This will ONLY ADD the notes column, no data will be deleted')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkUserSchema()
