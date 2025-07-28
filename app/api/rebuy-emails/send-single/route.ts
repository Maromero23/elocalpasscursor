import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Security check for external cron services
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('🔒 SINGLE REBUY EMAIL: Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { qrCodeId } = await request.json()
    
    if (!qrCodeId) {
      return NextResponse.json({ error: 'Missing qrCodeId' }, { status: 400 })
    }

    console.log(`🎯 SINGLE REBUY EMAIL: Processing rebuy email for QR: ${qrCodeId}`)
    
    // Get the specific QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        seller: {
          include: {
            savedConfig: true
          }
        },
        analytics: true
      }
    })

    if (!qrCode) {
      console.log(`❌ QR Code not found: ${qrCodeId}`)
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    if (!qrCode.isActive) {
      console.log(`❌ QR Code not active: ${qrCodeId}`)
      return NextResponse.json({ error: 'QR Code not active' }, { status: 400 })
    }

    // Check if rebuy email already sent (using rebuyEmailScheduled field for tracking)
    if (qrCode.analytics && !qrCode.analytics.rebuyEmailScheduled) {
      console.log(`✅ Rebuy email already processed for QR: ${qrCodeId}`)
      return NextResponse.json({
        success: true,
        message: 'Rebuy email already processed',
        alreadySent: true
      })
    }

    // Get seller's configuration to check if rebuy emails are enabled
    const sellerConfig = qrCode.seller.savedConfig
    if (!sellerConfig) {
      console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - seller has no saved configuration`)
      return NextResponse.json({ error: 'No configuration found' }, { status: 400 })
    }

    const configData = JSON.parse(sellerConfig.config)
    if (!configData.button5SendRebuyEmail) {
      console.log(`❌ REBUY EMAIL: QR ${qrCode.code} - rebuy emails disabled for this configuration`)
      return NextResponse.json({ error: 'Rebuy emails disabled' }, { status: 400 })
    }

    // Import necessary modules
    const { sendEmail } = await import('@/lib/email-service')
    
    type SupportedLanguage = 'en' | 'es'

    // Detect customer language
    let customerLanguage: SupportedLanguage = 'en'
    
    try {
      if (qrCode.analytics?.language) {
        customerLanguage = qrCode.analytics.language as SupportedLanguage
        console.log(`📧 REBUY EMAIL: Using stored customer language: ${customerLanguage}`)
      } else {
        customerLanguage = 'en'
        console.log(`📧 REBUY EMAIL: No stored language found, defaulting to English`)
      }
    } catch (error) {
      console.log(`📧 REBUY EMAIL: Language detection failed, defaulting to English`)
      customerLanguage = 'en'
    }
    
    // Generate passes page URL for renewal (not customer portal)
    let rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
    
    // Generate customer portal URL for customer support
    let customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCode.customerEmail}`

    // Calculate hours left until expiration
    const now = new Date()
    const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

    let emailHtml: string = ''
    let emailSubject: string

    // Get email templates from configuration
    const emailTemplates = sellerConfig.emailTemplates ? JSON.parse(sellerConfig.emailTemplates) : null
    
    console.log(`📧 REBUY EMAIL: Checking email templates for QR ${qrCode.code}`)
    console.log(`  - Has emailTemplates: ${!!emailTemplates}`)
    console.log(`  - Has rebuyEmail: ${!!emailTemplates?.rebuyEmail}`)
    
    // Add seller tracking to rebuy URL if enabled
    if (emailTemplates?.rebuyEmail?.rebuyConfig?.enableSellerTracking) {
      const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig
      const trackingMethod = rebuyConfig.trackingMethod || 'url_param'
      
      if (trackingMethod === 'url_param' || trackingMethod === 'both') {
        // Add seller_id parameter to track which seller the customer came from
        rebuyUrl += `?seller_id=${qrCode.sellerId}`
        console.log(`🔗 SINGLE REBUY EMAIL: Added seller tracking to rebuy URL: seller_id=${qrCode.sellerId}`)
      }
      
      if (trackingMethod === 'discount_code' || trackingMethod === 'both') {
        // Add discount code parameter if discount is enabled
        if (rebuyConfig.enableDiscountCode) {
          const discountCode = `${rebuyConfig.codePrefix || 'REBUY'}${rebuyConfig.discountValue || 15}`
          const separator = rebuyUrl.includes('?') ? '&' : '?'
          rebuyUrl += `${separator}discount=${discountCode}`
          console.log(`🎫 SINGLE REBUY EMAIL: Added discount code to rebuy URL: discount=${discountCode}`)
        }
      }
    }

    // Professional Rebuy Email Translation System
    const translateSubject = async (subject: string, targetLanguage: SupportedLanguage): Promise<string> => {
      if (targetLanguage === 'en') return subject
      
      try {
        const response = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: subject,
            source: 'en',
            target: 'es',
            format: 'text'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          return result.translatedText || subject
        }
      } catch (error) {
        console.warn('Translation failed, using original subject')
      }
      
      return subject
    }

    // ENHANCED: Generate fresh HTML using rebuy configuration (matches preview)
    if (emailTemplates?.rebuyEmail?.rebuyConfig) {
      console.log(`📧 REBUY EMAIL: Generating fresh HTML with enhanced components for QR ${qrCode.code}`)
      
      const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig
      
      // Generate fresh HTML using the same function as the preview
      const generateCustomRebuyEmailHtml = (config: any, sellerLocation: string = "Playa del Carmen") => {
        if (!config.enableRebuyEmail) {
          return null
        }
        
        // Generate advanced custom rebuy HTML template with countdown timer and featured partners
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.emailSubject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; background-color: ${config.emailBackgroundColor || '#f5f5f5'}; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${config.emailBackgroundColor || 'white'}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${config.emailHeaderColor || '#dc2626'}; padding: 24px; text-align: center; }
        .header h1 { color: ${config.emailHeaderTextColor || 'white'}; font-family: ${config.emailHeaderFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailHeaderFontSize || '24'}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${config.emailMessageColor || '#374151'}; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailMessageFontSize || '16'}px; line-height: 1.5; margin: 0; }
        .highlight-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .highlight-box p { color: #92400e; font-weight: 500; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailCtaFontSize || '16'}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .details { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .details h3 { color: #374151; font-weight: 600; margin: 0 0 12px 0; }
        .detail-item { display: flex; justify-content: space-between; margin: 8px 0; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #374151; font-weight: 600; }
        .discount-banner { background: linear-gradient(135deg, ${config.emailPrimaryColor || '#dc2626'}, ${config.emailSecondaryColor || '#ef4444'}); color: white; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px; }
        .discount-banner h2 { margin: 0 0 8px 0; font-size: 20px; }
        .discount-banner p { margin: 0; font-size: 14px; opacity: 0.9; }
        .countdown-timer { background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 16px; margin: 24px 0; border-radius: 8px; text-align: center; }
        .countdown-timer p { color: #4a5568; font-weight: 500; margin: 0 0 8px 0; font-size: 14px; }
        .countdown-display { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2d3748; margin: 8px 0; }
        .countdown-label { font-size: 12px; color: #718096; margin: 0; }
        .banner-images { margin: 20px 0; }
        .banner-image { width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; }
        .featured-partners { background-color: #fff7ed; padding: 16px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #f97316; }
        .featured-partners h3 { color: #c2410c; font-weight: 600; margin: 0 0 12px 0; }
        .partners-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .partner-item { background-color: white; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #fed7aa; }
        .partner-placeholder { width: 100%; height: 32px; background-color: #f3f4f6; border-radius: 4px; margin-bottom: 4px; }
        .partner-name { font-size: 11px; color: #9a3412; font-weight: 500; }
        .partners-message { color: #c2410c; font-size: 14px; margin: 12px 0 0 0; }
        .footer-message { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
        .footer-message p { color: ${config.emailFooterColor || '#6b7280'}; font-family: ${config.emailFooterFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailFooterFontSize || '14'}px; margin: 0; }
        .email-footer { background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
        @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content { padding: 16px; }
            .partners-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            ${config.logoUrl ? `<div style="margin-bottom: 16px;"><img src="${config.logoUrl}" alt="Logo" style="height: 40px; width: auto;"></div>` : ''}
            <h1>${config.emailHeader || 'Don\'t Miss Out!'}</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Main Message -->
            <div class="message">
                <p>Hello {customerName},</p>
                <p style="margin-top: 16px;">${config.emailMessage || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <!-- Banner Images Section -->
            ${config.bannerImages && config.bannerImages.length > 0 ? `
            <div class="banner-images">
                ${config.bannerImages.map((imageUrl: string) => `
                    <img src="${imageUrl}" alt="Promotional Banner" class="banner-image" />
                `).join('')}
            </div>
            ` : ''}
            
            <!-- Video Section -->
            ${config.videoUrl ? `
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <div style="background-color: #e5e7eb; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <div style="color: #6b7280;">
                        🎥 Promotional Video<br>
                        <span style="font-size: 12px;">Click to watch</span>
                    </div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Watch this special message about your renewal!</p>
                <a href="${config.videoUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">▶ Watch Video</a>
            </div>
            ` : ''}
            
            <!-- Enhanced Static Countdown Timer (if enabled) - EMAIL CLIENT COMPATIBLE -->
            ${config.showExpirationTimer !== false ? `
            <div class="countdown-timer">
                <p style="text-align: center; color: #dc2626; font-weight: 600; margin: 16px 0 8px 0;">⏰ Time Remaining Until Expiration:</p>
                <table style="margin: 0 auto; border-collapse: collapse;">
                    <tr>
                        <td style="
                            background: linear-gradient(135deg, #dc2626, #ef4444);
                            color: white;
                            padding: 12px 16px;
                            border-radius: 8px 0 0 8px;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                            font-size: 24px;
                            font-weight: bold;
                            min-width: 50px;
                            border: 2px solid #dc2626;
                        ">{hoursLeft}</td>
                        <td style="
                            background: #1f2937;
                            color: white;
                            padding: 12px 8px;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                            font-size: 24px;
                            font-weight: bold;
                            border-top: 2px solid #dc2626;
                            border-bottom: 2px solid #dc2626;
                        ">:</td>
                        <td style="
                            background: linear-gradient(135deg, #374151, #4b5563);
                            color: white;
                            padding: 12px 16px;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                            font-size: 24px;
                            font-weight: bold;
                            min-width: 50px;
                            border: 2px solid #dc2626;
                        ">00</td>
                        <td style="
                            background: #1f2937;
                            color: white;
                            padding: 12px 8px;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                            font-size: 24px;
                            font-weight: bold;
                            border-top: 2px solid #dc2626;
                            border-bottom: 2px solid #dc2626;
                        ">:</td>
                        <td style="
                            background: linear-gradient(135deg, #374151, #4b5563);
                            color: white;
                            padding: 12px 16px;
                            border-radius: 0 8px 8px 0;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                            font-size: 24px;
                            font-weight: bold;
                            min-width: 50px;
                            border: 2px solid #dc2626;
                        ">00</td>
                    </tr>
                    <tr>
                        <td style="text-align: center; font-size: 10px; color: #6b7280; padding-top: 4px; font-weight: 500;">HOURS</td>
                        <td></td>
                        <td style="text-align: center; font-size: 10px; color: #6b7280; padding-top: 4px; font-weight: 500;">MIN</td>
                        <td></td>
                        <td style="text-align: center; font-size: 10px; color: #6b7280; padding-top: 4px; font-weight: 500;">SEC</td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; color: #6b7280; margin: 8px 0; font-style: italic;">
                    🚨 Don't wait - your pass expires soon!
                </p>
            </div>
            ` : ''}
            
            <!-- Urgency Notice with Dynamic Countdown -->
            <div class="highlight-box">
                <p>⏰ Your ELocalPass expires in <span style="font-weight: bold; color: #dc2626;">{hoursLeft} hours</span> - Don't miss out on amazing local experiences!</p>
            </div>
            
            <!-- Current Pass Details -->
            <div class="details">
                <h3>Your Current ELocalPass Details:</h3>
                <div class="detail-item">
                    <span class="detail-label">Guests:</span>
                    <span class="detail-value">{guests} people</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">{days} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Expires:</span>
                    <span class="detail-value">In {hoursLeft} hours</span>
                </div>
            </div>
            
            ${config.enableDiscountCode ? `
            <!-- Discount Offer -->
            <div class="discount-banner">
                <h2>🎉 Special ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} OFF!</h2>
                <p>Get another ELocalPass now and save ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} on your next adventure</p>
            </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div class="cta-button">
                <a href="{rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <!-- Featured Partners (if enabled) -->
            ${config.enableFeaturedPartners ? `
            <div class="featured-partners">
                <h3>Featured Partners in ${sellerLocation}</h3>
                <div class="partners-grid">
                    <div class="partner-item">
                        <div class="partner-placeholder"></div>
                        <div class="partner-name">Local Restaurant</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder"></div>
                        <div class="partner-name">Adventure Tours</div>
                    </div>
                </div>
                <p class="partners-message">${config.customAffiliateMessage || 'Don\'t forget these amazing discounts are waiting for you:'}</p>
            </div>
            ` : ''}
            
            <!-- Seller Tracking Message -->
            ${config.enableSellerTracking ? `
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-weight: 500; margin: 0;">
                    💼 Supporting Local Business: Your purchase helps support the local seller who provided your original pass.
                </p>
            </div>
            ` : ''}
            
            <!-- Footer Message -->
            <div class="footer-message">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
                <p style="margin-top: 8px; font-size: 12px;">
                    Need help? Visit your <a href="{customerPortalUrl}" style="color: #3b82f6;">customer portal</a> or contact support.
                </p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div class="email-footer">
            <p>© 2025 eLocalPass. All rights reserved.</p>
            <p style="margin-top: 4px;">
                You received this email because your ELocalPass is expiring soon.
                <a href="#" style="color: #3b82f6;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`
      }
      
      // Generate fresh HTML with current configuration
      const freshHtml = generateCustomRebuyEmailHtml(rebuyConfig, "Playa del Carmen")
      
      if (freshHtml) {
        console.log(`✅ REBUY EMAIL: Generated fresh HTML with enhanced components`)
        
        // Format expiration date for display
        const expirationDate = qrCode.expiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })

        // Replace placeholders with actual data
        emailHtml = freshHtml
          .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
          .replace(/\{qrCode\}/g, qrCode.code)
          .replace(/\{guests\}/g, qrCode.guests.toString())
          .replace(/\{days\}/g, qrCode.days.toString())
          .replace(/\{hoursLeft\}/g, hoursLeft.toString())
          .replace(/\{expirationDate\}/g, expirationDate)
          .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
          .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
          .replace(/\{rebuyUrl\}/g, rebuyUrl)
        
        console.log(`📧 ENHANCED: Fresh HTML generated with all components (length: ${emailHtml.length})`)
        console.log(`📧 ENHANCED: Contains banner images: ${emailHtml.includes('banner-images')}`)
        console.log(`📧 ENHANCED: Contains video section: ${emailHtml.includes('Promotional Video')}`)
        console.log(`📧 ENHANCED: Contains current pass details: ${emailHtml.includes('Your Current ELocalPass Details')}`)
        console.log(`📧 ENHANCED: Static countdown timer: ${emailHtml.includes('hrs:min:sec (approximate)')}`)
      } else {
        console.log(`❌ REBUY EMAIL: Fresh HTML generation failed, falling back to stored template`)
        
        // Fallback to stored template if fresh HTML generation failed
        if (emailTemplates?.rebuyEmail?.customHTML && emailTemplates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE') {
          console.log(`📧 REBUY EMAIL: Using stored custom template as fallback`)
          
          let processedTemplate = emailTemplates.rebuyEmail.customHTML
            .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
            .replace(/\{qrCode\}/g, qrCode.code)
            .replace(/\{guests\}/g, qrCode.guests.toString())
            .replace(/\{days\}/g, qrCode.days.toString())
            .replace(/\{hoursLeft\}/g, hoursLeft.toString())
            .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
            .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
            .replace(/\{rebuyUrl\}/g, rebuyUrl)
          
          emailHtml = processedTemplate
        } else if (emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE') {
          console.log(`📧 REBUY EMAIL: Loading default template from RebuyEmailTemplate database`)
          
          try {
            // Load default rebuy template from database
            const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
              where: { isDefault: true }
            })
            
            if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
              console.log(`✅ REBUY EMAIL: Found default rebuy template in database`)
              
              // Parse the default template's configuration
              let defaultConfig: any = {}
              if (defaultRebuyTemplate.headerText) {
                try {
                  defaultConfig = JSON.parse(defaultRebuyTemplate.headerText)
                  console.log(`✅ REBUY EMAIL: Loaded default template configuration`)
                } catch (error) {
                  console.log(`⚠️ REBUY EMAIL: Could not parse default template config, using stored HTML`)
                }
              }
              
              // Try to generate fresh HTML using the default template's configuration
              if (defaultConfig.enableRebuyEmail) {
                console.log(`📧 REBUY EMAIL: Generating fresh HTML with default template configuration`)
                const freshHtml = generateCustomRebuyEmailHtml(defaultConfig, "Playa del Carmen")
                
                if (freshHtml) {
                  console.log(`✅ REBUY EMAIL: Generated fresh HTML with default template configuration`)
                  
                  // Replace placeholders with actual data
                  emailHtml = freshHtml
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, rebuyUrl)
                  
                  console.log(`📧 ENHANCED: Fresh HTML generated with default config (length: ${emailHtml.length})`)
                  console.log(`📧 ENHANCED: Contains banner images: ${emailHtml.includes('banner-images')}`)
                  console.log(`📧 ENHANCED: Contains video section: ${emailHtml.includes('Promotional Video')}`)
                  console.log(`📧 ENHANCED: Contains featured partners: ${emailHtml.includes('Featured Partners')}`)
                  console.log(`📧 ENHANCED: Contains countdown timer: ${emailHtml.includes('Time Remaining')}`)
                } else {
                  console.log(`❌ REBUY EMAIL: Fresh HTML generation failed with default config, using stored HTML`)
                  // Fallback to stored HTML
                  let processedTemplate = defaultRebuyTemplate.customHTML
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, rebuyUrl)
                  
                  emailHtml = processedTemplate
                }
              } else {
                console.log(`📧 REBUY EMAIL: Using stored HTML from default template`)
                // Use stored HTML
                let processedTemplate = defaultRebuyTemplate.customHTML
                  .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                  .replace(/\{qrCode\}/g, qrCode.code)
                  .replace(/\{guests\}/g, qrCode.guests.toString())
                  .replace(/\{days\}/g, qrCode.days.toString())
                  .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                  .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                  .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                  .replace(/\{rebuyUrl\}/g, rebuyUrl)
                
                emailHtml = processedTemplate
              }
              
              // Get subject from saved config if available
              try {
                const savedRebuyConfig = JSON.parse(defaultRebuyTemplate.headerText || '{}')
                const originalSubject = savedRebuyConfig.emailSubject || defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                emailSubject = await translateSubject(originalSubject, customerLanguage)
              } catch (error) {
                const originalSubject = defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                emailSubject = await translateSubject(originalSubject, customerLanguage)
              }
              
            } else {
              console.log(`⚠️ REBUY EMAIL: Default rebuy template in database is empty, using generic template`)
              throw new Error('Default template not found')
            }
            
          } catch (error) {
            console.error(`❌ REBUY EMAIL: Error loading default template from database:`, error)
            // Fallback to generic template on database error
            emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your ELocalPass is Expiring Soon!</h2>
                <p>Hello ${qrCode.customerName || 'Valued Customer'},</p>
                <p>Your ELocalPass (${qrCode.code}) expires in <strong>${hoursLeft} hours</strong>.</p>
                <p>Don't miss out! Renew your pass to continue enjoying the benefits.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${rebuyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Get Another ELocalPass
                  </a>
                </div>
                <p>Details:</p>
                <ul>
                  <li>Guests: ${qrCode.guests}</li>
                  <li>Days: ${qrCode.days}</li>
                  <li>Expires: ${qrCode.expiresAt.toLocaleString()}</li>
                </ul>
                <p>Thank you for choosing ELocalPass!</p>
              </div>
            `
            emailSubject = await translateSubject(`Your ELocalPass expires in ${hoursLeft} hours - Renew now!`, customerLanguage)
          }
        } else {
          console.log(`📧 REBUY EMAIL: Using default template as fallback`)
          
          // Use default rebuy template
          emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your ELocalPass is Expiring Soon!</h2>
              <p>Hello ${qrCode.customerName || 'Valued Customer'},</p>
              <p>Your ELocalPass (${qrCode.code}) expires in <strong>${hoursLeft} hours</strong>.</p>
              <p>Don't miss out! Renew your pass to continue enjoying the benefits.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${rebuyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Get Another ELocalPass
                </a>
              </div>
              <p>Details:</p>
              <ul>
                <li>Guests: ${qrCode.guests}</li>
                <li>Days: ${qrCode.days}</li>
                <li>Expires: ${qrCode.expiresAt.toLocaleString()}</li>
              </ul>
              <p>Thank you for choosing ELocalPass!</p>
            </div>
          `
        }
      }

      // Get subject from rebuy config
      if (rebuyConfig.emailSubject) {
        emailSubject = await translateSubject(rebuyConfig.emailSubject, customerLanguage)
      } else {
        const originalSubject = `Your ELocalPass expires in ${hoursLeft} hours - Renew now!`
        emailSubject = await translateSubject(originalSubject, customerLanguage)
      }
      
    } else if (emailTemplates?.rebuyEmail?.customHTML) {
      // FALLBACK: Use stored template if no rebuy config (for backwards compatibility)
      console.log(`📧 REBUY EMAIL: Fallback to stored template for QR ${qrCode.code}`)
      
      if (emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE') {
        console.log(`📧 REBUY EMAIL: Loading default template from RebuyEmailTemplate database`)
        
        try {
          // Load default rebuy template from database
          const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
            where: { isDefault: true }
          })
          
          if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
            console.log(`✅ REBUY EMAIL: Found default rebuy template in database`)
            
            let processedTemplate = defaultRebuyTemplate.customHTML
              .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
              .replace(/\{qrCode\}/g, qrCode.code)
              .replace(/\{guests\}/g, qrCode.guests.toString())
              .replace(/\{days\}/g, qrCode.days.toString())
              .replace(/\{hoursLeft\}/g, hoursLeft.toString())
              .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
              .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
              .replace(/\{rebuyUrl\}/g, rebuyUrl)
            
            emailHtml = processedTemplate
            
            // Get subject from saved config if available
            try {
              const savedRebuyConfig = JSON.parse(defaultRebuyTemplate.headerText || '{}')
              const originalSubject = savedRebuyConfig.emailSubject || defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
              emailSubject = await translateSubject(originalSubject, customerLanguage)
            } catch (error) {
              const originalSubject = defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
              emailSubject = await translateSubject(originalSubject, customerLanguage)
            }
            
          } else {
            console.log(`⚠️ REBUY EMAIL: Default rebuy template in database is empty, using generic template`)
            throw new Error('Default template not found')
          }
          
        } catch (error) {
          console.error(`❌ REBUY EMAIL: Error loading default template from database:`, error)
          // Fallback to generic template on database error
          emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your ELocalPass is Expiring Soon!</h2>
              <p>Hello ${qrCode.customerName || 'Valued Customer'},</p>
              <p>Your ELocalPass (${qrCode.code}) expires in <strong>${hoursLeft} hours</strong>.</p>
              <p>Don't miss out! Renew your pass to continue enjoying the benefits.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${rebuyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Get Another ELocalPass
                </a>
              </div>
              <p>Details:</p>
              <ul>
                <li>Guests: ${qrCode.guests}</li>
                <li>Days: ${qrCode.days}</li>
                <li>Expires: ${qrCode.expiresAt.toLocaleString()}</li>
              </ul>
              <p>Thank you for choosing ELocalPass!</p>
            </div>
          `
          emailSubject = await translateSubject(`Your ELocalPass expires in ${hoursLeft} hours - Renew now!`, customerLanguage)
        }
      } else {
        // Use custom template
        let processedTemplate = emailTemplates.rebuyEmail.customHTML
          .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
          .replace(/\{qrCode\}/g, qrCode.code)
          .replace(/\{guests\}/g, qrCode.guests.toString())
          .replace(/\{days\}/g, qrCode.days.toString())
          .replace(/\{hoursLeft\}/g, hoursLeft.toString())
          .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
          .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
          .replace(/\{rebuyUrl\}/g, rebuyUrl)
        
        emailHtml = processedTemplate

        // Get subject from rebuy config if available
        if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
          const originalSubject = emailTemplates.rebuyEmail.rebuyConfig.emailSubject
          emailSubject = await translateSubject(originalSubject, customerLanguage)
        } else {
          const originalSubject = `Your ELocalPass expires in ${hoursLeft} hours - Renew now!`
          emailSubject = await translateSubject(originalSubject, customerLanguage)
        }
      }
      
    } else {
      // Use default rebuy template
      console.log(`📧 REBUY EMAIL: Using default template for QR ${qrCode.code}`)
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your ELocalPass is Expiring Soon!</h2>
          <p>Hello ${qrCode.customerName || 'Valued Customer'},</p>
          <p>Your ELocalPass (${qrCode.code}) expires in <strong>${hoursLeft} hours</strong>.</p>
          <p>Don't miss out! Renew your pass to continue enjoying the benefits.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${rebuyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Another ELocalPass
            </a>
          </div>
          <p>Details:</p>
          <ul>
            <li>Guests: ${qrCode.guests}</li>
            <li>Days: ${qrCode.days}</li>
            <li>Expires: ${qrCode.expiresAt.toLocaleString()}</li>
          </ul>
          <p>Thank you for choosing ELocalPass!</p>
        </div>
      `
      
      emailSubject = await translateSubject(`Your ELocalPass expires in ${hoursLeft} hours - Renew now!`, customerLanguage)
    }

    console.log(`📧 REBUY EMAIL: Sending email to ${qrCode.customerEmail} with subject: ${emailSubject}`)

    const emailSent = await sendEmail({
      to: qrCode.customerEmail!,
      subject: emailSubject,
      html: emailHtml
    })

    if (emailSent) {
      console.log(`✅ REBUY EMAIL: Successfully sent to ${qrCode.customerEmail} for QR ${qrCode.code}`)
      
      // Mark as sent in analytics (set rebuyEmailScheduled to false to indicate it's been sent)
      if (qrCode.analytics) {
        await prisma.qRCodeAnalytics.update({
          where: { id: qrCode.analytics.id },
          data: { rebuyEmailScheduled: false }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: `Rebuy email sent successfully`,
        qrCode: qrCode.code,
        email: qrCode.customerEmail,
        hoursLeft: hoursLeft
      })
    } else {
      console.log(`❌ REBUY EMAIL: Failed to send to ${qrCode.customerEmail} for QR ${qrCode.code}`)
      return NextResponse.json({
        success: false,
        message: 'Failed to send rebuy email',
        qrCode: qrCode.code,
        email: qrCode.customerEmail
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ SINGLE REBUY EMAIL: Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Single rebuy email processor - use POST with qrCodeId' 
  })
} 