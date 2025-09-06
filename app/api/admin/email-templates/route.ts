import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, subject, customHTML, isDefault, emailConfig } = await request.json()
    
    console.log('📧 SAVING EMAIL TEMPLATE TO DATABASE:', name)
    
    // Create the template in database
    const template = await prisma.welcomeEmailTemplate.create({
      data: {
        name: name,
        subject: subject || 'Welcome to ELocalPass!',
        logoUrl: emailConfig?.logoUrl || null,
        headerText: emailConfig?.emailHeaderText || name,
        bodyText: emailConfig?.emailMessageText || 'Custom email template',
        footerText: emailConfig?.emailFooterText || 'Thank you for choosing ELocalPass!',
        primaryColor: emailConfig?.emailPrimaryColor || '#3b82f6',
        backgroundColor: emailConfig?.emailBackgroundColor || '#ffffff',
        buttonColor: emailConfig?.emailCtaBackgroundColor || '#3b82f6',
        buttonText: emailConfig?.emailCtaText || 'View Your Pass',
        customHTML: customHTML,
        isDefault: isDefault || false
      }
    })
    
    console.log('✅ EMAIL TEMPLATE SAVED TO DATABASE:', template.id)
    
    return NextResponse.json({
      success: true,
      templateId: template.id,
      templateName: template.name,
      message: 'Template saved to database successfully'
    })
    
  } catch (error) {
    console.error('❌ Error saving email template to database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save template to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📧 LOADING EMAIL TEMPLATES FROM DATABASE...')
    
    const { searchParams } = new URL(request.url)
    const isDefaultParam = searchParams.get('isDefault')
    
    // Build the where clause based on the isDefault parameter
    let whereClause = {}
    if (isDefaultParam !== null) {
      // Convert string to boolean
      const isDefault = isDefaultParam === 'true'
      whereClause = { isDefault: isDefault }
    }
    
    // Get email templates from database
    const templates = await prisma.welcomeEmailTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('✅ LOADED EMAIL TEMPLATES FROM DATABASE:', templates.length, 'isDefault filter:', isDefaultParam)
    
    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        hasCustomHTML: !!template.customHTML,
        // Map basic fields to full emailConfig structure
        emailConfig: {
          useDefaultEmail: template.isDefault,
          emailHeaderText: template.headerText,
          emailHeaderColor: template.primaryColor,
          emailHeaderTextColor: '#ffffff',
          emailHeaderFontFamily: 'Arial, sans-serif',
          emailHeaderFontSize: '28',
          emailMessageText: template.bodyText,
          emailMessageTextColor: '#374151',
          emailMessageFontFamily: 'Arial, sans-serif',
          emailMessageFontSize: '16',
          emailCtaText: template.buttonText,
          emailCtaTextColor: '#ffffff',
          emailCtaFontFamily: 'Arial, sans-serif',
          emailCtaFontSize: '18',
          emailCtaBackgroundColor: template.buttonColor,
          emailNoticeText: 'IMPORTANT: Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.',
          emailNoticeTextColor: '#dc2626',
          emailNoticeFontFamily: 'Arial, sans-serif',
          emailNoticeFontSize: '14',
          emailFooterText: template.footerText,
          emailFooterTextColor: '#6b7280',
          emailFooterFontFamily: 'Arial, sans-serif',
          emailFooterFontSize: '14',
          emailPrimaryColor: template.primaryColor,
          emailSecondaryColor: '#f97316',
          emailBackgroundColor: template.backgroundColor,
          logoUrl: template.logoUrl || '',
          bannerImages: [],
          newBannerUrl: '',
          videoUrl: '',
          enableLocationBasedAffiliates: true,
          selectedAffiliates: [],
          customAffiliateMessage: 'Discover amazing local discounts at these partner establishments:',
          includeQRInEmail: false,
          emailAccountCreationUrl: 'https://elocalpass.com/create-account',
          customCssStyles: '',
          companyName: 'ELocalPass',
          defaultWelcomeMessage: 'Welcome to your local pass experience!'
        }
      }))
    })
    
  } catch (error) {
    console.error('❌ Error loading email templates from database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load templates from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 