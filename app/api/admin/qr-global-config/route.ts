import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '../../../../lib/prisma'

// GET: Fetch global QR configuration
export async function GET(request: NextRequest) {
  try {
    // Get the global QR configuration
    const globalConfig = await prisma.qrGlobalConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!globalConfig) {
      return NextResponse.json({
        error: 'No global QR configuration found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      config: {
        // OLD Button 1 fields (backward compatibility)
        button1AllowCustomGuestsDays: globalConfig.button1AllowCustomGuestsDays,
        button1DefaultGuests: globalConfig.button1DefaultGuests,
        button1DefaultDays: globalConfig.button1DefaultDays,
        button1MaxGuests: globalConfig.button1MaxGuests,
        button1MaxDays: globalConfig.button1MaxDays,
        
        // NEW Button 1 fields
        button1GuestsLocked: globalConfig.button1GuestsLocked,
        button1GuestsDefault: globalConfig.button1GuestsDefault,
        button1GuestsRangeMax: globalConfig.button1GuestsRangeMax,
        button1DaysLocked: globalConfig.button1DaysLocked,
        button1DaysDefault: globalConfig.button1DaysDefault,
        button1DaysRangeMax: globalConfig.button1DaysRangeMax,
        
        // Button 2 fields
        button2PricingType: globalConfig.button2PricingType,
        button2FixedPrice: globalConfig.button2FixedPrice,
        button2VariableBasePrice: globalConfig.button2VariableBasePrice,
        button2VariableGuestIncrease: globalConfig.button2VariableGuestIncrease,
        button2VariableDayIncrease: globalConfig.button2VariableDayIncrease,
        button2VariableCommission: globalConfig.button2VariableCommission,
        button2IncludeTax: globalConfig.button2IncludeTax,
        button2TaxPercentage: globalConfig.button2TaxPercentage,
        
        // Button 3-6 fields
        button3DeliveryMethod: globalConfig.button3DeliveryMethod,
        button4LandingPageRequired: globalConfig.button4LandingPageRequired,
        button5SendRebuyEmail: globalConfig.button5SendRebuyEmail,
        button6AllowFutureQR: globalConfig.button6AllowFutureQR,
        
        // Metadata
        id: globalConfig.id,
        updatedAt: globalConfig.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching global QR config:', error)
    return NextResponse.json({
      error: 'Failed to fetch global QR configuration'
    } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}

// POST: Create or update global QR configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received data:', body)
    
          // Clean and validate the data
      const cleanData = {
        // OLD Button 1 fields (backward compatibility)
        button1AllowCustomGuestsDays: Boolean(body.button1AllowCustomGuestsDays),
        button1DefaultGuests: parseInt(body.button1DefaultGuests) || 2,
        button1DefaultDays: parseInt(body.button1DefaultDays) || 3,
        button1MaxGuests: parseInt(body.button1MaxGuests) || 10,
        button1MaxDays: parseInt(body.button1MaxDays) || 30,
        
        // NEW Button 1 fields
        button1GuestsLocked: Boolean(body.button1GuestsLocked),
        button1GuestsDefault: parseInt(body.button1GuestsDefault) || 2,
        button1GuestsRangeMax: parseInt(body.button1GuestsRangeMax) || 10,
        button1DaysLocked: Boolean(body.button1DaysLocked),
        button1DaysDefault: parseInt(body.button1DaysDefault) || 3,
        button1DaysRangeMax: parseInt(body.button1DaysRangeMax) || 30,
      
      // Button 2 fields
      button2PricingType: body.button2PricingType || 'FIXED',
      button2FixedPrice: parseFloat(body.button2FixedPrice) || 0,
      button2VariableBasePrice: parseFloat(body.button2VariableBasePrice) || 10,
      button2VariableGuestIncrease: parseFloat(body.button2VariableGuestIncrease) || 5,
      button2VariableDayIncrease: parseFloat(body.button2VariableDayIncrease) || 3,
      button2VariableCommission: parseFloat(body.button2VariableCommission) || 0,
      button2IncludeTax: Boolean(body.button2IncludeTax),
      button2TaxPercentage: parseFloat(body.button2TaxPercentage) || 0,
      
      // Button 3-6 fields
      button3DeliveryMethod: body.button3DeliveryMethod || 'DIRECT',
      button4LandingPageRequired: Boolean(body.button4LandingPageRequired !== false), // Default to true
      button5SendRebuyEmail: Boolean(body.button5SendRebuyEmail),
      button6AllowFutureQR: Boolean(body.button6AllowFutureQR)
    }

    console.log('Clean data:', cleanData)
    
    // Check if global config already exists
    const existingConfig = await prisma.qrGlobalConfig.findFirst()

    let savedConfig
    if (existingConfig) {
      // Update existing config
      savedConfig = await prisma.qrGlobalConfig.update({
        where: { id: existingConfig.id },
        data: cleanData
      })
    } else {
      // Create new config
      savedConfig = await prisma.qrGlobalConfig.create({
        data: cleanData
      })
    }

    return NextResponse.json(savedConfig)
  } catch (error) {
    console.error('Error saving global config:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } finally {
    await prisma.$disconnect()
  }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
