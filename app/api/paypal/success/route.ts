import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  console.log('🚀 PAYPAL SUCCESS POST ROUTE CALLED!')
  console.log('📍 URL:', request.url)
  console.log('📍 Method:', request.method)
  
  try {
    // Handle POST request from PayPal and process the payment
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    console.log('📨 PayPal Success POST Request:', {
      params: Object.fromEntries(searchParams.entries())
    })

    // Check if we have order data from the return URL
    const orderDataParam = searchParams.get('orderData')
    const amountParam = searchParams.get('amount')
    
    console.log('🔍 PayPal Success - URL Parameters Check:', {
      hasOrderData: !!orderDataParam,
      hasAmount: !!amountParam,
      orderDataLength: orderDataParam ? orderDataParam.length : 0,
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    if (orderDataParam) {
      console.log('💰 Processing PayPal payment from return URL...')
      
      try {
        const orderData = JSON.parse(orderDataParam)
        console.log('📋 Order data from URL:', orderData)

        // Generate a transaction ID since PayPal doesn't provide one reliably
        const txnId = `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Check if we already processed this order (by email and amount to avoid duplicates)
        const existingOrder = await prisma.order.findFirst({
          where: { 
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            amount: parseFloat(amountParam || orderData.calculatedPrice.toString()),
            createdAt: {
              gte: new Date(Date.now() - 2 * 60 * 1000) // Within last 2 minutes (reduced from 5)
            }
          }
        })

        if (existingOrder) {
          console.log('⚠️ Similar payment found recently, redirecting to success page')
          const redirectUrl = new URL('/payment-success', url.origin)
          redirectUrl.searchParams.set('orderId', existingOrder.id)
          return NextResponse.redirect(redirectUrl)
        }

        // Convert delivery date/time to proper DateTime format in Cancun timezone
        let deliveryDateTime = null
        if (orderData.deliveryDate && orderData.deliveryTime) {
          // Parse date and time in Cancun timezone with explicit offset
          const [year, month, day] = orderData.deliveryDate.split('-').map(Number)
          const [hours, minutes] = orderData.deliveryTime.split(':').map(Number)
          const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000-05:00`
          deliveryDateTime = new Date(isoString)
          
          console.log('📅 Converted delivery date/time to Cancun timezone:', {
            originalDate: orderData.deliveryDate,
            originalTime: orderData.deliveryTime,
            isoString: isoString,
            convertedDateTime: deliveryDateTime.toISOString(),
            localString: deliveryDateTime.toString()
          })
        } else if (orderData.deliveryDate) {
          const [year, month, day] = orderData.deliveryDate.split('-').map(Number)
          const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000-05:00`
          deliveryDateTime = new Date(isoString)
          console.log('📅 Converted delivery date (default noon Cancun time):', deliveryDateTime.toISOString())
        }

        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: txnId,
            amount: parseFloat(amountParam || orderData.calculatedPrice.toString()),
            originalAmount: orderData.originalPrice || parseFloat(amountParam || orderData.calculatedPrice.toString()),
            discountAmount: orderData.discountAmount || 0,
            currency: 'USD',
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            passType: orderData.passType,
            guests: orderData.guests,
            days: orderData.days,
            deliveryType: orderData.deliveryType,
            deliveryDate: deliveryDateTime,
            deliveryTime: orderData.deliveryTime,
            discountCode: orderData.discountCode,
            sellerId: orderData.sellerId || null, // Use seller ID from order data (discount codes, rebuy emails)
            status: 'PAID'
          }
        })

        console.log('📝 ORDER CREATED:', orderRecord.id)

        // Handle QR code creation based on delivery type
        if (orderData.deliveryType === 'now') {
          console.log('🚀 IMMEDIATE DELIVERY: Creating QR code now')
          await createQRCode(orderRecord)
        } else if (orderData.deliveryType === 'future') {
          console.log('📅 FUTURE DELIVERY: Scheduling QR code')
          console.log('📋 Future delivery data:', {
            deliveryType: orderData.deliveryType,
            deliveryDate: orderData.deliveryDate,
            deliveryTime: orderData.deliveryTime,
            orderRecordId: orderRecord.id
          })
          
          try {
            await scheduleQRCode(orderRecord)
            console.log('✅ FUTURE DELIVERY: scheduleQRCode completed successfully')
          } catch (scheduleError) {
            console.error('❌ FUTURE DELIVERY: scheduleQRCode failed:', scheduleError)
            console.error('📋 Schedule error details:', {
              message: scheduleError instanceof Error ? scheduleError.message : 'Unknown error',
              stack: scheduleError instanceof Error ? scheduleError.stack : 'No stack trace',
              orderData: orderRecord
            })
            // Don't throw - let the payment success continue
          }
        } else {
          console.log('⚠️ UNKNOWN DELIVERY TYPE:', orderData.deliveryType)
          console.log('📋 Order data:', orderData)
        }

        // Redirect to payment success page with order ID
        const redirectUrl = new URL('/payment-success', url.origin)
        redirectUrl.searchParams.set('orderId', orderRecord.id)
        console.log('🔄 Redirecting to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)

      } catch (error) {
        console.error('❌ Error processing PayPal payment:', error)
      }
    }

    console.log('⚠️ FALLBACK PATH: No orderData parameter found or processing failed')
    console.log('📋 Available parameters:', Object.fromEntries(searchParams.entries()))
    
    // Fallback: Check if we can process this payment from PayPal POST data
    const paymentStatus = searchParams.get('payment_status')
    const txnId = searchParams.get('txn_id')
    const customData = searchParams.get('custom')
    const mcGross = searchParams.get('mc_gross')
    const mcCurrency = searchParams.get('mc_currency')
    
    console.log('📊 PayPal Payment Data:', {
      paymentStatus,
      txnId,
      customData,
      mcGross,
      mcCurrency
    })

    if (paymentStatus === 'Completed' && txnId && customData) {
      console.log('💰 Processing completed PayPal payment from POST data...')
      
      try {
        const orderData = JSON.parse(customData)
        console.log('📋 Order data:', orderData)

        // Check if we already processed this transaction
        const existingOrder = await prisma.order.findFirst({
          where: { paymentId: txnId }
        })

        if (existingOrder) {
          console.log('⚠️ Payment already processed, redirecting to success page')
          const redirectUrl = new URL('/payment-success', url.origin)
          redirectUrl.searchParams.set('orderId', existingOrder.id)
          return NextResponse.redirect(redirectUrl)
        }

        // Convert delivery date/time to proper DateTime format in Cancun timezone
        let deliveryDateTime = null
        if (orderData.deliveryDate && orderData.deliveryTime) {
          // Parse date and time in Cancun timezone with explicit offset
          const [year, month, day] = orderData.deliveryDate.split('-').map(Number)
          const [hours, minutes] = orderData.deliveryTime.split(':').map(Number)
          const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000-05:00`
          deliveryDateTime = new Date(isoString)
          
          console.log('📅 POST: Converted delivery date/time to Cancun timezone:', {
            originalDate: orderData.deliveryDate,
            originalTime: orderData.deliveryTime,
            isoString: isoString,
            convertedDateTime: deliveryDateTime.toISOString(),
            localString: deliveryDateTime.toString()
          })
        } else if (orderData.deliveryDate) {
          const [year, month, day] = orderData.deliveryDate.split('-').map(Number)
          const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T12:00:00.000-05:00`
          deliveryDateTime = new Date(isoString)
          console.log('📅 POST: Converted delivery date (default noon Cancun time):', deliveryDateTime.toISOString())
        }

        // Create order record
        const orderRecord = await prisma.order.create({
          data: {
            paymentId: txnId,
            amount: parseFloat(mcGross || orderData.calculatedPrice.toString()),
            currency: mcCurrency || 'USD',
            customerEmail: orderData.customerEmail,
            customerName: orderData.customerName,
            passType: orderData.passType,
            guests: orderData.guests,
            days: orderData.days,
            deliveryType: orderData.deliveryType,
            deliveryDate: deliveryDateTime,
            deliveryTime: orderData.deliveryTime,
            discountCode: orderData.discountCode,
            sellerId: orderData.sellerId || null, // Use seller ID from order data (discount codes, rebuy emails)
            status: 'PAID'
          }
        })

        console.log('📝 ORDER CREATED:', orderRecord.id)

        // Handle QR code creation based on delivery type
        if (orderData.deliveryType === 'now') {
          await createQRCode(orderRecord)
        } else if (orderData.deliveryType === 'future') {
          console.log('📅 FUTURE DELIVERY (POST): Scheduling QR code')
          try {
            await scheduleQRCode(orderRecord)
            console.log('✅ FUTURE DELIVERY (POST): scheduleQRCode completed successfully')
          } catch (scheduleError) {
            console.error('❌ FUTURE DELIVERY (POST): scheduleQRCode failed:', scheduleError)
            console.error('📋 Schedule error details:', {
              message: scheduleError instanceof Error ? scheduleError.message : 'Unknown error',
              stack: scheduleError instanceof Error ? scheduleError.stack : 'No stack trace',
              orderData: orderRecord
            })
            // Don't throw - let the payment success continue
          }
        } else {
          console.log('⚠️ UNKNOWN DELIVERY TYPE (POST):', orderData.deliveryType)
        }

        // Redirect to payment success page with order ID
        const redirectUrl = new URL('/payment-success', url.origin)
        redirectUrl.searchParams.set('orderId', orderRecord.id)
        console.log('🔄 Redirecting to:', redirectUrl.toString())
        return NextResponse.redirect(redirectUrl)

      } catch (error) {
        console.error('❌ Error processing PayPal payment:', error)
      }
    }

    // Build redirect URL to payment success page with all parameters
    const redirectUrl = new URL('/payment-success', url.origin)
    
    // Copy all search parameters
    searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })

    console.log('🔄 Redirecting to:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ PayPal success POST error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 PAYPAL SUCCESS GET ROUTE CALLED!')
  console.log('📍 URL:', request.url)
  console.log('📍 Method:', request.method)
  
  try {
    // Handle GET request (redirect from PayPal)
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    console.log('📨 PayPal Success GET Request:', {
      params: Object.fromEntries(searchParams.entries())
    })

    // Handle GET requests the same way
    return POST(request)
  } catch (error) {
    console.error('❌ PayPal success GET error:', error)
    return NextResponse.redirect(new URL('/payment-success', request.url))
  }
}

async function createQRCode(orderRecord: any) {
  try {
    console.log('🎫 CREATING QR CODE FOR ORDER:', orderRecord.id)
    console.log('📋 Order details:', {
      id: orderRecord.id,
      customerEmail: orderRecord.customerEmail,
      customerName: orderRecord.customerName,
      guests: orderRecord.guests,
      days: orderRecord.days,
      amount: orderRecord.amount,
      deliveryType: orderRecord.deliveryType
    })
    
    // Import necessary modules
    console.log('📦 Importing crypto module...')
    const crypto = await import('crypto')
    console.log('📦 Importing translations module...')
    const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
    console.log('✅ All modules imported successfully')
    
    // Generate unique QR code
    let qrCodeId = `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + (orderRecord.days * 24 * 60 * 60 * 1000))
    
    console.log('🎯 Generated QR details:', {
      qrCodeId,
      expiresAt,
      daysFromNow: orderRecord.days
    })
    
    // Determine seller information for PayPal orders BEFORE creating QR code
    let sellerId = 'cmc4ha7l000086a96ef0e06qq' // Default system seller ID
    let sellerName = 'Online'
    let sellerEmail = 'direct@elocalpass.com'
    let sellerDetails = null // Declare outside the block
    
    // Check if customer came from a specific seller (rebuy email or discount code)
    if (orderRecord.sellerId) {
      console.log('🔍 PayPal order: Customer came from seller:', orderRecord.sellerId)
      
      // Get seller details from database
      sellerDetails = await prisma.user.findUnique({
        where: { id: orderRecord.sellerId },
        include: {
          location: {
            include: {
              distributor: true
            }
          }
        }
      })
      
      if (sellerDetails) {
        sellerId = sellerDetails.id
        sellerName = sellerDetails.name || 'Unknown Seller'
        sellerEmail = sellerDetails.email || 'unknown@elocalpass.com'
        console.log('✅ PayPal order: Using seller details:', { sellerName, sellerEmail })
      } else {
        console.log('⚠️ PayPal order: Seller not found, using direct purchase')
        // Reset to defaults if seller not found
        sellerId = 'cmc4ha7l000086a96ef0e06qq'
        sellerName = 'Online'
        sellerEmail = 'direct@elocalpass.com'
        sellerDetails = null
      }
    } else {
      console.log('📋 PayPal order: Direct purchase from passes page')
      // Explicitly reset all seller information for direct sales
      sellerId = 'cmc4ha7l000086a96ef0e06qq'
      sellerName = 'Online'
      sellerEmail = 'direct@elocalpass.com'
      sellerDetails = null
    }
    
    // Create QR code record
    console.log('💾 Creating QR code in database...')
    
    // Double-check that we don't already have a QR code for this specific order
    const existingQRCode = await prisma.qRCode.findFirst({
      where: {
        customerEmail: orderRecord.customerEmail,
        customerName: orderRecord.customerName,
        createdAt: {
          gte: new Date(Date.now() - 1 * 60 * 1000) // Within last 1 minute
        }
      }
    })
    
    if (existingQRCode) {
      console.log('⚠️ QR code already exists for this customer, creating new one with different ID')
      // Generate a new unique ID to ensure uniqueness
      qrCodeId = `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${orderRecord.id.substr(-6)}`
      console.log('🎯 New QR ID generated:', qrCodeId)
    }
    
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrCodeId,
        sellerId: sellerId, // Use determined seller ID (not hardcoded)
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
    
    console.log('✅ QR CODE CREATED:', qrCode.id, 'for seller:', sellerId)
    
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
    
    // Create analytics record with proper seller information and Cancun timezone
    const now = new Date()
    const cancunTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Cancun"}))
    
    // Determine location and distributor information
    let locationId = null
    let locationName = null
    let distributorId = null
    let distributorName = 'Elocalpass' // Default for direct sales
    
    if (orderRecord.sellerId && sellerDetails) {
      // Use seller's location and distributor information for attributed sales
      locationId = sellerDetails.location?.id || null
      locationName = sellerDetails.location?.name || null
      distributorId = sellerDetails.location?.distributor?.id || null
      distributorName = sellerDetails.location?.distributor?.name || 'Elocalpass'
    } else {
      // For direct purchases (no seller attribution), set location to "Online"
      locationName = 'Online'
    }
    
    // Determine if rebuy emails should be scheduled based on seller configuration
    let shouldScheduleRebuyEmail = false
    
    if (orderRecord.sellerId && sellerDetails && sellerDetails.savedConfigId) {
      try {
        // Get seller's saved configuration to check rebuy email settings
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: sellerDetails.savedConfigId },
          select: { config: true }
        })
        
        if (savedConfig?.config) {
          const configData = JSON.parse(savedConfig.config)
          shouldScheduleRebuyEmail = configData.button5SendRebuyEmail === true
          console.log(`📧 PayPal success: Seller rebuy emails ${shouldScheduleRebuyEmail ? 'ENABLED' : 'DISABLED'} for seller ${sellerDetails.name}`)
        }
      } catch (error) {
        console.error('⚠️ PayPal success: Error checking seller rebuy email config:', error)
      }
    } else {
      // 🐛 CRITICAL FIX: Direct purchases should also get rebuy emails using MASTER PAYPAL DEFAULT REBUY EMAIL template
      shouldScheduleRebuyEmail = true
      console.log('📧 PayPal success: Direct purchase - enabling rebuy emails with MASTER PAYPAL DEFAULT template')
    }
    
    await prisma.qRCodeAnalytics.create({
      data: {
        qrCodeId: qrCode.id,
        qrCode: qrCodeId,
        customerName: orderRecord.customerName,
        customerEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        cost: orderRecord.amount,
        discountAmount: orderRecord.discountAmount || 0,
        expiresAt: expiresAt,
        isActive: true,
        deliveryMethod: 'DIRECT',
        language: 'en',
        sellerId: sellerId,
        sellerName: sellerName,
        sellerEmail: sellerEmail,
        locationId: locationId,
        locationName: locationName,
        distributorId: distributorId,
        distributorName: distributorName,
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
        rebuyEmailScheduled: shouldScheduleRebuyEmail, // Enable rebuy emails for seller-referred sales
        createdAt: cancunTime, // Use Cancun timezone
        updatedAt: cancunTime
      }
    })
    
    // Send welcome email using seller-specific or PayPal template
    let emailSent = false
    let emailHtml: string = ''
    let emailSubject: string = ''
    
    // Check if this is a seller-referred sale and seller has custom templates
    if (orderRecord.sellerId && sellerDetails && sellerDetails.savedConfigId) {
      console.log('🎨 PayPal success: Seller-referred sale - checking for custom email templates')
      
      try {
        // Get seller's saved configuration with email templates
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: sellerDetails.savedConfigId },
          select: { emailTemplates: true }
        })
        
        let emailTemplates = null
        if (savedConfig?.emailTemplates) {
          try {
            emailTemplates = typeof savedConfig.emailTemplates === 'string' 
              ? JSON.parse(savedConfig.emailTemplates) 
              : savedConfig.emailTemplates
          } catch (error) {
            console.log('⚠️ PayPal success: Error parsing seller email templates:', error)
          }
        }
        
        // Use seller's custom welcome email template if available
        if (emailTemplates?.welcomeEmail?.customHTML && emailTemplates.welcomeEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
          console.log('📧 PayPal success: Using seller\'s custom welcome email template')
          
          const formattedExpirationDate = formatDate(expiresAt, 'en')
          
          // Use seller's custom template
          emailHtml = emailTemplates.welcomeEmail.customHTML
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, orderRecord.guests.toString())
            .replace(/\{days\}/g, orderRecord.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          // Use seller's custom subject if available
          if (emailTemplates.welcomeEmail.subject) {
            emailSubject = emailTemplates.welcomeEmail.subject
              .replace(/\{customerName\}/g, orderRecord.customerName)
              .replace(/\{qrCode\}/g, qrCodeId)
          } else {
            emailSubject = `Welcome to ELocalPass - ${orderRecord.customerName}!`
          }
          
          const { sendEmail } = await import('@/lib/email-service')
          emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log(`📧 PayPal success: Seller custom email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
          
          if (emailSent) {
            await prisma.qRCodeAnalytics.updateMany({
              where: { qrCodeId: qrCode.id },
              data: { welcomeEmailSent: true }
            })
            console.log('📊 Analytics updated - seller custom email marked as sent')
          }
        } else {
          console.log('📧 PayPal success: Seller has no custom template - falling back to PayPal template')
        }
      } catch (error) {
        console.error('⚠️ PayPal success: Error processing seller templates:', error)
        console.log('📧 PayPal success: Falling back to PayPal template due to error')
      }
    }
    
    // If no custom email was sent (direct sale or seller has no custom template), use PayPal template
    if (!emailSent) {
      console.log('📧 PayPal success: Using PayPal-specific template (direct sale or no custom template)')
    
      try {
        console.log('📧 STARTING EMAIL SENDING PROCESS...')
        console.log('📧 Order details for email:', {
          customerName: orderRecord.customerName,
          customerEmail: orderRecord.customerEmail,
          qrCodeId: qrCodeId
        })
        
        // Import email service and translations
        const { sendEmail } = await import('@/lib/email-service')
        const { formatDate } = await import('@/lib/translations')
        
        console.log('📧 Email service imported successfully')
        
        const customerLanguage = 'en' // Default language for PayPal orders
        const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
        
        console.log('📧 Looking for PayPal welcome email template...')
        
        // Get PayPal-specific template from database
        const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
          where: { 
            name: {
              contains: 'Paypal welcome email template (DO NOT ERASE)'
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        console.log('📧 PayPal template search result:', {
          found: !!paypalTemplate,
          name: paypalTemplate?.name,
          id: paypalTemplate?.id,
          hasCustomHTML: !!paypalTemplate?.customHTML
        })
        
        if (paypalTemplate && paypalTemplate.customHTML) {
          console.log('📧 Using PayPal branded template')
          
          emailHtml = paypalTemplate.customHTML
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
            .replace(/\{guests\}/g, orderRecord.guests.toString())
            .replace(/\{days\}/g, orderRecord.days.toString())
            .replace(/\{expirationDate\}/g, formattedExpirationDate)
            .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
            .replace(/\{magicLink\}/g, magicLinkUrl)
          
          emailSubject = paypalTemplate.subject
            .replace(/\{customerName\}/g, orderRecord.customerName)
            .replace(/\{qrCode\}/g, qrCodeId)
          
          emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log(`📧 PayPal welcome email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
          
          if (emailSent) {
            await prisma.qRCodeAnalytics.updateMany({
              where: { qrCodeId: qrCode.id },
              data: { welcomeEmailSent: true }
            })
            console.log('📊 Analytics updated - email marked as sent')
          }
        } else {
          console.log('⚠️ No PayPal template found - using generic template')
          
          emailHtml = `
            <h1>Welcome to ELocalPass!</h1>
            <p>Dear ${orderRecord.customerName},</p>
            <p>Your ELocalPass is ready! Here are your details:</p>
            <ul>
              <li><strong>QR Code:</strong> ${qrCodeId}</li>
              <li><strong>Guests:</strong> ${orderRecord.guests}</li>
              <li><strong>Days:</strong> ${orderRecord.days}</li>
              <li><strong>Expires:</strong> ${formattedExpirationDate}</li>
            </ul>
            <p><a href="${magicLinkUrl}">Access Your Pass</a></p>
            <p>Thank you for choosing ELocalPass!</p>
          `
          
          emailSubject = `Welcome to ELocalPass - ${orderRecord.customerName}!`
          
          emailSent = await sendEmail({
            to: orderRecord.customerEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log(`📧 Generic welcome email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
        }
        
      } catch (emailError) {
        console.error('❌ EMAIL SENDING ERROR:', emailError)
        emailSent = false
      }
    }
    
    console.log('✅ QR CODE AND EMAIL PROCESSED:', qrCode.id)
    
  } catch (error) {
    console.error('❌ QR CODE CREATION ERROR:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      orderRecordId: orderRecord?.id,
      customerEmail: orderRecord?.customerEmail
    })
    // Don't throw the error - let the PayPal flow continue
  }
}

async function scheduleQRCode(orderRecord: any) {
  try {
    console.log('📅 SCHEDULING QR CODE FOR ORDER:', orderRecord.id)
    console.log('📋 Order details:', {
      deliveryType: orderRecord.deliveryType,
      deliveryDate: orderRecord.deliveryDate,
      deliveryTime: orderRecord.deliveryTime,
      customerEmail: orderRecord.customerEmail
    })
    
    // Calculate delivery date and time
    // The orderRecord.deliveryDate should already be the correct date/time as processed in POST handler
    let deliveryDateTime: Date
    
    if (orderRecord.deliveryDate) {
      // Use the stored delivery date directly - it's already processed correctly in POST handler
      deliveryDateTime = new Date(orderRecord.deliveryDate)
      
      console.log('✅ Using stored delivery time directly:', {
        storedDate: orderRecord.deliveryDate,
        deliveryDateTime: deliveryDateTime.toString(),
        iso: deliveryDateTime.toISOString()
      })
    } else {
      // No date provided - this shouldn't happen for future delivery
      console.error('❌ CRITICAL: Future delivery order without delivery date!')
      console.error('📋 Order data:', orderRecord)
      
      // Default to 1 hour from now as fallback
      deliveryDateTime = new Date(Date.now() + 60 * 60 * 1000)
      console.log('🚨 FALLBACK: Scheduling for 1 hour from now:', deliveryDateTime.toISOString())
    }
    
    // Validate that delivery time is in the future (allow 5 minute grace period for processing)
    const now = new Date()
    const graceTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    
    if (deliveryDateTime <= graceTime) {
      console.log('⏰ Delivery time has passed, will process immediately after creation')
      // Don't change deliveryDateTime - keep the user's selected time for record keeping
      // The scheduled QR will be created and then immediately processed
    } else if (deliveryDateTime <= now) {
      console.log('⏰ Delivery time is recent past, will process immediately after creation')
    } else {
      console.log('📅 Delivery time is in future, will schedule normally')
    }
    
    // Create scheduled QR configuration using our existing system
    // For PayPal orders, always use the default system seller ID to ensure consistent seller info
    const scheduledQR = await prisma.scheduledQRCode.create({
      data: {
        scheduledFor: deliveryDateTime,
        clientName: orderRecord.customerName,
        clientEmail: orderRecord.customerEmail,
        guests: orderRecord.guests,
        days: orderRecord.days,
        amount: orderRecord.amount, // Store the cost for tracking
        discountAmount: orderRecord.discountAmount || 0, // Store discount amount
        sellerId: 'cmc4ha7l000086a96ef0e06qq', // Always use default PayPal seller for consistency
        configurationId: 'default',
        deliveryMethod: 'DIRECT',
        isProcessed: false
      }
    })
    
    console.log('✅ QR CODE SCHEDULED:', scheduledQR.id)
    
    // Use our existing QStash system for exact-time scheduling [[memory:3709459]]
    const delay = deliveryDateTime.getTime() - Date.now()
    
    if (delay > 0 && process.env.QSTASH_TOKEN) {
      try {
        // Schedule exact processing with Upstash QStash V2
        const qstashResponse = await fetch(`https://qstash.upstash.io/v2/publish/${process.env.NEXTAUTH_URL}/api/scheduled-qr/process-single`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Delay': `${delay}ms`
          },
          body: JSON.stringify({
            scheduledQRId: scheduledQR.id
          })
        })
        
        if (qstashResponse.ok) {
          const qstashData = await qstashResponse.json()
          console.log(`📅 PAYPAL QR: QStash job created for exact time: ${deliveryDateTime}`)
          console.log(`🆔 QStash Message ID: ${qstashData.messageId}`)
        } else {
          console.error('❌ QStash scheduling failed:', await qstashResponse.text())
        }
      } catch (qstashError) {
        console.error('❌ QStash error:', qstashError)
      }
    }
    
  } catch (error) {
    console.error('❌ QR CODE SCHEDULING ERROR:', error)
  }
} 