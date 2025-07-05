// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupAffiliates() {
  try {
    console.log('📋 Creating backup of all affiliates...');
    
    const affiliates = await prisma.affiliate.findMany({
      include: {
        sessions: true,
        visits: true,
        annotations: true
      }
    });
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalCount: affiliates.length,
      affiliates: affiliates
    };
    
    const filename = `affiliate-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(__dirname, 'backups', filename);
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupPath}`);
    console.log(`📊 Backed up ${affiliates.length} affiliates`);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

async function deleteAllAffiliates() {
  try {
    console.log('🔍 Checking current affiliate count...');
    
    const count = await prisma.affiliate.count();
    console.log(`📋 Current affiliate count: ${count}`);
    
    if (count === 0) {
      console.log('✅ No affiliates to delete. Database is already clean.');
      return;
    }
    
    // Create backup first
    const backupPath = await backupAffiliates();
    
    console.log('\n⚠️  WARNING: This will permanently delete ALL affiliates and their related data!');
    console.log('📋 This includes:');
    console.log('  - All affiliate records');
    console.log('  - All affiliate sessions');
    console.log('  - All affiliate visits');
    console.log('  - All affiliate field annotations');
    console.log(`\n💾 Backup created at: ${backupPath}`);
    
    // In a real scenario, you'd want to prompt for confirmation
    // For now, I'll just show what would be deleted without actually doing it
    console.log('\n🚨 READY TO DELETE - But stopping here for safety!');
    console.log('To actually delete, uncomment the deletion code in the script.');
    console.log('Make sure you really want to do this before proceeding.');
    
    // Uncomment these lines to actually perform the deletion:
    /*
    console.log('\n🗑️  Deleting all affiliate data...');
    
    // Delete in proper order due to foreign key constraints
    await prisma.affiliateFieldAnnotation.deleteMany({});
    console.log('✅ Deleted all affiliate field annotations');
    
    await prisma.affiliateVisit.deleteMany({});
    console.log('✅ Deleted all affiliate visits');
    
    await prisma.affiliateSession.deleteMany({});
    console.log('✅ Deleted all affiliate sessions');
    
    await prisma.affiliate.deleteMany({});
    console.log('✅ Deleted all affiliates');
    
    // Verify deletion
    const finalCount = await prisma.affiliate.count();
    console.log(`\n📊 Final affiliate count: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('🎉 All affiliates have been successfully deleted!');
      console.log(`💾 Backup available at: ${backupPath}`);
    } else {
      console.log('⚠️  Some affiliates may still remain.');
    }
    */
    
  } catch (error) {
    console.error('❌ Error deleting affiliates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show current status first
async function showCurrentStatus() {
  try {
    console.log('🔍 Current Affiliate Database Status');
    console.log('===================================\n');
    
    const count = await prisma.affiliate.count();
    const withLogos = await prisma.affiliate.count({
      where: { logo: { not: null } }
    });
    const sessions = await prisma.affiliateSession.count();
    const visits = await prisma.affiliateVisit.count();
    const annotations = await prisma.affiliateFieldAnnotation.count();
    
    console.log(`📋 Total affiliates: ${count}`);
    console.log(`🖼️  Affiliates with logos: ${withLogos}`);
    console.log(`🔐 Active sessions: ${sessions}`);
    console.log(`👥 Total visits: ${visits}`);
    console.log(`📝 Field annotations: ${annotations}`);
    
    if (count > 0) {
      console.log('\n📄 Sample affiliates:');
      const sample = await prisma.affiliate.findMany({
        take: 5,
        select: { name: true, email: true, logo: true }
      });
      
      sample.forEach((affiliate, index) => {
        const logoStatus = affiliate.logo ? '🖼️' : '❌';
        console.log(`  ${index + 1}. ${affiliate.name} (${affiliate.email}) ${logoStatus}`);
      });
      
      if (count > 5) {
        console.log(`  ... and ${count - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Main function
async function main() {
  await showCurrentStatus();
  
  console.log('\n🛑 Ready to delete all affiliates?');
  console.log('This script will create a backup first, then delete everything.');
  console.log('Uncomment the deletion code in the script to proceed.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { deleteAllAffiliates, backupAffiliates, showCurrentStatus }; 