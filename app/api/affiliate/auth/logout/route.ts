import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('affiliate-session')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    console.log(`🔐 AFFILIATE LOGOUT: Ending session`)
    
    // Deactivate the session
    await prisma.affiliateSession.updateMany({
      where: { sessionToken },
      data: { isActive: false }
    })
    
    // Clear the cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('affiliate-session')
    
    console.log(`✅ AFFILIATE LOGOUT: Session ended`)
    return response
    
  } catch (error) {
    console.error('💥 AFFILIATE LOGOUT ERROR:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 