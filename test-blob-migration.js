// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Convert Google Drive URL to thumbnail format
function convertGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Skip if it's already a Vercel Blob URL
  if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
    return null;
  }
  
  // Skip text descriptions
  const textPatterns = [
    /^(sin logo|no logo|muy grande|logo no disponible|sin imagen)/i,
    /^(no|yes|si|none|n\/a)$/i,
    /^[a-zA-Z\s]{1,50}$/
  ];
  
  for (const pattern of textPatterns) {
    if (pattern.test(url.trim())) {
      return null;
    }
  }
  
  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /open\?id=([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
    }
  }
  
  return null;
}

async function previewMigration() {
  try {
    console.log('🔍 Previewing Google Drive to Vercel Blob migration...\n');
    
    // Get all affiliates with logo URLs
    const affiliates = await prisma.affiliate.findMany({
      where: {
        logo: {
          not: null
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📋 Found ${affiliates.length} affiliates with logo URLs`);
    
    // Categorize URLs
    const categories = {
      googleDrive: [],
      vercelBlob: [],
      textDescriptions: [],
      other: []
    };
    
    affiliates.forEach(affiliate => {
      const url = affiliate.logo;
      
      if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
        categories.vercelBlob.push(affiliate);
      } else if (convertGoogleDriveUrl(url)) {
        categories.googleDrive.push(affiliate);
      } else if (url.length < 100 && !/^https?:\/\//.test(url)) {
        categories.textDescriptions.push(affiliate);
      } else {
        categories.other.push(affiliate);
      }
    });
    
    console.log('\n📊 URL CATEGORIES:');
    console.log('==================');
    console.log(`🔗 Google Drive URLs (will be migrated): ${categories.googleDrive.length}`);
    console.log(`✅ Already Vercel Blob URLs: ${categories.vercelBlob.length}`);
    console.log(`📝 Text descriptions (will be skipped): ${categories.textDescriptions.length}`);
    console.log(`❓ Other URLs: ${categories.other.length}`);
    
    if (categories.googleDrive.length > 0) {
      console.log('\n🔗 GOOGLE DRIVE URLS TO MIGRATE:');
      categories.googleDrive.forEach(affiliate => {
        console.log(`  - ${affiliate.name}: ${affiliate.logo}`);
      });
    }
    
    if (categories.vercelBlob.length > 0) {
      console.log('\n✅ ALREADY MIGRATED TO VERCEL BLOB:');
      categories.vercelBlob.forEach(affiliate => {
        console.log(`  - ${affiliate.name}: ${affiliate.logo}`);
      });
    }
    
    if (categories.textDescriptions.length > 0) {
      console.log('\n📝 TEXT DESCRIPTIONS (WILL BE SKIPPED):');
      categories.textDescriptions.forEach(affiliate => {
        console.log(`  - ${affiliate.name}: "${affiliate.logo}"`);
      });
    }
    
    if (categories.other.length > 0) {
      console.log('\n❓ OTHER URLS:');
      categories.other.forEach(affiliate => {
        console.log(`  - ${affiliate.name}: ${affiliate.logo}`);
      });
    }
    
    // Estimate storage usage
    const avgImageSize = 50; // KB estimate
    const totalImagesKB = categories.googleDrive.length * avgImageSize;
    const totalImagesMB = totalImagesKB / 1024;
    
    console.log('\n📦 ESTIMATED STORAGE USAGE:');
    console.log(`🖼️  Images to migrate: ${categories.googleDrive.length}`);
    console.log(`📊 Estimated total size: ${totalImagesMB.toFixed(2)} MB`);
    console.log(`🆓 Free tier limit: 1000 MB`);
    console.log(`✅ Within free tier: ${totalImagesMB <= 1000 ? 'YES' : 'NO'}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Set up your Vercel Blob token in .env file');
    console.log('2. Run: node migrate-images-to-vercel-blob.js');
    console.log('3. The migration will process images in batches of 5');
    console.log('4. Each image will be uploaded to Vercel Blob');
    console.log('5. Database will be updated with new URLs');
    
  } catch (error) {
    console.error('❌ Preview failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the preview
if (require.main === module) {
  previewMigration();
}

module.exports = { previewMigration }; 