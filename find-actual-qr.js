const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findActualQR() {
  console.log('🔍 FINDING ACTUAL QR CODE FROM SCHEDULED ENTRY')
  
  try {
    // Find QR codes created around the same time as the scheduled entry
    const scheduledQR = await prisma.scheduledQRCode.findFirst({
      where: {
        clientEmail: 'jorgeruiz23@gmail.com',
        clientName: 'jorge future welcome email rosa, rebuy defualt'
      }
    })
    
    if (!scheduledQR) {
      console.log('❌ Scheduled QR not found')
      return
    }
    
    console.log('✅ Found scheduled QR:', {
      id: scheduledQR.id,
      clientName: scheduledQR.clientName,
      clientEmail: scheduledQR.clientEmail,
      scheduledFor: scheduledQR.scheduledFor,
      isProcessed: scheduledQR.isProcessed,
      createdAt: scheduledQR.createdAt
    })
    
    // Find QR codes created around the same time
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        customerEmail: 'jorgeruiz23@gmail.com',
        createdAt: {
          gte: new Date(scheduledQR.scheduledFor.getTime() - 5 * 60 * 1000), // 5 minutes before
          lte: new Date(scheduledQR.scheduledFor.getTime() + 5 * 60 * 1000)  // 5 minutes after
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📋 Found ${qrCodes.length} QR codes created around scheduled time:`)
    qrCodes.forEach(qr => {
      console.log(`  - ${qr.id}: ${qr.customerName} - Created: ${qr.createdAt}`)
    })
    
    // Also check for QR codes with similar names
    const similarQRCodes = await prisma.qRCode.findMany({
      where: {
        customerEmail: 'jorgeruiz23@gmail.com',
        customerName: { contains: 'jorge future' }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`📋 Found ${similarQRCodes.length} QR codes with similar names:`)
    similarQRCodes.forEach(qr => {
      console.log(`  - ${qr.id}: ${qr.customerName} - Created: ${qr.createdAt}`)
    })
    
  } catch (error) {
    console.error('❌ Error finding QR code:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findActualQR() 