import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Website Sales API called')
    
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Found' : 'Not found')
    console.log('User role:', session?.user?.role)
    
    if (!session || session.user.role !== 'ADMIN') {
      console.log('❌ Unauthorized - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Authorized - proceeding with query')

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const seller = searchParams.get('seller') || 'all'
    const delivery = searchParams.get('delivery') || 'all'
    const offset = (page - 1) * limit

    console.log('Query params:', { page, limit, search, status, seller, delivery })

    // Get all QR codes first, then filter for PayPal purchases only
    console.log('📊 Fetching all QR codes...')
    const allQRCodes = await prisma.qRCode.findMany({
      include: {
        seller: {
          include: {
            location: {
              include: {
                distributor: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Found ${allQRCodes.length} total QR codes`)

    // Filter QR codes that were purchased through PayPal (have customerEmail AND cost > 0)
    const qrCodes = allQRCodes.filter(qr => 
      qr.customerEmail !== null && 
      qr.customerName !== null && 
      qr.cost > 0  // Only paid QR codes (PayPal purchases)
    )
    console.log(`💰 Found ${qrCodes.length} PayPal-purchased QR codes`)

    // Apply additional filters
    let filteredQRCodes = qrCodes

    // Search filter
    if (search) {
      filteredQRCodes = filteredQRCodes.filter(qr => 
        qr.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        qr.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        qr.code.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Status filter
    if (status === 'active') {
      filteredQRCodes = filteredQRCodes.filter(qr => 
        qr.isActive && qr.expiresAt > new Date()
      )
    } else if (status === 'expired') {
      filteredQRCodes = filteredQRCodes.filter(qr => 
        qr.expiresAt <= new Date()
      )
    } else if (status === 'inactive') {
      filteredQRCodes = filteredQRCodes.filter(qr => !qr.isActive)
    }

    // Seller filter
    if (seller !== 'all') {
      filteredQRCodes = filteredQRCodes.filter(qr => qr.sellerId === seller)
    }

    // Delivery filter
    if (delivery === 'immediate') {
      // Keep only immediate deliveries (all QR codes are immediate)
    } else if (delivery === 'scheduled') {
      // For scheduled, we'll handle separately
      filteredQRCodes = []
    }

    // Pagination
    const paginatedQRCodes = filteredQRCodes.slice(offset, offset + limit)

    console.log(`📊 Final filtered PayPal QR codes: ${paginatedQRCodes.length}`)

    // Get scheduled QR codes from PayPal payments
    console.log('📅 Fetching scheduled QR codes...')
    const allScheduledQRCodes = await prisma.scheduledQRCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📅 Found ${allScheduledQRCodes.length} total scheduled QR codes`)

    // Filter scheduled QR codes that were from PayPal payments (have clientEmail)
    const scheduledQRCodes = allScheduledQRCodes.filter(sqr => 
      sqr.clientEmail !== null && 
      sqr.clientName !== null
      // Note: Scheduled QR codes don't have cost until processed, so we can't filter by cost
    )
    console.log(`💰 Found ${scheduledQRCodes.length} PayPal-scheduled QR codes`)

    // Apply filters to scheduled QR codes
    let filteredScheduledQRCodes = scheduledQRCodes

    // Search filter for scheduled
    if (search) {
      filteredScheduledQRCodes = filteredScheduledQRCodes.filter(sqr => 
        sqr.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        sqr.clientEmail?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Seller filter for scheduled
    if (seller !== 'all') {
      filteredScheduledQRCodes = filteredScheduledQRCodes.filter(sqr => sqr.sellerId === seller)
    }

    // Delivery filter for scheduled
    if (delivery === 'scheduled') {
      // Keep only scheduled deliveries
    } else if (delivery === 'immediate') {
      // For immediate, exclude scheduled
      filteredScheduledQRCodes = []
    } else {
      // For 'all', only include unprocessed scheduled QRs
      filteredScheduledQRCodes = filteredScheduledQRCodes.filter(sqr => !sqr.isProcessed)
    }

    // Pagination for scheduled
    const paginatedScheduledQRCodes = filteredScheduledQRCodes.slice(offset, offset + limit)

    console.log(`📅 Final filtered PayPal scheduled QR codes: ${paginatedScheduledQRCodes.length}`)

    // Get seller information for scheduled QRs
    const sellerIds = Array.from(new Set(paginatedScheduledQRCodes.map(qr => qr.sellerId)))
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })
    const sellerMap = new Map(sellers.map(seller => [seller.id, seller]))

    // Combine and format the data
    const sales: any[] = []

    // Add immediate deliveries
    paginatedQRCodes.forEach(qr => {
      if (delivery === 'all' || delivery === 'immediate') {
        sales.push({
          id: qr.id,
          qrCode: qr.code,
          customerName: qr.customerName,
          customerEmail: qr.customerEmail,
          amount: qr.cost,
          guests: qr.guests,
          days: qr.days,
          expiresAt: qr.expiresAt,
          createdAt: qr.createdAt,
          isActive: qr.isActive,
          deliveryType: 'immediate',
          seller: {
            id: qr.seller.id,
            name: qr.seller.name,
            email: qr.seller.email,
            location: qr.seller.location
          }
        })
      }
    })

    // Add scheduled deliveries
    paginatedScheduledQRCodes.forEach(scheduled => {
      if (delivery === 'all' || delivery === 'scheduled') {
        const seller = sellerMap.get(scheduled.sellerId)
        sales.push({
          id: scheduled.id,
          qrCode: scheduled.isProcessed ? scheduled.createdQRCodeId : 'Scheduled',
          customerName: scheduled.clientName,
          customerEmail: scheduled.clientEmail,
          amount: 0, // Scheduled QRs don't have cost yet
          guests: scheduled.guests,
          days: scheduled.days,
          expiresAt: scheduled.scheduledFor, // Will be set when processed
          createdAt: scheduled.createdAt,
          isActive: !scheduled.isProcessed,
          deliveryType: 'scheduled',
          scheduledFor: scheduled.scheduledFor,
          isProcessed: scheduled.isProcessed,
          seller: {
            id: seller?.id || scheduled.sellerId,
            name: seller?.name || 'Unknown',
            email: seller?.email || 'Unknown',
            location: seller?.location
          }
        })
      }
    })

    // Sort by creation date
    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`💰 Total sales to return: ${sales.length}`)

    // Get summary statistics (only PayPal purchases)
    const totalQRCodes = qrCodes.length
    const totalScheduledQRCodes = scheduledQRCodes.length

    const totalRevenue = qrCodes.reduce((sum, qr) => sum + (qr.cost || 0), 0)
    const activeQRCodes = qrCodes.filter(qr => qr.isActive && qr.expiresAt > new Date()).length
    const expiredQRCodes = qrCodes.filter(qr => qr.expiresAt <= new Date()).length

    const summary = {
      totalSales: totalQRCodes + totalScheduledQRCodes,
      totalRevenue: totalRevenue,
      immediateDeliveries: totalQRCodes,
      scheduledDeliveries: totalScheduledQRCodes,
      activeQRCodes,
      expiredQRCodes
    }

    console.log('📈 Summary:', summary)

    // Calculate total pages
    const totalItems = totalQRCodes + totalScheduledQRCodes
    const totalPages = Math.ceil(totalItems / limit)

    const response = {
      sales,
      summary,
      totalPages,
      currentPage: page,
      totalItems
    }

    console.log('✅ Returning response with', sales.length, 'sales')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching website sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch website sales' },
      { status: 500 }
    )
  }
} 