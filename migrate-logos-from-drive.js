#!/usr/bin/env node

/**
 * Google Drive Logo Migration Script
 * Downloads all affiliate logos from Google Drive and stores them locally
 * Updates database with local file paths
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configuration
const LOGOS_DIR = path.join(__dirname, 'public', 'logos')
const MAX_CONCURRENT_DOWNLOADS = 5
const DOWNLOAD_TIMEOUT = 30000 // 30 seconds

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true })
  console.log('📁 Created logos directory:', LOGOS_DIR)
}

// Helper function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath)
    
    const request = https.get(url, { timeout: DOWNLOAD_TIMEOUT }, (response) => {
      // Check if the response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      // Check content type
      const contentType = response.headers['content-type']
      if (!contentType || !contentType.startsWith('image/')) {
        reject(new Error(`Invalid content type: ${contentType}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve(filepath)
      })
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}) // Delete partial file
        reject(err)
      })
    })
    
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('Download timeout'))
    })
    
    request.on('error', (err) => {
      reject(err)
    })
  })
}

// Helper function to get file extension from URL or content type
function getFileExtension(url, contentType) {
  // Try to get extension from URL
  const urlExt = path.extname(new URL(url).pathname).toLowerCase()
  if (urlExt && ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(urlExt)) {
    return urlExt
  }
  
  // Fallback to content type
  if (contentType) {
    if (contentType.includes('jpeg')) return '.jpg'
    if (contentType.includes('png')) return '.png'
    if (contentType.includes('gif')) return '.gif'
    if (contentType.includes('webp')) return '.webp'
    if (contentType.includes('svg')) return '.svg'
  }
  
  return '.jpg' // Default fallback
}

// Helper function to generate safe filename
function generateSafeFilename(affiliateName, affiliateId) {
  const safeName = affiliateName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) // Limit length
  
  return `${safeName}-${affiliateId}`
}

// Main migration function
async function migrateLogos() {
  try {
    console.log('🚀 Starting Google Drive logo migration...')
    console.log('===============================================')
    
    // Get all affiliates with Google Drive logos
    const affiliates = await prisma.affiliate.findMany({
      where: {
        AND: [
          { logo: { not: null } },
          { logo: { not: '' } },
          { logo: { contains: 'drive.google.com' } }
        ]
      },
      select: {
        id: true,
        name: true,
        logo: true
      }
    })
    
    console.log(`📊 Found ${affiliates.length} affiliates with Google Drive logos`)
    
    if (affiliates.length === 0) {
      console.log('✅ No Google Drive logos to migrate')
      return
    }
    
    let successful = 0
    let failed = 0
    const results = []
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < affiliates.length; i += MAX_CONCURRENT_DOWNLOADS) {
      const batch = affiliates.slice(i, i + MAX_CONCURRENT_DOWNLOADS)
      console.log(`\n📦 Processing batch ${Math.floor(i / MAX_CONCURRENT_DOWNLOADS) + 1}/${Math.ceil(affiliates.length / MAX_CONCURRENT_DOWNLOADS)}`)
      
      const batchPromises = batch.map(async (affiliate) => {
        try {
          console.log(`⬇️  Downloading: ${affiliate.name}`)
          
          // Convert to thumbnail format if not already
          let imageUrl = affiliate.logo
          if (imageUrl.includes('drive.google.com/uc?')) {
            const fileIdMatch = imageUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)
            if (fileIdMatch) {
              imageUrl = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w400-h400`
            }
          } else if (imageUrl.includes('drive.google.com/file/d/')) {
            const fileIdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
            if (fileIdMatch) {
              imageUrl = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w400-h400`
            }
          }
          
          // Generate filename
          const safeFilename = generateSafeFilename(affiliate.name, affiliate.id)
          const tempPath = path.join(LOGOS_DIR, `${safeFilename}.tmp`)
          
          // Download image
          await downloadImage(imageUrl, tempPath)
          
          // Determine final filename with correct extension
          const stats = fs.statSync(tempPath)
          if (stats.size === 0) {
            throw new Error('Downloaded file is empty')
          }
          
          // Read first few bytes to determine image type
          const buffer = fs.readFileSync(tempPath, { start: 0, end: 10 })
          let extension = '.jpg'
          
          if (buffer[0] === 0x89 && buffer[1] === 0x50) extension = '.png'
          else if (buffer[0] === 0x47 && buffer[1] === 0x49) extension = '.gif'
          else if (buffer[0] === 0xFF && buffer[1] === 0xD8) extension = '.jpg'
          else if (buffer.toString('ascii', 0, 4) === 'RIFF') extension = '.webp'
          
          const finalPath = path.join(LOGOS_DIR, `${safeFilename}${extension}`)
          const publicPath = `/logos/${safeFilename}${extension}`
          
          // Move file to final location
          fs.renameSync(tempPath, finalPath)
          
          // Update database
          await prisma.affiliate.update({
            where: { id: affiliate.id },
            data: { logo: publicPath }
          })
          
          console.log(`✅ ${affiliate.name}: ${publicPath}`)
          successful++
          
          return {
            id: affiliate.id,
            name: affiliate.name,
            originalUrl: affiliate.logo,
            newPath: publicPath,
            status: 'success'
          }
          
        } catch (error) {
          console.log(`❌ ${affiliate.name}: ${error.message}`)
          failed++
          
          return {
            id: affiliate.id,
            name: affiliate.name,
            originalUrl: affiliate.logo,
            error: error.message,
            status: 'failed'
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + MAX_CONCURRENT_DOWNLOADS < affiliates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log('\n🎉 Migration Complete!')
    console.log('=====================')
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📁 Images stored in: ${LOGOS_DIR}`)
    
    // Save detailed results
    const resultFile = path.join(__dirname, `logo-migration-results-${Date.now()}.json`)
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2))
    console.log(`📄 Detailed results saved to: ${resultFile}`)
    
    if (failed > 0) {
      console.log('\n⚠️  Failed Downloads:')
      results.filter(r => r.status === 'failed').forEach(result => {
        console.log(`   ${result.name}: ${result.error}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLogos()
}

module.exports = { migrateLogos } 