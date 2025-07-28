import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 FALLBACK PROCESSOR: Processing overdue scheduled QRs (QStash alternative)...')
    
    // Get all scheduled QR codes that are overdue and not processed
    const now = new Date()
    const overdueQRs = await prisma.scheduledQRCode.findMany({
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
    
    console.log(`📋 Found ${overdueQRs.length} overdue scheduled QR codes`)
    
    if (overdueQRs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No overdue scheduled QR codes to process',
        processed: 0
      })
    }
    
    let processedCount = 0
    let errorCount = 0
    const results = []
    
    for (const scheduledQR of overdueQRs) {
      try {
        console.log(`📅 Processing overdue QR for ${scheduledQR.clientEmail} (scheduled for ${scheduledQR.scheduledFor.toLocaleString()})`)
        
        // Import the necessary modules
        const crypto = await import('crypto')
        const { detectLanguage, t, getPlural, formatDate } = await import('@/lib/translations')
        
        // Use default configuration for PayPal/system QRs (like the single processor does)
        const config = {
          button2PricingType: 'FIXED',
          button2FixedPrice: 0,
          button5SendRebuyEmail: false,
          // Welcome emails always enabled (can be changed if needed)
        }
        
        // Calculate pricing (should be 0 for PayPal orders)
        let calculatedPrice = 0
        if (config.button2PricingType === 'FIXED') {
          calculatedPrice = config.button2FixedPrice || 0
        }

        // Generate unique QR code (NOW is activation time!)
        // Use PASS_ prefix for PayPal orders (default configurationId) to maintain consistency
    const qrCodeId = scheduledQR.configurationId === 'default' 
      ? `PASS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `EL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + scheduledQR.days)

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

        // Create analytics record with Cancun timezone
        const currentTime = new Date()
        const cancunTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "America/Cancun"}))
        
        await prisma.qRCodeAnalytics.create({
          data: {
            qrCode: qrCodeId,
            qrCodeId: qrCode.id,
            sellerId: scheduledQR.sellerId,
            sellerName: 'Online',
            sellerEmail: 'direct@elocalpass.com',
            locationId: null,
            locationName: 'Online',
            distributorId: null,
            distributorName: 'Elocalpass',
            customerName: scheduledQR.clientName,
            customerEmail: scheduledQR.clientEmail,
            guests: scheduledQR.guests,
            days: scheduledQR.days,
            cost: calculatedPrice,
            expiresAt: expiresAt,
            deliveryMethod: 'DIRECT',
            configurationId: 'default',
            pricingType: 'FIXED',
            createdAt: cancunTime,
            welcomeEmailSent: false, // Will be updated after email is sent
            rebuyEmailScheduled: false
          }
        })

        // Send welcome email based on configuration setting
        let emailSent = false
        
        // Welcome emails are always enabled (no toggle needed)
    console.log(`📧 SCHEDULED QR: Welcome emails are ENABLED - proceeding to send email`)
          try {
            // Use English for PayPal orders (same as immediate creation)
            const customerLanguage = 'en'
            
            // Format expiration date
            const formattedExpirationDate = formatDate(expiresAt, customerLanguage)
          
          console.log('📧 OVERDUE SCHEDULED QR: Looking for PayPal welcome email template...')
          
          // Get PayPal-specific template from database (same search as immediate creation)
          const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
            where: { 
              name: {
                contains: 'Paypal welcome email template'
              }
            },
            orderBy: { createdAt: 'desc' } // Get the newest one
          })
          
          console.log('📧 OVERDUE SCHEDULED QR: PayPal template search result:', {
            found: !!paypalTemplate,
            name: paypalTemplate?.name,
            id: paypalTemplate?.id,
            hasCustomHTML: !!paypalTemplate?.customHTML,
            htmlLength: paypalTemplate?.customHTML?.length || 0
          })
          
          let emailHtml = ''
          let emailSubject = 'Your ELocalPass is Ready - Overdue Processing'
          
          if (paypalTemplate && paypalTemplate.customHTML) {
            console.log('📧 OVERDUE SCHEDULED QR: Using PayPal-specific branded template')
            
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
            
            console.log('📧 OVERDUE SCHEDULED QR: PayPal template variables replaced successfully')
          } else {
            console.log('⚠️ OVERDUE SCHEDULED QR: PayPal template not found - using fallback template')
            
            // Fallback to generic template
            const { createWelcomeEmailHtml } = await import('@/lib/email-service')
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
          
          // Send email
          const nodemailer = await import('nodemailer')
          const transporter = nodemailer.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          })

          await transporter.sendMail({
            from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: scheduledQR.clientEmail,
            subject: emailSubject,
            html: emailHtml
          })

          emailSent = true
          console.log(`📧 Welcome email sent successfully to ${scheduledQR.clientEmail}`)

          // Update analytics to reflect email was sent
          await prisma.qRCodeAnalytics.updateMany({
            where: { qrCodeId: qrCode.id },
            data: { welcomeEmailSent: true }
          })

          } catch (emailError) {
            console.error(`❌ Failed to send welcome email to ${scheduledQR.clientEmail}:`, emailError)
            emailSent = false
          }
        }

        // Mark as processed
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
          emailSent: emailSent,
          wasOverdue: true
        })
        
        console.log(`✅ Successfully processed overdue QR for ${scheduledQR.clientEmail}`)
        
      } catch (error) {
        console.error(`❌ Error processing overdue QR ${scheduledQR.id}:`, error)
        errorCount++
        results.push({
          scheduledId: scheduledQR.id,
          clientEmail: scheduledQR.clientEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`🏁 FALLBACK PROCESSOR: Completed processing`)
    console.log(`✅ Processed: ${processedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} overdue scheduled QR codes`,
      processed: processedCount,
      errors: errorCount,
      results: results,
      fallbackMode: true
    })
    
  } catch (error) {
    console.error('💥 FALLBACK PROCESSOR: Fatal error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallbackMode: true
      },
      { status: 500 }
    )
  }
} 