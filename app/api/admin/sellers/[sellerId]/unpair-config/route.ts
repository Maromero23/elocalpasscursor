import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    // Delete the QR configuration for this seller
    const deletedConfig = await prisma.qRConfig.delete({
      where: { sellerId: sellerId }
    })

    console.log(' QR config unpaired successfully:', deletedConfig.id)

    return NextResponse.json({ 
      success: true, 
      message: 'QR configuration unpaired successfully',
      deletedConfigId: deletedConfig.id
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