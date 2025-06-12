import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET single saved configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!savedConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }
    
    // Parse JSON strings back to objects
    const parsedConfig = {
      ...savedConfig,
      config: JSON.parse(savedConfig.config),
      emailTemplates: savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null,
      landingPageConfig: savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : null,
      selectedUrlIds: savedConfig.selectedUrlIds ? JSON.parse(savedConfig.selectedUrlIds) : null,
    }
    
    return NextResponse.json(parsedConfig)
    
  } catch (error) {
    console.error('Error fetching saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE saved configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // First unassign all users from this configuration
    await prisma.user.updateMany({
      where: { savedConfigId: params.id },
      data: { savedConfigId: null }
    })
    
    // Then delete the configuration
    await prisma.savedQRConfiguration.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting saved configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
