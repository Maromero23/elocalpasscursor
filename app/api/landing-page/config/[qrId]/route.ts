import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET configuration for landing page (PUBLIC ACCESS - no authentication required)
export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    console.log('[PUBLIC API] Fetching config for qrId:', params.qrId)
    
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: params.qrId }
    })
    
    if (!savedConfig) {
      console.log('[PUBLIC API] Configuration not found for qrId:', params.qrId)
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }
    
    console.log('[PUBLIC API] Found config:', {
      id: savedConfig.id,
      name: savedConfig.name,
      hasLandingPageConfig: !!savedConfig.landingPageConfig,
      hasSelectedUrlIds: !!savedConfig.selectedUrlIds
    })
    
    // Parse JSON strings back to objects
    const parsedConfig = {
      id: savedConfig.id,
      name: savedConfig.name,
      description: savedConfig.description,
      config: JSON.parse(savedConfig.config),
      emailTemplates: savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null,
      landingPageConfig: savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : null,
      selectedUrlIds: savedConfig.selectedUrlIds ? JSON.parse(savedConfig.selectedUrlIds) : null,
      createdAt: savedConfig.createdAt,
      updatedAt: savedConfig.updatedAt
    }
    
    console.log('[PUBLIC API] Parsed config structure:', {
      hasConfig: !!parsedConfig.config,
      hasLandingPageConfig: !!parsedConfig.landingPageConfig,
      hasSelectedUrlIds: !!parsedConfig.selectedUrlIds,
      selectedUrlIdsCount: parsedConfig.selectedUrlIds?.length || 0
    })
    
    // Set cache headers to prevent stale data
    const response = NextResponse.json(parsedConfig)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
    
  } catch (error) {
    console.error('[PUBLIC API] Error fetching configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 