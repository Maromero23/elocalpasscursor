import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    const { sellerEmail } = body
    
    if (!sellerEmail) {
      return NextResponse.json(
        { error: 'Seller email required' },
        { status: 400 }
      )
    }
    
    // Find seller by email
    const seller = await prisma.user.findFirst({
      where: {
        email: sellerEmail,
        role: 'SELLER'
      }
    })
    
    if (!seller) {
      return NextResponse.json(
        { error: `Seller not found with email: ${sellerEmail}` },
        { status: 404 }
      )
    }
    
    // Get the global configuration
    const globalConfig = await prisma.qrGlobalConfig.findFirst()
    
    if (!globalConfig) {
      return NextResponse.json(
        { error: 'No global configuration found' },
        { status: 400 }
      )
    }
    
    // Check if seller already has a config
    const existingConfig = await prisma.qRConfig.findUnique({
      where: { sellerId: seller.id }
    })
    
    if (existingConfig) {
      // Update existing configuration with global settings
      const updatedConfig = await prisma.qRConfig.update({
        where: { sellerId: seller.id },
        data: {
          // Copy all fields from global config to seller config
          button1GuestsLocked: globalConfig.button1GuestsLocked,
          button1GuestsDefault: globalConfig.button1GuestsDefault,
          button1GuestsRangeMax: globalConfig.button1GuestsRangeMax,
          button1DaysLocked: globalConfig.button1DaysLocked,
          button1DaysDefault: globalConfig.button1DaysDefault,
          button1DaysRangeMax: globalConfig.button1DaysRangeMax,
          button2PricingType: globalConfig.button2PricingType,
          button2FixedPrice: globalConfig.button2FixedPrice,
          button2VariableBasePrice: globalConfig.button2VariableBasePrice,
          button2VariableGuestIncrease: globalConfig.button2VariableGuestIncrease,
          button2VariableDayIncrease: globalConfig.button2VariableDayIncrease,
          button2VariableCommission: globalConfig.button2VariableCommission,
          button2IncludeTax: globalConfig.button2IncludeTax,
          button2TaxPercentage: globalConfig.button2TaxPercentage,
          button3DeliveryMethod: globalConfig.button3DeliveryMethod,
          button4LandingPageRequired: globalConfig.button4LandingPageRequired,
          button5SendRebuyEmail: globalConfig.button5SendRebuyEmail,
        }
      })
      
      return NextResponse.json({
        message: 'Seller configuration updated successfully',
        config: updatedConfig
      })
    } else {
      // Create new configuration for seller
      const newConfig = await prisma.qRConfig.create({
        data: {
          sellerId: seller.id,
          // Copy all fields from global config
          button1GuestsLocked: globalConfig.button1GuestsLocked,
          button1GuestsDefault: globalConfig.button1GuestsDefault,
          button1GuestsRangeMax: globalConfig.button1GuestsRangeMax,
          button1DaysLocked: globalConfig.button1DaysLocked,
          button1DaysDefault: globalConfig.button1DaysDefault,
          button1DaysRangeMax: globalConfig.button1DaysRangeMax,
          button2PricingType: globalConfig.button2PricingType,
          button2FixedPrice: globalConfig.button2FixedPrice,
          button2VariableBasePrice: globalConfig.button2VariableBasePrice,
          button2VariableGuestIncrease: globalConfig.button2VariableGuestIncrease,
          button2VariableDayIncrease: globalConfig.button2VariableDayIncrease,
          button2VariableCommission: globalConfig.button2VariableCommission,
          button2IncludeTax: globalConfig.button2IncludeTax,
          button2TaxPercentage: globalConfig.button2TaxPercentage,
          button3DeliveryMethod: globalConfig.button3DeliveryMethod,
          button4LandingPageRequired: globalConfig.button4LandingPageRequired,
          button5SendRebuyEmail: globalConfig.button5SendRebuyEmail,
        }
      })
      
      return NextResponse.json({
        message: 'Seller configuration created successfully',
        config: newConfig
      })
    }
    
  } catch (error) {
    console.error('Error assigning config to seller:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
