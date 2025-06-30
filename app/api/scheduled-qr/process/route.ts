import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
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
        
        // Get seller info and configuration (same as generate-qr API)
        const seller = await prisma.user.findUnique({
          where: { id: scheduledQR.sellerId },
          select: { 
            id: true,
            savedConfigId: true,
            configurationName: true 
          }
        })

        if (!seller?.savedConfigId) {
          throw new Error('No configuration assigned to seller')
        }

        // Get the saved QR configuration
        const savedConfig = await prisma.savedQRConfiguration.findUnique({
          where: { id: seller.savedConfigId }
        })

        if (!savedConfig) {
          throw new Error('Configuration not found')
        }

        // Parse the configuration JSON
        const config = JSON.parse(savedConfig.config)
        
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
            sellerName: sellerDetails?.name,
            sellerEmail: sellerDetails?.email || '',
            locationId: sellerDetails?.locationId,
            locationName: sellerDetails?.location?.name,
            distributorId: sellerDetails?.location?.distributorId,
            distributorName: sellerDetails?.location?.distributor?.name,
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
            baseAmount: config.button2PricingType === 'FIXED' ? config.button2FixedPrice || 0 : config.button2VariableBasePrice || 0,
            guestAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableGuestIncrease || 0) * Math.max(0, scheduledQR.guests - 1) : 0,
            dayAmount: config.button2PricingType === 'VARIABLE' ? (config.button2VariableDayIncrease || 0) * Math.max(0, scheduledQR.days - 1) : 0,
            commissionAmount: config.button2PricingType === 'VARIABLE' ? config.button2VariableCommission || 0 : 0,
            taxAmount: config.button2IncludeTax && config.button2TaxPercentage > 0 ? calculatedPrice * (config.button2TaxPercentage / 100) : 0,
            totalAmount: calculatedPrice,
            landingUrl: qrCode.landingUrl,
            magicLinkUrl: magicLinkUrl,
            welcomeEmailSent: false,
            rebuyEmailScheduled: config.button5SendRebuyEmail || false
          }
        })

        // Send welcome email using shared template system
        const { sendWelcomeEmailWithTemplates } = await import('@/lib/email-service')
        
        const customerLanguage = 'en' // Default language for now
        
        // Use the shared email template system
        const emailSent = await sendWelcomeEmailWithTemplates({
          customerName: scheduledQR.clientName,
          customerEmail: scheduledQR.clientEmail,
          qrCode: qrCodeId,
          guests: scheduledQR.guests,
          days: scheduledQR.days,
          expiresAt: expiresAt,
          magicLinkUrl: magicLinkUrl,
          customerLanguage: customerLanguage,
          deliveryMethod: scheduledQR.deliveryMethod,
          savedConfigId: seller.savedConfigId
        })

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