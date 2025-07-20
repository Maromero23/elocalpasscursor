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
        logoUrl: null,
        headerText: name,
        bodyText: 'Custom email template',
        footerText: 'Thank you for choosing ELocalPass!',
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
    
    // Get all email templates from database
    const templates = await prisma.welcomeEmailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('✅ LOADED EMAIL TEMPLATES FROM DATABASE:', templates.length)
    
    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        hasCustomHTML: !!template.customHTML
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