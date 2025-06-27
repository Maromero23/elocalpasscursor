import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Function to generate fresh HTML with current rebuy configuration
function generateRebuyHtmlWithConfig(config: any, replacements: any) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.emailSubject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; background-color: ${config.emailBackgroundColor || '#f5f5f5'}; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${config.emailBackgroundColor || 'white'}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${config.emailHeaderColor || '#dc2626'}; padding: 24px; text-align: center; }
        .header h1 { color: ${config.emailHeaderColor === '#9AE6B4' ? '#2D3748' : 'white'}; font-family: ${config.emailHeaderFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailHeaderFontSize || '24'}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${config.emailMessageColor || '#374151'}; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailMessageFontSize || '16'}px; line-height: 1.5; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailCtaFontSize || '16'}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .footer-message { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
        .footer-message p { color: ${config.emailFooterColor || '#6b7280'}; font-family: ${config.emailFooterFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailFooterFontSize || '14'}px; margin: 0; }
        .discount-banner { background: linear-gradient(135deg, ${config.emailPrimaryColor || '#dc2626'}, ${config.emailSecondaryColor || '#ef4444'}); color: white; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px; }
        .highlight-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .details { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${config.logoUrl ? `<div style="margin-bottom: 16px;"><img src="${config.logoUrl}" alt="Logo" style="height: 40px; width: auto;"></div>` : ''}
            <h1>${config.emailHeader || 'Don\'t Miss Out!'}</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>Hello ${replacements.customerName},</p>
                <p style="margin-top: 16px;">${config.emailMessage || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <div class="highlight-box">
                <p style="color: #92400e; font-weight: 500; margin: 0;">${config.urgencyMessage ? config.urgencyMessage.replace('{hours_left}', replacements.hoursLeft) : '⏰ Your ELocalPass expires in ' + replacements.hoursLeft + ' hours - Don\'t miss out!'}</p>
            </div>
            
            <div class="details">
                <h3 style="color: #374151; font-weight: 600; margin: 0 0 12px 0;">Your Current ELocalPass Details:</h3>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Pass Code:</span>
                    <span style="color: #374151; font-weight: 600;">${replacements.qrCode}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Guests:</span>
                    <span style="color: #374151; font-weight: 600;">${replacements.guests} people</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Days:</span>
                    <span style="color: #374151; font-weight: 600;">${replacements.days} days</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Expires:</span>
                    <span style="color: #374151; font-weight: 600;">In ${replacements.hoursLeft} hours</span>
                </div>
            </div>
            
            ${config.enableDiscountCode ? `
            <div class="discount-banner">
                <h2 style="margin: 0 0 8px 0; font-size: 20px;">🎉 Special ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} OFF!</h2>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Get another ELocalPass now and save!</p>
            </div>
            ` : ''}
            
            <div class="cta-button">
                <a href="${replacements.rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <div class="footer-message">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
            </div>
        </div>
    </div>
</body>
</html>`

  return html
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