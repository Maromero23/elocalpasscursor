import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Save/Update default rebuy template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rebuyConfig, action } = body

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
                <p>Hello {customerName},</p>
                <p style="margin-top: 16px;">${config.emailMessage || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <div class="highlight-box">
                <p style="color: #92400e; font-weight: 500; margin: 0;">${config.urgencyMessage ? config.urgencyMessage.replace('{hours_left}', '{hoursLeft}') : '⏰ Your ELocalPass expires in {hoursLeft} hours - Don\'t miss out!'}</p>
            </div>
            
            <div class="details">
                <h3 style="color: #374151; font-weight: 600; margin: 0 0 12px 0;">Your Current ELocalPass Details:</h3>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Pass Code:</span>
                    <span style="color: #374151; font-weight: 600;">{qrCode}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500;">Expires:</span>
                    <span style="color: #374151; font-weight: 600;">In {hoursLeft} hours</span>
                </div>
            </div>
            
            ${config.enableDiscountCode ? `
            <div class="discount-banner">
                <h2 style="margin: 0 0 8px 0; font-size: 20px;">🎉 Special ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} OFF!</h2>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Get another ELocalPass now and save!</p>
            </div>
            ` : ''}
            
            <div class="cta-button">
                <a href="{rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <div class="footer-message">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
            </div>
        </div>
    </div>
</body>
</html>`
      }

      const customHTML = generateRebuyHtml(rebuyConfig)

      // First, set all existing templates to not default
      await prisma.rebuyEmailTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })

      // Find existing default template or create new one
      let defaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
        where: { isDefault: true }
      })

      if (defaultTemplate) {
        // Update existing default template
        defaultTemplate = await prisma.rebuyEmailTemplate.update({
          where: { id: defaultTemplate.id },
          data: {
            subject: rebuyConfig.emailSubject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
            customHTML: customHTML,
            isDefault: true,
            updatedAt: new Date()
          }
        })
      } else {
        // Create new default template
        defaultTemplate = await prisma.rebuyEmailTemplate.create({
          data: {
            name: 'Default Rebuy Template',
            subject: rebuyConfig.emailSubject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
            customHTML: customHTML,
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
export async function GET() {
  try {
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

  } catch (error) {
    console.error('❌ REBUY TEMPLATE API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to load default rebuy template' 
    }, { status: 500 })
  }
} 