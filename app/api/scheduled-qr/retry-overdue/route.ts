import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Security check for external cron services
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('🔒 RETRY OVERDUE: Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🔄 RETRY OVERDUE: Starting overdue QR retry process...')
    
    // Get all overdue QRs that haven't been processed
    const now = new Date()
    const overdueQRs = await prisma.scheduledQRCode.findMany({
      where: {
        scheduledFor: {
          lt: now
        },
        isProcessed: false
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })
    
    console.log(`📋 Found ${overdueQRs.length} overdue QR codes to retry`)
    
    if (overdueQRs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue QR codes to retry',
        retried: 0,
        failed: 0
      })
    }
    
    let retriedCount = 0
    let failedCount = 0
    const results = []
    
    for (const overdueQR of overdueQRs) {
      try {
        console.log(`🔄 Retrying overdue QR for ${overdueQR.clientEmail} (scheduled for ${overdueQR.scheduledFor.toLocaleString()})`)
        
        // Call the single QR processor with retry flag
        const retryResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/scheduled-qr/process-single`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET || 'internal-retry'}`
          },
          body: JSON.stringify({
            scheduledQRId: overdueQR.id,
            isRetry: true
          })
        })
        
        const retryResult = await retryResponse.json()
        
        if (retryResult.success) {
          retriedCount++
          results.push({
            scheduledId: overdueQR.id,
            clientEmail: overdueQR.clientEmail,
            success: true,
            message: 'Successfully retried'
          })
          console.log(`✅ Successfully retried overdue QR for ${overdueQR.clientEmail}`)
        } else {
          failedCount++
          results.push({
            scheduledId: overdueQR.id,
            clientEmail: overdueQR.clientEmail,
            success: false,
            error: retryResult.message || 'Retry failed'
          })
          console.log(`❌ Failed to retry overdue QR for ${overdueQR.clientEmail}`)
        }
        
      } catch (error) {
        console.error(`❌ Error retrying overdue QR ${overdueQR.id}:`, error)
        failedCount++
        results.push({
          scheduledId: overdueQR.id,
          clientEmail: overdueQR.clientEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`🏁 RETRY OVERDUE: Completed retry process`)
    console.log(`✅ Retried: ${retriedCount}`)
    console.log(`❌ Failed: ${failedCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Retried ${retriedCount} overdue QR codes`,
      retried: retriedCount,
      failed: failedCount,
      results: results
    })
    
  } catch (error) {
    console.error('💥 RETRY OVERDUE: Fatal error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Retry overdue QRs endpoint - use POST to retry overdue QRs' 
  })
} 