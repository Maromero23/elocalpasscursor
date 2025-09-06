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
    
    // Generate session token (90 days for PWA persistence)
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    
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
    
    console.log(`✅ AFFILIATE LOGIN: Created 90-day session for ${affiliate.name} (${email})`)
    
    // Set cookie with PWA-optimized settings
    const response = NextResponse.json({
      success: true,
      sessionToken, // Include session token in response for localStorage backup
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
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better PWA compatibility
      maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
      path: '/' // Explicitly set path for better persistence
    })
    
    return response
    
  } catch (error) {
    console.error('💥 AFFILIATE LOGIN ERROR:', error)
    return NextResponse.json(
      { error: 'Login failed' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 