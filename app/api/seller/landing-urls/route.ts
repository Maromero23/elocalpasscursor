import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all landing page URLs for the seller (or all URLs if admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let urls;
    
    // If user is admin, fetch all URLs. If seller, fetch only their URLs
    if (session.user.role === 'ADMIN') {
      console.log(' ADMIN: Fetching all seller landing page URLs')
      urls = await prisma.sellerLandingPageUrl.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log(' ADMIN: Found', urls.length, 'total URLs')
    } else {
      console.log(' SELLER: Fetching URLs for seller ID:', session.user.id)
      urls = await prisma.sellerLandingPageUrl.findMany({
        where: {
          sellerId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log(' SELLER: Found', urls.length, 'URLs for this seller')
    }

    return NextResponse.json(urls)
  } catch (error) {
    console.error('Error fetching seller landing URLs:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new landing page URL
export async function POST(request: NextRequest) {
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

    // URL is now optional - can be added later
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

    // Create the landing page URL entry
    const landingUrl = await prisma.sellerLandingPageUrl.create({
      data: {
        name: name.trim(),
        url: url?.trim() || null, // Allow null URLs
        description: description?.trim() || null,
        sellerId: seller.id
      }
    })

    return NextResponse.json(landingUrl)
  } catch (error) {
    console.error('Error creating landing URL:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
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
