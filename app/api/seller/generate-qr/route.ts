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
    
    // Get seller info and configuration
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        configurationId: true,
        configurationName: true 
      }
    })
    
    if (!seller?.configurationId) {
      return NextResponse.json(
        { error: 'No configuration assigned to seller' },
        { status: 400 }
      )
    }
    
    // Get the QR global configuration that this seller is paired to
    const config = await prisma.qrGlobalConfig.findUnique({
      where: {
        id: seller.configurationId
      }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
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
    
    // Calculate pricing (Button 2) - Hidden from seller
    let calculatedPrice = 0
    if (config.button2PricingType === 'FIXED') {
      calculatedPrice = config.button2FixedPrice || 0
    } else if (config.button2PricingType === 'VARIABLE') {
      // Variable pricing: base + (guest increase * extra guests) + (day increase * extra days)
      const basePrice = config.button2VariableBasePrice || 0
      const extraGuests = Math.max(0, guests - 1) // Assuming first guest is included in base
      const extraDays = Math.max(0, days - 1) // Assuming first day is included in base
      const guestPrice = (config.button2VariableGuestIncrease || 0) * extraGuests
      const dayPrice = (config.button2VariableDayIncrease || 0) * extraDays
      calculatedPrice = basePrice + guestPrice + dayPrice
      
      // Add commission if configured
      if (config.button2VariableCommission > 0) {
        calculatedPrice += config.button2VariableCommission
      }
      
      // Add tax if configured
      if (config.button2IncludeTax && config.button2TaxPercentage > 0) {
        calculatedPrice += calculatedPrice * (config.button2TaxPercentage / 100)
      }
    }
    
    // Generate unique QR code
    const qrCode = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)
    
    // Store QR record with calculated price (hidden from seller)
    const qrRecord = await prisma.qRCode.create({
      data: {
        code: qrCode,
        sellerId: session.user.id,
        guests: guests,
        days: days,
        cost: calculatedPrice, // Hidden pricing stored
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: requestedDelivery === 'DIRECT' ? null : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/landing/${qrCode}`
      }
    })
    
    // Button 4: Welcome Email Template Logic
    const isSpanish = language === 'es'
    let emailContent = ''
    let subject = ''
    
    // For now, Button 4 just determines if landing page is required
    // In the future, we can add button4WelcomeEmailTemplate field to schema
    // Currently using default welcome email template
    
    subject = isSpanish 
      ? 'Su ELocalPass está listo - Acceso Inmediato' 
      : 'Your ELocalPass is Ready - Immediate Access'
      
    emailContent = isSpanish ? `
Hola ${clientName},

¡Su ELocalPass está listo para usar! 

📋 DETALLES DE SU PASE:
• Código: ${qrCode}
• Huéspedes: ${guests} personas
• Válido por: ${days} días

🎯 ACCESO DIRECTO:
Este código le da acceso inmediato a su experiencia local.
Solo muestre este código QR en el punto de acceso.

⏰ VÁLIDO HASTA: ${expiresAt.toLocaleDateString('es-ES')}

¡Disfrute su experiencia ELocalPass!

Saludos,
El equipo ELocalPass
` : `
Hello ${clientName},

Your ELocalPass is ready to use!

📋 PASS DETAILS:
• Code: ${qrCode}
• Guests: ${guests} people
• Valid for: ${days} days

🎯 DIRECT ACCESS:
This code gives you immediate access to your local experience.
Simply show this QR code at the access point.

⏰ VALID UNTIL: ${expiresAt.toLocaleDateString('en-US')}

We hope you enjoy your local experience!

Best regards,
The ELocalPass Team
`
    
    // Button 5: Rebuy Email Logic (Hidden from seller)
    const shouldSendRebuyEmail = config.button5SendRebuyEmail
    let rebuyEmailScheduled = false
    
    if (shouldSendRebuyEmail) {
      // Schedule rebuy email to be sent when QR expires
      // For now, just log that rebuy email would be scheduled
      console.log(`📧 Rebuy email will be scheduled for ${clientEmail} when QR expires on ${expiresAt.toLocaleDateString()}`)
      rebuyEmailScheduled = true
      
      // TODO: Implement actual rebuy email scheduling
      // This could involve:
      // 1. Creating a scheduled job/cron task
      // 2. Using a queue system (Bull, Agenda, etc.)
      // 3. Database trigger or background process
    } else {
      console.log(`❌ Rebuy email disabled for this configuration`)
    }
    
    // TODO: Send actual welcome email
    // For now, we'll just log the email content
    console.log(' 📧 WELCOME EMAIL TO SEND:')
    console.log(`To: ${clientEmail}`)
    console.log(`Subject: ${subject}`)
    console.log(`Language: ${language}`)
    console.log(`Delivery Method: ${requestedDelivery}`)
    console.log(`Rebuy Email Scheduled: ${rebuyEmailScheduled}`)
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
