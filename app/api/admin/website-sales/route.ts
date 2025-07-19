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

    // Get all QR codes first, then filter in JavaScript (avoiding Prisma issues)
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

    // Filter for PayPal purchases only (customerEmail, customerName, cost > 0, and PASS_ prefix)
    let paypalQRCodes = allQRCodes.filter(qr => 
      qr.customerEmail && 
      qr.customerName && 
      qr.cost > 0 &&
      qr.code.startsWith('PASS_') // Only QR codes from PayPal checkout flow
    )

    console.log(`💰 Found ${paypalQRCodes.length} PayPal-purchased QR codes`)

    // Apply additional filters
    if (search) {
      paypalQRCodes = paypalQRCodes.filter(qr => 
        qr.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        qr.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
        qr.code.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status === 'active') {
      paypalQRCodes = paypalQRCodes.filter(qr => 
        qr.isActive && qr.expiresAt > new Date()
      )
    } else if (status === 'expired') {
      paypalQRCodes = paypalQRCodes.filter(qr => 
        qr.expiresAt <= new Date()
      )
    } else if (status === 'inactive') {
      paypalQRCodes = paypalQRCodes.filter(qr => !qr.isActive)
    }

    if (seller !== 'all') {
      paypalQRCodes = paypalQRCodes.filter(qr => qr.sellerId === seller)
    }

    // Handle delivery filter
    const qrCodes = delivery === 'scheduled' ? [] : paypalQRCodes.slice(offset, offset + limit)

    console.log(`📊 Final PayPal QR codes for page: ${qrCodes.length}`)

    // Get all scheduled QR codes
    console.log('📅 Fetching all scheduled QR codes...')
    const allScheduledQRCodes = await prisma.scheduledQRCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📅 Found ${allScheduledQRCodes.length} total scheduled QR codes`)

    // Filter for PayPal scheduled purchases only (clientEmail and clientName)
    let paypalScheduledQRCodes = allScheduledQRCodes.filter(sqr => 
      sqr.clientEmail && 
      sqr.clientName
    )

    console.log(`💰 Found ${paypalScheduledQRCodes.length} PayPal-scheduled QR codes`)

    // Apply additional filters to scheduled
    if (search) {
      paypalScheduledQRCodes = paypalScheduledQRCodes.filter(sqr => 
        sqr.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        sqr.clientEmail?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (seller !== 'all') {
      paypalScheduledQRCodes = paypalScheduledQRCodes.filter(sqr => sqr.sellerId === seller)
    }

    // For 'all' delivery type, only include unprocessed scheduled QRs
    if (delivery === 'all') {
      paypalScheduledQRCodes = paypalScheduledQRCodes.filter(sqr => !sqr.isProcessed)
    }

    // Handle delivery filter and pagination
    const scheduledQRCodes = delivery === 'immediate' ? [] : paypalScheduledQRCodes.slice(offset, offset + limit)

    console.log(`📅 Final PayPal scheduled QR codes for page: ${scheduledQRCodes.length}`)

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

    // Get summary statistics (using filtered counts)
    const totalQRCodesCount = paypalQRCodes.length
    const totalScheduledQRCodesCount = paypalScheduledQRCodes.length

    const totalRevenue = paypalQRCodes.reduce((sum, qr) => sum + (qr.cost || 0), 0)
    const activeQRCodes = paypalQRCodes.filter(qr => qr.isActive && qr.expiresAt > new Date()).length
    const expiredQRCodes = paypalQRCodes.filter(qr => qr.expiresAt <= new Date()).length

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