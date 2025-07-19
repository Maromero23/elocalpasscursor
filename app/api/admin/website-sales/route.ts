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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const seller = searchParams.get('seller') || 'all'
    const delivery = searchParams.get('delivery') || 'all'
    const offset = (page - 1) * limit

    // Build where clause for QR codes
    let whereClause: any = {
      customerEmail: {
        not: null as any
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (status === 'active') {
      whereClause.isActive = true
      whereClause.expiresAt = { gt: new Date() }
    } else if (status === 'expired') {
      whereClause.expiresAt = { lte: new Date() }
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    // Add seller filter
    if (seller !== 'all') {
      whereClause.sellerId = seller
    }

    // Get QR codes (immediate deliveries)
    const qrCodes = await prisma.qRCode.findMany({
      where: whereClause,
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

    // Get scheduled QR codes (future deliveries)
    const scheduledQRCodes = await prisma.scheduledQRCode.findMany({
      where: {
        clientEmail: {
          not: null as any
        },
        ...(search ? {
          OR: [
            { clientName: { contains: search, mode: 'insensitive' } },
            { clientEmail: { contains: search, mode: 'insensitive' } }
          ]
        } : {}),
        ...(seller !== 'all' ? { sellerId: seller } : {}),
        ...(delivery === 'scheduled' ? {} : { isProcessed: false })
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

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

    // Get summary statistics
    const totalQRCodes = await prisma.qRCode.count({
      where: { customerEmail: { not: null as any } }
    })

    const totalScheduledQRCodes = await prisma.scheduledQRCode.count({
      where: { clientEmail: { not: null as any } }
    })

    const totalRevenue = await prisma.qRCode.aggregate({
      where: { 
        customerEmail: { not: null },
        cost: { gt: 0 }
      },
      _sum: { cost: true }
    })

    const activeQRCodes = await prisma.qRCode.count({
      where: {
        customerEmail: { not: null },
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    })

    const expiredQRCodes = await prisma.qRCode.count({
      where: {
        customerEmail: { not: null },
        expiresAt: { lte: new Date() }
      }
    })

    const summary = {
      totalSales: totalQRCodes + totalScheduledQRCodes,
      totalRevenue: totalRevenue._sum.cost || 0,
      immediateDeliveries: totalQRCodes,
      scheduledDeliveries: totalScheduledQRCodes,
      activeQRCodes,
      expiredQRCodes
    }

    // Calculate total pages
    const totalItems = totalQRCodes + totalScheduledQRCodes
    const totalPages = Math.ceil(totalItems / limit)

    return NextResponse.json({
      sales,
      summary,
      totalPages,
      currentPage: page,
      totalItems
    })

  } catch (error) {
    console.error('Error fetching website sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch website sales' },
      { status: 500 }
    )
  }
} 