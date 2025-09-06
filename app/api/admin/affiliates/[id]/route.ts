import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const affiliate = await (prisma as any).affiliate.findUnique({
      where: { id: params.id },
      include: {
        visits: {
          take: 10,
          orderBy: { visitedAt: 'desc' },
          include: {
            qrCodeRecord: {
              select: {
                code: true,
                customerName: true,
                customerEmail: true
              }
            }
          }
        },
        _count: {
          select: {
            visits: true
          }
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      affiliate
    })

  } catch (error) {
    console.error('❌ ADMIN: Error fetching affiliate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 })
    }

    const affiliate = await (prisma as any).affiliate.update({
      where: { id: params.id },
      data: {
        affiliateNum: body.affiliateNum,
        isActive: body.isActive,
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email.toLowerCase(),
        workPhone: body.workPhone,
        whatsApp: body.whatsApp,
        address: body.address,
        web: body.web,
        description: body.description,
        city: body.city,
        maps: body.maps,
        location: body.location,
        discount: body.discount,
        logo: body.logo,
        facebook: body.facebook,
        instagram: body.instagram,
        category: body.category,
        subCategory: body.subCategory,
        service: body.service,
        type: body.type,
        sticker: body.sticker,
        rating: body.rating ? parseFloat(body.rating) : null,
        recommended: body.recommended,
        termsConditions: body.termsConditions
      }
    })

    console.log(`✅ ADMIN: Updated affiliate ${affiliate.name} (${affiliate.email})`)

    return NextResponse.json({
      success: true,
      affiliate
    })

  } catch (error) {
    console.error('❌ ADMIN: Error updating affiliate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate info before deletion
    const affiliate = await (prisma as any).affiliate.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, totalVisits: true }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Delete all related data in correct order
    await (prisma as any).$transaction([
      // Delete visits first (due to foreign key constraints)
      (prisma as any).affiliateVisit.deleteMany({
        where: { affiliateId: params.id }
      }),
      // Delete sessions
      (prisma as any).affiliateSession.deleteMany({
        where: { affiliateId: params.id }
      }),
      // Finally delete the affiliate
      (prisma as any).affiliate.delete({
        where: { id: params.id }
      })
    ])

    console.log(`🗑️ ADMIN: Deleted affiliate ${affiliate.name} (${affiliate.email}) with ${affiliate.totalVisits} visits`)

    return NextResponse.json({
      success: true,
      message: `Affiliate ${affiliate.name} deleted successfully`
    })

  } catch (error) {
    console.error('❌ ADMIN: Error deleting affiliate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 