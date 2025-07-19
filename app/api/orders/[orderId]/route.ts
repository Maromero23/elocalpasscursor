import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    
    console.log(`📋 Fetching order details for: ${orderId}`)
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Check if QR code has been created for this order
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        cost: order.amount,
        createdAt: {
          gte: new Date(order.createdAt.getTime() - 5 * 60 * 1000), // Within 5 minutes of order
          lte: new Date(order.createdAt.getTime() + 5 * 60 * 1000)
        }
      }
    })
    
    if (!existingQR) {
      console.log(`🎫 No QR code found for order ${orderId}, creating one now...`)
      
      // Trigger QR code creation for this order
      try {
        await createQRCodeForOrder(order)
        console.log(`✅ QR code created for order ${orderId}`)
      } catch (error) {
        console.error(`❌ Failed to create QR code for order ${orderId}:`, error)
      }
    } else {
      console.log(`✅ QR code already exists for order ${orderId}`)
    }
    
    // Calculate discount amount if discount code was used
    let discountAmount = 0
    if (order.discountCode) {
      // This would need to be calculated based on your discount logic
      // For now, we'll set it to 0
      discountAmount = 0
    }
    
    const orderDetails = {
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amount: order.amount,
      currency: order.currency,
      guests: order.guests,
      days: order.days,
      deliveryType: order.deliveryType,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      discountCode: order.discountCode,
      discountAmount: discountAmount,
      status: order.status,
      createdAt: order.createdAt
    }
    
    console.log(`✅ Order details retrieved for: ${orderId}`)
    
    return NextResponse.json({
      success: true,
      order: orderDetails
    })
    
  } catch (error) {
    console.error('❌ Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createQRCodeForOrder(orderRecord: any) {
  try {
    console.log('🎫 CREATING QR CODE FOR ORDER:', orderRecord.id)
    
    // Import necessary modules
    const crypto = await import('crypto')
    const { formatDate } = await import('@/lib/translations')
    
    // Generate unique QR code (same as seller dashboard)
    const qrCodeId = `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + (orderRecord.days * 24 * 60 * 60 * 1000))
    
    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: 'cmc4ha7l000086a96ef0e06qq', // Use existing seller for PayPal orders
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: expiresAt,
        isActive: true,
        landingUrl: null
      }
    })
    
    console.log('✅ QR CODE CREATED:', qrCode.id)
    
    // Generate magic link token
    const accessToken = crypto.default.randomBytes(32).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.customerAccessToken.create({
      data: {
        token: accessToken,
        qrCodeId: qrCode.id,
        customerEmail: orderRecord.customerEmail,
        customerName: orderRecord.customerName,
        expiresAt: tokenExpiresAt
      }
    })

    const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`
    
    // Create analytics record
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: 'DIRECT',
        language: 'en',
        sellerId: 'system',
        sellerName: 'ELocalPass System',
        sellerEmail: 'system@elocalpass.com',
        locationId: null,
        locationName: null,
        distributorId: null,
        distributorName: null,
        configurationId: 'default',
        configurationName: 'Default PayPal Configuration',
        pricingType: 'FIXED',
        fixedPrice: orderRecord.amount,
        variableBasePrice: null,
        variableGuestIncrease: null,
        variableDayIncrease: null,
        variableCommission: null,
        includeTax: false,
        taxPercentage: null,
        baseAmount: orderRecord.amount,
        guestAmount: 0,
        dayAmount: 0,
        commissionAmount: 0,
        taxAmount: 0,
        totalAmount: orderRecord.amount,
        landingUrl: null,
        magicLinkUrl: magicLinkUrl,
        welcomeEmailSent: false,
        rebuyEmailScheduled: false
      }
    })
    
    // 🚀 ALWAYS USE DEFAULT EMAIL TEMPLATE FOR PAYPAL ORDERS (no seller config)
    let emailSent = false
    let emailSubject = 'Your ELocalPass is Ready - Immediate Access'
    try {
      console.log('📧 PayPal order - using DEFAULT email template from admin panel...')
      
      // Import email service
      const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
      const { formatDate } = await import('@/lib/translations')
      
      const customerLanguage = 'en'
      const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
      
      // ALWAYS get DEFAULT email template from admin panel for PayPal orders
      const defaultEmailTemplate = await prisma.welcomeEmailTemplate.findFirst({
        where: {
          isDefault: true
        }
      })
      
      console.log('📧 Default template found:', defaultEmailTemplate ? 'YES' : 'NO')
      console.log('📧 Template details:', {
        id: defaultEmailTemplate?.id,
        name: defaultEmailTemplate?.name,
        subject: defaultEmailTemplate?.subject,
        isDefault: defaultEmailTemplate?.isDefault,
        hasCustomHTML: !!defaultEmailTemplate?.customHTML,
        customHTMLLength: defaultEmailTemplate?.customHTML?.length || 0,
        customHTMLPreview: defaultEmailTemplate?.customHTML?.substring(0, 200) + '...'
      })
      
      let emailHtml
      
      if (defaultEmailTemplate && defaultEmailTemplate.customHTML) {
        console.log('📧 Using DEFAULT branded template from admin panel')
        console.log('📧 Original template length:', defaultEmailTemplate.customHTML.length)
        
        // Use default template with variable replacements
        emailHtml = defaultEmailTemplate.customHTML
          .replace(/\{customerName\}/g, orderRecord.customerName)
          .replace(/\{qrCode\}/g, qrCodeId)
          .replace(/\{guests\}/g, orderRecord.guests.toString())
          .replace(/\{days\}/g, orderRecord.days.toString())
          .replace(/\{expirationDate\}/g, formattedExpirationDate)
          .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
          .replace(/\{magicLink\}/g, magicLinkUrl)
        
        console.log('📧 After variable replacement length:', emailHtml.length)
        console.log('📧 Variable replacements made:', {
          customerName: orderRecord.customerName,
          qrCode: qrCodeId,
          guests: orderRecord.guests,
          days: orderRecord.days,
          expirationDate: formattedExpirationDate,
          magicLink: magicLinkUrl
        })
        
        // Use default template subject
        emailSubject = defaultEmailTemplate.subject
          .replace(/\{customerName\}/g, orderRecord.customerName)
          .replace(/\{qrCode\}/g, qrCodeId)
          
        console.log('📧 Using default template from admin panel')
        console.log('📧 Final email subject:', emailSubject)
      } else {
        console.log('📧 No default template found OR customHTML is null, using fallback template')
        console.log('📧 Template debug info:', {
          templateExists: !!defaultEmailTemplate,
          customHTMLExists: !!defaultEmailTemplate?.customHTML,
          customHTMLValue: defaultEmailTemplate?.customHTML
        })
        
        // Fallback to built-in template
        emailHtml = createWelcomeEmailHtml({
          customerName: orderRecord.customerName,
          qrCode: qrCodeId,
          guests: orderRecord.guests,
          days: orderRecord.days,
          expiresAt: formattedExpirationDate,
          customerPortalUrl: magicLinkUrl,
          language: customerLanguage,
          deliveryMethod: 'DIRECT'
        })
        
        console.log('📧 Using fallback built-in template')
      }
      
      console.log(`📧 Sending welcome email to: ${orderRecord.customerEmail}`)
      console.log(`📧 Email subject: ${emailSubject}`)
      console.log(`📧 Email HTML length: ${emailHtml.length} characters`)
      
      // Send email using same function as seller dashboard
      emailSent = await sendEmail({
        to: orderRecord.customerEmail,
        subject: emailSubject,
        html: emailHtml
      })
      
      console.log(`📧 Email sent result: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
      
    } catch (emailError) {
      console.error('❌ EMAIL ERROR:', emailError)
      emailSent = false
    }
    
         console.log(`📧 EMAIL SUMMARY:
To: ${orderRecord.customerEmail}
Subject: ${emailSubject || 'Your ELocalPass is Ready - Immediate Access'}
Email Sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
    
    console.log('✅ QR CODE AND EMAIL PROCESSED:', qrCode.id)
    
  } catch (error) {
    console.error('❌ QR CODE CREATION ERROR:', error)
  }
} 