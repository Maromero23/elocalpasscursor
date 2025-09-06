import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET saved configuration for landing page (PUBLIC ACCESS - no authentication required)
export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    console.log('🔍 PUBLIC CONFIG API: Fetching config for qrId:', params.qrId)
    
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: params.qrId }
    })
    
    if (!savedConfig) {
      console.log('❌ PUBLIC CONFIG API: Configuration not found for qrId:', params.qrId)
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }
    
    console.log('✅ PUBLIC CONFIG API: Found config:', savedConfig.name)
    
    // Parse JSON strings back to objects
    const parsedConfig = {
      id: savedConfig.id,
      name: savedConfig.name,
      description: savedConfig.description,
      config: typeof savedConfig.config === 'string' ? JSON.parse(savedConfig.config) : savedConfig.config,
      emailTemplates: savedConfig.emailTemplates ? (typeof savedConfig.emailTemplates === 'string' ? JSON.parse(savedConfig.emailTemplates) : savedConfig.emailTemplates) : null,
      landingPageConfig: savedConfig.landingPageConfig ? (typeof savedConfig.landingPageConfig === 'string' ? JSON.parse(savedConfig.landingPageConfig) : savedConfig.landingPageConfig) : null,
      selectedUrlIds: savedConfig.selectedUrlIds ? (typeof savedConfig.selectedUrlIds === 'string' ? JSON.parse(savedConfig.selectedUrlIds) : savedConfig.selectedUrlIds) : null,
      createdAt: savedConfig.createdAt,
      updatedAt: savedConfig.updatedAt
    }
    
    return NextResponse.json(parsedConfig)
    
  } catch (error) {
    console.error('❌ Error fetching public config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 