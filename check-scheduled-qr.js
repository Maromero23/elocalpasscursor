const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkScheduledQRs() {
  console.log('🔍 Checking recent scheduled QRs...')
  
  // Get all scheduled QRs from the last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  const scheduledQRs = await prisma.scheduledQRCode.findMany({
    where: {
      createdAt: {
        gte: oneDayAgo
      }
    },
    orderBy: {
      scheduledFor: 'desc'
    }
  })
  
  console.log(`📋 Found ${scheduledQRs.length} scheduled QRs in last 24 hours:`)
  
  for (const qr of scheduledQRs) {
    const now = new Date()
    const isOverdue = qr.scheduledFor < now && !qr.isProcessed
    const timeDiff = Math.round((now - qr.scheduledFor) / 1000 / 60) // minutes
    
    console.log(`
📅 Scheduled QR:
  - ID: ${qr.id}
  - Email: ${qr.clientEmail}
  - Scheduled For: ${qr.scheduledFor.toLocaleString()}
  - Is Processed: ${qr.isProcessed}
  - Created QR ID: ${qr.createdQRCodeId || 'None'}
  - Time Status: ${isOverdue ? `❌ OVERDUE by ${timeDiff} minutes` : qr.isProcessed ? '✅ PROCESSED' : `⏰ Pending (${-timeDiff} minutes remaining)`}
    `)
  }
  
  // Check for any actual QR codes created today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const qrCodes = await prisma.qRCode.findMany({
    where: {
      createdAt: {
        gte: todayStart
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log(`\n🔖 QR Codes created today: ${qrCodes.length}`)
  for (const qr of qrCodes) {
    console.log(`  - ${qr.code} for ${qr.customerEmail} at ${qr.createdAt.toLocaleString()}`)
  }
  
  await prisma.$disconnect()
}

checkScheduledQRs().catch(console.error) 