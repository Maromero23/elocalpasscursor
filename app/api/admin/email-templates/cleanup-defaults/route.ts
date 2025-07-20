import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ CLEANING UP OLD DEFAULT TEMPLATES...')
    
    // Find all default templates
    const defaultTemplates = await prisma.welcomeEmailTemplate.findMany({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })
    
    if (defaultTemplates.length <= 1) {
      console.log('✅ Only one or zero default templates found - no cleanup needed')
      return NextResponse.json({ 
        success: true, 
        message: 'No cleanup needed - only one default template exists',
        templatesFound: defaultTemplates.length
      })
    }
    
    // Keep the newest one, delete all others
    const newestTemplate = defaultTemplates[0]
    const oldTemplates = defaultTemplates.slice(1)
    
    console.log(`🗑️ Found ${defaultTemplates.length} default templates`)
    console.log(`✅ Keeping newest: ${newestTemplate.name} (${newestTemplate.createdAt})`)
    console.log(`🗑️ Deleting ${oldTemplates.length} old templates...`)
    
    // Delete old default templates
    const deleteResult = await prisma.welcomeEmailTemplate.deleteMany({
      where: {
        id: {
          in: oldTemplates.map(t => t.id)
        }
      }
    })
    
    console.log(`✅ Deleted ${deleteResult.count} old default templates`)
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.count} old default templates`,
      keptTemplate: {
        id: newestTemplate.id,
        name: newestTemplate.name,
        createdAt: newestTemplate.createdAt
      },
      deletedCount: deleteResult.count
    })
    
  } catch (error) {
    console.error('❌ Error cleaning up default templates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clean up default templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 