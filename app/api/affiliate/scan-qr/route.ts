import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAffiliateAuth } from '@/lib/affiliate-auth'

// Function to extract QR code from various URL formats
function extractQRCode(input: string): string {
  const trimmed = input.trim()
  
  // If it's already a QR code format (starts with EL-), return as is
  if (trimmed.startsWith('EL-')) {
    return trimmed
  }
  
  // Try to parse as URL and extract QR code from path
  try {
    const url = new URL(trimmed)
    const pathSegments = url.pathname.split('/')
    
    // Look for QR code in URL path (format: /landing/EL-xxxxx or /landing-enhanced/EL-xxxxx)
    for (const segment of pathSegments) {
      if (segment.startsWith('EL-')) {
        return segment
      }
    }
    
    // If no QR code found in path, check query parameters
    const qrFromQuery = url.searchParams.get('qr') || url.searchParams.get('code')
    if (qrFromQuery && qrFromQuery.startsWith('EL-')) {
      return qrFromQuery
    }
  } catch (e) {
    // Not a valid URL, continue with original logic
  }
  
  // If all else fails, return the original input
  return trimmed
}

export async function POST(request: NextRequest) {
  try {
    // Validate affiliate authentication
    const affiliate = await requireAffiliateAuth(request)
    
    const { qrCode } = await request.json()
    
    if (!qrCode || qrCode.trim().length === 0) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }
    
    // Extract the actual QR code from URL if needed
    const actualQRCode = extractQRCode(qrCode)
    
    console.log(`🔍 AFFILIATE SCAN: ${affiliate.name} scanning QR ${qrCode}`)
    console.log(`📋 EXTRACTED QR CODE: ${actualQRCode}`)
    
    // Find the QR code in our system
    const qrRecord = await (prisma as any).qRCode.findUnique({
      where: { code: actualQRCode },
      include: {
        seller: {
          select: { name: true, email: true }
        }
      }
    })
    
    if (!qrRecord) {
      console.log(`❌ QR CODE NOT FOUND: ${actualQRCode}`)
      return NextResponse.json({ 
        error: 'QR code not found',
        details: 'This QR code is not valid or has expired',
        debugInfo: {
          originalScannedContent: qrCode.trim(),
          extractedQRCode: actualQRCode,
          currentServerTime: new Date().toISOString(),
          errorType: 'NOT_FOUND',
          message: 'QR code does not exist in database'
        }
      }, { status: 404 })
    }
    
    // Enhanced debugging for date comparison
    const currentTime = new Date()
    const qrExpiresAt = qrRecord.expiresAt
    const isExpired = currentTime > qrExpiresAt
    
    console.log(`🕐 DATE COMPARISON DEBUG:`)
    console.log(`   Current Server Time: ${currentTime.toISOString()} (${currentTime.getTime()})`)
    console.log(`   QR Expires At: ${qrExpiresAt.toISOString()} (${qrExpiresAt.getTime()})`)
    console.log(`   Time Difference: ${qrExpiresAt.getTime() - currentTime.getTime()}ms`)
    console.log(`   Is Expired: ${isExpired}`)
    console.log(`   QR Created At: ${qrRecord.createdAt.toISOString()}`)
    console.log(`   QR Code: ${actualQRCode}`)
    console.log(`   Customer: ${qrRecord.customerName}`)
    console.log(`   Days Valid: ${qrRecord.days}`)
    console.log(`   Is Active: ${qrRecord.isActive}`)
    
    // Check if QR code is active and not expired
    if (!qrRecord.isActive) {
      console.log(`❌ QR CODE INACTIVE: ${actualQRCode}`)
      return NextResponse.json({ 
        error: 'QR code is inactive',
        details: 'This ELocalPass has been deactivated',
        debugInfo: {
          qrCode: actualQRCode,
          currentServerTime: new Date().toISOString(),
          qrCreatedAt: qrRecord.createdAt.toISOString(),
          customerName: qrRecord.customerName,
          isActive: qrRecord.isActive,
          expiresAt: qrRecord.expiresAt.toISOString(),
          errorType: 'INACTIVE',
          message: 'QR code exists but is marked as inactive'
        }
      }, { status: 400 })
    }
    
    if (isExpired) {
      console.log(`❌ QR CODE EXPIRED: ${actualQRCode} (expired ${qrRecord.expiresAt.toISOString()})`)
      console.log(`   Expired ${Math.abs(qrExpiresAt.getTime() - currentTime.getTime())}ms ago`)
      return NextResponse.json({ 
        error: 'QR code has expired',
        details: `This ELocalPass expired on ${qrRecord.expiresAt.toLocaleDateString()}. Current time: ${currentTime.toLocaleDateString()}`,
        debugInfo: {
          currentServerTime: currentTime.toISOString(),
          qrExpiresAt: qrExpiresAt.toISOString(),
          timeDifferenceMs: qrExpiresAt.getTime() - currentTime.getTime(),
          qrCreatedAt: qrRecord.createdAt.toISOString(),
          qrCode: actualQRCode,
          customerName: qrRecord.customerName,
          daysValid: qrRecord.days,
          isActive: qrRecord.isActive,
          expiredAgoMs: Math.abs(qrExpiresAt.getTime() - currentTime.getTime())
        }
      }, { status: 400 })
    }
    
    // Check if this affiliate has already scanned this QR today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingVisit = await (prisma as any).affiliateVisit.findUnique({
      where: {
        affiliateId_qrCodeId_visitDate: {
          affiliateId: affiliate.id,
          qrCodeId: qrRecord.id,
          visitDate: today
        }
      }
    })
    
    if (existingVisit) {
      console.log(`⚠️ DUPLICATE VISIT: ${affiliate.name} already scanned ${actualQRCode} today`)
      return NextResponse.json({ 
        error: 'Already visited today',
        details: 'This customer has already visited your business today',
        visit: {
          visitedAt: existingVisit.visitedAt,
          discount: existingVisit.discountApplied
        }
      }, { status: 409 })
    }
    
    // Get device info
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Create the visit record
    const visit = await (prisma as any).affiliateVisit.create({
      data: {
        affiliateId: affiliate.id,
        qrCodeId: qrRecord.id,
        qrCode: actualQRCode,
        customerName: qrRecord.customerName || 'Unknown',
        customerEmail: qrRecord.customerEmail || 'Unknown',
        discountApplied: affiliate.discount || 'No discount specified',
        visitDate: today,
        deviceInfo: userAgent
      }
    })
    
    // Update affiliate's total visits count
    await (prisma as any).affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalVisits: { increment: 1 },
        lastVisitAt: new Date()
      }
    })
    
    console.log(`✅ VISIT LOGGED: ${affiliate.name} scanned ${actualQRCode} for ${qrRecord.customerName}`)
    
    return NextResponse.json({
      success: true,
      message: 'Visit logged successfully',
      visit: {
        id: visit.id,
        customerName: qrRecord.customerName,
        customerEmail: qrRecord.customerEmail,
        discount: affiliate.discount,
        visitedAt: visit.visitedAt,
        qrDetails: {
          code: actualQRCode,
          guests: qrRecord.guests,
          days: qrRecord.days,
          expiresAt: qrRecord.expiresAt
        }
      }
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('💥 AFFILIATE SCAN ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to process QR scan' },
      { status: 500 }
    )
  }
} 