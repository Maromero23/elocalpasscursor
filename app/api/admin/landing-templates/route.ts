import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.landingPageTemplate.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching landing templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.headerText || !data.descriptionText || !data.ctaButtonText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If this is being set as default, unset all other defaults
    if (data.isDefault) {
      await prisma.landingPageTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.landingPageTemplate.create({
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

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating landing template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
