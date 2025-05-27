import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get seller's QR configuration
    const config = await prisma.qRConfig.findUnique({
      where: {
        sellerId: session.user.id
      }
    })
    
    if (!config) {
      return NextResponse.json(null)
    }
    
    return NextResponse.json(config)
    
  } catch (error) {
    console.error('Error fetching seller config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
