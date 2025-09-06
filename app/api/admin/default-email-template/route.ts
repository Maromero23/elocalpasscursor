import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEFAULT EMAIL TEMPLATE API: Saving template to database')
    
    const body = await request.json()
    const { emailConfig, action } = body
    
    // Make emailConfig more flexible to handle different field names
    const config = emailConfig as any

    if (action === 'saveAsDefault') {
      // Generate HTML from email config (same logic as admin panel)
      const generateCustomEmailHtml = (emailConfig: any) => {
        if (emailConfig.useDefaultEmail) {
          return 'USE_DEFAULT_TEMPLATE' // Signal to use built-in default
        }
        
        // Generate custom HTML template
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to eLocalPass</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${emailConfig.emailBackgroundColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${emailConfig.emailPrimaryColor || emailConfig.emailHeaderColor}; padding: 24px; text-align: center; }
        .header h1 { color: ${emailConfig.emailHeaderTextColor}; font-family: ${emailConfig.emailHeaderFontFamily}; font-size: ${emailConfig.emailHeaderFontSize}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${emailConfig.emailMessageTextColor}; font-family: ${emailConfig.emailMessageFontFamily}; font-size: ${emailConfig.emailMessageFontSize}px; line-height: 1.5; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${emailConfig.emailCtaBackgroundColor}; color: ${emailConfig.emailCtaTextColor}; font-family: ${emailConfig.emailCtaFontFamily}; font-size: ${emailConfig.emailCtaFontSize}px; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
        .notice { background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; }
        .notice p { color: ${emailConfig.emailNoticeTextColor}; font-family: ${emailConfig.emailNoticeFontFamily}; font-size: ${emailConfig.emailNoticeFontSize}px; font-weight: bold; margin: 0; }
        .footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
        .footer p { color: ${emailConfig.emailFooterTextColor}; font-family: ${emailConfig.emailFooterFontFamily}; font-size: ${emailConfig.emailFooterFontSize}px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${emailConfig.emailHeaderText}</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>${emailConfig.emailMessageText}</p>
            </div>
            
            <div class="cta-button">
                <a href="{customerPortalUrl}">${emailConfig.emailCtaText}</a>
            </div>
            
            <div class="notice">
                <p>${emailConfig.emailNoticeText}</p>
            </div>
            
            <div class="footer">
                <p>${emailConfig.emailFooterText}</p>
            </div>
        </div>
    </div>
</body>
</html>`
      }

      const customHTML = generateCustomEmailHtml(config)
      
      // First, set all existing templates to not default
      await prisma.welcomeEmailTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })

      // Create new default template
      const defaultTemplate = await prisma.welcomeEmailTemplate.create({
        data: {
          name: `Welcome Email Template - ${new Date().toLocaleDateString()}`,
          subject: 'Welcome to eLocalPass!',
          customHTML: customHTML,
          isDefault: true,
          // Store additional template info
          logoUrl: config.logoUrl || null,
          headerText: config.emailHeaderText || 'Welcome to eLocalPass!',
          bodyText: config.emailMessageText || 'Thank you for choosing eLocalPass.',
          footerText: config.emailFooterText || 'Enjoy your local experience!',
          primaryColor: config.emailPrimaryColor || '#3b82f6',
          backgroundColor: config.emailBackgroundColor || '#ffffff',
          buttonColor: config.emailCtaBackgroundColor || '#3b82f6',
          buttonText: config.emailCtaText || 'Access Your Pass'
        }
      })

      console.log('✅ DEFAULT EMAIL TEMPLATE API: Template saved to database')
      console.log(`   Template ID: ${defaultTemplate.id}`)
      console.log(`   HTML Length: ${customHTML.length} characters`)

      return NextResponse.json({
        success: true,
        message: 'Default email template saved successfully to database',
        template: {
          id: defaultTemplate.id,
          name: defaultTemplate.name,
          subject: defaultTemplate.subject,
          htmlLength: customHTML.length,
          createdAt: defaultTemplate.createdAt
        }
      })
    }

    if (action === 'clearDefault') {
      // Set all templates to not default
      await prisma.welcomeEmailTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })

      return NextResponse.json({
        success: true,
        message: 'Default template cleared successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ DEFAULT EMAIL TEMPLATE API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to save default template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 