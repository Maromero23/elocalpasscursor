import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING DEFAULT EMAIL TEMPLATES IN DATABASE...')
    
    // Check for default welcome email templates
    const defaultTemplates = await prisma.welcomeEmailTemplate.findMany({
      where: {
        isDefault: true
      }
    })
    
    console.log(`📧 Found ${defaultTemplates.length} default templates`)
    
    // Also check all templates
    const allTemplates = await prisma.welcomeEmailTemplate.findMany()
    console.log(`📧 Total templates in database: ${allTemplates.length}`)
    
    const result = {
      defaultTemplatesCount: defaultTemplates.length,
      totalTemplatesCount: allTemplates.length,
      defaultTemplates: defaultTemplates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        hasCustomHTML: !!template.customHTML,
        customHTMLLength: template.customHTML?.length || 0,
        createdAt: template.createdAt
      })),
      allTemplates: allTemplates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        hasCustomHTML: !!template.customHTML,
        customHTMLLength: template.customHTML?.length || 0,
        createdAt: template.createdAt
      }))
    }
    
    console.log('📧 Template check result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error checking templates:', error)
    return NextResponse.json(
      { error: 'Failed to check templates', details: error },
      { status: 500 }
    )
  }
} 