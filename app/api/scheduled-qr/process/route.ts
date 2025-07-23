import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Optional security check for external cron services
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('🔒 SCHEDULED QR: Unauthorized cron request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🕐 SCHEDULED QR PROCESSOR: Starting scheduled QR code processing...')
    
    // Get all scheduled QR codes that are due for processing
    const now = new Date()
    const scheduledQRs = await prisma.scheduledQRCode.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        isProcessed: false
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })
    
    console.log(`📋 Found ${scheduledQRs.length} scheduled QR codes ready for processing`)
    
    if (scheduledQRs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled QR codes to process',
        processed: 0
      })
    }
    
    let processedCount = 0
    let errorCount = 0
    const results = []
    
    for (const scheduledQR of scheduledQRs) {
      try {
        console.log(`📅 Processing scheduled QR for ${scheduledQR.clientEmail} (scheduled for ${scheduledQR.scheduledFor.toLocaleString()})`)
        
        // Create QR code directly using the same logic as generate-qr API
        // Import the necessary modules
        const crypto = await import('crypto')
        const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
        
        // Get seller info and configuration 
        const seller = await prisma.user.findUnique({
          where: { id: scheduledQR.sellerId },
          select: { 
            id: true,
            savedConfigId: true,
            configurationName: true 
          }
        })

        let config
        let savedConfig = null

        // Handle different types of scheduled QRs
        if (scheduledQR.configurationId === 'default' || !seller?.savedConfigId) {
          // This is a PayPal or system-generated QR with default configuration
          console.log(`📅 BATCH PROCESSING: Using default configuration for scheduled QR: ${scheduledQR.id}`)
          
          // Use default configuration for PayPal/system QRs
          config = {
            button2PricingType: 'FIXED',
            button2FixedPrice: 0,
            button5SendRebuyEmail: false
          }
        } else {
          // This is a seller dashboard QR with saved configuration
          console.log(`📅 BATCH PROCESSING: Using saved configuration for scheduled QR: ${scheduledQR.id}`)
          
          if (!seller || !seller.savedConfigId) {
            throw new Error('No configuration assigned to seller')
          }

          // Get the saved QR configuration
          savedConfig = await prisma.savedQRConfiguration.findUnique({
            where: { id: seller.savedConfigId }
          })

          if (!savedConfig) {
            throw new Error('Configuration not found')
          }

          // Parse the configuration JSON
          config = JSON.parse(savedConfig.config)
        }
        
        // Calculate pricing (same logic as generate-qr API)
        let calculatedPrice = 0
        if (config.button2PricingType === 'FIXED') {
          calculatedPrice = config.button2FixedPrice || 0
        } else if (config.button2PricingType === 'VARIABLE') {
          const basePrice = config.button2VariableBasePrice || 0
          const extraGuests = Math.max(0, scheduledQR.guests - 1)
          const extraDays = Math.max(0, scheduledQR.days - 1)
          const guestPrice = (config.button2VariableGuestIncrease || 0) * extraGuests
          const dayPrice = (config.button2VariableDayIncrease || 0) * extraDays
          calculatedPrice = basePrice + guestPrice + dayPrice
          
          if (config.button2VariableCommission > 0) {
            calculatedPrice += config.button2VariableCommission
          }
          
          if (config.button2IncludeTax && config.button2TaxPercentage > 0) {
            calculatedPrice += calculatedPrice * (config.button2TaxPercentage / 100)
          }
        }

        // Generate unique QR code (NOW is activation time!)
        const qrCodeId = `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + scheduledQR.days) // Expiration starts NOW

        // Create QR code
        const qrCode = await prisma.qRCode.create({
          data: {
            code: qrCodeId,
            sellerId: scheduledQR.sellerId,
            customerName: scheduledQR.clientName,
            customerEmail: scheduledQR.clientEmail,
            guests: scheduledQR.guests,
            days: scheduledQR.days,
            cost: calculatedPrice,
            expiresAt: expiresAt,
            isActive: true,
            landingUrl: scheduledQR.deliveryMethod === 'DIRECT' ? null : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/landing/${qrCodeId}`
          }
        })

        // Generate magic link token
        const accessToken = crypto.default.randomBytes(32).toString('hex')
        const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        
        await prisma.customerAccessToken.create({
          data: {
            token: accessToken,
            qrCodeId: qrCode.id,
            customerEmail: scheduledQR.clientEmail,
            customerName: scheduledQR.clientName,
            expiresAt: tokenExpiresAt
          }
        })

        const magicLinkUrl = `${process.env.NEXTAUTH_URL}/customer/access?token=${accessToken}`

        // Create analytics record (same as generate-qr API)
        const sellerDetails = await prisma.user.findUnique({
          where: { id: scheduledQR.sellerId },
          include: {
            location: {
              include: {
                distributor: true
              }
            }
          }
        })

        // Create analytics record with Cancun timezone
        const currentTime = new Date()
        const cancunTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/Cancun"}))
        
        // Determine seller information for analytics (consistent with PayPal immediate creation)
        let analyticsSellerName, analyticsSellerEmail, analyticsLocationName, analyticsDistributorName
        
        if (scheduledQR.configurationId === 'default' || !seller?.savedConfigId) {
          // This is a PayPal QR - use consistent PayPal seller information
          analyticsSellerName = 'Online'
          analyticsSellerEmail = 'direct@elocalpass.com'
          analyticsLocationName = 'Online'
          analyticsDistributorName = 'Elocalpass'
        } else {
          // This is a seller dashboard QR - use actual seller information
          analyticsSellerName = sellerDetails?.name || 'Unknown Seller'
          analyticsSellerEmail = sellerDetails?.email || 'unknown@elocalpass.com'
          analyticsLocationName = sellerDetails?.location?.name || null
          analyticsDistributorName = sellerDetails?.location?.distributor?.name || null
        }
        
        await prisma.qRCodeAnalytics.create({
          data: {
            qrCodeId: qrCode.id,
            qrCode: qrCodeId,
            customerName: scheduledQR.clientName,
            customerEmail: scheduledQR.clientEmail,
            guests: scheduledQR.guests,
            days: scheduledQR.days,
            cost: calculatedPrice,
            expiresAt: expiresAt,
            isActive: true,
            deliveryMethod: scheduledQR.deliveryMethod,
            language: 'en',
            sellerId: scheduledQR.sellerId,
            sellerName: analyticsSellerName,
            sellerEmail: analyticsSellerEmail,
            locationId: sellerDetails?.locationId,
            locationName: analyticsLocationName,
            distributorId: sellerDetails?.location?.distributorId,
            distributorName: analyticsDistributorName,
            configurationId: seller?.savedConfigId || scheduledQR.configurationId,
            configurationName: seller?.configurationName || 'Default Configuration',
            pricingType: config.button2PricingType,
            fixedPrice: config.button2PricingType === 'FIXED' ? config.button2FixedPrice : null,
            variableBasePrice: config.button2PricingType === 'VARIABLE' ? config.button2VariableBasePrice : null,
            variableGuestIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableGuestIncrease : null,
            variableDayIncrease: config.button2PricingType === 'VARIABLE' ? config.button2VariableDayIncrease : null,
            variableCommission: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission : null,
            includeTax: config.button2IncludeTax || false,
            taxPercentage: config.button2TaxPercentage,
            baseAmount: config.button2PricingType === 'FIXED' ? config.button2FixedPrice || 0 : config.button2VariableBasePrice || 0,
            guestAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableGuestIncrease || 0) * Math.max(0, scheduledQR.guests - 1) : 0,
            dayAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableDayIncrease || 0) * Math.max(0, scheduledQR.days - 1) : 0,
            commissionAmount: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission || 0 : 0,
            taxAmount: config.button2IncludeTax && config.button2TaxPercentage > 0 ? calculatedPrice * (config.button2TaxPercentage / 100) : 0,
            totalAmount: calculatedPrice,
            landingUrl: null,
            magicLinkUrl: magicLinkUrl,
            welcomeEmailSent: false,
            rebuyEmailScheduled: config.button5SendRebuyEmail || false,
            createdAt: cancunTime, // Use Cancun timezone
            updatedAt: cancunTime
          }
        })

        // Send welcome email using PayPal template (same logic as immediate PayPal creation)
        let emailSent = false
        try {
          // Import email service and translations
          const { sendEmail, createWelcomeEmailHtml } = await import('@/lib/email-service')
          const { formatDate } = await import('@/lib/translations')
          
          const customerLanguage = 'en' // Default language for PayPal orders
          const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
          
          console.log('📧 BATCH SCHEDULED QR: Looking for PayPal welcome email template...')
          
          // Get PayPal-specific template from database (same search as immediate creation)
          const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
            where: { 
              name: {
                contains: 'Paypal welcome email template'
              }
            },
            orderBy: { createdAt: 'desc' } // Get the newest one
          })
          
          console.log('📧 BATCH SCHEDULED QR: PayPal template search result:', {
            found: !!paypalTemplate,
            name: paypalTemplate?.name,
            id: paypalTemplate?.id,
            hasCustomHTML: !!paypalTemplate?.customHTML,
            htmlLength: paypalTemplate?.customHTML?.length || 0
          })
          
          let emailHtml = ''
          let emailSubject = 'Your ELocalPass is Ready - Scheduled Delivery'
          
          if (paypalTemplate && paypalTemplate.customHTML) {
            console.log('📧 BATCH SCHEDULED QR: Using PayPal-specific branded template')
            
            // Replace variables in PayPal template (same as immediate creation)
            emailHtml = paypalTemplate.customHTML
              .replace(/\{customerName\}/g, scheduledQR.clientName)
              .replace(/\{qrCode\}/g, qrCodeId)
              .replace(/\{guests\}/g, scheduledQR.guests.toString())
              .replace(/\{days\}/g, scheduledQR.days.toString())
              .replace(/\{expirationDate\}/g, formattedExpirationDate)
              .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
              .replace(/\{magicLink\}/g, magicLinkUrl)
            
            if (paypalTemplate.subject) {
              emailSubject = paypalTemplate.subject
                .replace(/\{customerName\}/g, scheduledQR.clientName)
                .replace(/\{qrCode\}/g, qrCodeId)
            }
            
            console.log('📧 BATCH SCHEDULED QR: PayPal template variables replaced successfully')
          } else {
            console.log('⚠️ BATCH SCHEDULED QR: PayPal template not found - using fallback template')
            
            // Fallback to generic template
            emailHtml = createWelcomeEmailHtml({
              customerName: scheduledQR.clientName,
              qrCode: qrCodeId,
              guests: scheduledQR.guests,
              days: scheduledQR.days,
              expiresAt: formattedExpirationDate,
              customerPortalUrl: magicLinkUrl,
              language: customerLanguage,
              deliveryMethod: 'DIRECT'
            })
          }
          
          console.log(`📧 BATCH SCHEDULED QR: Generated welcome email HTML - Length: ${emailHtml.length} chars`)
          
          // Send the email
          emailSent = await sendEmail({
            to: scheduledQR.clientEmail,
            subject: emailSubject,
            html: emailHtml
          })
          
          console.log('📧 BATCH SCHEDULED QR: Email send result:', emailSent)

          if (emailSent) {
            console.log(`✅ BATCH SCHEDULED QR: Welcome email sent successfully to ${scheduledQR.clientEmail}`)
          } else {
            console.error(`❌ BATCH SCHEDULED QR: Failed to send welcome email to ${scheduledQR.clientEmail}`)
          }
        } catch (emailError) {
          console.error('❌ BATCH SCHEDULED QR: Error sending welcome email:', emailError)
          emailSent = false
        }

        if (emailSent) {
          await prisma.qRCodeAnalytics.updateMany({
            where: { qrCodeId: qrCode.id },
            data: { welcomeEmailSent: true }
          })
        }

        // Mark as processed and store the created QR code ID
        await prisma.scheduledQRCode.update({
          where: { id: scheduledQR.id },
          data: {
            isProcessed: true,
            processedAt: new Date(),
            createdQRCodeId: qrCodeId
          }
        })
        
        processedCount++
        results.push({
          scheduledId: scheduledQR.id,
          clientEmail: scheduledQR.clientEmail,
          qrCode: qrCodeId,
          success: true,
          emailSent: emailSent
        })
        
        console.log(`✅ Successfully processed scheduled QR for ${scheduledQR.clientEmail}`)
        
      } catch (error) {
        console.error(`❌ Error processing scheduled QR ${scheduledQR.id}:`, error)
        errorCount++
        results.push({
          scheduledId: scheduledQR.id,
          clientEmail: scheduledQR.clientEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`🏁 SCHEDULED QR PROCESSOR: Completed processing`)
    console.log(`✅ Processed: ${processedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} scheduled QR codes`,
      processed: processedCount,
      errors: errorCount,
      results: results
    })
    
  } catch (error) {
    console.error('💥 SCHEDULED QR PROCESSOR: Fatal error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
} 