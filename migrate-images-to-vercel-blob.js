// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 5; // Process 5 images at a time to avoid rate limits
const MAX_RETRIES = 3;
const TIMEOUT = 30000; // 30 second timeout

// Utility function to download image from URL
function downloadImage(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const request = client.get(url, { timeout }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      response.on('error', reject);
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

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

// Generate safe filename for Vercel Blob
function generateBlobFilename(affiliate, originalUrl) {
  const safeName = affiliate.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const extension = '.jpg'; // Default to jpg for Google Drive images
  
  return `affiliate-logos/${safeName}_${affiliate.id}_${timestamp}${extension}`;
}

// Upload image to Vercel Blob with retry logic
async function uploadToVercelBlob(imageBuffer, filename, retries = 0) {
  try {
    console.log(`  📤 Uploading to Vercel Blob: ${filename}`);
    
    // Create a File-like object from the buffer
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    
    const result = await put(filename, blob, {
      access: 'public',
      addRandomSuffix: true
    });
    
    console.log(`  ✅ Upload successful: ${result.url}`);
    return result.url;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.log(`  ⚠️  Upload failed, retrying... (${retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
      return uploadToVercelBlob(imageBuffer, filename, retries + 1);
    } else {
      console.error(`  ❌ Upload failed after ${MAX_RETRIES} retries:`, error.message);
      throw error;
    }
  }
}

// Process a single affiliate
async function processAffiliate(affiliate) {
  try {
    console.log(`\n📋 Processing: ${affiliate.name} (ID: ${affiliate.id})`);
    console.log(`  🔗 Original URL: ${affiliate.logo}`);
    
    // Convert to thumbnail URL
    const thumbnailUrl = convertGoogleDriveUrl(affiliate.logo);
    if (!thumbnailUrl) {
      console.log(`  ⏭️  Skipping: Not a valid Google Drive URL or already processed`);
      return { status: 'skipped', reason: 'Not a valid Google Drive URL' };
    }
    
    console.log(`  🔄 Thumbnail URL: ${thumbnailUrl}`);
    
    // Download image
    console.log(`  📥 Downloading image...`);
    const imageBuffer = await downloadImage(thumbnailUrl);
    console.log(`  ✅ Downloaded: ${imageBuffer.length} bytes`);
    
    // Generate filename
    const filename = generateBlobFilename(affiliate, affiliate.logo);
    
    // Upload to Vercel Blob
    const blobUrl = await uploadToVercelBlob(imageBuffer, filename);
    
    // Update database
    console.log(`  💾 Updating database...`);
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { logo: blobUrl }
    });
    
    console.log(`  ✅ Migration completed for ${affiliate.name}`);
    return { 
      status: 'success', 
      originalUrl: affiliate.logo,
      newUrl: blobUrl,
      size: imageBuffer.length
    };
    
  } catch (error) {
    console.error(`  ❌ Error processing ${affiliate.name}:`, error.message);
    return { 
      status: 'error', 
      error: error.message,
      originalUrl: affiliate.logo
    };
  }
}

// Process affiliates in batches
async function processInBatches(affiliates, batchSize = BATCH_SIZE) {
  const results = [];
  
  for (let i = 0; i < affiliates.length; i += batchSize) {
    const batch = affiliates.slice(i, i + batchSize);
    console.log(`\n🚀 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(affiliates.length / batchSize)}`);
    
    const batchPromises = batch.map(affiliate => processAffiliate(affiliate));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`❌ Batch processing failed for ${batch[index].name}:`, result.reason);
        results.push({ 
          status: 'error', 
          error: result.reason.message,
          originalUrl: batch[index].logo
        });
      }
    });
    
    // Brief pause between batches
    if (i + batchSize < affiliates.length) {
      console.log(`⏳ Waiting 2 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Main migration function
async function migrateToVercelBlob() {
  try {
    console.log('🚀 Starting Google Drive to Vercel Blob migration...\n');
    
    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is not set!');
      console.log('Please set up your Vercel Blob token first:');
      console.log('1. Go to https://vercel.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to Storage tab');
      console.log('4. Create a new Blob store if you don\'t have one');
      console.log('5. Copy the BLOB_READ_WRITE_TOKEN');
      console.log('6. Add it to your .env file or environment variables');
      return;
    }
    
    // Get all affiliates with Google Drive URLs
    console.log('📊 Fetching affiliates from database...');
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
    
    // Filter for Google Drive URLs only
    const googleDriveAffiliates = affiliates.filter(affiliate => {
      const thumbnailUrl = convertGoogleDriveUrl(affiliate.logo);
      return thumbnailUrl !== null;
    });
    
    console.log(`🔗 Found ${googleDriveAffiliates.length} affiliates with Google Drive URLs`);
    
    if (googleDriveAffiliates.length === 0) {
      console.log('✅ No Google Drive URLs found to migrate!');
      return;
    }
    
    // Process all affiliates
    const results = await processInBatches(googleDriveAffiliates);
    
    // Generate summary report
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('==================');
    
    const successful = results.filter(r => r.status === 'success');
    const errors = results.filter(r => r.status === 'error');
    const skipped = results.filter(r => r.status === 'skipped');
    
    console.log(`✅ Successfully migrated: ${successful.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⏭️  Skipped: ${skipped.length}`);
    
    if (successful.length > 0) {
      const totalSize = successful.reduce((sum, r) => sum + (r.size || 0), 0);
      console.log(`📦 Total data migrated: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Log errors if any
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => {
        console.log(`  - ${error.originalUrl}: ${error.error}`);
      });
    }
    
    // Log successful migrations
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL MIGRATIONS:');
      successful.forEach(success => {
        console.log(`  - ${success.originalUrl} → ${success.newUrl}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToVercelBlob();
}

module.exports = { migrateToVercelBlob }; 