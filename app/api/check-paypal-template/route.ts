import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING PAYPAL TEMPLATE: "Welcome Email Paypal 2323"')
    
    // Check database for PayPal template
    const paypalTemplateDB = await prisma.welcomeEmailTemplate.findFirst({
      where: {
        name: {
          contains: 'Welcome Email Paypal 2323'
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the latest one
      }
    })
    
    // Check for any templates with "paypal" in the name (case insensitive)
    const allPaypalTemplatesDB = await prisma.welcomeEmailTemplate.findMany({
      where: {
        name: {
          contains: 'paypal',
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const result = {
      paypalTemplateFound: !!paypalTemplateDB,
      paypalTemplate: paypalTemplateDB ? {
        id: paypalTemplateDB.id,
        name: paypalTemplateDB.name,
        subject: paypalTemplateDB.subject,
        isDefault: paypalTemplateDB.isDefault,
        createdAt: paypalTemplateDB.createdAt,
        updatedAt: paypalTemplateDB.updatedAt,
        customHTMLLength: paypalTemplateDB.customHTML?.length || 0,
        hasCustomHTML: !!paypalTemplateDB.customHTML
      } : null,
      allPaypalTemplates: allPaypalTemplatesDB.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        customHTMLLength: template.customHTML?.length || 0
      })),
      totalPaypalTemplates: allPaypalTemplatesDB.length,
      recommendation: paypalTemplateDB ? 
        'PayPal template found in database - ready to use!' : 
        'PayPal template not found in database - may be in localStorage only',
      nextSteps: paypalTemplateDB ? 
        'Update PayPal system to use this template' : 
        'Need to save PayPal template to database or check localStorage'
    }
    
    console.log('📧 PayPal template check result:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('❌ Error checking PayPal template:', error)
    return NextResponse.json(
      { error: 'Failed to check PayPal template', details: error } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 