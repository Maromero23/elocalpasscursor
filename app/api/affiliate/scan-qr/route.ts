import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAffiliateAuth } from '@/lib/affiliate-auth'

export async function POST(request: NextRequest) {
  try {
    // Validate affiliate authentication
    const affiliate = await requireAffiliateAuth(request)
    
    const { qrCode } = await request.json()
    
    if (!qrCode || qrCode.trim().length === 0) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }
    
    console.log(`🔍 AFFILIATE SCAN: ${affiliate.name} scanning QR ${qrCode}`)
    
    // Find the QR code in our system
    const qrRecord = await (prisma as any).qRCode.findUnique({
      where: { code: qrCode.trim() },
      include: {
        seller: {
          select: { name: true, email: true }
        }
      }
    })
    
    if (!qrRecord) {
      console.log(`❌ QR CODE NOT FOUND: ${qrCode}`)
      return NextResponse.json({ 
        error: 'QR code not found',
        details: 'This QR code is not valid or has expired'
      }, { status: 404 })
    }
    
    // Check if QR code is active and not expired
    if (!qrRecord.isActive) {
      console.log(`❌ QR CODE INACTIVE: ${qrCode}`)
      return NextResponse.json({ 
        error: 'QR code is inactive',
        details: 'This ELocalPass has been deactivated'
      }, { status: 400 })
    }
    
    if (new Date() > qrRecord.expiresAt) {
      console.log(`❌ QR CODE EXPIRED: ${qrCode} (expired ${qrRecord.expiresAt})`)
      return NextResponse.json({ 
        error: 'QR code has expired',
        details: `This ELocalPass expired on ${qrRecord.expiresAt.toLocaleDateString()}`
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
      console.log(`⚠️ DUPLICATE VISIT: ${affiliate.name} already scanned ${qrCode} today`)
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
        qrCode: qrCode.trim(),
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
    
    console.log(`✅ VISIT LOGGED: ${affiliate.name} scanned ${qrCode} for ${qrRecord.customerName}`)
    
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
          code: qrCode,
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