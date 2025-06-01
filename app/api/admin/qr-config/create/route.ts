import { NextRequest, NextResponse } from 'next/server'
import { qrConfigurations } from '../../../../../lib/qr-storage'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Generate unique QR ID based on business name
    const qrId = generateQRId(data.businessName)
    
    // Store configuration with current timestamp
    const qrConfig = {
      qrId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    qrConfigurations.set(qrId, qrConfig)
    
    console.log(`✅ QR Configuration created: ${qrId}`)
    console.log(`Business: ${data.businessName}`)
    console.log(`Colors: primary=${data.primaryColor}, secondary=${data.secondaryColor}`)
    console.log(`Header: ${data.headerText}`)
    console.log(`Stored data:`, JSON.stringify(qrConfig, null, 2))
    console.log(`Landing URL: /landing/${qrId}`)
    
    return NextResponse.json({
      success: true,
      qrId,
      landingUrl: `/landing/${qrId}`,
      message: 'QR Configuration created successfully'
    })
    
  } catch (error) {
    console.error('Error creating QR configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create QR configuration' },
      { status: 500 }
    )
  }
}

// Get all QR configurations
export async function GET() {
  try {
    const configs = Array.from(qrConfigurations.values())
    console.log(`📋 Available QR configurations:`, configs.map((c: any) => ({id: c.qrId, business: c.businessName})))
    return NextResponse.json({ configurations: configs })
  } catch (error) {
    console.error('Error fetching QR configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR configurations' },
      { status: 500 }
    )
  }
}

function generateQRId(businessName: string): string {
  // Create a clean ID from the business name
  const cleanName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20)
  
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString().slice(-6)
  
  return `${cleanName}-${timestamp}`
}
