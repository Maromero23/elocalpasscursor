import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    
    console.log(`🔐 AFFILIATE LOGIN: Attempting login for ${email}`)
    
    // Find affiliate by email
    const affiliate = await prisma.affiliate.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (!affiliate) {
      console.log(`❌ AFFILIATE LOGIN: Email ${email} not found`)
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }
    
    if (!affiliate.isActive) {
      console.log(`❌ AFFILIATE LOGIN: ${email} is inactive`)
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }
    
    // Generate session token (30 days)
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    // Get device/browser info
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown'
    
    // Create session (multiple sessions allowed)
    const session = await prisma.affiliateSession.create({
      data: {
        affiliateId: affiliate.id,
        sessionToken,
        deviceInfo: userAgent,
        ipAddress,
        expiresAt
      }
    })
    
    console.log(`✅ AFFILIATE LOGIN: Created session for ${affiliate.name} (${email})`)
    
    // Set cookie with long expiration
    const response = NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        discount: affiliate.discount
      }
    })
    
    response.cookies.set('affiliate-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    })
    
    return response
    
  } catch (error) {
    console.error('💥 AFFILIATE LOGIN ERROR:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
} 