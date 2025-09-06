import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Assign Config API called')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      console.log('❌ Access denied - not admin')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    console.log('📥 Request body:', body)
    
    const { sellerEmail, configData, configId, configName } = body
    
    if (!sellerEmail) {
      return NextResponse.json(
        { error: 'Seller email required' },
        { status: 400 }
      )
    }

    if (!configData) {
      return NextResponse.json(
        { error: 'Configuration data required' },
        { status: 400 }
      )
    }

    if (!configId || !configName) {
      return NextResponse.json(
        { error: 'Configuration ID and name required for pairing' },
        { status: 400 }
      )
    }
    
    // Find seller by email (including independent sellers)
    const seller = await prisma.user.findFirst({
      where: {
        email: sellerEmail,
        OR: [
          { role: 'SELLER' },
          { role: 'INDEPENDENT_SELLER' }
        ]
      }
    })
    
    if (!seller) {
      console.log('❌ Seller not found with email:', sellerEmail)
      return NextResponse.json(
        { error: `Seller not found with email: ${sellerEmail}` },
        { status: 404 }
      )
    }
    
    console.log('✅ Found seller:', seller.id)
    
    // Use the provided configuration data instead of fetching from database
    const configToAssign = {
      // Map from QrGlobalConfig to QRConfig field names
      button1GuestsLocked: configData.button1GuestsLocked,
      button1GuestsDefault: configData.button1GuestsDefault,
      button1GuestsRangeMax: configData.button1GuestsRangeMax,
      button1DaysLocked: configData.button1DaysLocked,
      button1DaysDefault: configData.button1DaysDefault,
      button1DaysRangeMax: configData.button1DaysRangeMax,
      button2PricingType: configData.button2PricingType,
      button2FixedPrice: configData.button2FixedPrice,
      button2VariableBasePrice: configData.button2VariableBasePrice,
      button2VariableGuestIncrease: configData.button2VariableGuestIncrease,
      button2VariableDayIncrease: configData.button2VariableDayIncrease,
      button2VariableCommission: configData.button2VariableCommission,
      button2IncludeTax: configData.button2IncludeTax,
      button2TaxPercentage: configData.button2TaxPercentage,
      button3DeliveryMethod: configData.button3DeliveryMethod,
      button4LandingPageRequired: configData.button4LandingPageRequired,
      button5SendRebuyEmail: configData.button5SendRebuyEmail,
    }
    console.log('⚙️ Config to assign:', configToAssign)
    
    // Check if seller already has a config
    const existingConfig = await prisma.qRConfig.findUnique({
      where: { sellerId: seller.id }
    })
    
    console.log('🔍 Existing config:', existingConfig ? 'Found' : 'Not found')
    
    if (existingConfig) {
      console.log('🔄 Updating existing configuration...')
      // Update existing configuration with provided settings
      const updatedConfig = await prisma.qRConfig.update({
        where: { sellerId: seller.id },
        data: configToAssign
      })
      
      // Also update the seller's configuration identifiers
      await (prisma.user as any).update({
        where: { id: seller.id },
        data: {
          savedConfigId: configId,  // This is the key field for saved configurations
          configurationId: configId,
          configurationName: configName
        }
      })
      
      console.log('✅ Configuration updated successfully')
      return NextResponse.json({
        message: 'Seller configuration updated successfully',
        config: updatedConfig
      })
    } else {
      console.log('➕ Creating new configuration...')
      // Create new configuration for seller
      const newConfig = await prisma.qRConfig.create({
        data: {
          sellerId: seller.id,
          ...configToAssign
        }
      })
      
      // Also update the seller's configuration identifiers
      await (prisma.user as any).update({
        where: { id: seller.id },
        data: {
          savedConfigId: configId,  // This is the key field for saved configurations
          configurationId: configId,
          configurationName: configName
        }
      })
      
      console.log('✅ Configuration created successfully')
      return NextResponse.json({
        message: 'Seller configuration created successfully',
        config: newConfig
      })
    }
    
  } catch (error) {
    console.error('💥 Error assigning config to seller:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
}
