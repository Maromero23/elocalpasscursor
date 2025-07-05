// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...\n');
    
    // Get all affiliates with logo URLs
    const allAffiliates = await prisma.affiliate.findMany({
      where: {
        logo: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        logo: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📋 Total affiliates with logos: ${allAffiliates.length}`);
    
    // Categorize URLs
    const categories = {
      vercelBlob: [],
      googleDrive: [],
      textDescriptions: [],
      other: []
    };
    
    allAffiliates.forEach(affiliate => {
      const url = affiliate.logo;
      
      if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
        categories.vercelBlob.push(affiliate);
      } else if (url.includes('drive.google.com')) {
        categories.googleDrive.push(affiliate);
      } else if (url.length < 100 && !/^https?:\/\//.test(url)) {
        categories.textDescriptions.push(affiliate);
      } else {
        categories.other.push(affiliate);
      }
    });
    
    console.log('\n📊 MIGRATION STATUS:');
    console.log('===================');
    console.log(`✅ Migrated to Vercel Blob: ${categories.vercelBlob.length}`);
    console.log(`🔗 Still on Google Drive: ${categories.googleDrive.length}`);
    console.log(`📝 Text descriptions: ${categories.textDescriptions.length}`);
    console.log(`❓ Other URLs: ${categories.other.length}`);
    
    // Calculate migration progress
    const totalToMigrate = categories.googleDrive.length + categories.vercelBlob.length;
    const migrationProgress = totalToMigrate > 0 ? (categories.vercelBlob.length / totalToMigrate * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Migration Progress: ${migrationProgress}%`);
    
    if (categories.vercelBlob.length > 0) {
      console.log('\n✅ SUCCESSFULLY MIGRATED:');
      categories.vercelBlob.slice(0, 10).forEach(affiliate => {
        console.log(`  - ${affiliate.name}: ${affiliate.logo.substring(0, 80)}...`);
      });
      if (categories.vercelBlob.length > 10) {
        console.log(`  ... and ${categories.vercelBlob.length - 10} more`);
      }
    }
    
    if (categories.googleDrive.length > 0) {
      console.log('\n🔗 STILL TO MIGRATE:');
      categories.googleDrive.slice(0, 5).forEach(affiliate => {
        console.log(`  - ${affiliate.name}: ${affiliate.logo.substring(0, 80)}...`);
      });
      if (categories.googleDrive.length > 5) {
        console.log(`  ... and ${categories.googleDrive.length - 5} more`);
      }
    }
    
    if (categories.vercelBlob.length === 0) {
      console.log('\n⚠️  No images have been migrated yet.');
      console.log('The migration script may have encountered issues.');
      console.log('Try running: node migrate-images-to-vercel-blob.js');
    } else if (categories.googleDrive.length === 0) {
      console.log('\n🎉 All Google Drive images have been successfully migrated to Vercel Blob!');
    } else {
      console.log('\n⏳ Migration is partially complete.');
      console.log('Some images may still be processing or the script stopped.');
      console.log('You can re-run the migration script to continue.');
    }
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the status check
if (require.main === module) {
  checkMigrationStatus();
}

module.exports = { checkMigrationStatus }; 