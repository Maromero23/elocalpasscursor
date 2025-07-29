import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'



// POST: Save/Update default rebuy template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rebuyConfig, action, templateName } = body

    if (action === 'saveTemplate') {
      console.log('🔧 REBUY TEMPLATE API: Saving named template to database')
      
      // Generate HTML from rebuy config
      const generateRebuyHtml = (config: any) => {
        return `<!DOCTYPE html>
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
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailCtaFontSize || '16'}px; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; }
        .countdown-container { text-align: center; margin: 20px 0; padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .countdown-text { font-size: 14px; color: #92400e; margin-bottom: 8px; }
        .countdown-timer { text-align: center; margin: 24px 0; }
        .special-offer { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .special-offer h2 { margin: 0 0 8px 0; font-size: 20px; }
        .special-offer p { margin: 0; font-size: 14px; opacity: 0.9; }
        .featured-partners { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .featured-partners h3 { color: #1f2937; margin-bottom: 16px; text-align: center; }
        .partners-grid { display: flex; justify-content: space-around; margin-bottom: 16px; }
        .partner-item { text-align: center; }
        .partner-placeholder { width: 60px; height: 60px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 24px; }
        .partner-name { font-size: 12px; color: #374151; font-weight: 500; }
        .partners-message { text-align: center; color: #6b7280; font-size: 14px; margin: 0; }
        .banner-images { text-align: center; margin: 20px 0; }
        .banner-image { max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${config.emailSubject}</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>Hello {customerName},</p>
                <br>
                <p>${config.emailMessageText || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <!-- Banner Images -->
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
            
            <!-- Enhanced Static Countdown Timer (if enabled) -->
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
            
            <!-- Current Pass Details -->
            <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">Your Current ELocalPass Details:</h3>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Pass Code:</strong> {qrCode}</p>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Expires:</strong> In {hoursLeft} hours</p>
            </div>
            
            <div class="special-offer">
                <h2>🎉 Special 50% OFF!</h2>
                <p>Get another ELocalPass now and save!</p>
            </div>
            
            <div class="cta-button">
                <a href="{rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <!-- Featured Partners (if enabled) -->
            ${config.enableFeaturedPartners ? `
            <div class="featured-partners">
                <h3>Featured Partners in Playa del Carmen</h3>
                <div class="partners-grid">
                    <div class="partner-item">
                        <div class="partner-placeholder">🍽️</div>
                        <div class="partner-name">Local Restaurant</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder">🏖️</div>
                        <div class="partner-name">Adventure Tours</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder">🛍️</div>
                        <div class="partner-name">Local Shops</div>
                    </div>
                </div>
                <p class="partners-message">${config.customAffiliateMessage || 'Don\'t forget these amazing discounts are waiting for you!'}</p>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
                <p style="margin-top: 8px; font-size: 12px;">
                    Need help? Visit your <a href="{customerPortalUrl}" style="color: #3b82f6;">customer portal</a> or contact support.
                </p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
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

      const customHTML = generateRebuyHtml(rebuyConfig)

      // Create named template
      const namedTemplate = await prisma.rebuyEmailTemplate.create({
        data: {
          name: templateName || `Rebuy Template - ${new Date().toLocaleDateString()}`,
          subject: rebuyConfig.emailSubject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
          customHTML: customHTML,
          headerText: JSON.stringify(rebuyConfig),
          isDefault: false
        }
      })

      console.log('✅ REBUY TEMPLATE API: Named template saved to database')
      console.log(`   Template ID: ${namedTemplate.id}`)
      console.log(`   Template Name: ${namedTemplate.name}`)
      console.log(`   HTML Length: ${customHTML.length} characters`)

      return NextResponse.json({
        success: true,
        message: 'Named rebuy template saved successfully',
        template: {
          id: namedTemplate.id,
          name: namedTemplate.name,
          subject: namedTemplate.subject,
          htmlLength: customHTML.length
        }
      })
    }

    if (action === 'saveAsDefault') {
      console.log('🔧 REBUY TEMPLATE API: Saving as default template to database')
      
      // Generate HTML from rebuy config
      const generateRebuyHtml = (config: any) => {
        return `<!DOCTYPE html>
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
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailCtaFontSize || '16'}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .footer-message { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
        .footer-message p { color: ${config.emailFooterColor || '#6b7280'}; font-family: ${config.emailFooterFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailFooterFontSize || '14'}px; margin: 0; }
        .countdown-timer { text-align: center; margin: 24px 0; }
        .special-offer { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .special-offer h2 { margin: 0 0 8px 0; font-size: 20px; }
        .special-offer p { margin: 0; font-size: 14px; opacity: 0.9; }
        .featured-partners { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .featured-partners h3 { color: #1f2937; margin-bottom: 16px; text-align: center; }
        .partners-grid { display: flex; justify-content: space-around; margin-bottom: 16px; }
        .partner-item { text-align: center; }
        .partner-placeholder { width: 60px; height: 60px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 24px; }
        .partner-name { font-size: 12px; color: #374151; font-weight: 500; }
        .partners-message { text-align: center; color: #6b7280; font-size: 14px; margin: 0; }
        .banner-images { text-align: center; margin: 20px 0; }
        .banner-image { max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${config.emailSubject}</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>Hello {customerName},</p>
                <br>
                <p>${config.emailMessageText || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <!-- Banner Images -->
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
            
            <!-- Enhanced Static Countdown Timer (if enabled) -->
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
            
            <!-- Current Pass Details -->
            <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #374151;">Your Current ELocalPass Details:</h3>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Pass Code:</strong> {qrCode}</p>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Expires:</strong> In {hoursLeft} hours</p>
            </div>
            
            <div class="special-offer">
                <h2>🎉 Special 50% OFF!</h2>
                <p>Get another ELocalPass now and save!</p>
            </div>
            
            <div class="cta-button">
                <a href="{rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <!-- Featured Partners (if enabled) -->
            ${config.enableFeaturedPartners ? `
            <div class="featured-partners">
                <h3>Featured Partners in Playa del Carmen</h3>
                <div class="partners-grid">
                    <div class="partner-item">
                        <div class="partner-placeholder">🍽️</div>
                        <div class="partner-name">Local Restaurant</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder">🏖️</div>
                        <div class="partner-name">Adventure Tours</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder">🛍️</div>
                        <div class="partner-name">Local Shops</div>
                    </div>
                </div>
                <p class="partners-message">${config.customAffiliateMessage || 'Don\'t forget these amazing discounts are waiting for you!'}</p>
            </div>
            ` : ''}
            
            <div class="footer-message">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
                <p style="margin-top: 8px; font-size: 12px;">
                    Need help? Visit your <a href="{customerPortalUrl}" style="color: #3b82f6;">customer portal</a> or contact support.
                </p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
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

      const customHTML = generateRebuyHtml(rebuyConfig)

      // Find existing default template BEFORE clearing defaults
      let defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
        where: { isDefault: true }
      })

      if (defaultTemplate) {
        // First, set all existing templates to not default
        await prisma.rebuyEmailTemplate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        })

        // Update existing default template
        defaultTemplate = await prisma.rebuyEmailTemplate.update({
          where: { id: defaultTemplate.id },
          data: {
            name: 'Default Rebuy Template',
            subject: rebuyConfig.emailSubject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
            customHTML: customHTML,
            // Store the complete rebuy configuration in headerText field (temporary solution)
            headerText: JSON.stringify(rebuyConfig),
            isDefault: true,
            updatedAt: new Date()
          }
        })
      } else {
        // Create new default template (first time)
        defaultTemplate = await prisma.rebuyEmailTemplate.create({
          data: {
            name: 'Default Rebuy Template',
            subject: rebuyConfig.emailSubject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
            customHTML: customHTML,
            // Store the complete rebuy configuration in headerText field (temporary solution)
            headerText: JSON.stringify(rebuyConfig),
            isDefault: true
          }
        })
      }

      console.log('✅ REBUY TEMPLATE API: Default template saved to database')
      console.log(`   Template ID: ${defaultTemplate.id}`)
      console.log(`   HTML Length: ${customHTML.length} characters`)

      return NextResponse.json({
        success: true,
        message: 'Default rebuy template saved successfully',
        template: {
          id: defaultTemplate.id,
          name: defaultTemplate.name,
          subject: defaultTemplate.subject,
          htmlLength: customHTML.length
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ REBUY TEMPLATE API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to save rebuy template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET: Load default rebuy template
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const loadAll = url.searchParams.get('all') === 'true'

    if (loadAll) {
      console.log('🔧 REBUY TEMPLATE API: Loading all templates from database')
      
      const templates = await prisma.rebuyEmailTemplate.findMany({
        orderBy: { createdAt: 'desc' }
      })

      console.log(`✅ REBUY TEMPLATE API: Found ${templates.length} templates`)

      return NextResponse.json({
        success: true,
        templates: templates.map(template => {
          let data = null
          try {
            data = template.headerText ? JSON.parse(template.headerText) : null
          } catch (error) {
            console.error(`❌ Error parsing headerText for template ${template.id}:`, error)
            data = null
          }
          
          return {
            id: template.id,
            name: template.name,
            subject: template.subject,
            isDefault: template.isDefault,
            createdAt: template.createdAt,
            data: data,
            htmlLength: template.customHTML?.length || 0
          }
        })
      })
    } else {
      // Default behavior - load only default template
      const defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
        where: { isDefault: true }
      })

      if (!defaultTemplate) {
        return NextResponse.json({ 
          error: 'No default rebuy template found' 
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        template: defaultTemplate
      })
    }

  } catch (error) {
    console.error('❌ REBUY TEMPLATE API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to load rebuy template(s)' 
    }, { status: 500 })
  }
}

// DELETE: Delete a rebuy template
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const templateId = url.searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    console.log('🗑️ REBUY TEMPLATE API: Deleting template:', templateId)

    // Check if template exists and is not default
    const template = await prisma.rebuyEmailTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default template' }, { status: 400 })
    }

    // Delete the template
    await prisma.rebuyEmailTemplate.delete({
      where: { id: templateId }
    })

    console.log('✅ REBUY TEMPLATE API: Template deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      deletedTemplate: {
        id: template.id,
        name: template.name
      }
    })

  } catch (error) {
    console.error('❌ Error deleting rebuy template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}