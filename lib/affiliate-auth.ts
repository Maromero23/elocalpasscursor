import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AffiliateSession {
  id: string
  name: string
  email: string
  discount: string | null
  sessionId: string
}

export async function validateAffiliateSession(request: NextRequest): Promise<AffiliateSession | null> {
  try {
    const sessionToken = request.cookies.get('affiliate-session')?.value
    
    if (!sessionToken) {
      return null
    }
    
    // Find active session
    const session = await (prisma as any).affiliateSession.findFirst({
      where: {
        sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        affiliate: true
      }
    })
    
    if (!session || !session.affiliate) {
      return null
    }
    
    // Check if session needs extension (less than 30 days remaining)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const shouldExtend = session.expiresAt < thirtyDaysFromNow
    
    if (shouldExtend) {
      // Extend session to 90 days from now
      const newExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      await (prisma as any).affiliateSession.update({
        where: { id: session.id },
        data: { 
          lastUsedAt: now,
          expiresAt: newExpiresAt
        }
      })
      console.log(`🔄 AFFILIATE SESSION: Extended session for ${session.affiliate.name} to ${newExpiresAt}`)
    } else {
      // Just update last used time
      await (prisma as any).affiliateSession.update({
        where: { id: session.id },
        data: { lastUsedAt: now }
      })
    }
    
    return {
      id: session.affiliate.id,
      name: session.affiliate.name,
      email: session.affiliate.email,
      discount: session.affiliate.discount,
      sessionId: session.id
    }
    
  } catch (error) {
    console.error('❌ AFFILIATE SESSION VALIDATION ERROR:', error)
    return null
  }
}

export async function requireAffiliateAuth(request: NextRequest): Promise<AffiliateSession> {
  const session = await validateAffiliateSession(request)
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
} 