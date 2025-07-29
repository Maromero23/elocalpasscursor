import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET default landing page template (public endpoint)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 PUBLIC API: Fetching default landing page template')
    
    const defaultTemplate = await prisma.landingPageTemplate.findFirst({
      where: { isDefault: true }
    })

    if (!defaultTemplate) {
      console.log('❌ PUBLIC API: No default template found')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Default template not found' 
        },
        { status: 404 }
      )
    }

    console.log('✅ PUBLIC API: Default template found:', defaultTemplate.name)
    
    return NextResponse.json({
      success: true,
      template: defaultTemplate
    })
    
  } catch (error) {
    console.error('❌ Error fetching default template:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch default template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 