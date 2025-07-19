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

    // Build base where clause for PayPal purchases
    let baseWhere: any = {
      customerEmail: { not: null as any },
      customerName: { not: null as any },
      cost: { gt: 0 }  // Only paid QR codes (PayPal purchases)
    }

    // Add search filter
    if (search) {
      baseWhere.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (status === 'active') {
      baseWhere.isActive = true
      baseWhere.expiresAt = { gt: new Date() }
    } else if (status === 'expired') {
      baseWhere.expiresAt = { lte: new Date() }
    } else if (status === 'inactive') {
      baseWhere.isActive = false
    }

    // Add seller filter
    if (seller !== 'all') {
      baseWhere.sellerId = seller
    }

    console.log('Base where clause:', JSON.stringify(baseWhere, null, 2))

    // Get PayPal-purchased QR codes
    console.log('📊 Fetching PayPal-purchased QR codes...')
    const qrCodes = delivery === 'scheduled' ? [] : await prisma.qRCode.findMany({
      where: baseWhere,
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
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    console.log(`💰 Found ${qrCodes.length} PayPal-purchased QR codes`)

    // Build base where clause for scheduled QR codes
    let scheduledWhere: any = {
      clientEmail: { not: null as any },
      clientName: { not: null as any }
    }

    // Add search filter for scheduled
    if (search) {
      scheduledWhere.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add seller filter for scheduled
    if (seller !== 'all') {
      scheduledWhere.sellerId = seller
    }

    // For 'all' delivery type, only include unprocessed scheduled QRs
    if (delivery === 'all') {
      scheduledWhere.isProcessed = false
    }

    // Get PayPal-scheduled QR codes
    console.log('📅 Fetching PayPal-scheduled QR codes...')
    const scheduledQRCodes = delivery === 'immediate' ? [] : await prisma.scheduledQRCode.findMany({
      where: scheduledWhere,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    console.log(`💰 Found ${scheduledQRCodes.length} PayPal-scheduled QR codes`)

    // Get seller information for scheduled QRs
    const sellerIds = Array.from(new Set(scheduledQRCodes.map(qr => qr.sellerId)))
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
    qrCodes.forEach(qr => {
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
    scheduledQRCodes.forEach(scheduled => {
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
    const totalQRCodesCount = await prisma.qRCode.count({
      where: {
        customerEmail: { not: null as any },
        customerName: { not: null as any },
        cost: { gt: 0 }
      }
    })

    const totalScheduledQRCodesCount = await prisma.scheduledQRCode.count({
      where: {
        clientEmail: { not: null as any },
        clientName: { not: null as any }
      }
    })

    const totalRevenue = qrCodes.reduce((sum, qr) => sum + (qr.cost || 0), 0)
    const activeQRCodes = qrCodes.filter(qr => qr.isActive && qr.expiresAt > new Date()).length
    const expiredQRCodes = qrCodes.filter(qr => qr.expiresAt <= new Date()).length

    const summary = {
      totalSales: totalQRCodesCount + totalScheduledQRCodesCount,
      totalRevenue: totalRevenue,
      immediateDeliveries: totalQRCodesCount,
      scheduledDeliveries: totalScheduledQRCodesCount,
      activeQRCodes,
      expiredQRCodes
    }

    console.log('📈 Summary:', summary)

    // Calculate total pages
    const totalItems = totalQRCodesCount + totalScheduledQRCodesCount
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