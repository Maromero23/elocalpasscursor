import { NextRequest, NextResponse } from 'next/server'
import { validateAffiliateSession } from '@/lib/affiliate-auth'

export async function POST(request: NextRequest) {
  try {
    // Validate and refresh the session
    const affiliate = await validateAffiliateSession(request)
    
    if (!affiliate) {
      return NextResponse.json({ error: 'Session invalid or expired' }, { status: 401 })
    }
    
    console.log(`🔄 AFFILIATE SESSION REFRESH: Extended session for ${affiliate.name}`)
    
    return NextResponse.json({
      success: true,
      message: 'Session refreshed',
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email
      }
    })
    
  } catch (error) {
    console.error('💥 AFFILIATE SESSION REFRESH ERROR:', error)
    return NextResponse.json(
      { error: 'Session refresh failed' },
      { status: 500 }
    )
  }
} 