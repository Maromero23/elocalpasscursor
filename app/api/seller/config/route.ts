import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getLandingPageUrl } from '@/lib/config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔍 SELLER CONFIG: Starting GET request...')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ SELLER CONFIG: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ SELLER CONFIG: Session found for user:', session.user.email)

    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get the seller and their saved configuration
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        savedConfig: true
      }
    })

    if (!seller) {
      console.log('❌ SELLER CONFIG: Seller not found')
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    console.log('✅ SELLER CONFIG: Seller found:', seller.email)
    console.log('🔍 SELLER CONFIG: Has saved config:', !!seller.savedConfig)

    if (!seller.savedConfig) {
      console.log('❌ SELLER CONFIG: No saved configuration found')
      return NextResponse.json({ error: 'No configuration found' }, { status: 404 })
    }

    // Check if seller has a saved configuration
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
            return {
              id: url.id,
              name: url.name,
              url: url.url,
              description: url.description,
              // Generate the full landing page URL using the config helper function
              fullLandingUrl: getLandingPageUrl(savedConfig.id, url.id, savedConfig.updatedAt)
            }
          })
      }

      console.log('✅ SELLER CONFIG: Configuration loaded successfully')
      console.log('🔍 SELLER CONFIG: Landing page URLs:', landingPageUrls.length)
      console.log('🔍 SELLER CONFIG: Config name from saved config:', savedConfig.name)

      return NextResponse.json({
        ...config,
        configName: savedConfig.name || `Configuration ${savedConfig.id.slice(-6)}`, // Add the configuration name
        configDescription: savedConfig.description || 'Saved configuration',
        landingPageUrls,
        emailTemplates,
        landingPageConfig,
        selectedUrlIds
      })
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
    console.error('💥 SELLER CONFIG: Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
