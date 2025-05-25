import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // First, unset all existing defaults
    await prisma.landingPageTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    })

    // Then set this template as default
    const template = await prisma.landingPageTemplate.update({
      where: { id },
      data: { isDefault: true }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error setting default template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
