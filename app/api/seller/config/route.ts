import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
    
    // Add temporary configuration name based on configuration
    const configWithName = {
      ...config,
      configName: `QR Configuration (${config.button3DeliveryMethod.toLowerCase()})`,
      configDescription: `${config.button1GuestsDefault} guests × ${config.button1DaysDefault} days - ${config.button3DeliveryMethod.toLowerCase()} delivery`
    }
    
    return NextResponse.json(configWithName)
    
  } catch (error) {
    console.error('Error fetching seller config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
