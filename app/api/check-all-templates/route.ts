import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING ALL EMAIL TEMPLATES...')
    
    // Get ALL templates (both default and non-default)
    const allTemplates = await prisma.welcomeEmailTemplate.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📧 Found ${allTemplates.length} total templates`)
    
    // Separate default vs non-default
    const defaultTemplates = allTemplates.filter(t => t.isDefault)
    const nonDefaultTemplates = allTemplates.filter(t => !t.isDefault)
    
    const result = {
      totalTemplates: allTemplates.length,
      defaultTemplates: defaultTemplates.length,
      nonDefaultTemplates: nonDefaultTemplates.length,
      allTemplates: allTemplates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        customHTMLLength: template.customHTML?.length || 0,
        isFromToday: template.createdAt.toDateString() === new Date().toDateString(),
        isFromJune: template.createdAt.toDateString().includes('Jun') || template.createdAt.getMonth() === 5
      })),
      analysis: {
        hasTemplateFromToday: allTemplates.some(t => t.createdAt.toDateString() === new Date().toDateString()),
        hasMultipleDefaults: defaultTemplates.length > 1,
        newestTemplate: allTemplates[0] ? {
          id: allTemplates[0].id,
          name: allTemplates[0].name,
          isDefault: allTemplates[0].isDefault,
          createdAt: allTemplates[0].createdAt
        } : null
      }
    }
    
    console.log('📧 Template analysis:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error checking all templates:', error)
    return NextResponse.json(
      { error: 'Failed to check templates', details: error },
      { status: 500 }
    )
  }
} 