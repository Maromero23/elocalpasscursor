import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Utility function to convert Google Drive URLs to direct image URLs
function convertGoogleDriveUrl(url: string): string {
  if (!url) return url
  
  // Check if it's already a direct Google Drive URL
  if (url.includes('drive.google.com/uc?')) {
    return url
  }
  
  // Convert sharing URL to direct URL
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (fileIdMatch) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`
    }
  }
  
  return url
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
    const fixedAffiliates = []

    for (const affiliate of affiliates) {
      const originalUrl = affiliate.logo
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

    console.log(`🎉 ADMIN: Bulk logo fix completed - ${fixed} URLs converted`)

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${fixed} logo URLs`,
      fixed,
      total: affiliates.length,
      details: fixedAffiliates.slice(0, 10) // Return first 10 for debugging
    })

  } catch (error) {
    console.error('❌ ADMIN: Error in bulk logo fix:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 