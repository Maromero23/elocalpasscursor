import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET all landing page templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isDefault = searchParams.get('isDefault')
    
    const whereClause: any = {}
    if (isDefault !== null) {
      whereClause.isDefault = isDefault === 'true'
    }

    const templates = await prisma.landingPageTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📄 LANDING PAGE TEMPLATES: Found ${templates.length} templates`)
    
    return NextResponse.json({
      success: true,
      templates: templates
    })
    
  } catch (error) {
    console.error('❌ Error fetching landing page templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
}

// POST create new landing page template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      logoUrl, 
      primaryColor, 
      secondaryColor, 
      backgroundColor,
      headerText,
      descriptionText,
      ctaButtonText,
      showPayPal,
      showContactForm,
      customCSS,
      isDefault = false,
      // Additional styling fields
      headerTextColor,
      headerFontFamily,
      headerFontSize,
      descriptionTextColor,
      descriptionFontFamily,
      descriptionFontSize,
      ctaButtonTextColor,
      ctaButtonFontFamily,
      ctaButtonFontSize,
      formTitleText,
      formTitleTextColor,
      formTitleFontFamily,
      formTitleFontSize,
      formInstructionsText,
      formInstructionsTextColor,
      formInstructionsFontFamily,
      formInstructionsFontSize,
      footerDisclaimerText,
      footerDisclaimerTextColor,
      footerDisclaimerFontFamily,
      footerDisclaimerFontSize,
      guestSelectionBoxColor,
      daySelectionBoxColor,
      footerDisclaimerBoxColor
    } = body
    
    // Store additional styling in customCSS as JSON
    const additionalStyling = {
      headerTextColor,
      headerFontFamily,
      headerFontSize,
      descriptionTextColor,
      descriptionFontFamily,
      descriptionFontSize,
      ctaButtonTextColor,
      ctaButtonFontFamily,
      ctaButtonFontSize,
      formTitleText,
      formTitleTextColor,
      formTitleFontFamily,
      formTitleFontSize,
      formInstructionsText,
      formInstructionsTextColor,
      formInstructionsFontFamily,
      formInstructionsFontSize,
      footerDisclaimerText,
      footerDisclaimerTextColor,
      footerDisclaimerFontFamily,
      footerDisclaimerFontSize,
      guestSelectionBoxColor,
      daySelectionBoxColor,
      footerDisclaimerBoxColor
    }
    
    const customCSSData = customCSS || JSON.stringify(additionalStyling)
    
    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    let template

    // If this is a default template, update/replace the existing default
    if (isDefault) {
      // First, find the existing default template
      const existingDefault = await prisma.landingPageTemplate.findFirst({
        where: { isDefault: true }
      })

      if (existingDefault) {
        // Update the existing default template with new data
        template = await prisma.landingPageTemplate.update({
          where: { id: existingDefault.id },
          data: {
            name: name,
            logoUrl: logoUrl || null,
            primaryColor: primaryColor || '#3b82f6',
            secondaryColor: secondaryColor || '#6366f1',
            backgroundColor: backgroundColor || '#f8fafc',
            headerText: headerText || 'Welcome to Your ELocalPass Experience!',
            descriptionText: descriptionText || 'Enter your details below to receive your personalized ELocalPass.',
            ctaButtonText: ctaButtonText || 'Get Your ELocalPass',
            showPayPal: showPayPal !== undefined ? showPayPal : true,
            showContactForm: showContactForm !== undefined ? showContactForm : true,
            customCSS: customCSSData,
            isDefault: true
          }
        })
        console.log('✅ Updated existing default template:', template.id)
      } else {
        // No existing default, create a new one
        template = await prisma.landingPageTemplate.create({
          data: {
            name: name,
            logoUrl: logoUrl || null,
            primaryColor: primaryColor || '#3b82f6',
            secondaryColor: secondaryColor || '#6366f1',
            backgroundColor: backgroundColor || '#f8fafc',
            headerText: headerText || 'Welcome to Your ELocalPass Experience!',
            descriptionText: descriptionText || 'Enter your details below to receive your personalized ELocalPass.',
            ctaButtonText: ctaButtonText || 'Get Your ELocalPass',
            showPayPal: showPayPal !== undefined ? showPayPal : true,
            showContactForm: showContactForm !== undefined ? showContactForm : true,
            customCSS: customCSSData,
            isDefault: true
          }
        })
        console.log('✅ Created new default template:', template.id)
      }
    } else {
      // Regular template, create normally
      template = await prisma.landingPageTemplate.create({
        data: {
          name: name,
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || '#3b82f6',
          secondaryColor: secondaryColor || '#6366f1',
          backgroundColor: backgroundColor || '#f8fafc',
          headerText: headerText || 'Welcome to Your ELocalPass Experience!',
          descriptionText: descriptionText || 'Enter your details below to receive your personalized ELocalPass.',
          ctaButtonText: ctaButtonText || 'Get Your ELocalPass',
          showPayPal: showPayPal !== undefined ? showPayPal : true,
          showContactForm: showContactForm !== undefined ? showContactForm : true,
          customCSS: customCSSData,
          isDefault: false
        }
      })
    }
    
    console.log('✅ LANDING PAGE TEMPLATE SAVED TO DATABASE:', template.id, template.name)
    
    return NextResponse.json({
      success: true,
      template: template,
      message: 'Template saved to database successfully'
    })
    
  } catch (error) {
    console.error('❌ Error saving landing page template to database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save template to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
}

// DELETE landing page template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Check if template exists
    const existingTemplate = await prisma.landingPageTemplate.findUnique({
      where: { id: templateId }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Don't allow deletion of default template
    if (existingTemplate.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default template' }, { status: 400 })
    }

    // Delete the template
    await prisma.landingPageTemplate.delete({
      where: { id: templateId }
    })
    
    console.log('🗑️ LANDING PAGE TEMPLATE DELETED:', templateId)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting landing page template:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 