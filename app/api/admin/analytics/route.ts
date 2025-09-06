import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface QRAnalytics {
  id: string
  qrCode: string
  customerName: string
  customerEmail: string
  guests: number
  days: number
  cost: number
  sellerName: string
  sellerEmail: string
  locationName: string
  distributorName: string
  deliveryMethod: string
  language: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRangeParam = searchParams.get('dateRange') || '30'
    const distributorId = searchParams.get('distributorId') || ''
    const locationId = searchParams.get('locationId') || ''
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Calculate date filter
    let dateThreshold: Date | null = null
    if (dateRangeParam !== 'all') {
      const dateRange = parseInt(dateRangeParam)
      dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - dateRange)
    }

         // Build search filter
     const searchFilter = search ? {
       OR: [
         { code: { contains: search } },
         { customerName: { contains: search } },
         { customerEmail: { contains: search } }
       ]
     } : {}

     // Get all QR codes with related data
     const qrCodes = await prisma.qRCode.findMany({
       where: {
         ...(dateThreshold && {
           createdAt: {
             gte: dateThreshold
           }
         }),
         ...(status === 'active' && { isActive: true }),
         ...(status === 'expired' && { isActive: false }),
         ...searchFilter
       },
       include: {
         seller: {
           include: {
             location: {
               include: {
                 distributor: true
               }
             }
           }
         },
         analytics: true
       },
       orderBy: {
         [sortBy]: sortOrder as 'asc' | 'desc'
       },
       take: 1000
     })

    // Filter by distributor/location if specified
    const filteredQRCodes = qrCodes.filter((qr: any) => {
      if (distributorId && qr.seller?.location?.distributorId !== distributorId) {
        return false
      }
      if (locationId && qr.seller?.locationId !== locationId) {
        return false
      }
      return true
    })

         // Transform data for response
     const analytics: QRAnalytics[] = filteredQRCodes.map((qr: any) => {
       // Determine if this is a direct sale or seller-referred sale
       const isDirectSale = qr.sellerId === 'cmc4ha7l000086a96ef0e06qq' || 
                           (qr.seller?.email === 'direct@elocalpass.com' && qr.seller?.name === 'Online')
       
       let sellerName, sellerEmail, locationName, distributorName
       
       if (isDirectSale) {
         // Direct online sale (no discount code/rebuy link)
         sellerName = 'Online Sales'
         sellerEmail = 'direct@elocalpass.com'
         locationName = 'Website'
         distributorName = 'Elocalpass'
       } else {
         // Seller-referred sale (discount code or rebuy link used) or regular seller QR
         sellerName = qr.analytics?.sellerName || qr.seller?.name || 'Unknown Seller'
         sellerEmail = qr.analytics?.sellerEmail || qr.seller?.email || 'unknown@elocalpass.com'
         
         // For seller-referred PayPal sales, show "Online via [Location]"
         const isPayPalCode = qr.code.startsWith('PASS_')
         if (isPayPalCode && qr.seller?.location?.name) {
           locationName = `Online via ${qr.seller.location.name}`
         } else {
           locationName = qr.analytics?.locationName || qr.seller?.location?.name || (isPayPalCode ? 'Online' : '')
         }
         
         distributorName = qr.analytics?.distributorName || qr.seller?.location?.distributor?.name || ''
       }
       
       return {
         id: qr.id,
         qrCode: qr.code,
         customerName: qr.customerName || '',
         customerEmail: qr.customerEmail || '',
         guests: qr.guests,
         days: qr.days,
         cost: qr.cost,
         discountAmount: qr.analytics?.discountAmount || 0,
         sellerName,
         sellerEmail,
         locationName,
         distributorName,
         deliveryMethod: qr.analytics?.deliveryMethod || 'DIRECT',
         language: qr.analytics?.language || 'en',
         createdAt: qr.createdAt,
         expiresAt: qr.expiresAt,
         isActive: qr.isActive
       }
     })

    // Calculate summary statistics
    const totalQRCodes = analytics.length
    const totalRevenue = analytics.reduce((sum, qr) => sum + qr.cost, 0)
    const totalCustomers = new Set(analytics.map(qr => qr.customerEmail)).size
    const avgCost = totalQRCodes > 0 ? totalRevenue / totalQRCodes : 0
    const totalGuests = analytics.reduce((sum, qr) => sum + qr.guests, 0)
    const avgDays = totalQRCodes > 0 ? analytics.reduce((sum, qr) => sum + qr.days, 0) / totalQRCodes : 0
    const activeQRCodes = analytics.filter(qr => qr.isActive).length
    const expiredQRCodes = analytics.filter(qr => !qr.isActive).length

    const summary = {
      totalQRCodes,
      totalRevenue,
      totalCustomers,
      avgCost,
      totalGuests,
      avgDays,
      activeQRCodes,
      expiredQRCodes
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      summary
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 