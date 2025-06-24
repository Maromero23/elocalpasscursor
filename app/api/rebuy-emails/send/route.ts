import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 REBUY EMAIL SERVICE: Starting scheduled rebuy email check...')

    // Get all active QR codes that expire within the next 24 hours
    const now = new Date()
    const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000))
    
    const expiringQRCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gte: now,
          lte: next24Hours
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
        }
      }
    })

    console.log(`📧 REBUY EMAIL SERVICE: Found ${expiringQRCodes.length} QR codes expiring within 24 hours`)

    const results = []

    for (const qrCode of expiringQRCodes) {
      try {
        // Calculate hours left until expiration
        const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
        
        // 🧪 TESTING MODE: Send emails 3 minutes after QR creation instead of 12 hours before expiration
        const minutesSinceCreation = Math.ceil((now.getTime() - qrCode.createdAt.getTime()) / (1000 * 60))
        
        console.log(`🧪 TESTING MODE: QR ${qrCode.code} created ${minutesSinceCreation} minutes ago, expires in ${hoursLeft} hours`)
        
        // Skip if less than 3 minutes since creation (wait for 3 minute mark)
        if (minutesSinceCreation < 3) {
          console.log(`⏭️ REBUY EMAIL: QR ${qrCode.code} created only ${minutesSinceCreation} minutes ago, waiting for 3 minute mark`)
          continue
        }
        
        // Skip if more than 10 minutes since creation (only send once in the 3-10 minute window)
        if (minutesSinceCreation > 10) {
          console.log(`⏭️ REBUY EMAIL: QR ${qrCode.code} created ${minutesSinceCreation} minutes ago, outside 3-10 minute testing window`)
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

        // 🧪 TESTING MODE: Skip the normal 6-12 hour expiration window check
        // We're now using the 3-10 minute creation window instead
        console.log(`🧪 TESTING MODE: QR ${qrCode.code} is in the 3-10 minute testing window, proceeding with rebuy email`)

        // Detect customer language (for now default to English, can be enhanced later)
        const customerLanguage = 'en' as const
        
        // Generate customer portal URL for renewal
        const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCode.customerEmail}`

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
        const subject = `🧪 TEST: Your ELocalPass expires in ${hoursLeft} hours - Don't miss out!`

        const emailSent = await sendEmail({
          to: qrCode.customerEmail!,
          subject: subject,
          html: emailHtml
        })

        if (emailSent) {
          console.log(`✅ REBUY EMAIL: Successfully sent to ${qrCode.customerEmail} for QR ${qrCode.code}`)
          results.push({
            qrCode: qrCode.code,
            email: qrCode.customerEmail,
            hoursLeft: hoursLeft,
            status: 'sent'
          })
        } else {
          console.log(`❌ REBUY EMAIL: Failed to send to ${qrCode.customerEmail} for QR ${qrCode.code}`)
          results.push({
            qrCode: qrCode.code,
            email: qrCode.customerEmail,
            hoursLeft: hoursLeft,
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
      message: `Rebuy email service completed. Processed ${results.length} emails.`,
      results: results,
      totalExpiring: expiringQRCodes.length
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