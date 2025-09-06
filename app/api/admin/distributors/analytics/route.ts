import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Allow both ADMIN and users with distributor profiles to access
    const isAdmin = session.user.role === 'ADMIN'
    let distributorId: string | null = null
    
    if (!isAdmin) {
      // Get user's distributor profile
      const userProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          distributorProfile: true
        }
      })
      
      if (!userProfile?.distributorProfile) {
        return NextResponse.json({ error: 'Access denied - No distributor profile' }, { status: 403 })
      }
      
      distributorId = userProfile.distributorProfile.id
    }
    
    const { searchParams } = new URL(request.url)
    const requestedDistributorId = searchParams.get('distributorId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const locationId = searchParams.get('locationId')
    const sellerId = searchParams.get('sellerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // If not admin, ensure they can only see their own distributor data
    const finalDistributorId = isAdmin ? (requestedDistributorId || distributorId) : distributorId
    
    if (!finalDistributorId) {
      return NextResponse.json({ error: 'Distributor ID required' }, { status: 400 })
    }
    
    // Build filter conditions
    const whereConditions: any = {
      distributorId: finalDistributorId
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
    
    if (locationId) {
      whereConditions.locationId = locationId
    }
    
    if (sellerId) {
      whereConditions.sellerId = sellerId
    }
    
    // Get distributor information
    const distributorInfo = await prisma.distributor.findUnique({
      where: { id: finalDistributorId },
      include: {
        locations: {
          include: {
            sellers: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        }
      }
    })
    
    if (!distributorInfo) {
      return NextResponse.json({ error: 'Distributor not found' }, { status: 404 })
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
    
    // Get breakdown by location within this distributor
    const locationBreakdown = await prisma.qRCodeAnalytics.groupBy({
      by: ['locationId', 'locationName'],
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
    
    // Get breakdown by seller within this distributor
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
    
    // Get daily trend for this distributor (last 30 days)
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
      WHERE distributorId = ${finalDistributorId} 
        AND createdAt >= ${thirtyDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `
    
    return NextResponse.json({
      success: true,
      data: {
        distributor: {
          id: distributorInfo.id,
          name: distributorInfo.name,
          contactPerson: distributorInfo.contactPerson,
          email: distributorInfo.email,
          isActive: distributorInfo.isActive,
          locationsCount: distributorInfo.locations.length,
          sellersCount: distributorInfo.locations.reduce((total, loc) => total + loc.sellers.length, 0)
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
          locations: locationBreakdown,
          sellers: sellerBreakdown
        },
        trends: {
          daily: dailyTrend
        },
        hierarchy: {
          locations: distributorInfo.locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            isActive: loc.isActive,
            sellersCount: loc.sellers.length,
            sellers: loc.sellers
          }))
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching distributor analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 