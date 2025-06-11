import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get seller's user record to find their configurationId
    const seller = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        email: true,
        configurationId: true,
        configurationName: true
      }
    })
    
    if (!seller?.configurationId) {
      return NextResponse.json(null)
    }
    
    // Get the QR configuration that this seller is paired to
    const config = await prisma.qrGlobalConfig.findUnique({
      where: {
        id: seller.configurationId
      }
    })
    
    if (!config) {
      return NextResponse.json(null)
    }
    
    // Get landing page URLs associated with this seller
    const landingPageUrls = await prisma.sellerLandingPageUrl.findMany({
      where: {
        sellerId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        url: true,
        description: true
      }
    })
    
    // Transform the QrGlobalConfig to match the expected QRConfig interface on the frontend
    const transformedConfig = {
      configName: seller.configurationName || `Configuration ${config.id.slice(-6)}`,
      configDescription: `${config.button1GuestsDefault} guests × ${config.button1DaysDefault} days - ${config.button3DeliveryMethod.toLowerCase()} delivery`,
      
      // Button 1 fields
      button1GuestsLocked: config.button1GuestsLocked,
      button1GuestsDefault: config.button1GuestsDefault,
      button1GuestsRangeMax: config.button1GuestsRangeMax,
      button1DaysLocked: config.button1DaysLocked,
      button1DaysDefault: config.button1DaysDefault,
      button1DaysRangeMax: config.button1DaysRangeMax,
      
      // Button 2 fields (for backend pricing calculation only)
      button2PricingType: config.button2PricingType,
      button2FixedPrice: config.button2FixedPrice,
      button2VariableBasePrice: config.button2VariableBasePrice,
      button2VariableGuestIncrease: config.button2VariableGuestIncrease,
      button2VariableDayIncrease: config.button2VariableDayIncrease,
      button2VariableCommission: config.button2VariableCommission,
      button2IncludeTax: config.button2IncludeTax,
      button2TaxPercentage: config.button2TaxPercentage,
      
      // Button 3 fields
      button3DeliveryMethod: config.button3DeliveryMethod as 'DIRECT' | 'URLS' | 'BOTH',
      
      // Landing page URLs from configuration
      landingPageUrls: landingPageUrls
    }
    
    return NextResponse.json(transformedConfig)
    
  } catch (error) {
    console.error('Error fetching seller config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
