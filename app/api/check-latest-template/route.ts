import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING LATEST DEFAULT TEMPLATE...')
    
    // Get all default templates ordered by creation date (newest first)
    const defaultTemplates = await prisma.welcomeEmailTemplate.findMany({
      where: {
        isDefault: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📧 Found ${defaultTemplates.length} default templates`)
    
    // Also get the one the system would currently pick
    const currentDefault = await prisma.welcomeEmailTemplate.findFirst({
      where: {
        isDefault: true
      }
    })
    
    const result = {
      totalDefaultTemplates: defaultTemplates.length,
      templates: defaultTemplates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        isNewest: template.id === defaultTemplates[0]?.id,
        customHTMLLength: template.customHTML?.length || 0
      })),
      systemWouldPick: currentDefault ? {
        id: currentDefault.id,
        name: currentDefault.name,
        createdAt: currentDefault.createdAt,
        isNewest: currentDefault.id === defaultTemplates[0]?.id
      } : null,
      recommendation: defaultTemplates.length > 1 ? 
        'Multiple default templates found - should use newest one' : 
        'Only one default template found'
    }
    
    console.log('📧 Template analysis:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error checking templates:', error)
    return NextResponse.json(
      { error: 'Failed to check templates', details: error } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 