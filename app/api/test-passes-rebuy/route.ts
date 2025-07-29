import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

// Generate enhanced rebuy email HTML (same as seller rebuy emails)
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
        .cta-button a { background-color: ${config.emailCtaColor || '#dc2626'}; color: ${config.emailCtaTextColor || 'white'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
        .footer-message { text-align: center; color: #6b7280; font-size: 14px; margin-top: 32px; }
        .email-footer { background-color: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
        .countdown-timer { text-align: center; margin: 24px 0; }
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
        <!-- Header -->
        <div class="header">
            <h1>${config.emailSubject}</h1>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <!-- Main Message -->
            <div class="message">
                <p>Hi {customerName},</p>
                <p style="margin-top: 16px;">${config.emailMessage}</p>
            </div>
            
            <!-- Current Pass Details -->
            <div class="highlight-box">
                <p><strong>Your Current ELocalPass Details:</strong></p>
                <p>Pass Code: {qrCode} | Guests: {guests} | Days: {days}</p>
                <p>Expires: {expirationDate}</p>
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
</html>
`
}

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json()
    
    if (!qrCode) {
      return NextResponse.json({ error: 'Missing qrCode parameter' }, { status: 400 })
    }

    console.log(`🧪 TEST PASSES REBUY EMAIL: Processing ${qrCode}`)
    
    // Get the QR code details
    const qrCodeData = await prisma.qRCode.findFirst({
      where: { code: qrCode },
      include: { analytics: true }
    })

    if (!qrCodeData) {
      return NextResponse.json({ error: 'QR Code not found' }, { status: 404 })
    }

    const now = new Date()
    const hoursLeft = Math.ceil((qrCodeData.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    console.log(`📧 Sending rebuy email for passes/PayPal QR code: ${qrCode}`)
    console.log(`- Customer: ${qrCodeData.customerName || 'Unknown'} (${qrCodeData.customerEmail})`)
    console.log(`- Hours left: ${hoursLeft}`)

    const customerName = qrCodeData.customerName || 'Valued Customer'
    
    // Get the SPECIFIC PayPal rebuy email template from database
    console.log('📧 Loading SPECIFIC PayPal rebuy email template from database...')
    const paypalRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { 
        OR: [
          { name: { contains: "Paypal Rebuy Email 2", mode: 'insensitive' } },
          { name: { contains: "Paypal Rebuy Email", mode: 'insensitive' } },
          { name: { contains: "Paypal Rebuy", mode: 'insensitive' } },
          { name: { contains: "PayPal", mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`🔍 PayPal template search result: ${paypalRebuyTemplate ? `Found "${paypalRebuyTemplate.name}"` : 'Not found'}`)

    // Fallback to default if PayPal template not found
    const rebuyTemplate = paypalRebuyTemplate || await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })

    let emailHtml: string
    let emailSubject: string

    if (rebuyTemplate && rebuyTemplate.customHTML) {
      console.log(`📧 REBUY EMAIL: Found PayPal template: ${rebuyTemplate.name}`)
      
      if (paypalRebuyTemplate) {
        console.log(`✅ Found SPECIFIC PayPal rebuy template: ${paypalRebuyTemplate.name}`)
        console.log(`📧 PayPal template created: ${paypalRebuyTemplate.createdAt}`)
      } else {
        console.log(`⚠️ PayPal rebuy template not found, using default: ${rebuyTemplate.name}`)
      }

      // Parse the template's rebuy configuration to generate fresh HTML with all components
      let rebuyConfig = null
      try {
        // Try to parse rebuyConfig from customHTML if it contains configuration data
        if (rebuyTemplate.customHTML.includes('"enableRebuyEmail"') || rebuyTemplate.customHTML.includes('"emailSubject"')) {
          // This template contains configuration data, extract it
          const configMatch = rebuyTemplate.customHTML.match(/\{.*\}/)
          if (configMatch) {
            rebuyConfig = JSON.parse(configMatch[0])
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not parse rebuy config from template, using default settings`)
      }

      // If no config found in template, create a default enhanced config
      if (!rebuyConfig) {
        rebuyConfig = {
          enableRebuyEmail: true,
          emailSubject: rebuyTemplate.subject || 'Your eLocalPass expires soon - Get 15% off renewal!',
          emailMessage: 'Your ELocalPass is expiring soon! Don\'t miss out on amazing local experiences. Get another pass now with a special 15% discount.',
          emailCta: 'Get Another ELocalPass',
          emailHeaderColor: '#dc2626',
          emailHeaderTextColor: 'white',
          emailCtaColor: '#dc2626',
          emailCtaTextColor: 'white',
          emailBackgroundColor: '#f5f5f5',
          emailMessageColor: '#374151',
          emailMessageFontFamily: 'Arial, sans-serif',
          emailHeaderFontFamily: 'Arial, sans-serif',
          emailMessageFontSize: '16',
          emailHeaderFontSize: '24',
          showExpirationTimer: true,
          enableFeaturedPartners: true,
          customAffiliateMessage: 'Don\'t forget these amazing discounts are waiting for you!',
          emailFooter: 'Thank you for choosing ELocalPass for your local adventures!',
          bannerImages: [],
          videoUrl: paypalRebuyTemplate?.name.includes('2') ? 'https://example.com/promo-video' : null // Add video for Email 2
        }
      }

      // Generate fresh HTML with all enhanced components (same as seller emails)
      console.log(`📧 REBUY EMAIL: Generating fresh HTML with enhanced components for PayPal template`)
      const freshHtml = generateCustomRebuyEmailHtml(rebuyConfig, "Playa del Carmen")
      
      // Define URLs for both branches
      const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`
      const rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
      
      if (freshHtml) {
        console.log(`✅ REBUY EMAIL: Generated fresh HTML with enhanced components`)
        
        // Format expiration date for display
        const expirationDate = qrCodeData.expiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })

        // Replace placeholders with actual data (same as seller emails)
        emailHtml = freshHtml
          .replace(/\{customerName\}/g, customerName)
          .replace(/\{qrCode\}/g, qrCodeData.code)
          .replace(/\{guests\}/g, qrCodeData.guests.toString())
          .replace(/\{days\}/g, qrCodeData.days.toString())
          .replace(/\{hoursLeft\}/g, hoursLeft.toString())
          .replace(/\{expirationDate\}/g, expirationDate)
          .replace(/\{qrExpirationTimestamp\}/g, qrCodeData.expiresAt.toISOString())
          .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
          .replace(/\{rebuyUrl\}/g, rebuyUrl)
          .replace(/\{magicLink\}/g, customerPortalUrl)
          .replace(/\{expiresAt\}/g, qrCodeData.expiresAt.toLocaleDateString())
          .replace(/\{passType\}/g, 'day')
          .replace(/\{cost\}/g, qrCodeData.cost?.toString() || '0')
          .replace(/\{deliveryMethod\}/g, 'now')
        
        console.log(`📧 ENHANCED: Fresh HTML generated with all components (length: ${emailHtml.length})`)
        console.log(`📧 ENHANCED: Contains banner images: ${emailHtml.includes('banner-images')}`)
        console.log(`📧 ENHANCED: Contains video section: ${emailHtml.includes('Promotional Video')}`)
        console.log(`📧 ENHANCED: Contains countdown timer: ${emailHtml.includes('Time Remaining')}`)
        console.log(`📧 ENHANCED: Contains featured partners: ${emailHtml.includes('Featured Partners')}`)
        
      } else {
        console.log(`❌ REBUY EMAIL: Fresh HTML generation failed, falling back to stored template`)
        // Fallback to basic template processing
        emailHtml = rebuyTemplate.customHTML
          .replace(/\{customerName\}/g, customerName)
          .replace(/\{qrCode\}/g, qrCodeData.code)
          .replace(/\{guests\}/g, qrCodeData.guests.toString())
          .replace(/\{days\}/g, qrCodeData.days.toString())
          .replace(/\{hoursLeft\}/g, hoursLeft.toString())
          .replace(/\{qrExpirationTimestamp\}/g, qrCodeData.expiresAt.toISOString())
          .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
          .replace(/\{rebuyUrl\}/g, rebuyUrl)
          .replace(/\{magicLink\}/g, customerPortalUrl)
          .replace(/\{expirationDate\}/g, qrCodeData.expiresAt.toLocaleDateString())
          .replace(/\{expiresAt\}/g, qrCodeData.expiresAt.toLocaleDateString())
          .replace(/\{passType\}/g, 'day')
          .replace(/\{cost\}/g, qrCodeData.cost?.toString() || '0')
          .replace(/\{deliveryMethod\}/g, 'now')
      }

      // Handle subject with placeholders
      let emailSubject = rebuyTemplate.subject || 'Your eLocalPass expires soon - Get 15% off renewal!'
      emailSubject = emailSubject
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{qrCode\}/g, qrCodeData.code)
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())

      console.log(`📧 REBUY EMAIL: Using subject: ${emailSubject}`)
      console.log(`📧 REBUY EMAIL: Final HTML length: ${emailHtml.length} characters`)
      console.log(`📧 REBUY EMAIL: Contains video: ${emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video')}`)
      console.log(`📧 REBUY EMAIL: Contains timer: ${emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer')}`)
      console.log(`📧 REBUY EMAIL: Contains partners: ${emailHtml.includes('Featured Partners') || emailHtml.includes('partners')}`)

      // Send the email
      const emailResult = await sendEmail({
        to: qrCodeData.customerEmail || '',
        subject: emailSubject,
        html: emailHtml
      })

      if (emailResult) {
        // Mark rebuy email as sent
        if (qrCodeData.analytics) {
          await prisma.qRCodeAnalytics.update({
            where: { id: qrCodeData.analytics.id },
            data: { rebuyEmailScheduled: false }
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Passes/PayPal rebuy email sent successfully using PayPal template',
          qrCode: qrCodeData.code,
          email: qrCodeData.customerEmail,
          hoursLeft: hoursLeft,
          template: rebuyTemplate.name,
          templateSource: paypalRebuyTemplate ? 'PayPal specific template' : 'Database default rebuy template',
          originalHtmlLength: rebuyTemplate.customHTML?.length || 0,
          finalHtmlLength: emailHtml.length,
          subjectUsed: emailSubject,
          containsVideo: emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video'),
          containsTimer: emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer'),
          containsPartners: emailHtml.includes('Featured Partners') || emailHtml.includes('partners')
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Failed to send rebuy email',
          error: 'Email sending failed'
        }, { status: 500 })
      }
    } else {
      console.log('❌ No default rebuy template found in database')
      return NextResponse.json({ 
        error: 'No default rebuy email template found',
        message: 'Please create a default rebuy email template first'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Test passes rebuy email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 