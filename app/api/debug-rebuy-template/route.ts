import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Checking rebuy template data...')
    
    // Get the most recent QR code
    const recentQR = await prisma.qRCode.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    })
    
    if (!recentQR) {
      return NextResponse.json({ error: 'No QR codes found' })
    }
    
    const sellerConfig = recentQR.seller.savedConfig
    if (!sellerConfig) {
      return NextResponse.json({ error: 'No seller config found' })
    }
    
    const emailTemplates = sellerConfig.emailTemplates ? JSON.parse(sellerConfig.emailTemplates) : null
    
    const debugInfo = {
      qrCode: recentQR.code,
      sellerId: recentQR.seller.id,
      configId: sellerConfig.id,
      hasEmailTemplates: !!emailTemplates,
      hasRebuyEmail: !!emailTemplates?.rebuyEmail,
      hasCustomHTML: !!emailTemplates?.rebuyEmail?.customHTML,
      customHTMLLength: emailTemplates?.rebuyEmail?.customHTML?.length || 0,
      customHTMLPreview: (emailTemplates?.rebuyEmail?.customHTML || '').substring(0, 200),
      includesTestingCustom: (emailTemplates?.rebuyEmail?.customHTML || '').includes('testing custom'),
      includesFeaturedPartners: (emailTemplates?.rebuyEmail?.customHTML || '').includes('Featured Partners'),
      isUseDefaultTemplate: emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE',
      hasRebuyConfig: !!emailTemplates?.rebuyEmail?.rebuyConfig
    }
    
    return NextResponse.json({
      success: true,
      debugInfo
    })
    
  } catch (error) {
    console.error('❌ DEBUG: Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 