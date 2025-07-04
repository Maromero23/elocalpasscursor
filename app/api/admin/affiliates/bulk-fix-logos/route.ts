import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Utility function to convert Google Drive URLs to direct image URLs
function convertGoogleDriveUrl(url: string): string {
  if (!url) return url
  
  // If it's not a Google Drive URL, return as-is
  if (!url.includes('drive.google.com')) {
    return url
  }
  
  // If it's a search URL or folder URL, it's not a file URL
  if (url.includes('/search?') || url.includes('/drive/folders/') || url.includes('/drive/search?')) {
    console.warn('❌ Cannot convert Google Drive search/folder URL to direct image URL:', url)
    return url // Return original URL, will be handled as invalid by isActualUrl check
  }
  
  // Check if it's already a thumbnail URL (preferred format)
  if (url.includes('drive.google.com/thumbnail?')) {
    return url
  }
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com/uc?')) {
    // Extract file ID and convert to thumbnail format
    const fileIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
    if (fileIdMatch) {
      const fileId = fileIdMatch[1]
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`
      console.log('🔄 Converting Google Drive URL to thumbnail format:', { original: url, converted: thumbnailUrl })
      return thumbnailUrl
    }
  }
  
  // Convert sharing URL to thumbnail URL (PREFERRED FORMAT - WORKS FOR EMBEDDING!)
  let fileId = ''
  
  // Try to extract file ID from different URL formats
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,  // /d/ID format
    /[?&]id=([a-zA-Z0-9-_]+)/, // ?id=ID format
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      fileId = match[1]
      break
    }
  }
  
  if (fileId) {
    // Use thumbnail format instead of standard format (thumbnail format works for embedding!)
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`
    console.log('🔄 Converting Google Drive URL to thumbnail format:', { original: url, converted: thumbnailUrl })
    return thumbnailUrl
  } else {
    console.warn('❌ Could not extract file ID from Google Drive URL:', url)
    return url // Return original URL, will be handled as invalid by isActualUrl check
  }
}

// Check if the logo value is actually a URL vs a text description
function isActualUrl(url: string): boolean {
  if (!url) return false
  
  // Check if it's a URL (starts with http/https or has common image extensions)
  const isUrl = url.startsWith('http://') || url.startsWith('https://') || 
               url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
               url.includes('.gif') || url.includes('.svg') || url.includes('.webp')
  
  // Check if it's a text description (common Spanish phrases)
  const isTextDescription = /^(sin logo|no logo|muy grande|apostrofe|cerrado|no disponible|pendiente|falta|error)/i.test(url.trim())
  
  return isUrl && !isTextDescription
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 ADMIN: Starting bulk logo URL fix')

    // Get all affiliates with logo URLs
    const affiliates = await (prisma as any).affiliate.findMany({
      where: {
        AND: [
          { logo: { not: null } },
          { logo: { not: '' } }
        ]
      },
      select: {
        id: true,
        name: true,
        logo: true
      }
    })

    console.log(`📊 Found ${affiliates.length} affiliates with logo URLs`)

    let fixed = 0
    let skipped = 0
    const fixedAffiliates = []
    const skippedAffiliates = []

    for (const affiliate of affiliates) {
      const originalUrl = affiliate.logo
      
      // Skip if it's a text description, not an actual URL
      if (!isActualUrl(originalUrl)) {
        skipped++
        skippedAffiliates.push({
          name: affiliate.name,
          originalUrl,
          reason: 'Text description, not a URL'
        })
        console.log(`⏭️  Skipped ${affiliate.name} - Text description: "${originalUrl}"`)
        continue
      }
      
      const convertedUrl = convertGoogleDriveUrl(originalUrl)
      
      // Only update if the URL actually changed
      if (originalUrl !== convertedUrl) {
        await (prisma as any).affiliate.update({
          where: { id: affiliate.id },
          data: { logo: convertedUrl }
        })
        
        fixed++
        fixedAffiliates.push({
          name: affiliate.name,
          originalUrl,
          convertedUrl
        })
        
        console.log(`✅ Fixed logo for ${affiliate.name}`)
        console.log(`   From: ${originalUrl}`)
        console.log(`   To:   ${convertedUrl}`)
      }
    }

    console.log(`🎉 ADMIN: Bulk logo fix completed - ${fixed} URLs converted, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${fixed} logo URLs, skipped ${skipped} text descriptions`,
      fixed,
      skipped,
      total: affiliates.length,
      details: {
        fixed: fixedAffiliates.slice(0, 10), // Return first 10 for debugging
        skipped: skippedAffiliates.slice(0, 10)
      }
    })

  } catch (error) {
    console.error('❌ ADMIN: Error in bulk logo fix:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 