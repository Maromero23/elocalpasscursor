// Load environment variables
require('dotenv').config();

const { put } = require('@vercel/blob');

async function testVercelBlob() {
  try {
    console.log('🔍 Testing Vercel Blob connection...\n');
    
    // Check if token is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('❌ BLOB_READ_WRITE_TOKEN is not set!');
      return;
    }
    
    console.log('✅ Token is set');
    
    // Test upload with a simple text file
    const testContent = 'Hello from ELocalPass migration test!';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    console.log('📤 Testing upload to Vercel Blob...');
    
    const result = await put('test-migration.txt', testBlob, {
      access: 'public',
      addRandomSuffix: true
    });
    
    console.log('✅ Upload successful!');
    console.log('📄 Test file URL:', result.url);
    
    // Test downloading the file back
    console.log('📥 Testing download...');
    const response = await fetch(result.url);
    const downloadedContent = await response.text();
    
    if (downloadedContent === testContent) {
      console.log('✅ Download successful! Content matches.');
      console.log('🎉 Vercel Blob is working correctly!');
    } else {
      console.log('❌ Download failed or content mismatch');
    }
    
  } catch (error) {
    console.error('❌ Vercel Blob test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
if (require.main === module) {
  testVercelBlob();
}

module.exports = { testVercelBlob }; 