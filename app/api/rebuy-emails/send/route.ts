import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createRebuyEmailHtml } from '@/lib/email-service'
import { detectLanguage, t, type SupportedLanguage } from '@/lib/translations'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Function to apply fresh colors to existing HTML template
function generateRebuyHtmlWithConfig(config: any, replacements: any, existingHtml?: string, preserveTemplateColors = false) {
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
    
    // Skip color replacement if preserveTemplateColors is true
    if (preserveTemplateColors) {
      console.log('🎨 PRESERVING CUSTOM TEMPLATE COLORS - skipping color replacement')
      return updatedHtml
    }
    
    // Apply specific color updates with precise targeting
    if (config.emailHeaderColor) {
      // Update header background color specifically - improved regex to handle any CSS properties
      updatedHtml = updatedHtml.replace(/\.header\s*{([^}]*?)background-color:\s*[^;]*;([^}]*?)}/g, `.header {$1background-color: ${config.emailHeaderColor};$2}`)
      
      // Use configured header text color, or determine based on background as fallback
      const headerTextColor = config.emailHeaderTextColor || (config.emailHeaderColor === '#fcfcfc' || config.emailHeaderColor === '#ffffff' ? '#374151' : 'white')
      updatedHtml = updatedHtml.replace(/\.header\s+h1\s*{([^}]*?)color:\s*[^;]*;([^}]*?)}/g, `.header h1 {$1color: ${headerTextColor};$2}`)
    }
    
    if (config.emailCtaBackgroundColor) {
      // Update CTA button background color specifically - improved regex
      updatedHtml = updatedHtml.replace(/\.cta-button\s+a\s*{([^}]*?)background-color:\s*[^;]*;([^}]*?)}/g, `.cta-button a {$1background-color: ${config.emailCtaBackgroundColor};$2}`)
    }
    
    if (config.emailCtaColor) {
      // Update CTA button text color specifically - improved regex
      updatedHtml = updatedHtml.replace(/\.cta-button\s+a\s*{([^}]*?)color:\s*[^;]*;([^}]*?)}/g, `.cta-button a {$1color: ${config.emailCtaColor};$2}`)
    }
    
    if (config.emailMessageColor) {
      // Update message text colors specifically - improved regex
      updatedHtml = updatedHtml.replace(/\.message\s+p\s*{([^}]*?)color:\s*[^;]*;([^}]*?)}/g, `.message p {$1color: ${config.emailMessageColor};$2}`)
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
    // Optional security check for external cron services
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('🔒 REBUY EMAIL: Unauthorized cron request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('🔄 REBUY EMAIL SERVICE: Starting rebuy email check (PRODUCTION MODE - 6-12 hours before expiration)...')

    // PRODUCTION MODE: Get QR codes expiring in 6-12 hours that haven't received rebuy emails yet
    const now = new Date()
    const sixHoursFromNow = new Date(now.getTime() + (6 * 60 * 60 * 1000)) // 6 hours from now
    const twelveHoursFromNow = new Date(now.getTime() + (12 * 60 * 60 * 1000)) // 12 hours from now
    
    const expiringQRCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gte: sixHoursFromNow,   // Expires more than 6 hours from now
          lte: twelveHoursFromNow // But less than 12 hours from now
        },
        customerEmail: {
          not: null
        },
        // Only include QRs that haven't received rebuy emails yet
        analytics: {
          rebuyEmailScheduled: true, // Only if rebuy email is scheduled
          // We'll check rebuyEmailSent separately since it might not be in the schema yet
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

    console.log(`📧 REBUY EMAIL SERVICE: Found ${expiringQRCodes.length} QR codes expiring in 6-12 hours`)

    const results = []

    for (const qrCode of expiringQRCodes) {
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

        // Detect customer language (enhanced detection like welcome emails)
        let customerLanguage: SupportedLanguage = 'en'
        
        // Try to detect language from customer data or use browser detection
        try {
          // Check if we have stored language preference in analytics
          if (qrCode.analytics?.language) {
            customerLanguage = qrCode.analytics.language as SupportedLanguage
            console.log(`📧 REBUY EMAIL: Using stored customer language from analytics: ${customerLanguage}`)
          } else {
            // Fallback to English for server-side processing
            customerLanguage = 'en'
            console.log(`📧 REBUY EMAIL: No stored language found, defaulting to English`)
          }
        } catch (error) {
          console.log(`📧 REBUY EMAIL: Language detection failed, defaulting to English`)
          customerLanguage = 'en'
        }
        
        // Generate passes page URL for renewal with seller tracking
        let customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
        
        // Add seller tracking if enabled in rebuy configuration
        if (emailTemplates?.rebuyEmail?.rebuyConfig?.enableSellerTracking) {
          const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig
          const trackingMethod = rebuyConfig.trackingMethod || 'url_param'
          
          if (trackingMethod === 'url_param' || trackingMethod === 'both') {
            // Add seller_id parameter to track which seller the customer came from
            customerPortalUrl += `&seller_id=${qrCode.sellerId}`
            console.log(`🔗 REBUY EMAIL: Added seller tracking to URL: seller_id=${qrCode.sellerId}`)
          }
          
          if (trackingMethod === 'discount_code' || trackingMethod === 'both') {
            // Add discount code parameter if discount is enabled
            if (rebuyConfig.enableDiscountCode) {
              const discountCode = `${rebuyConfig.codePrefix || 'REBUY'}${rebuyConfig.discountValue || 15}`
              customerPortalUrl += `&discount=${discountCode}`
              console.log(`🎫 REBUY EMAIL: Added discount code to URL: discount=${discountCode}`)
            }
          }
        } else {
          // No rebuy config, check if seller has default discount
          if (qrCode.seller.defaultDiscountType && qrCode.seller.defaultDiscountValue > 0) {
            const discountCode = `SELLER${qrCode.seller.defaultDiscountValue}${qrCode.seller.defaultDiscountType === 'percentage' ? 'PCT' : 'USD'}`
            customerPortalUrl += `&seller_id=${qrCode.sellerId}&discount=${discountCode}`
            console.log(`🎫 REBUY EMAIL: Added seller default discount to URL: seller_id=${qrCode.sellerId}, discount=${discountCode}`)
          } else {
            // Just add seller tracking without discount
            customerPortalUrl += `&seller_id=${qrCode.sellerId}`
            console.log(`🔗 REBUY EMAIL: Added seller tracking to URL: seller_id=${qrCode.sellerId}`)
          }
        }

        // Calculate hours left until expiration for email content
        const hoursLeft = Math.ceil((qrCode.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

        let emailHtml: string
        let emailSubject: string

        // Professional Rebuy Email Translation System (same as welcome emails)
        const translateRebuyEmailHTML = async (htmlContent: string, targetLanguage: SupportedLanguage): Promise<string> => {
          if (targetLanguage === 'en') return htmlContent
          
          console.log(`🌍 REBUY EMAIL TRANSLATION: Translating rebuy email HTML to ${targetLanguage}`)
          
          // Extract text content from HTML while preserving structure
          let translatedHTML = htmlContent
          
          // Function to translate text using professional APIs
          const translateText = async (text: string): Promise<string> => {
            if (!text || text.trim().length === 0) return text
            
            console.log(`🔄 Rebuy Email Translation - Input: "${text.substring(0, 100)}..."`)
            
            let translatedText = text
            let translationSuccessful = false
            
            // Try LibreTranslate first
            try {
              const response = await fetch('https://libretranslate.com/translate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  q: text,
                  source: 'en',
                  target: 'es',
                  format: 'text'
                })
              })
              
              if (response.ok) {
                const result = await response.json()
                if (result.translatedText && result.translatedText.trim()) {
                  translatedText = result.translatedText
                  translationSuccessful = true
                  console.log(`✅ Rebuy Email LibreTranslate success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
                }
              }
            } catch (error) {
              console.warn('⚠️ Rebuy Email LibreTranslate failed, trying MyMemory API...')
            }
            
            // Try MyMemory API as fallback if LibreTranslate failed
            if (!translationSuccessful) {
              try {
                const encodedText = encodeURIComponent(text)
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|es`)
                
                if (response.ok) {
                  const result = await response.json()
                  if (result.responseData && result.responseData.translatedText) {
                    translatedText = result.responseData.translatedText
                    translationSuccessful = true
                    console.log(`✅ Rebuy Email MyMemory success: "${text.substring(0, 50)}..." → "${translatedText.substring(0, 50)}..."`)
                  }
                }
              } catch (error) {
                console.warn('⚠️ Rebuy Email MyMemory also failed, using original text')
              }
            }
            
            return translatedText
          }
          
          // Convert formal Spanish to informal (tú form)
          const makeInformalSpanish = (text: string): string => {
            return text
              .replace(/\busted\b/gi, 'tú')
              .replace(/\bUsted\b/g, 'Tú')
              .replace(/\bsu\b/g, 'tu')
              .replace(/\bSu\b/g, 'Tu')
              .replace(/\bsus\b/g, 'tus')
              .replace(/\bSus\b/g, 'Tus')
              .replace(/\btiene\b/g, 'tienes')
              .replace(/\bTiene\b/g, 'Tienes')
              .replace(/\bpuede\b/g, 'puedes')
              .replace(/\bPuede\b/g, 'Puedes')
          }
          
          // Extract and translate text content from HTML tags
          const textPattern = />([^<]+)</g
          let match
          
          while ((match = textPattern.exec(htmlContent)) !== null) {
            const originalText = match[1].trim()
            if (originalText && originalText.length > 0 && !/^[0-9\s\-\(\)\[\]{}@.,:;!?]+$/.test(originalText)) {
              const translatedText = await translateText(originalText)
              const informalText = makeInformalSpanish(translatedText)
              translatedHTML = translatedHTML.replace(`>${originalText}<`, `>${informalText}<`)
            }
          }
          
          // Also translate alt attributes and title attributes
          const altPattern = /alt="([^"]+)"/g
          let altMatch
          while ((altMatch = altPattern.exec(htmlContent)) !== null) {
            const originalAlt = altMatch[1]
            if (originalAlt && originalAlt.length > 0) {
              const translatedAlt = await translateText(originalAlt)
              const informalAlt = makeInformalSpanish(translatedAlt)
              translatedHTML = translatedHTML.replace(`alt="${originalAlt}"`, `alt="${informalAlt}"`)
            }
          }
          
          console.log(`✅ Rebuy Email HTML translation completed for ${targetLanguage}`)
          return translatedHTML
        }

        // Function to translate email subject
        const translateSubject = async (subject: string, targetLanguage: SupportedLanguage): Promise<string> => {
          if (targetLanguage === 'en' || !subject) return subject
          
          console.log(`🌍 REBUY EMAIL: Translating subject to ${targetLanguage}: "${subject}"`)
          
          try {
            // Try LibreTranslate first
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
              if (result.translatedText && result.translatedText.trim()) {
                const translatedSubject = result.translatedText
                  .replace(/\busted\b/gi, 'tú')
                  .replace(/\bUsted\b/g, 'Tú')
                  .replace(/\bsu\b/g, 'tu')
                  .replace(/\bSu\b/g, 'Tu')
                
                console.log(`✅ Rebuy Email subject translated: "${subject}" → "${translatedSubject}"`)
                return translatedSubject
              }
            }
          } catch (error) {
            // Try MyMemory API as fallback
            try {
              const encodedSubject = encodeURIComponent(subject)
              const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedSubject}&langpair=en|es`)
              
              if (response.ok) {
                const result = await response.json()
                if (result.responseData && result.responseData.translatedText) {
                  const translatedSubject = result.responseData.translatedText
                    .replace(/\busted\b/gi, 'tú')
                    .replace(/\bUsted\b/g, 'Tú')
                    .replace(/\bsu\b/g, 'tu')
                    .replace(/\bSu\b/g, 'Tu')
                  
                  console.log(`✅ Rebuy Email subject translated (MyMemory): "${subject}" → "${translatedSubject}"`)
                  return translatedSubject
                }
              }
            } catch {}
          }
          
          console.log(`⚠️ Rebuy Email subject translation failed, using original: "${subject}"`)
          return subject
        }

        // ENHANCED: Generate fresh HTML using rebuy configuration (matches preview)
        if (emailTemplates?.rebuyEmail?.rebuyConfig) {
          console.log(`📧 REBUY EMAIL: Generating fresh HTML with enhanced components for QR ${qrCode.code}`)
          
          const rebuyConfig = emailTemplates.rebuyEmail.rebuyConfig
          
          // Generate fresh HTML using the same function as the preview (same as send-single)
          const generateCustomRebuyEmailHtml = (config: any, sellerLocation: string = "Playa del Carmen") => {
            if (!config.enableRebuyEmail) {
              return null
            }
            
            // Use the same enhanced template as the single rebuy API
            return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${config.emailSubject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: \${config.emailMessageFontFamily || 'Arial, sans-serif'}; background-color: \${config.emailBackgroundColor || '#f5f5f5'}; }
        .container { max-width: 600px; margin: 0 auto; background-color: \${config.emailBackgroundColor || 'white'}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: \${config.emailHeaderColor || '#dc2626'}; padding: 24px; text-align: center; }
        .header h1 { color: \${config.emailHeaderTextColor || 'white'}; font-family: \${config.emailHeaderFontFamily || 'Arial, sans-serif'}; font-size: \${config.emailHeaderFontSize || '24'}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: \${config.emailMessageColor || '#374151'}; font-family: \${config.emailMessageFontFamily || 'Arial, sans-serif'}; font-size: \${config.emailMessageFontSize || '16'}px; line-height: 1.5; margin: 0; }
        .highlight-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .highlight-box p { color: #92400e; font-weight: 500; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: \${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: \${config.emailCtaColor || 'white'}; font-family: \${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: \${config.emailCtaFontSize || '16'}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .details { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .details h3 { color: #374151; font-weight: 600; margin: 0 0 12px 0; }
        .detail-item { display: flex; justify-content: space-between; margin: 8px 0; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #374151; font-weight: 600; }
        .discount-banner { background: linear-gradient(135deg, \${config.emailPrimaryColor || '#dc2626'}, \${config.emailSecondaryColor || '#ef4444'}); color: white; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px; }
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
        .footer-message p { color: \${config.emailFooterColor || '#6b7280'}; font-family: \${config.emailFooterFontFamily || 'Arial, sans-serif'}; font-size: \${config.emailFooterFontSize || '14'}px; margin: 0; }
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
        <div class="header">
            \${config.logoUrl ? \`<div style="margin-bottom: 16px;"><img src="\${config.logoUrl}" alt="Logo" style="height: 40px; width: auto;"></div>\` : ''}
            <h1>\${config.emailHeader || 'Don\\'t Miss Out!'}</h1>
        </div>
        <div class="content">
            <div class="message">
                <p>Hello {customerName},</p>
                <p style="margin-top: 16px;">\${config.emailMessage || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            \${config.bannerImages && config.bannerImages.length > 0 ? \`
            <div class="banner-images">
                \${config.bannerImages.map((imageUrl: string) => \`
                    <img src="\${imageUrl}" alt="Promotional Banner" class="banner-image" />
                \`).join('')}
            </div>
            \` : ''}
            \${config.videoUrl ? \`
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <div style="background-color: #e5e7eb; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <div style="color: #6b7280;">🎥 Promotional Video<br><span style="font-size: 12px;">Click to watch</span></div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Watch this special message about your renewal!</p>
                <a href="\${config.videoUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">▶ Watch Video</a>
            </div>
            \` : ''}
            \${config.showExpirationTimer !== false ? \`
            <div class="countdown-timer">
                <p>⏰ Time Remaining Until Expiration:</p>
                <div class="countdown-display">{hoursLeft}:00:00</div>
                <p class="countdown-label">hrs:min:sec (approximate)</p>
            </div>
            \` : ''}
            <div class="highlight-box">
                <p>⏰ Your ELocalPass expires in <span style="font-weight: bold; color: #dc2626;">{hoursLeft} hours</span> - Don't miss out on amazing local experiences!</p>
            </div>
            <div class="details">
                <h3>Your Current ELocalPass Details:</h3>
                <div class="detail-item"><span class="detail-label">Guests:</span><span class="detail-value">{guests} people</span></div>
                <div class="detail-item"><span class="detail-label">Duration:</span><span class="detail-value">{days} days</span></div>
                <div class="detail-item"><span class="detail-label">Expires:</span><span class="detail-value">In {hoursLeft} hours</span></div>
            </div>
            \${config.enableDiscountCode ? \`
            <div class="discount-banner">
                <h2>🎉 Special \${config.discountValue}\${config.discountType === 'percentage' ? '%' : '$'} OFF!</h2>
                <p>Get another ELocalPass now and save \${config.discountValue}\${config.discountType === 'percentage' ? '%' : '$'} on your next adventure</p>
            </div>
            \` : ''}
            <div class="cta-button">
                <a href="{rebuyUrl}">\${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            \${config.enableFeaturedPartners ? \`
            <div class="featured-partners">
                <h3>Featured Partners in \${sellerLocation}</h3>
                <div class="partners-grid">
                    <div class="partner-item"><div class="partner-placeholder"></div><div class="partner-name">Local Restaurant</div></div>
                    <div class="partner-item"><div class="partner-placeholder"></div><div class="partner-name">Adventure Tours</div></div>
                </div>
                <p class="partners-message">\${config.customAffiliateMessage || 'Don\\'t forget these amazing discounts are waiting for you:'}</p>
            </div>
            \` : ''}
            \${config.enableSellerTracking ? \`
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-weight: 500; margin: 0;">💼 Supporting Local Business: Your purchase helps support the local seller who provided your original pass.</p>
            </div>
            \` : ''}
            <div class="footer-message">
                <p>\${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
                <p style="margin-top: 8px; font-size: 12px;">Need help? Visit your <a href="{customerPortalUrl}" style="color: #3b82f6;">customer portal</a> or contact support.</p>
            </div>
        </div>
        <div class="email-footer">
            <p>© 2025 eLocalPass. All rights reserved.</p>
            <p style="margin-top: 4px;">You received this email because your ELocalPass is expiring soon. <a href="#" style="color: #3b82f6;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>\`
          }
          
          // Generate fresh HTML with current configuration
          const freshHtml = generateCustomRebuyEmailHtml(rebuyConfig, "Playa del Carmen")
          
          if (freshHtml) {
            console.log(\`✅ REBUY EMAIL: Generated fresh HTML with enhanced components\`)
            
            // Replace placeholders with actual data
            emailHtml = freshHtml
              .replace(/\\{customerName\\}/g, qrCode.customerName || 'Valued Customer')
              .replace(/\\{qrCode\\}/g, qrCode.code)
              .replace(/\\{guests\\}/g, qrCode.guests.toString())
              .replace(/\\{days\\}/g, qrCode.days.toString())
              .replace(/\\{hoursLeft\\}/g, hoursLeft.toString())
              .replace(/\\{qrExpirationTimestamp\\}/g, qrCode.expiresAt.toISOString())
              .replace(/\\{customerPortalUrl\\}/g, customerPortalUrl)
              .replace(/\\{rebuyUrl\\}/g, customerPortalUrl)
            
            console.log(\`📧 ENHANCED: Fresh HTML generated with all components (length: \${emailHtml.length})\`)
          }

          // Get subject from rebuy config
          if (rebuyConfig.emailSubject) {
            const originalSubject = rebuyConfig.emailSubject
            emailSubject = \`\${await translateSubject(originalSubject, customerLanguage)}\`
          } else {
            const originalSubject = \`Your ELocalPass - Get another one! (expires in \${hoursLeft} hours)\`
            emailSubject = \`\${await translateSubject(originalSubject, customerLanguage)}\`
          }
          
        } else if (emailTemplates?.rebuyEmail?.customHTML) {
          
          console.log(`🔍 DEBUG: CustomHTML value check for QR ${qrCode.code}`)
          console.log(`  - CustomHTML === 'USE_DEFAULT_TEMPLATE': ${emailTemplates.rebuyEmail.customHTML === 'USE_DEFAULT_TEMPLATE'}`)
          console.log(`  - CustomHTML length: ${emailTemplates.rebuyEmail.customHTML.length}`)
          console.log(`  - CustomHTML includes 'testing custom': ${emailTemplates.rebuyEmail.customHTML.includes('testing custom')}`)
          
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
                  
                  let processedTemplate = defaultRebuyTemplate.customHTML
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                  
                  // Apply universal rebuy email translation for Spanish customers
                  emailHtml = await translateRebuyEmailHTML(processedTemplate, customerLanguage)
                  
                  // Get subject from saved config if available
                  try {
                    const savedRebuyConfig = JSON.parse(defaultRebuyTemplate.headerText)
                    const originalSubject = savedRebuyConfig.emailSubject || defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                    emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
                  } catch (error) {
                    const originalSubject = defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                    emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
                  }
                } else {
                  // No saved config, use stored HTML
                  let processedTemplate = defaultRebuyTemplate.customHTML
                    .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                    .replace(/\{qrCode\}/g, qrCode.code)
                    .replace(/\{guests\}/g, qrCode.guests.toString())
                    .replace(/\{days\}/g, qrCode.days.toString())
                    .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                    .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                    .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                    .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                  
                  // Apply universal rebuy email translation for Spanish customers
                  emailHtml = await translateRebuyEmailHTML(processedTemplate, customerLanguage)
                  
                  const originalSubject = defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                  emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
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
                emailSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
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
              emailSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
            }
            
          } else {
            console.log(`📧 REBUY EMAIL: Using custom template for QR ${qrCode.code}`)
            console.log(`📧 REBUY EMAIL: Custom template length: ${emailTemplates.rebuyEmail.customHTML?.length || 0} characters`)
            console.log(`📧 REBUY EMAIL: Custom template preview: ${(emailTemplates.rebuyEmail.customHTML || '').substring(0, 100)}...`)
            
            try {
              // Use custom template HTML directly - PRESERVE embedded colors
              console.log(`✅ REBUY EMAIL: Using custom template HTML with PRESERVED embedded colors`)
              
              let processedTemplate = emailTemplates.rebuyEmail.customHTML
                .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                .replace(/\{qrCode\}/g, qrCode.code)
                .replace(/\{guests\}/g, qrCode.guests.toString())
                .replace(/\{days\}/g, qrCode.days.toString())
                .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                .replace(/\{rebuyUrl\}/g, customerPortalUrl)
              
              // Apply universal rebuy email translation for Spanish customers
              emailHtml = await translateRebuyEmailHTML(processedTemplate, customerLanguage)

              // Get subject from rebuy config if available
              if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
                const originalSubject = emailTemplates.rebuyEmail.rebuyConfig.emailSubject
                emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
              } else {
                const originalSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
                emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
              }

              console.log(`✅ REBUY EMAIL: Custom template processed successfully. Final length: ${emailHtml.length} characters`)
              console.log(`🎨 REBUY EMAIL: Custom template colors preserved - no config color overrides applied`)
              
            } catch (templateError) {
              console.error(`❌ REBUY EMAIL: Error processing custom template for QR ${qrCode.code}:`, templateError)
              console.log(`📧 REBUY EMAIL: Falling back to default template due to custom template error`)
              
              // Fallback to default template on error
              const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
                where: { isDefault: true }
              })
              
              if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
                let processedTemplate = defaultRebuyTemplate.customHTML
                  .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
                  .replace(/\{qrCode\}/g, qrCode.code)
                  .replace(/\{guests\}/g, qrCode.guests.toString())
                  .replace(/\{days\}/g, qrCode.days.toString())
                  .replace(/\{hoursLeft\}/g, hoursLeft.toString())
                  .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
                  .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
                  .replace(/\{rebuyUrl\}/g, customerPortalUrl)
                
                // Apply universal rebuy email translation for Spanish customers
                emailHtml = await translateRebuyEmailHTML(processedTemplate, customerLanguage)
                
                const originalSubject = defaultRebuyTemplate.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!'
                emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
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
                emailSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
              }
            }
          }
          
        } else if (emailTemplates?.rebuyEmail?.htmlContent) {
          console.log(`📧 REBUY EMAIL: Using legacy htmlContent template for QR ${qrCode.code}`)
          
          // Legacy support for htmlContent field
          let processedTemplate = emailTemplates.rebuyEmail.htmlContent
            .replace(/\{customerName\}/g, qrCode.customerName || 'Valued Customer')
            .replace(/\{qrCode\}/g, qrCode.code)
            .replace(/\{guests\}/g, qrCode.guests.toString())
            .replace(/\{days\}/g, qrCode.days.toString())
            .replace(/\{hoursLeft\}/g, hoursLeft.toString())
            .replace(/\{qrExpirationTimestamp\}/g, qrCode.expiresAt.toISOString())
            .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
            .replace(/\{rebuyUrl\}/g, customerPortalUrl)
          
          // Apply universal rebuy email translation for Spanish customers
          emailHtml = await translateRebuyEmailHTML(processedTemplate, customerLanguage)

          if (emailTemplates.rebuyEmail.rebuyConfig?.emailSubject) {
            const originalSubject = emailTemplates.rebuyEmail.rebuyConfig.emailSubject
            emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
          } else {
            const originalSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
            emailSubject = `${await translateSubject(originalSubject, customerLanguage)}`
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
          
          emailSubject = `Your ELocalPass - Get another one! (expires in ${hoursLeft} hours)`
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
      message: `Rebuy email service completed (PRODUCTION MODE). Processed ${results.length} emails.`,
      results: results,
      totalFound: expiringQRCodes.length,
      productionMode: true,
      triggerWindow: "6-12 hours before expiration"
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