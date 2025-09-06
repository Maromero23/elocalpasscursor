import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch specific landing page URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = await prisma.sellerLandingPageUrl.findFirst({
      where: {
        id: params.id,
        sellerId: session.user.id
      }
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    return NextResponse.json(url)
  } catch (error) {
    console.error('Error fetching seller landing URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update landing page URL
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, url, description } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // URL is optional - can be added later
    if (url && !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Get the seller user
    const seller = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!seller) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if the URL belongs to this seller
    const existingUrl = await prisma.sellerLandingPageUrl.findFirst({
      where: {
        id: params.id,
        sellerId: seller.id
      }
    })

    if (!existingUrl) {
      return NextResponse.json({ error: 'Landing URL not found' }, { status: 404 })
    }

    // Update the landing page URL
    const updatedUrl = await prisma.sellerLandingPageUrl.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        url: url?.trim() || null, // Allow null URLs
        description: description?.trim() || null
      }
    })

    return NextResponse.json(updatedUrl)
  } catch (error) {
    console.error('Error updating landing URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// DELETE - Delete landing page URL
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletedUrl = await prisma.sellerLandingPageUrl.deleteMany({
      where: {
        id: params.id,
        sellerId: session.user.id
      }
    })

    if (deletedUrl.count === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'URL deleted successfully' })
  } catch (error) {
    console.error('Error deleting seller landing URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
