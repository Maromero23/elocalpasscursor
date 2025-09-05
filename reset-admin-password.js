const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔐 RESETTING ADMIN PASSWORD\n');
    
    const adminEmail = 'admin@elocalpass.com';
    const newPassword = 'admin123'; // Simple password for immediate access
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!admin) {
      console.error('❌ Admin user not found!');
      return;
    }
    
    console.log(`✅ Found admin: ${admin.email} - ${admin.name}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    });
    
    console.log('\n🎉 PASSWORD RESET SUCCESSFUL!');
    console.log('\n📋 NEW LOGIN CREDENTIALS:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${newPassword}`);
    
    console.log('\n🔗 LOGIN URL:');
    console.log('   https://elocalpasscursor.vercel.app/auth/login');
    
    console.log('\n⚠️  SECURITY NOTE:');
    console.log('   Please change this password after logging in!');
    console.log('   This is a temporary password for immediate access.');
    
    console.log('\n📊 AFFILIATE INFO:');
    console.log('   Total affiliates to potentially delete: 198');
    console.log('   Access admin panel → Affiliates to manage them');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();

