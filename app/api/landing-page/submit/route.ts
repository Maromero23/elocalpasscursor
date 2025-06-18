import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import crypto from 'crypto'
import { detectLanguage, t, getPlural, formatDate, type SupportedLanguage } from '../../../../lib/translations'

export async function POST(request: NextRequest) {
  try {
    const { qrConfigId, formData } = await request.json()

    // Validate required fields
    if (!qrConfigId || !formData?.name || !formData?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get the configuration from saved configurations
    const savedConfig = await prisma.savedQRConfiguration.findUnique({
      where: { id: qrConfigId }
    })

    if (!savedConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Parse configuration data
    const config = JSON.parse(savedConfig.config)
    const emailTemplates = savedConfig.emailTemplates ? JSON.parse(savedConfig.emailTemplates) : null

    // Validate guests and days against configuration rules
    const guests = formData.guests || config.button1GuestsDefault || 2
    const days = formData.days || config.button1DaysDefault || 3

    if (guests < 1 || guests > (config.button1GuestsRangeMax || 10)) {
      return NextResponse.json({ error: `Invalid number of guests. Must be between 1 and ${config.button1GuestsRangeMax || 10}` }, { status: 400 })
    }

    if (days < 1 || days > (config.button1DaysRangeMax || 30)) {
      return NextResponse.json({ error: `Invalid number of days. Must be between 1 and ${config.button1DaysRangeMax || 30}` }, { status: 400 })
    }

    // Calculate pricing based on configuration
    let calculatedPrice = 0
    if (config.button2PricingType === 'FIXED') {
      calculatedPrice = config.button2FixedPrice || 0
    } else if (config.button2PricingType === 'VARIABLE') {
      const basePrice = config.button2VariableBasePrice || 0
      const extraGuests = Math.max(0, guests - 1)
      const extraDays = Math.max(0, days - 1)
      const guestAmount = (config.button2VariableGuestIncrease || 0) * extraGuests
      const dayAmount = (config.button2VariableDayIncrease || 0) * extraDays
      
      calculatedPrice = basePrice + guestAmount + dayAmount
      
      // Apply commission
      const commission = config.button2VariableCommission || 0
      calculatedPrice += calculatedPrice * (commission / 100)
      
      // Apply tax if enabled
      if (config.button2IncludeTax) {
        const taxRate = config.button2TaxPercentage || 0
        calculatedPrice += calculatedPrice * (taxRate / 100)
      }
    }

    // Generate unique QR code ID
    const qrCodeId = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Set expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    // Find a seller to assign this QR to (for now, use the first seller with this configuration)
    // In a real implementation, you might want to use location-based assignment or round-robin
    const sellerWithConfig = await prisma.user.findFirst({
      where: {
        role: 'SELLER',
        savedConfigId: qrConfigId
      },
      include: {
        location: {
          include: {
            distributor: true
          }
        }
      }
    })

    if (!sellerWithConfig) {
      return NextResponse.json({ error: 'No seller available for this configuration' }, { status: 404 })
    }

    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: sellerWithConfig.id,
        customerName: formData.name,
        customerEmail: formData.email,
        guests: guests,
        days: days,
        cost: calculatedPrice,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: null // This was a landing page submission, so no additional landing URL needed
      }
    })

    // Generate magic link token for customer access
    const accessToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: formData.email,
        customerName: formData.name,
        expiresAt: tokenExpiresAt
      }
    })

    // Create magic link URL
    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`

    // Prepare welcome email content using translation system
    const deliveryMethod = config.button3DeliveryMethod || 'DIRECT'
    
    // Auto-detect language from browser headers or use passed language
    const acceptLanguage = request.headers.get('accept-language') || undefined
    const customerLanguage: SupportedLanguage = formData.language || detectLanguage(acceptLanguage)
    
    console.log(`🌍 Customer language detected: ${customerLanguage}`)
    
    // Generate email content using translation system
    let emailSubject = t('email.welcome.subject', customerLanguage)
    
    const guestPlural = getPlural(guests, customerLanguage, 'guest')
    const dayPlural = getPlural(days, customerLanguage, 'day')
    const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
    
    let emailContent = `${t('email.welcome.greeting', customerLanguage, { customerName: formData.name })}

${t('email.welcome.ready', customerLanguage)}

${t('email.welcome.details.header', customerLanguage)}
${t('email.welcome.details.code', customerLanguage, { qrCode: qrCodeId })}
${t('email.welcome.details.guests', customerLanguage, { guests: guests.toString() })}
${t('email.welcome.details.days', customerLanguage, { days: days.toString() })}

${deliveryMethod === 'DIRECT' ? t('email.welcome.access.direct.header', customerLanguage) : t('email.welcome.access.portal.header', customerLanguage)}
${deliveryMethod === 'DIRECT' 
  ? t('email.welcome.access.direct.text', customerLanguage)
  : t('email.welcome.access.portal.text', customerLanguage, { magicLink: magicLinkUrl })}

${t('email.welcome.validity', customerLanguage, { expirationDate: formattedExpirationDate })}

${t('email.welcome.closing', customerLanguage)}

${t('email.welcome.signature', customerLanguage)}
`

    // Use custom email template if available (override translations)
    if (emailTemplates?.welcomeEmail) {
      const template = emailTemplates.welcomeEmail
      if (template.subject) emailSubject = template.subject
      if (template.content) {
        emailContent = template.content
          .replace(/\{customerName\}/g, formData.name)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, guests.toString())
          .replace(/\{days\}/g, days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{magicLink\}/g, magicLinkUrl)
      }
    }

    console.log(`📧 WELCOME EMAIL TO SEND:
To: ${formData.email}
Subject: ${emailSubject}
Language: ${customerLanguage}
Delivery Method: ${deliveryMethod}
Rebuy Email Scheduled: ${config.button5SendRebuyEmail || false}
Content:
${emailContent}`)

    // Schedule rebuy email if enabled
    if (config.button5SendRebuyEmail) {
      console.log(`📧 Rebuy email will be scheduled for ${formData.email} when QR expires on ${expiresAt.toLocaleDateString()}`)
    }

    return NextResponse.json({ 
      success: true, 
      qrCodeId: qrCode.id,
      message: t('landing.success.message', customerLanguage),
      deliveryMethod: deliveryMethod,
      magicLink: deliveryMethod !== 'DIRECT' ? magicLinkUrl : undefined
    })

  } catch (error) {
    console.error('Error submitting landing page form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
