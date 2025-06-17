import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Allow ADMIN and users with location profiles to access
    const isAdmin = session.user.role === 'ADMIN'
    let locationId: string | null = null
    
    if (!isAdmin) {
      // Get user's location profile
      const userProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          locationProfile: true
        }
      })
      
      if (!userProfile?.locationProfile) {
        return NextResponse.json({ error: 'Access denied - No location profile' }, { status: 403 })
      }
      
      locationId = userProfile.locationProfile.id
    }
    
    const { searchParams } = new URL(request.url)
    const requestedLocationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sellerId = searchParams.get('sellerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // If not admin, ensure they can only see their own location data
    const finalLocationId = isAdmin ? (requestedLocationId || locationId) : locationId
    
    if (!finalLocationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 })
    }
    
    // Build filter conditions
    const whereConditions: any = {
      locationId: finalLocationId
    }
    
    if (startDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: new Date(startDate)
      }
    }
    
    if (endDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: new Date(endDate)
      }
    }
    
    if (sellerId) {
      whereConditions.sellerId = sellerId
    }
    
    // Get location information
    const locationInfo = await prisma.location.findUnique({
      where: { id: finalLocationId },
      include: {
        distributor: true,
        sellers: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    })
    
    if (!locationInfo) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    
    // Get analytics data
    const [analytics, totalCount] = await Promise.all([
      prisma.qRCodeAnalytics.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          qrCodeRecord: {
            include: {
              usage: {
                orderBy: { usedAt: 'desc' }
              },
              activations: {
                orderBy: { activatedAt: 'desc' }
              }
            }
          }
        }
      }),
      prisma.qRCodeAnalytics.count({
        where: whereConditions
      })
    ])
    
    // Calculate summary statistics
    const summaryStats = await prisma.qRCodeAnalytics.aggregate({
      where: whereConditions,
      _sum: {
        totalAmount: true,
        baseAmount: true,
        guestAmount: true,
        dayAmount: true,
        commissionAmount: true,
        taxAmount: true
      },
      _avg: {
        totalAmount: true,
        guests: true,
        days: true
      },
      _count: {
        id: true
      }
    })
    
    // Get breakdown by seller within this location
    const sellerBreakdown = await prisma.qRCodeAnalytics.groupBy({
      by: ['sellerId', 'sellerName'],
      where: whereConditions,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      }
    })
    
    // Get daily trend for this location (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const dailyTrend = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as qrCodes,
        SUM(totalAmount) as revenue,
        AVG(totalAmount) as avgRevenue,
        SUM(guests) as totalGuests,
        AVG(guests) as avgGuests
      FROM qr_code_analytics 
      WHERE locationId = ${finalLocationId} 
        AND createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `
    
    return NextResponse.json({
      success: true,
      data: {
        location: {
          id: locationInfo.id,
          name: locationInfo.name,
          contactPerson: locationInfo.contactPerson,
          email: locationInfo.email,
          isActive: locationInfo.isActive,
          distributor: {
            id: locationInfo.distributor.id,
            name: locationInfo.distributor.name
          },
          sellersCount: locationInfo.sellers.length
        },
        analytics,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary: {
          totalRevenue: summaryStats._sum.totalAmount || 0,
          totalQRCodes: summaryStats._count.id || 0,
          averageRevenue: summaryStats._avg.totalAmount || 0,
          averageGuests: summaryStats._avg.guests || 0,
          averageDays: summaryStats._avg.days || 0,
          revenueBreakdown: {
            base: summaryStats._sum.baseAmount || 0,
            guests: summaryStats._sum.guestAmount || 0,
            days: summaryStats._sum.dayAmount || 0,
            commission: summaryStats._sum.commissionAmount || 0,
            tax: summaryStats._sum.taxAmount || 0
          }
        },
        breakdowns: {
          sellers: sellerBreakdown
        },
        trends: {
          daily: dailyTrend
        },
        hierarchy: {
          sellers: locationInfo.sellers
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching location analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 