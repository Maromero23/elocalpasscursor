import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Function to generate fresh HTML with current rebuy configuration based on original template structure
function generateRebuyHtmlWithConfig(config: any, replacements: any) {
  const isSpanish = false // For now, default to English (can be enhanced later)
  
  // Apply user's color configuration to the original rebuy template structure
  const baseStyles = `
    <style>
      body { font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; line-height: 1.6; color: ${config.emailMessageColor || '#333'}; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, ${config.emailHeaderColor || '#dc2626'} 0%, ${config.emailPrimaryColor || '#f97316'} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: ${config.emailBackgroundColor || '#f9f9f9'}; padding: 30px; border-radius: 0 0 10px 10px; }
      .urgency-section { background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid ${config.emailHeaderColor || '#dc2626'}; text-align: center; }
      .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .cta-button { display: inline-block; background: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; padding: 20px 40px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-size: ${config.emailCtaFontSize || '18'}px; font-weight: bold; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; }
      .footer { text-align: center; color: ${config.emailFooterColor || '#666'}; margin-top: 30px; font-size: ${config.emailFooterFontSize || '14'}px; font-family: ${config.emailFooterFontFamily || 'Arial, sans-serif'}; }
      .timer { font-size: 24px; font-weight: bold; color: ${config.emailHeaderColor || '#dc2626'}; }
      .header h1 { color: white; font-family: ${config.emailHeaderFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailHeaderFontSize || '24'}px; margin: 0; }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.emailSubject || 'Your ELocalPass Expires Soon!'}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ ${config.emailHeader || 'Don\'t Let Your Local Adventure End!'}</h1>
        </div>
        
        <div class="content">
          <p>Hello ${replacements.customerName}!</p>
          
          <div class="urgency-section">
            <h2>🚨 TIME RUNNING OUT!</h2>
            <div class="timer">${replacements.hoursLeft} hours left</div>
            <p>${config.urgencyMessage || 'Your ELocalPass expires soon. Don\'t lose your local discounts!'}</p>
          </div>
          
          <div class="details">
            <h3>📋 YOUR CURRENT PASS</h3>
            <ul>
              <li><strong>Code:</strong> ${replacements.qrCode}</li>
              <li><strong>Guests:</strong> ${replacements.guests} people</li>
              <li><strong>Duration:</strong> ${replacements.days} days</li>
              <li><strong>Time left:</strong> ${replacements.hoursLeft} hours</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 18px; margin-bottom: 20px;">
              ${config.emailMessage || 'Keep enjoying amazing local experiences!'}
            </p>
            
            <a href="${replacements.rebuyUrl}" class="cta-button">
              🎯 ${config.emailCta || 'GET ANOTHER PASS'}
            </a>
          </div>
          
          <div class="details">
            <h4>💡 Why renew?</h4>
            <ul>
              <li>✅ Keep saving at local restaurants</li>
              <li>✅ Access to exclusive discounts</li>
              <li>✅ Discover amazing new places</li>
              <li>✅ Authentic experiences like a local</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>${config.emailFooter || 'Thank you for choosing ELocalPass!'}</p>
            <p>Your local experience partner</p>
          </div>
        </div>
      </div>
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
                  try {
                    const savedRebuyConfig = JSON.parse(defaultRebuyTemplate.headerText)
                    console.log(`🎨 REBUY EMAIL: Regenerating HTML with saved color configuration`)
                    
                    // Regenerate HTML with current colors instead of using stored HTML
                    emailHtml = generateRebuyHtmlWithConfig(savedRebuyConfig, {
                      customerName: qrCode.customerName || 'Valued Customer',
                      qrCode: qrCode.code,
                      guests: qrCode.guests,
                      days: qrCode.days,
                      hoursLeft: hoursLeft,
                      customerPortalUrl: customerPortalUrl,
                      rebuyUrl: customerPortalUrl
                    })
                    
                    emailSubject = `🧪 TEST: ${savedRebuyConfig.emailSubject || defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'}`
                    
                  } catch (error) {
                    console.log(`⚠️ REBUY EMAIL: Could not parse saved config, using stored HTML`)
                    // Fallback to stored HTML if config parsing fails
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
              // Check if we have rebuy configuration to regenerate HTML with fresh colors
              if (emailTemplates.rebuyEmail.rebuyConfig) {
                console.log(`🎨 REBUY EMAIL: Regenerating custom template HTML with saved color configuration`)
                
                // Regenerate HTML with current colors from configuration
                emailHtml = generateRebuyHtmlWithConfig(emailTemplates.rebuyEmail.rebuyConfig, {
                  customerName: qrCode.customerName || 'Valued Customer',
                  qrCode: qrCode.code,
                  guests: qrCode.guests,
                  days: qrCode.days,
                  hoursLeft: hoursLeft,
                  customerPortalUrl: customerPortalUrl,
                  rebuyUrl: customerPortalUrl
                })
                
                emailSubject = `🧪 TEST: ${emailTemplates.rebuyEmail.rebuyConfig.emailSubject || 'Your ELocalPass - Get another one!'}`
                
              } else {
                console.log(`📧 REBUY EMAIL: No rebuy config found, using stored custom HTML`)
                
                // Use stored custom template with placeholder replacement
                emailHtml = emailTemplates.rebuyEmail.customHTML
                  .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                  .replace(/\{qrCode\}/g, qrCode.code)
                  .replace(/\{guests\}/g, qrCode.guests.toString())
                  .replace(/\{days\}/g, qrCode.days.toString())
                  .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                  .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                  .replace(/\{rebuyUrl\}/g, customerPortalUrl)

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