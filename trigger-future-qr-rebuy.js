const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function triggerFutureQRRebuy() {
  console.log('📧 TRIGGERING REBUY EMAIL FOR FUTURE QR')
  
  try {
    // Find the QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: 'EL-1753738980830-4a42f196c' },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        }
      }
    })
    
    if (!qrCode) {
      console.log('❌ QR code not found')
      return
    }
    
    console.log('✅ Found QR code:', {
      id: qrCode.id,
      clientName: qrCode.clientName,
      clientEmail: qrCode.clientEmail,
      createdAt: qrCode.createdAt,
      sellerName: qrCode.seller?.name || 'Unknown',
      hasSavedConfig: !!qrCode.seller?.savedConfig
    })
    
    // Check if rebuy email is enabled
    if (!qrCode.rebuyEmailEnabled) {
      console.log('❌ Rebuy email is not enabled for this QR code')
      return
    }
    
    console.log('📧 Rebuy email is enabled - triggering...')
    
    // Call the rebuy email API
    const response = await fetch('https://elocalpasscursor.vercel.app/api/rebuy-emails/send-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrId: qrCode.id
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Rebuy email triggered successfully:', result)
    } else {
      console.log('❌ Failed to trigger rebuy email:', result)
    }
    
  } catch (error) {
    console.error('❌ Error triggering rebuy email:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerFutureQRRebuy() 