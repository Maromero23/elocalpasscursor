import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 })
    }
    
    console.log('🔄 SESSION RECOVERY: Attempting recovery with backup token')
    
    // Find active session by token
    const session = await (prisma as any).affiliateSession.findFirst({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        affiliate: true
      }
    })
    
    if (!session || !session.affiliate) {
      console.log('❌ SESSION RECOVERY: Invalid or expired backup token')
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }
    
    // Update last used time and extend session if needed
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const shouldExtend = session.expiresAt < thirtyDaysFromNow
    
    if (shouldExtend) {
      // Extend session to 90 days from now
      const newExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      await (prisma as any).affiliateSession.update({
        where: { id: session.id },
        data: { 
          lastUsedAt: now,
          expiresAt: newExpiresAt
        }
      })
      console.log(`🔄 SESSION RECOVERY: Extended session for ${session.affiliate.name} to ${newExpiresAt}`)
    } else {
      // Just update last used time
      await (prisma as any).affiliateSession.update({
        where: { id: session.id },
        data: { lastUsedAt: now }
      })
    }
    
    // Get full affiliate data for recovery
    const fullAffiliate = await (prisma as any).affiliate.findUnique({
      where: { id: session.affiliate.id },
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
    
    // Get recent visits (last 10)
    const recentVisits = await (prisma as any).affiliateVisit.findMany({
      where: { affiliateId: session.affiliate.id },
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
    const transformedVisits = recentVisits.map((visit: any) => ({
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
    const now2 = new Date()
    const today = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate())
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const thisMonthStart = new Date(now2.getFullYear(), now2.getMonth(), 1)
    
    const [todayCount, weekCount, monthCount] = await Promise.all([
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: session.affiliate.id,
          visitedAt: { gte: today }
        }
      }),
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: session.affiliate.id,
          visitedAt: { gte: thisWeekStart }
        }
      }),
      (prisma as any).affiliateVisit.count({
        where: {
          affiliateId: session.affiliate.id,
          visitedAt: { gte: thisMonthStart }
        }
      })
    ])
    
    const stats = {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount
    }
    
    // Set cookie for restored session
    const response = NextResponse.json({
      success: true,
      message: 'Session recovered successfully',
      affiliate: fullAffiliate,
      recentVisits: transformedVisits,
      stats
    })
    
    response.cookies.set('affiliate-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: '/'
    })
    
    console.log(`✅ SESSION RECOVERY: Successfully recovered session for ${session.affiliate.name}`)
    return response
    
  } catch (error) {
    console.error('💥 SESSION RECOVERY ERROR:', error)
    return NextResponse.json(
      { error: 'Session recovery failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 