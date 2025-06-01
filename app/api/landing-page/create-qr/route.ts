import { NextRequest, NextResponse } from 'next/server'

interface CreateQRRequest {
  qrConfigId: string
  name: string
  email: string
  guests: number
  days: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateQRRequest = await request.json()
    const { qrConfigId, name, email, guests, days } = body

    // Basic validation
    if (!qrConfigId || !name || !email || !guests || !days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // TODO: Implement the actual logic:
    // 1. Create customer account in database
    // 2. Generate QR code with the specified guests and days
    // 3. Send welcome email with login instructions and video
    // 4. Return success response

    // For now, simulate success
    const mockResponse = {
      success: true,
      message: 'Your eLocalPass has been created successfully! Please check your email for login instructions.',
      qrCode: `QR-${Date.now()}`, // Mock QR code ID
      customerAccountCreated: true
    }

    console.log('QR Creation Request:', {
      qrConfigId,
      name,
      email,
      guests,
      days,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error creating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to create your eLocalPass. Please try again.' },
      { status: 500 }
    )
  }
}
