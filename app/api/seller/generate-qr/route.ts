import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { detectLanguage, t, getPlural, formatDate, type SupportedLanguage } from '@/lib/translations'

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
    const { clientName, clientEmail, guests, days, deliveryMethod } = body
    
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
        savedConfigId: true,
        configurationName: true 
      }
    })
    
    if (!seller?.savedConfigId) {
      return NextResponse.json(
        { error: 'No configuration assigned to seller' },
        { status: 400 }
      )
    }
    
    // Get the saved QR configuration that this seller is paired to
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: {
        id: seller.savedConfigId
      }
    })
    
    if (!savedConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 400 }
      )
    }
    
    // Parse the configuration JSON
    const config = JSON.parse(savedConfig.config)
    
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
    const qrCodeId = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)
    
    // Get seller details with location and distributor info for analytics
    const sellerDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })

    // Store QR record with calculated price (hidden from seller)
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: session.user.id,
        customerName: clientName,
        customerEmail: clientEmail,
        guests: guests,
        days: days,
        cost: calculatedPrice, // Hidden pricing stored
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: requestedDelivery === 'DIRECT' ? null : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/landing/${qrCodeId}`
      }
    })
    
    // Generate magic link token for customer access
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: clientEmail,
        customerName: clientName,
        expiresAt: tokenExpiresAt
      }
    })

    // Create magic link URL
    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`
    
    // Calculate revenue breakdown for analytics
    const basePrice = config.button2PricingType === 'FIXED' 
      ? config.button2FixedPrice || 0 
      : config.button2VariableBasePrice || 0
    
    const extraGuests = Math.max(0, guests - 1)
    const extraDays = Math.max(0, days - 1)
    const guestAmount = config.button2PricingType === 'VARIABLE' 
      ? (config.button2VariableGuestIncrease || 0) * extraGuests 
      : 0
    const dayAmount = config.button2PricingType === 'VARIABLE' 
      ? (config.button2VariableDayIncrease || 0) * extraDays 
      : 0
    const commissionAmount = config.button2PricingType === 'VARIABLE' 
      ? config.button2VariableCommission || 0 
      : 0
    const taxAmount = config.button2IncludeTax && config.button2TaxPercentage > 0
      ? calculatedPrice * (config.button2TaxPercentage / 100)
      : 0
    
    // Create comprehensive analytics record
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        
        // Customer Information
        customerName: clientName,
        customerEmail: clientEmail,
        
        // QR Code Details
        guests: guests,
        days: days,
        cost: calculatedPrice,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: requestedDelivery,
        language: 'en',
        
        // Seller Information
        sellerId: session.user.id,
        sellerName: sellerDetails?.name,
        sellerEmail: sellerDetails?.email || '',
        
        // Location Information
        locationId: sellerDetails?.locationId,
        locationName: sellerDetails?.location?.name,
        
        // Distributor Information
        distributorId: sellerDetails?.location?.distributorId,
        distributorName: sellerDetails?.location?.distributor?.name,
        
        // Configuration Information
        configurationId: seller.savedConfigId,
        configurationName: seller.configurationName,
        pricingType: config.button2PricingType,
        fixedPrice: config.button2PricingType === 'FIXED' ? config.button2FixedPrice : null,
        variableBasePrice: config.button2PricingType === 'VARIABLE' ? config.button2VariableBasePrice : null,
        variableGuestIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableGuestIncrease : null,
        variableDayIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableDayIncrease : null,
        variableCommission: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission : null,
        includeTax: config.button2IncludeTax || false,
        taxPercentage: config.button2TaxPercentage,
        
        // Revenue Breakdown
        baseAmount: basePrice,
        guestAmount: guestAmount,
        dayAmount: dayAmount,
        commissionAmount: commissionAmount,
        taxAmount: taxAmount,
        totalAmount: calculatedPrice,
        
        // Tracking & Analytics
        landingUrl: qrCode.landingUrl,
        magicLinkUrl: magicLinkUrl,
        welcomeEmailSent: false, // Will be updated when email is actually sent
        rebuyEmailScheduled: config.button5SendRebuyEmail || false
      }
    })
    
    // Button 4: Welcome Email Template Logic
    // Detect customer language from Accept-Language headers
    const acceptLanguage = request.headers.get('accept-language') || undefined
    const customerLanguage: SupportedLanguage = detectLanguage(acceptLanguage)
    
    console.log(`🌍 Customer language detected: ${customerLanguage}`)
    
    // Generate email content using translation system
    const subject = t('email.welcome.subject', customerLanguage)
    
    const guestPlural = getPlural(guests, customerLanguage, 'guest')
    const dayPlural = getPlural(days, customerLanguage, 'day')
    const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
    
    const emailContent = `${t('email.welcome.greeting', customerLanguage, { customerName: clientName })}

${t('email.welcome.ready', customerLanguage)}

${t('email.welcome.details.header', customerLanguage)}
${t('email.welcome.details.code', customerLanguage, { qrCode: qrCodeId })}
${t('email.welcome.details.guests', customerLanguage, { guests: guests.toString() })}
${t('email.welcome.details.days', customerLanguage, { days: days.toString() })}

${t('email.welcome.access.direct.header', customerLanguage)}
${t('email.welcome.access.direct.text', customerLanguage)}

${t('email.welcome.access.portal.header', customerLanguage)}
${t('email.welcome.access.portal.text', customerLanguage, { magicLink: magicLinkUrl })}

${t('email.welcome.validity', customerLanguage, { expirationDate: formattedExpirationDate })}

${t('email.welcome.closing', customerLanguage)}

${t('email.welcome.signature', customerLanguage)}
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
    
    // 🚀 SEND ACTUAL WELCOME EMAIL
    let emailSent = false
    try {
      // Import email service
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      
      // Create HTML email using the email service
      const emailHtml = createWelcomeEmailHtml({
        customerName: clientName,
        qrCode: qrCodeId,
        guests: guests,
        days: days,
        expiresAt: formattedExpirationDate,
        customerPortalUrl: magicLinkUrl,
        language: customerLanguage,
        deliveryMethod: requestedDelivery
      })

      // Send the email
      emailSent = await sendEmail({
        to: clientEmail,
        subject: subject,
        html: emailHtml
      })

      if (emailSent) {
        console.log(`✅ Welcome email sent successfully to ${clientEmail}`)
        
        // Update analytics record to reflect email was sent
        await prisma.qRCodeAnalytics.updateMany({
          where: { qrCodeId: qrCode.id },
          data: { welcomeEmailSent: true }
        })
      } else {
        console.error(`❌ Failed to send welcome email to ${clientEmail}`)
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError)
      emailSent = false
    }
    
    console.log(`📧 WELCOME EMAIL SUMMARY:
To: ${clientEmail}
Subject: ${subject}
Delivery Method: ${requestedDelivery}
Rebuy Email Scheduled: ${rebuyEmailScheduled}
Email Sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
    
    return NextResponse.json({
      success: true,
      qrCode: qrCodeId,
      expiresAt: expiresAt,
      message: emailSent ? 'QR code generated and email sent successfully' : 'QR code generated but email failed to send',
      magicLinkUrl: magicLinkUrl,
      emailSent: emailSent
    })
    
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
