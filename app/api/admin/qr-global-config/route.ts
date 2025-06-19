import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '../../../../lib/prisma'

// GET: Fetch global QR configuration
export async function GET() {
  try {
    console.log('🔍 Starting GET /api/admin/qr-global-config')
    
    const session = await getServerSession(authOptions)
    console.log('✅ Session retrieved:', session?.user?.email, session?.user?.role)
    
    if (!session || session.user.role !== 'ADMIN') {
      console.log('❌ Authorization failed:', { hasSession: !!session, role: session?.user?.role })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 Querying database for global config...')
    // Try to get existing global config (should only be one)
    const globalConfig = await prisma.qrGlobalConfig.findFirst()
    console.log('📋 Global config found:', !!globalConfig)

    if (!globalConfig) {
      console.log('🆕 No global config found, returning default')
      // Return default config if none exists
      const defaultConfig = {
        id: null,
        // OLD Button 1 fields (backward compatibility)
        button1AllowCustomGuestsDays: false,
        button1DefaultGuests: 2,
        button1DefaultDays: 3,
        button1MaxGuests: 10,
        button1MaxDays: 30,
        // NEW Button 1 fields
        button1GuestsLocked: false,
        button1GuestsDefault: 2,
        button1GuestsRangeMax: 10,
        button1DaysLocked: false,
        button1DaysDefault: 3,
        button1DaysRangeMax: 30,
        // Button 2 fields
        button2PricingType: 'FIXED',
        button2FixedPrice: 0,
        button2VariableBasePrice: 10,
        button2VariableGuestIncrease: 5,
        button2VariableDayIncrease: 3,
        button2VariableCommission: 0,
        button2IncludeTax: false,
        button2TaxPercentage: 0,
        // Button 3-5 fields
        button3DeliveryMethod: 'DIRECT',
        button4LandingPageRequired: true,
        button5SendRebuyEmail: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      console.log('✅ Returning default config')
      return NextResponse.json(defaultConfig)
    }

    console.log('✅ Returning existing config:', globalConfig.id)
    return NextResponse.json(globalConfig)
  } catch (error) {
    console.error('💥 ERROR in GET /api/admin/qr-global-config:')
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
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
      
      // Button 3-5 fields
      button3DeliveryMethod: body.button3DeliveryMethod || 'DIRECT',
      button4LandingPageRequired: Boolean(body.button4LandingPageRequired !== false), // Default to true
      button5SendRebuyEmail: Boolean(body.button5SendRebuyEmail)
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
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
