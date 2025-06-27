import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Function to apply fresh colors to existing HTML template
function generateRebuyHtmlWithConfig(config: any, replacements: any, existingHtml?: string) {
  // If we have existing HTML, use it and just update the colors
  if (existingHtml) {
    let updatedHtml = existingHtml
    
    // Replace placeholders first
    updatedHtml = updatedHtml
      .replace(/\{customerName\}/g, replacements.customerName)
      .replace(/\{qrCode\}/g, replacements.qrCode)
      .replace(/\{guests\}/g, replacements.guests.toString())
      .replace(/\{days\}/g, replacements.days.toString())
      .replace(/\{hoursLeft\}/g, replacements.hoursLeft.toString())
      .replace(/\{customerPortalUrl\}/g, replacements.customerPortalUrl)
      .replace(/\{rebuyUrl\}/g, replacements.rebuyUrl)
    
    // Apply specific color updates with precise targeting
    if (config.emailHeaderColor) {
      // Update header background color specifically
      updatedHtml = updatedHtml.replace(/\.header\s*{\s*background-color:\s*[^;]*;/g, `.header { background-color: ${config.emailHeaderColor};`)
      
      // Determine header text color based on background
      const headerTextColor = config.emailHeaderColor === '#fcfcfc' || config.emailHeaderColor === '#ffffff' ? '#374151' : 'white'
      updatedHtml = updatedHtml.replace(/\.header\s+h1\s*{\s*color:\s*[^;]*;/g, `.header h1 { color: ${headerTextColor};`)
    }
    
    if (config.emailCtaBackgroundColor) {
      // Update CTA button background color specifically
      updatedHtml = updatedHtml.replace(/\.cta-button\s+a\s*{\s*background-color:\s*[^;]*;/g, `.cta-button a { background-color: ${config.emailCtaBackgroundColor};`)
    }
    
    if (config.emailCtaColor) {
      // Update CTA button text color specifically
      updatedHtml = updatedHtml.replace(/(\.cta-button\s+a\s*{[^}]*color:\s*)[^;]*;/g, `$1${config.emailCtaColor};`)
    }
    
    if (config.emailMessageColor) {
      // Update message text colors specifically
      updatedHtml = updatedHtml.replace(/\.message\s+p\s*{\s*color:\s*[^;]*;/g, `.message p { color: ${config.emailMessageColor};`)
    }
    
    if (config.emailBackgroundColor) {
      // Update body and container background colors
      updatedHtml = updatedHtml.replace(/body\s*{\s*([^}]*background-color:\s*)[^;]*;/g, `body { $1${config.emailBackgroundColor};`)
      updatedHtml = updatedHtml.replace(/\.container\s*{\s*([^}]*background-color:\s*)[^;]*;/g, `.container { $1${config.emailBackgroundColor};`)
    }
    
    if (config.emailFooterColor) {
      // Update footer text color
      updatedHtml = updatedHtml.replace(/\.footer-message\s+p\s*{\s*color:\s*[^;]*;/g, `.footer-message p { color: ${config.emailFooterColor};`)
    }
    
    return updatedHtml
  }
  
  // Fallback: if no existing HTML, return error message
  return `
    <html>
    <body>
      <h1>Error: No template HTML provided</h1>
      <p>The rebuy email system should use your saved template HTML, not generate new content.</p>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 REBUY EMAIL SERVICE: Starting rebuy email check (TESTING MODE - 2 minutes after creation)...')

    // TESTING MODE: Get QR codes created more than 2 minutes ago but less than 25 minutes ago
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000)) // 2 minutes ago
    const twentyFiveMinutesAgo = new Date(now.getTime() - (25 * 60 * 1000)) // 25 minutes ago
    
    const recentQRCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: twentyFiveMinutesAgo, // Created at least 2 minutes ago
          lte: twoMinutesAgo   // But not more than 25 minutes ago
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

    console.log(`📧 REBUY EMAIL SERVICE: Found ${recentQRCodes.length} QR codes created 2-25 minutes ago`)

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

        // Get email templates from configuration
        const emailTemplates = sellerConfig.emailTemplates ? JSON.parse(sellerConfig.emailTemplates) : null
        
        console.log(`📧 REBUY EMAIL: Checking email templates for QR ${qrCode.code}`)
        console.log(`  - Has emailTemplates: ${!!emailTemplates}`)
        console.log(`  - Has rebuyEmail: ${!!emailTemplates?.rebuyEmail}`)
        console.log(`  - Has customHTML: ${!!emailTemplates?.rebuyEmail?.customHTML}`)
        console.log(`  - Has htmlContent: ${!!emailTemplates?.rebuyEmail?.htmlContent}`)
        console.log(`  - CustomHTML length: ${emailTemplates?.rebuyEmail?.customHTML?.length || 0}`)
        console.log(`  - CustomHTML preview: ${(emailTemplates?.rebuyEmail?.customHTML || '').substring(0, 150)}`)
        console.log(`  - CustomHTML includes "testing custom": ${(emailTemplates?.rebuyEmail?.customHTML || '').includes('testing custom')}`)
        console.log(`  - CustomHTML includes "Featured Partners": ${(emailTemplates?.rebuyEmail?.customHTML || '').includes('Featured Partners')}`)

        // Detect customer language (for now default to English, can be enhanced later)
        const customerLanguage = 'en' as const
        
        // Generate customer portal URL for renewal
        const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCode.customerEmail}`

        // Calculate hours left until expiration for email content
        const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

        let emailHtml: string
        let emailSubject: string

        // Check if we have rebuy email template configuration
        if (emailTemplates?.rebuyEmail?.customHTML) {
          
          // Check if it's requesting the default rebuy template
          if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
            console.log(`📧 REBUY EMAIL: Loading default template from RebuyEmailTemplate database for QR ${qrCode.code}`)
            
            try {
              // Load default rebuy template from database (SEPARATE from welcome emails)
              const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
                where: { isDefault: true }
              })
              
              if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
                console.log(`✅ REBUY EMAIL: Found default rebuy template in database`)
                
                // Try to get saved rebuy configuration for fresh HTML generation
                if (defaultRebuyTemplate.headerText) {
                  // The template already has the correct colors saved, just replace placeholders
                  console.log(`✅ REBUY EMAIL: Using saved template HTML with current colors`)
                  
                  emailHtml = defaultRebuyTemplate.customHTML
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                  
                  // Get subject from saved config if available
                  try {
                    const savedRebuyConfig = JSON.parse(defaultRebuyTemplate.headerText)
                    emailSubject = `🧪 TEST: ${savedRebuyConfig.emailSubject || defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'}`
                  } catch (error) {
                    emailSubject = `🧪 TEST: ${defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'}`
                  }
                } else {
                  // No saved config, use stored HTML
                  emailHtml = defaultRebuyTemplate.customHTML
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                  
                  emailSubject = `🧪 TEST: ${defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'}`
                }
                
              } else {
                console.log(`⚠️ REBUY EMAIL: Default rebuy template in database is empty, falling back to generic template`)
                // Fallback to generic template if database template is empty
                emailHtml = createRebuyEmailHtml({
                  customerName: qrCode.customerName || 'Valued Customer',
                  qrCode: qrCode.code,
                  guests: qrCode.guests,
                  days: qrCode.days,
                  hoursLeft: hoursLeft,
                  customerPortalUrl: customerPortalUrl,
                  language: customerLanguage,
                  rebuyUrl: customerPortalUrl
                })
                emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
              }
              
            } catch (error) {
              console.error(`❌ REBUY EMAIL: Error loading default template from database:`, error)
              // Fallback to generic template on database error
              emailHtml = createRebuyEmailHtml({
                customerName: qrCode.customerName || 'Valued Customer',
                qrCode: qrCode.code,
                guests: qrCode.guests,
                days: qrCode.days,
                hoursLeft: hoursLeft,
                customerPortalUrl: customerPortalUrl,
                language: customerLanguage,
                rebuyUrl: customerPortalUrl
              })
              emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
            }
            
          } else {
            console.log(`📧 REBUY EMAIL: Using custom template for QR ${qrCode.code}`)
            console.log(`📧 REBUY EMAIL: Custom template length: ${emailTemplates.rebuyEmail.customHTML?.length || 0} characters`)
            console.log(`📧 REBUY EMAIL: Custom template preview: ${(emailTemplates.rebuyEmail.customHTML || '').substring(0, 100)}...`)
            
            try {
              // Use custom template HTML directly (colors are already saved in the HTML)
              console.log(`✅ REBUY EMAIL: Using custom template HTML with saved colors`)
              
              emailHtml = emailTemplates.rebuyEmail.customHTML
                .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                .replace(/\{qrCode\}/g, qrCode.code)
                .replace(/\{guests\}/g, qrCode.guests.toString())
                .replace(/\{days\}/g, qrCode.days.toString())
                .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                .replace(/\{rebuyUrl\}/g, customerPortalUrl)

              // Get subject from rebuy config if available
              if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
                emailSubject = `🧪 TEST: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject}`
              } else {
                emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
              }

              console.log(`✅ REBUY EMAIL: Custom template processed successfully. Final length: ${emailHtml.length} characters`)
              
            } catch (templateError) {
              console.error(`❌ REBUY EMAIL: Error processing custom template for QR ${qrCode.code}:`, templateError)
              console.log(`📧 REBUY EMAIL: Falling back to default template due to custom template error`)
              
              // Fallback to default template on error
              const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
                where: { isDefault: true }
              })
              
              if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
                emailHtml = defaultRebuyTemplate.customHTML
                  .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                  .replace(/\{qrCode\}/g, qrCode.code)
                  .replace(/\{guests\}/g, qrCode.guests.toString())
                  .replace(/\{days\}/g, qrCode.days.toString())
                  .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                  .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                  .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                
                emailSubject = `🧪 TEST: ${defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'}`
              } else {
                // Final fallback to generic template
                emailHtml = createRebuyEmailHtml({
                  customerName: qrCode.customerName || 'Valued Customer',
                  qrCode: qrCode.code,
                  guests: qrCode.guests,
                  days: qrCode.days,
                  hoursLeft: hoursLeft,
                  customerPortalUrl: customerPortalUrl,
                  language: customerLanguage,
                  rebuyUrl: customerPortalUrl
                })
                emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
              }
            }
          }
          
        } else if (emailTemplates?.rebuyEmail?.htmlContent) {
          console.log(`📧 REBUY EMAIL: Using legacy htmlContent template for QR ${qrCode.code}`)
          
          // Legacy support for htmlContent field
          emailHtml = emailTemplates.rebuyEmail.htmlContent
            .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
            .replace(/\{qrCode\}/g, qrCode.code)
            .replace(/\{guests\}/g, qrCode.guests.toString())
            .replace(/\{days\}/g, qrCode.days.toString())
            .replace(/\{hoursLeft\}/g, hoursLeft.toString())
            .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
            .replace(/\{rebuyUrl\}/g, customerPortalUrl)

          if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
            emailSubject = `🧪 TEST: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject}`
          } else {
            emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
          }
          
        } else {
          console.log(`📧 REBUY EMAIL: No rebuy template found, using generic fallback for QR ${qrCode.code}`)
          
          // No rebuy template configured - use generic fallback
          emailHtml = createRebuyEmailHtml({
            customerName: qrCode.customerName || 'Valued Customer',
            qrCode: qrCode.code,
            guests: qrCode.guests,
            days: qrCode.days,
            hoursLeft: hoursLeft,
            customerPortalUrl: customerPortalUrl,
            language: customerLanguage,
            rebuyUrl: customerPortalUrl
          })
          
          emailSubject = `🧪 TEST: Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
        }

        console.log(`📧 REBUY EMAIL: Sending email to ${qrCode.customerEmail} with subject: ${emailSubject}`)

        const emailSent = await sendEmail({
          to: qrCode.customerEmail!,
          subject: emailSubject,
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
      triggerWindow: "2-25 minutes after QR creation"
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