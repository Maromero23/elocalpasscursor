const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkFutureQR() {
  console.log('🔍 CHECKING FUTURE QR CODE')
  
  try {
    // Check in QR codes table
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: 'EL-1753738980830-4a42f196c' }
    })
    
    if (qrCode) {
      console.log('✅ Found in QR codes table:', {
        id: qrCode.id,
        clientName: qrCode.clientName,
        clientEmail: qrCode.clientEmail,
        createdAt: qrCode.createdAt,
        rebuyEmailEnabled: qrCode.rebuyEmailEnabled
      })
    } else {
      console.log('❌ Not found in QR codes table')
    }
    
    // Check in scheduled QR codes table
    const scheduledQR = await prisma.scheduledQRCode.findFirst({
      where: {
        OR: [
          { id: 'EL-1753738980830-4a42f196c' },
          { clientEmail: { contains: 'jorgeruiz23' } } // Look for recent entries
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (scheduledQR) {
      console.log('✅ Found in scheduled QR codes table:', {
        id: scheduledQR.id,
        clientName: scheduledQR.clientName,
        clientEmail: scheduledQR.clientEmail,
        scheduledFor: scheduledQR.scheduledFor,
        isProcessed: scheduledQR.isProcessed,
        createdAt: scheduledQR.createdAt
      })
    } else {
      console.log('❌ Not found in scheduled QR codes table')
    }
    
    // List recent scheduled QR codes
    const recentScheduled = await prisma.scheduledQRCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log('📋 Recent scheduled QR codes:')
    recentScheduled.forEach(qr => {
      console.log(`  - ${qr.id}: ${qr.clientName} (${qr.clientEmail}) - ${qr.isProcessed ? 'Processed' : 'Pending'}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking QR code:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFutureQR() 