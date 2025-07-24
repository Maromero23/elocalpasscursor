import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'pending', 'processed', 'overdue', 'all'
    const offset = (page - 1) * limit

    // Build where clause based on status filter
    // IMPORTANT: Only show unprocessed QRs (processed ones are in regular QR list)
    let whereClause: any = {
      isProcessed: false  // Always filter to unprocessed only
    }
    const now = new Date()
    
    if (status === 'pending') {
      whereClause = {
        isProcessed: false,
        scheduledFor: { gt: now }
      }
    } else if (status === 'overdue') {
      whereClause = {
        isProcessed: false,
        scheduledFor: { lt: now }
      }
    }
    // For 'all' or no filter: whereClause already set to { isProcessed: false }
    // Never show processed QRs - those are in the regular QR analytics

    console.log(`📊 ADMIN: Fetching scheduled QRs (page ${page}, limit ${limit}, status: ${status || 'all'})`)

    // Get scheduled QRs
    const scheduledQRs = await prisma.scheduledQRCode.findMany({
      where: whereClause,
      orderBy: [
        { isProcessed: 'asc' }, // Unprocessed first
        { scheduledFor: 'asc' }  // Then by time
      ],
      skip: offset,
      take: limit
    })

    // Get seller IDs to fetch seller data
    const sellerIds = Array.from(new Set(scheduledQRs.map(qr => qr.sellerId)))
    
    // Fetch seller data with location and distributor info
    const sellers = await prisma.user.findMany({
      where: {
        id: { in: sellerIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: {
          select: {
            name: true,
            distributor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Create a map for quick seller lookup
    const sellerMap = new Map(sellers.map(seller => [seller.id, seller]))

    // Get total count for pagination
    const totalCount = await prisma.scheduledQRCode.count({
      where: whereClause
    })

    // Get status counts for dashboard (only unprocessed QRs)
    const statusCounts = await prisma.$transaction([
      // Pending (future, unprocessed)
      prisma.scheduledQRCode.count({
        where: {
          isProcessed: false,
          scheduledFor: { gt: now }
        }
      }),
      // Overdue (past, unprocessed) 
      prisma.scheduledQRCode.count({
        where: {
          isProcessed: false,
          scheduledFor: { lt: now }
        }
      }),
      // Total unprocessed (pending + overdue)
      prisma.scheduledQRCode.count({
        where: {
          isProcessed: false
        }
      })
    ])

    // Format the data with additional computed fields
    // NOTE: Only unprocessed QRs are shown (processed ones are in regular QR analytics)
    const formattedData = scheduledQRs.map(qr => {
      // Calculate time difference from now (all QRs here are unprocessed)
      const timeDiff = Math.round((qr.scheduledFor.getTime() - now.getTime()) / 1000 / 60) // minutes
      let status = 'pending'
      let statusColor = 'blue'
      let timeFromNowText = ''

      if (timeDiff < 0) {
        status = 'overdue'
        statusColor = 'red'
        timeFromNowText = `${Math.abs(timeDiff)} minutes overdue`
      } else if (timeDiff === 0) {
        status = 'pending'
        statusColor = 'blue'
        timeFromNowText = 'Due now'
      } else {
        status = 'pending'
        statusColor = 'blue'
        timeFromNowText = `${timeDiff} minutes remaining`
      }

      return {
        id: qr.id,
        clientName: qr.clientName,
        clientEmail: qr.clientEmail,
        guests: qr.guests,
        days: qr.days,
        amount: qr.amount,
        scheduledFor: qr.scheduledFor,
        isProcessed: qr.isProcessed,
        processedAt: qr.processedAt,
        createdQRCodeId: qr.createdQRCodeId,
        deliveryMethod: qr.deliveryMethod,
        createdAt: qr.createdAt,
        
        // Computed fields
        status: status,
        statusColor: statusColor,
        timeFromNow: timeDiff,
        timeFromNowText: timeFromNowText,
        
        // Seller info - PayPal QRs should show consistent seller information
        seller: (() => {
          // Check if this is a PayPal QR (configurationId === 'default' or specific seller ID)
          const isPayPalQR = qr.configurationId === 'default' || qr.sellerId === 'cmc4ha7l000086a96ef0e06qq'
          
          if (isPayPalQR) {
            // PayPal QR - show consistent seller information
            return {
              id: qr.sellerId,
              name: 'Online',
              email: 'direct@elocalpass.com',
              locationName: 'Online',
              distributorName: 'Elocalpass'
            }
          } else {
            // Seller dashboard QR - show actual seller information
            return {
              id: qr.sellerId,
              name: sellerMap.get(qr.sellerId)?.name || 'Unknown',
              email: sellerMap.get(qr.sellerId)?.email || 'Unknown',
              locationName: sellerMap.get(qr.sellerId)?.location?.name || null,
              distributorName: sellerMap.get(qr.sellerId)?.location?.distributor?.name || null
            }
          }
        })()
      }
    })

    const response = {
      success: true,
      data: formattedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      },
      summary: {
        pending: statusCounts[0],
        overdue: statusCounts[1], 
        total: statusCounts[2]
      }
    }

    console.log(`📊 ADMIN: Returning ${formattedData.length} scheduled QRs`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ ADMIN: Error fetching scheduled QRs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 