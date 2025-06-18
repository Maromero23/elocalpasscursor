import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    // Validate session and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { sellerId } = params

    console.log(' Unpairing QR config for seller:', sellerId)

    // Find the seller
    const seller = await prisma.user.findUnique({
      where: { id: sellerId }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Clear all configuration identifiers from the seller (for saved configurations)
    await prisma.user.update({
      where: { id: sellerId },
      data: {
        savedConfigId: null,        // This is the key field for saved configurations
        configurationId: null,
        configurationName: null
      }
    })

    // Also try to delete old QRConfig if it exists (for backward compatibility)
    try {
      await prisma.qRConfig.delete({
        where: { sellerId: sellerId }
      })
    } catch (error: any) {
      // Ignore if no old config exists
      if (error.code !== 'P2025') {
        console.warn('Error deleting old QRConfig:', error.message)
      }
    }

    console.log(' QR config unpaired successfully for seller:', sellerId)

    return NextResponse.json({ 
      success: true, 
      message: 'QR configuration unpaired successfully',
      sellerId: sellerId
    })

  } catch (error: any) {
    console.error(' Error unpairing QR config:', error)
    
    // Handle case where no config exists to delete
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'No QR configuration found for this seller' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Failed to unpair QR configuration',
      details: error.message 
    }, { status: 500 })
  }
}