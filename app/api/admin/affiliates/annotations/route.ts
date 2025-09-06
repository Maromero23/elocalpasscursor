import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Load annotations for affiliates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const affiliateIds = searchParams.get('affiliateIds')?.split(',') || []

    if (affiliateIds.length === 0) {
      return NextResponse.json({ success: true, annotations: {} })
    }

    const annotations = await prisma.affiliateFieldAnnotation.findMany({
      where: {
        affiliateId: { in: affiliateIds }
      },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    // Group by affiliateId and fieldName for easy lookup
    const annotationsMap: Record<string, Record<string, any>> = {}
    annotations.forEach(annotation => {
      if (!annotationsMap[annotation.affiliateId]) {
        annotationsMap[annotation.affiliateId] = {}
      }
      annotationsMap[annotation.affiliateId][annotation.fieldName] = {
        id: annotation.id,
        color: annotation.color,
        comment: annotation.comment,
        createdAt: annotation.createdAt,
        createdBy: annotation.creator
      }
    })

    return NextResponse.json({
      success: true,
      annotations: annotationsMap
    })
  } catch (error) {
    console.error('Error loading annotations:', error)
    return NextResponse.json({ error: 'Failed to load annotations' } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}

// POST - Create or update annotation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { affiliateId, fieldName, color, comment } = await request.json()

    if (!affiliateId || !fieldName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert the annotation
    const annotation = await prisma.affiliateFieldAnnotation.upsert({
      where: {
        affiliateId_fieldName: {
          affiliateId,
          fieldName
        }
      },
      create: {
        affiliateId,
        fieldName,
        color: color || null,
        comment: comment || null,
        createdBy: user.id
      },
      update: {
        color: color || null,
        comment: comment || null,
        createdBy: user.id // Track who last updated
      },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      annotation: {
        id: annotation.id,
        color: annotation.color,
        comment: annotation.comment,
        createdAt: annotation.createdAt,
        createdBy: annotation.creator
      }
    })
  } catch (error) {
    console.error('Error saving annotation:', error)
    return NextResponse.json({ error: 'Failed to save annotation' } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}

// DELETE - Remove annotation
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const affiliateId = searchParams.get('affiliateId')
    const fieldName = searchParams.get('fieldName')

    if (!affiliateId || !fieldName) {
      return NextResponse.json({ error: 'Missing affiliateId or fieldName' }, { status: 400 })
    }

    await prisma.affiliateFieldAnnotation.delete({
      where: {
        affiliateId_fieldName: {
          affiliateId,
          fieldName
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting annotation:', error)
    return NextResponse.json({ error: 'Failed to delete annotation' } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
} 