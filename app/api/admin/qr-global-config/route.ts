import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

// GET: Fetch global QR configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get existing global config (should only be one)
    const globalConfig = await prisma.qRGlobalConfig.findFirst()

    if (!globalConfig) {
      // Return default config if none exists
      const defaultConfig = {
        id: null,
        button1AllowCustomGuestsDays: false,
        button1DefaultGuests: 2,
        button1DefaultDays: 3,
        button1MaxGuests: 10,
        button1MaxDays: 30,
        button2PricingType: 'FIXED',
        button2FixedPrice: 0,
        button2IncludeTax: false,
        button2TaxPercentage: 0,
        button3SendMethod: 'URL',
        button4LandingPageRequired: true,
        button5SendRebuyEmail: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return NextResponse.json(defaultConfig)
    }

    return NextResponse.json(globalConfig)
  } catch (error) {
    console.error('Error fetching global config:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
      button1AllowCustomGuestsDays: Boolean(body.button1AllowCustomGuestsDays),
      button1DefaultGuests: parseInt(body.button1DefaultGuests) || 2,
      button1DefaultDays: parseInt(body.button1DefaultDays) || 3,
      button1MaxGuests: parseInt(body.button1MaxGuests) || 10,
      button1MaxDays: parseInt(body.button1MaxDays) || 30,
      button2PricingType: body.button2PricingType || 'FIXED',
      button2FixedPrice: parseFloat(body.button2FixedPrice) || 0,
      button2IncludeTax: Boolean(body.button2IncludeTax),
      button2TaxPercentage: parseFloat(body.button2TaxPercentage) || 0,
      button3SendMethod: body.button3SendMethod || 'URL',
      button4LandingPageRequired: Boolean(body.button4LandingPageRequired !== false), // Default to true
      button5SendRebuyEmail: Boolean(body.button5SendRebuyEmail)
    }

    console.log('Clean data:', cleanData)
    
    // Check if global config already exists
    const existingConfig = await prisma.qRGlobalConfig.findFirst()

    let savedConfig
    if (existingConfig) {
      // Update existing config
      savedConfig = await prisma.qRGlobalConfig.update({
        where: { id: existingConfig.id },
        data: cleanData
      })
    } else {
      // Create new config
      savedConfig = await prisma.qRGlobalConfig.create({
        data: cleanData
      })
    }

    return NextResponse.json(savedConfig)
  } catch (error) {
    console.error('Error saving global config:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
