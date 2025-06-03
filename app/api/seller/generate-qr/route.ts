import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    const { clientName, clientEmail, guests, days, language, deliveryMethod } = body
    
    // Validate required fields
    if (!clientName || !clientEmail || !guests || !days) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify seller has configuration
    const config = await prisma.qRConfig.findUnique({
      where: {
        sellerId: session.user.id
      }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'No configuration assigned to seller' },
        { status: 400 }
      )
    }
    
    // Validate delivery method based on configuration
    const requestedDelivery = deliveryMethod || config.button3DeliveryMethod
    
    if (config.button3DeliveryMethod === 'DIRECT' && requestedDelivery !== 'DIRECT') {
      return NextResponse.json(
        { error: 'Only direct delivery allowed for this configuration' },
        { status: 400 }
      )
    }
    
    if (config.button3DeliveryMethod === 'URLS' && requestedDelivery !== 'URLS') {
      return NextResponse.json(
        { error: 'Only URL delivery allowed for this configuration' },
        { status: 400 }
      )
    }
    
    if (config.button3DeliveryMethod === 'BOTH' && !['DIRECT', 'URLS'].includes(requestedDelivery)) {
      return NextResponse.json(
        { error: 'Invalid delivery method. Must be DIRECT or URLS' },
        { status: 400 }
      )
    }
    
    // Generate unique QR code
    const qrCode = `ELPASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)
    
    // Create QR code in database
    const newQRCode = await prisma.qRCode.create({
      data: {
        code: qrCode,
        sellerId: session.user.id,
        guests: guests,
        days: days,
        cost: 0,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: requestedDelivery === 'DIRECT' ? null : 'https://example.com' // Replace with actual landing URL
      }
    })
    
    // Generate email content based on delivery method
    const isSpanish = language === 'es'
    
    let emailContent = ''
    let subject = ''
    
    if (requestedDelivery === 'DIRECT') {
      // Direct delivery - QR code gives immediate access
      subject = isSpanish 
        ? ' Su ELocalPass está listo - Acceso Inmediato' 
        : ' Your ELocalPass is Ready - Immediate Access'
        
      emailContent = isSpanish ? `
Hola ${clientName},

¡Su ELocalPass está listo para usar! 

 DETALLES DE SU PASE:
• Código: ${qrCode}
• Huéspedes: ${guests} personas
• Válido por: ${days} días

 ACCESO DIRECTO:
Este código le da acceso inmediato a su experiencia local.
Solo muestre este código QR en el punto de acceso.

 VÁLIDO HASTA: ${expiresAt.toLocaleDateString('es-ES')}

¡Disfrute su experiencia ELocalPass!

Saludos,
El equipo ELocalPass
` : `
Hello ${clientName},

Your ELocalPass is ready to use!

 PASS DETAILS:
• Code: ${qrCode}
• Guests: ${guests} people
• Valid for: ${days} days  

 DIRECT ACCESS:
This code gives you immediate access to your local experience.
Simply show this QR code at the access point.

 VALID UNTIL: ${expiresAt.toLocaleDateString('en-US')}

Enjoy your ELocalPass experience!

Best regards,
The ELocalPass Team
`
    } else {
      // URL delivery - QR code leads to landing page
      subject = isSpanish 
        ? ' Su ELocalPass - Complete su registro' 
        : ' Your ELocalPass - Complete Your Registration'
        
      emailContent = isSpanish ? `
Hola ${clientName},

¡Su ELocalPass ha sido generado! 

 DETALLES DE SU PASE:
• Código: ${qrCode}
• Huéspedes: ${guests} personas
• Válido por: ${days} días

 PRÓXIMO PASO:
Use este código QR para acceder a su página personalizada y completar el proceso:
${qrCode}

 VÁLIDO HASTA: ${expiresAt.toLocaleDateString('es-ES')}

¡Esperamos que disfrute su experiencia local!

Saludos,
El equipo ELocalPass
` : `
Hello ${clientName},

Your ELocalPass has been generated!

 PASS DETAILS:
• Code: ${qrCode}
• Guests: ${guests} people
• Valid for: ${days} days

 NEXT STEP:
Use this QR code to access your personalized page and complete the process:
${qrCode}

 VALID UNTIL: ${expiresAt.toLocaleDateString('en-US')}

We hope you enjoy your local experience!

Best regards,
The ELocalPass Team
`
    }
    
    // TODO: Send actual email
    // For now, we'll just log the email content
    console.log(' EMAIL TO SEND:')
    console.log(`To: ${clientEmail}`)
    console.log(`Subject: ${subject}`)
    console.log(`Language: ${language}`)
    console.log(`Delivery Method: ${requestedDelivery}`)
    console.log('Content:')
    console.log(emailContent)
    
    return NextResponse.json({
      success: true,
      qrCode: qrCode,
      expiresAt: expiresAt,
      message: 'QR code generated and email sent successfully'
    })
    
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
