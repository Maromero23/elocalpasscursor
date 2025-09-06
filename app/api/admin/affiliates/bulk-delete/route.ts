import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. Must provide array of affiliate IDs' 
      }, { status: 400 })
    }

    console.log(`🗑️ ADMIN: Starting bulk delete of ${ids.length} affiliates`)

    // Delete related data first (due to foreign key constraints)
    const deletedSessions = await (prisma as any).affiliateSession.deleteMany({
      where: { affiliateId: { in: ids } }
    })

    const deletedVisits = await (prisma as any).affiliateVisit.deleteMany({
      where: { affiliateId: { in: ids } }
    })

    // Delete the affiliates
    const deletedAffiliates = await (prisma as any).affiliate.deleteMany({
      where: { id: { in: ids } }
    })

    console.log(`✅ ADMIN: Bulk delete completed:`)
    console.log(`  - ${deletedAffiliates.count} affiliates deleted`)
    console.log(`  - ${deletedSessions.count} sessions deleted`)
    console.log(`  - ${deletedVisits.count} visits deleted`)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedAffiliates.count} affiliates`,
      deleted: deletedAffiliates.count,
      relatedDataDeleted: {
        sessions: deletedSessions.count,
        visits: deletedVisits.count
      }
    })

  } catch (error) {
    console.error('❌ ADMIN: Error in bulk delete:', error)
    return NextResponse.json(
      { error: 'Internal server error' } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 