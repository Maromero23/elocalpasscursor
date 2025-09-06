import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id
    
    console.log('🗑️ DELETING EMAIL TEMPLATE FROM DATABASE:', templateId)
    
    // Delete the template from database
    const deletedTemplate = await prisma.welcomeEmailTemplate.delete({
      where: {
        id: templateId
      }
    })
    
    console.log('✅ EMAIL TEMPLATE DELETED FROM DATABASE:', deletedTemplate.name)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      deletedTemplate: {
        id: deletedTemplate.id,
        name: deletedTemplate.name
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting email template from database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete template from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 