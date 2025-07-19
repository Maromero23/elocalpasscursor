import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGGING DEFAULT TEMPLATE...')
    
    // Get the exact template that should be used
    const template = await prisma.welcomeEmailTemplate.findFirst({
      where: {
        isDefault: true
      }
    })
    
    if (!template) {
      return NextResponse.json({ 
        error: 'No default template found',
        message: 'This is why PayPal is using fallback template'
      }, { status: 404 })
    }
    
    const result = {
      found: true,
      template: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        customHTML: {
          exists: !!template.customHTML,
          isNull: template.customHTML === null,
          isUndefined: template.customHTML === undefined,
          isEmpty: template.customHTML === '',
          length: template.customHTML?.length || 0,
          type: typeof template.customHTML,
          preview: template.customHTML ? template.customHTML.substring(0, 500) + '...' : 'NO CONTENT'
        },
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      },
      diagnosis: template.customHTML ? 'Template has content - should work' : 'Template has no customHTML - this is the problem!'
    }
    
    console.log('🔍 Template debug result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error debugging template:', error)
    return NextResponse.json(
      { error: 'Failed to debug template', details: error },
      { status: 500 }
    )
  }
} 