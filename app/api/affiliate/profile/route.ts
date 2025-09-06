import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAffiliateAuth } from '@/lib/affiliate-auth'

export async function GET(request: NextRequest) {
  try {
    // Validate affiliate authentication
    const affiliate = await requireAffiliateAuth(request)
    
    console.log(`📊 AFFILIATE PROFILE: Fetching data for ${affiliate.name}`)
    
    // Get full affiliate data
    const fullAffiliate = await (prisma as any).affiliate.findUnique({
      where: { id: affiliate.id },
      select: {
        id: true,
        name: true,
        email: true,
        discount: true,
        city: true,
        category: true,
        totalVisits: true,
        lastVisitAt: true,
        isActive: true
      }
    })
    
    if (!fullAffiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }
    
    // Get recent visits (last 10)
    const recentVisits = await (prisma as any).affiliateVisit.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { visitedAt: 'desc' },
      take: 10,
      include: {
        qrCodeRecord: {
          select: {
            code: true,
            guests: true,
            days: true,
            expiresAt: true
          }
        }
      }
    })
    
    // Transform visits data
    const transformedVisits = recentVisits.map(visit => ({
      id: visit.id,
      qrCode: visit.qrCode,
      customerName: visit.customerName,
      customerEmail: visit.customerEmail,
      discountApplied: visit.discountApplied,
      visitedAt: visit.visitedAt,
      qrDetails: {
        code: visit.qrCodeRecord?.code || visit.qrCode,
        guests: visit.qrCodeRecord?.guests || 1,
        days: visit.qrCodeRecord?.days || 1,
        expiresAt: visit.qrCodeRecord?.expiresAt || new Date()
      }
    }))
    
    // Calculate stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay()) // Start of week
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Get visit counts for different periods
    const [todayCount, weekCount, monthCount] = await Promise.all([
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: affiliate.id,
          visitedAt: { gte: today }
        }
      }),
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: affiliate.id,
          visitedAt: { gte: thisWeekStart }
        }
      }),
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: affiliate.id,
          visitedAt: { gte: thisMonthStart }
        }
      })
    ])
    
    const stats = {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount
    }
    
    console.log(`✅ AFFILIATE PROFILE: Returning data for ${affiliate.name} (${transformedVisits.length} recent visits)`)
    
    return NextResponse.json({
      success: true,
      affiliate: fullAffiliate,
      recentVisits: transformedVisits,
      stats
    })
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.error('💥 AFFILIATE PROFILE ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    )
  }
} 