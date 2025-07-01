import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🗑️ ADMIN: Starting bulk delete of all affiliate data')
    
    // Get counts before deletion for reporting
    const affiliateCount = await (prisma as any).affiliate.count()
    const visitCount = await (prisma as any).affiliateVisit.count()
    const sessionCount = await (prisma as any).affiliateSession.count()
    
    console.log(`📊 Found: ${affiliateCount} affiliates, ${visitCount} visits, ${sessionCount} sessions`)
    
    if (affiliateCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliate data to delete',
        deleted: 0
      })
    }
    
    // Delete in correct order due to foreign key constraints
    
    // 1. Delete all affiliate visits first
    if (visitCount > 0) {
      await (prisma as any).affiliateVisit.deleteMany({})
      console.log(`🗑️ Deleted ${visitCount} affiliate visits`)
    }
    
    // 2. Delete all affiliate sessions
    if (sessionCount > 0) {
      await (prisma as any).affiliateSession.deleteMany({})
      console.log(`🗑️ Deleted ${sessionCount} affiliate sessions`)
    }
    
    // 3. Finally delete all affiliates
    await (prisma as any).affiliate.deleteMany({})
    console.log(`🗑️ Deleted ${affiliateCount} affiliates`)
    
    console.log('✅ Bulk delete completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'All affiliate data deleted successfully',
      deleted: affiliateCount,
      details: {
        affiliates: affiliateCount,
        visits: visitCount,
        sessions: sessionCount
      }
    })

  } catch (error) {
    console.error('❌ ADMIN: Error in bulk delete:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 