import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 REBUY EMAIL SERVICE: Starting rebuy email check (TESTING MODE - 2 minutes after creation)...')

    // TESTING MODE: Get QR codes created more than 2 minutes ago but less than 15 minutes ago
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000)) // 2 minutes ago
    const fifteenMinutesAgo = new Date(now.getTime() - (15 * 60 * 1000)) // 15 minutes ago
    
    const recentQRCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: fifteenMinutesAgo, // Created at least 2 minutes ago
          lte: twoMinutesAgo   // But not more than 15 minutes ago
        },
        customerEmail: {
          not: null
        }
      },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    })

    console.log(`📧 REBUY EMAIL SERVICE: Found ${recentQRCodes.length} QR codes created 2-15 minutes ago`)

    const results = []

    for (const qrCode of recentQRCodes) {
      try {
        // Calculate time since creation
        const minutesSinceCreation = Math.floor((now.getTime() - qrCode.createdAt.getTime()) / (1000 * 60))
        
        // Check if rebuy email is scheduled in analytics
        if (!qrCode.analytics || !qrCode.analytics.rebuyEmailScheduled) {
          console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - rebuy email not scheduled`)
          continue
        }
        
        // Get seller's configuration to check if rebuy emails are enabled
        const sellerConfig = qrCode.seller.savedConfig
        if (!sellerConfig) {
          console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - seller has no saved configuration`)
          continue
        }

        const configData = JSON.parse(sellerConfig.config)
        if (!configData.button5SendRebuyEmail) {
          console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - rebuy emails disabled for this configuration`)
          continue
        }

        console.log(`✅ REBUY EMAIL: QR ${qrCode.code} was created ${minutesSinceCreation} minutes ago, sending test rebuy email`)

        // Detect customer language (for now default to English, can be enhanced later)
        const customerLanguage = 'en' as const
        
        // Generate customer portal URL for renewal
        const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCode.customerEmail}`

        // Calculate hours left until expiration for email content
        const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

        // Create rebuy email HTML
        const emailHtml = createRebuyEmailHtml({
          customerName: qrCode.customerName || 'Valued Customer',
          qrCode: qrCode.code,
          guests: qrCode.guests,
          days: qrCode.days,
          hoursLeft: hoursLeft,
          customerPortalUrl: customerPortalUrl,
          language: customerLanguage,
          rebuyUrl: customerPortalUrl // For now, use the same URL
        })

        // Send the rebuy email
        const subject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`

        const emailSent = await sendEmail({
          to: qrCode.customerEmail!,
          subject: subject,
          html: emailHtml
        })

        if (emailSent) {
          console.log(`✅ REBUY EMAIL: Successfully sent to ${qrCode.customerEmail} for QR ${qrCode.code}`)
          
          // Mark as sent to prevent duplicates by updating the analytics record
          await prisma.qRCodeAnalytics.update({
            where: { qrCodeId: qrCode.id },
            data: { rebuyEmailScheduled: false }
          })
          
          results.push({
            qrCode: qrCode.code,
            email: qrCode.customerEmail,
            minutesSinceCreation: minutesSinceCreation,
            hoursLeft: hoursLeft,
            status: 'sent'
          })
        } else {
          console.log(`❌ REBUY EMAIL: Failed to send to ${qrCode.customerEmail} for QR ${qrCode.code}`)
          results.push({
            qrCode: qrCode.code,
            email: qrCode.customerEmail,
            minutesSinceCreation: minutesSinceCreation,
            status: 'failed'
          })
        }

      } catch (error) {
        console.error(`❌ REBUY EMAIL: Error processing QR ${qrCode.code}:`, error)
        results.push({
          qrCode: qrCode.code,
          email: qrCode.customerEmail,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎯 REBUY EMAIL SERVICE: Completed. Processed ${results.length} rebuy emails`)

    return NextResponse.json({
      success: true,
      message: `Rebuy email service completed (TESTING MODE). Processed ${results.length} emails.`,
      results: results,
      totalFound: recentQRCodes.length,
      testingMode: true,
      triggerWindow: "2-15 minutes after QR creation"
    })

  } catch (error) {
    console.error('❌ REBUY EMAIL SERVICE: Critical error:', error)
    return NextResponse.json({
      success: false,
      error: 'Rebuy email service failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method to manually trigger rebuy email check (for testing)
export async function GET(request: NextRequest) {
  console.log('🧪 REBUY EMAIL SERVICE: Manual trigger via GET request')
  return POST(request)
} 