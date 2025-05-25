import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { prisma } from '../../../../../lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = params
    
    // Validate required fields
    if (!data.name || !data.headerText || !data.descriptionText || !data.ctaButtonText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If this is being set as default, unset all other defaults
    if (data.isDefault) {
      await prisma.landingPageTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.landingPageTemplate.update({
      where: { id },
      data: {
        name: data.name,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#f97316',
        secondaryColor: data.secondaryColor || '#fb923c',
        backgroundColor: data.backgroundColor || '#fef3f2',
        headerText: data.headerText,
        descriptionText: data.descriptionText,
        ctaButtonText: data.ctaButtonText,
        showPayPal: data.showPayPal || false,
        showContactForm: data.showContactForm || false,
        customCSS: data.customCSS || null,
        isDefault: data.isDefault || false
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating landing template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const { id } = params

    // Check if this is the default template
    const template = await prisma.landingPageTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default template' }, { status: 400 })
    }

    await prisma.landingPageTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting landing template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
