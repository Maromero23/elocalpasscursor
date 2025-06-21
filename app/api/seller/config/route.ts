import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get seller's user record with saved configuration relationship
    const seller = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        savedConfig: true  // Include the saved configuration
      }
    })
    
    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }
    
    // Priority 1: Check if seller has a saved configuration assigned
    if (seller.savedConfig) {
      const savedConfig = seller.savedConfig
      
      // Parse the JSON configuration data
      const config = JSON.parse(savedConfig.config)
      const emailTemplates = savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null
      const landingPageConfig = savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : null
      const selectedUrlIds = savedConfig.selectedUrlIds ? JSON.parse(savedConfig.selectedUrlIds) : []
      
      // Get landing page URLs if any are selected
      // URLs are stored in the configuration's landingPageConfig, not in a separate table
      let landingPageUrls = []
      
      if (selectedUrlIds.length > 0 && landingPageConfig) {
        // Get URLs from the configuration's temporaryUrls
        const temporaryUrls = landingPageConfig.temporaryUrls || []
        
        landingPageUrls = temporaryUrls
          .filter((url: any) => selectedUrlIds.includes(url.id))
          .map((url: any) => {
            // Add cache-busting timestamp to prevent browser caching of edited content
            const cacheBreaker = savedConfig.updatedAt ? `&t=${new Date(savedConfig.updatedAt).getTime()}` : '';
            
            return {
              id: url.id,
              name: url.name,
              url: url.url,
              description: url.description,
              // Generate the full landing page URL with cache-busting timestamp
              fullLandingUrl: `http://localhost:3003/landing-enhanced/${savedConfig.id}?urlId=${url.id}${cacheBreaker}`
            }
          })
      }
      
      // Transform to match frontend interface
      const transformedConfig = {
        configName: savedConfig.name,
        configDescription: savedConfig.description || `${config.button1GuestsDefault} guests × ${config.button1DaysDefault} days - ${(config.button3DeliveryMethod || 'DIRECT').toLowerCase()} delivery`,
        
        // Button 1 fields
        button1GuestsLocked: config.button1GuestsLocked || false,
        button1GuestsDefault: config.button1GuestsDefault || 2,
        button1GuestsRangeMax: config.button1GuestsRangeMax || 10,
        button1DaysLocked: config.button1DaysLocked || false,
        button1DaysDefault: config.button1DaysDefault || 3,
        button1DaysRangeMax: config.button1DaysRangeMax || 30,
        
        // Button 2 fields (for backend pricing calculation only)
        button2PricingType: config.button2PricingType || 'FIXED',
        button2FixedPrice: config.button2FixedPrice || 25,
        button2VariableBasePrice: config.button2VariableBasePrice || 10,
        button2VariableGuestIncrease: config.button2VariableGuestIncrease || 5,
        button2VariableDayIncrease: config.button2VariableDayIncrease || 3,
        button2VariableCommission: config.button2VariableCommission || 0,
        button2IncludeTax: config.button2IncludeTax || false,
        button2TaxPercentage: config.button2TaxPercentage || 0,
        
        // Button 3 fields
        button3DeliveryMethod: (config.button3DeliveryMethod as 'DIRECT' | 'URLS' | 'BOTH') || 'DIRECT',
        
        // Landing page URLs from configuration
        landingPageUrls: landingPageUrls
      }
      
      return NextResponse.json(transformedConfig)
    }
    
    // Priority 2: Check legacy configurationId (for backward compatibility)
    if (seller.configurationId) {
      // Check if it's a timestamp-based ID (old saved configuration)
      if (seller.configurationId.match(/^\d+$/)) {
        // This is a legacy saved configuration ID
        const basicConfig = {
          configName: seller.configurationName || `Configuration ${seller.configurationId.slice(-6)}`,
          configDescription: `Legacy saved configuration: ${seller.configurationName}`,
          
          // Default Button 1 fields
          button1GuestsLocked: false,
          button1GuestsDefault: 2,
          button1GuestsRangeMax: 10,
          button1DaysLocked: false,
          button1DaysDefault: 3,
          button1DaysRangeMax: 30,
          
          // Default Button 2 fields
          button2PricingType: 'FIXED',
          button2FixedPrice: 25,
          button2VariableBasePrice: 10,
          button2VariableGuestIncrease: 5,
          button2VariableDayIncrease: 3,
          button2VariableCommission: 0,
          button2IncludeTax: false,
          button2TaxPercentage: 0,
          
          // Default Button 3 fields
          button3DeliveryMethod: 'DIRECT' as 'DIRECT' | 'URLS' | 'BOTH',
          
          landingPageUrls: []
        }
        
        return NextResponse.json(basicConfig)
      }
      
      // Try to get from QrGlobalConfig database table
      const config = await prisma.qrGlobalConfig.findUnique({
        where: {
          id: seller.configurationId
        }
      })
      
      if (config) {
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
        
        // Transform the QrGlobalConfig to match the expected interface
        const transformedConfig = {
          configName: seller.configurationName || `Configuration ${config.id.slice(-6)}`,
          configDescription: `${config.button1GuestsDefault} guests × ${config.button1DaysDefault} days - ${(config.button3DeliveryMethod || 'DIRECT').toLowerCase()} delivery`,
          
          // Button 1 fields
          button1GuestsLocked: config.button1GuestsLocked,
          button1GuestsDefault: config.button1GuestsDefault,
          button1GuestsRangeMax: config.button1GuestsRangeMax,
          button1DaysLocked: config.button1DaysLocked,
          button1DaysDefault: config.button1DaysDefault,
          button1DaysRangeMax: config.button1DaysRangeMax,
          
          // Button 2 fields
          button2PricingType: config.button2PricingType,
          button2FixedPrice: config.button2FixedPrice,
          button2VariableBasePrice: config.button2VariableBasePrice,
          button2VariableGuestIncrease: config.button2VariableGuestIncrease,
          button2VariableDayIncrease: config.button2VariableDayIncrease,
          button2VariableCommission: config.button2VariableCommission,
          button2IncludeTax: config.button2IncludeTax,
          button2TaxPercentage: config.button2TaxPercentage,
          
        // Button 3 fields
        button3DeliveryMethod: (config?.button3DeliveryMethod || 'DIRECT') as 'DIRECT' | 'URLS' | 'BOTH',
        
        landingPageUrls: landingPageUrls
        }
        
        return NextResponse.json(transformedConfig)
      }
    }
    
    // No configuration found
    return NextResponse.json(null)
    
  } catch (error) {
    console.error('Error fetching seller config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
