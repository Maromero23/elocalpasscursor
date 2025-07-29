import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

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
      if (paypalRebuyTemplate) {
        console.log(`✅ Found SPECIFIC PayPal rebuy template: ${paypalRebuyTemplate.name}`)
        console.log(`📧 PayPal template created: ${paypalRebuyTemplate.createdAt}`)
      } else {
        console.log(`⚠️ PayPal rebuy template not found, using default: ${rebuyTemplate.name}`)
      }
      console.log(`📧 Template HTML length: ${rebuyTemplate.customHTML.length} characters`)
      
      // Use the SAME logic as working seller rebuy emails
      // Check if we should use the enhanced template (same as regular rebuy emails)
      if (rebuyTemplate.customHTML === 'USE_DEFAULT_TEMPLATE' || rebuyTemplate.customHTML.includes('USE_DEFAULT_TEMPLATE')) {
        console.log(`📧 REBUY EMAIL: Loading default template from RebuyEmailTemplate database (same as working seller emails)`)
        
        // Load the full enhanced template (same logic as working seller rebuy emails)
        const enhancedDefaultTemplate = await prisma.rebuyEmailTemplate.findFirst({
          where: { isDefault: true }
        })
        
        if (enhancedDefaultTemplate && enhancedDefaultTemplate.customHTML) {
          console.log(`✅ REBUY EMAIL: Found enhanced default rebuy template in database`)
          
          // Create comprehensive placeholder replacements (same as seller emails)
          const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`
          const rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
          const qrExpirationTimestamp = qrCodeData.expiresAt.toISOString()
          
          // Use the EXACT same replacement logic as working seller rebuy emails
          let processedTemplate = enhancedDefaultTemplate.customHTML
            .replace(/\{customerName\}/g, customerName)
            .replace(/\{qrCode\}/g, qrCodeData.code)
            .replace(/\{guests\}/g, qrCodeData.guests.toString())
            .replace(/\{days\}/g, qrCodeData.days.toString())
            .replace(/\{hoursLeft\}/g, hoursLeft.toString())
            .replace(/\{qrExpirationTimestamp\}/g, qrExpirationTimestamp)
            .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
            .replace(/\{rebuyUrl\}/g, rebuyUrl)
            .replace(/\{magicLink\}/g, customerPortalUrl)
            .replace(/\{expirationDate\}/g, qrCodeData.expiresAt.toLocaleDateString())
            .replace(/\{expiresAt\}/g, qrCodeData.expiresAt.toLocaleDateString())
            .replace(/\{passType\}/g, 'day')
            .replace(/\{cost\}/g, qrCodeData.cost?.toString() || '0')
            .replace(/\{deliveryMethod\}/g, 'now')
          
          emailHtml = processedTemplate
          
          console.log(`✅ REBUY EMAIL: Enhanced template processed successfully. Final length: ${emailHtml.length} characters`)
          console.log(`📧 Enhanced template contains video: ${emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video')}`)
          console.log(`📧 Enhanced template contains timer: ${emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer')}`)
          console.log(`📧 Enhanced template contains partners: ${emailHtml.includes('Featured Partners') || emailHtml.includes('partners')}`)
          
        } else {
          console.log(`❌ No enhanced default template found, falling back to basic template`)
          // Fallback to basic template logic (existing code)
          emailHtml = rebuyTemplate.customHTML
            .replace(/\{customerName\}/g, customerName)
            .replace(/\{qrCode\}/g, qrCodeData.code)
            .replace(/\{guests\}/g, qrCodeData.guests.toString())
            .replace(/\{days\}/g, qrCodeData.days.toString())
            .replace(/\{hoursLeft\}/g, hoursLeft.toString())
            .replace(/\{qrExpirationTimestamp\}/g, qrCodeData.expiresAt.toISOString())
            .replace(/\{customerPortalUrl\}/g, `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`)
            .replace(/\{rebuyUrl\}/g, `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`)
        }
        
      } else {
        console.log(`📧 REBUY EMAIL: Using full template directly (same as working seller emails)`)
        
        // Use the full template directly (same as working seller rebuy emails)
        const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`
        const rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
        const qrExpirationTimestamp = qrCodeData.expiresAt.toISOString()
        
        // Use the EXACT same replacement logic as working seller rebuy emails
        emailHtml = rebuyTemplate.customHTML
          .replace(/\{customerName\}/g, customerName)
          .replace(/\{qrCode\}/g, qrCodeData.code)
          .replace(/\{guests\}/g, qrCodeData.guests.toString())
          .replace(/\{days\}/g, qrCodeData.days.toString())
          .replace(/\{hoursLeft\}/g, hoursLeft.toString())
          .replace(/\{qrExpirationTimestamp\}/g, qrExpirationTimestamp)
          .replace(/\{customerPortalUrl\}/g, customerPortalUrl)
          .replace(/\{rebuyUrl\}/g, rebuyUrl)
          .replace(/\{magicLink\}/g, customerPortalUrl)
          .replace(/\{expirationDate\}/g, qrCodeData.expiresAt.toLocaleDateString())
          .replace(/\{expiresAt\}/g, qrCodeData.expiresAt.toLocaleDateString())
          .replace(/\{passType\}/g, 'day')
          .replace(/\{cost\}/g, qrCodeData.cost?.toString() || '0')
          .replace(/\{deliveryMethod\}/g, 'now')
        
        console.log(`✅ REBUY EMAIL: Full template processed successfully. Final length: ${emailHtml.length} characters`)
        console.log(`📧 Full template contains video: ${emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video')}`)
        console.log(`📧 Full template contains timer: ${emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer')}`)
        console.log(`📧 Full template contains partners: ${emailHtml.includes('Featured Partners') || emailHtml.includes('partners')}`)
      }
      
      emailSubject = rebuyTemplate.subject || `Your ELocalPass expires in ${hoursLeft} hours - Get another one!`
      
      // Also replace placeholders in subject
      emailSubject = emailSubject
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())
        .replace(/\{qrCode\}/g, qrCodeData.code)
      
      console.log(`📧 Using default rebuy template: ${rebuyTemplate.name}`)
      console.log(`📧 Subject: ${emailSubject}`)
      
      // CRITICAL: Log the exact HTML being sent
      console.log(`📧 EXACT HTML BEING SENT (first 1000 chars):`)
      console.log(emailHtml.substring(0, 1000))
      console.log(`📧 EXACT HTML BEING SENT (last 1000 chars):`)
      console.log(emailHtml.substring(emailHtml.length - 1000))
      
    } else {
      console.log('❌ No default rebuy template found in database')
      return NextResponse.json({ 
        error: 'No default rebuy email template found',
        message: 'Please create a default rebuy email template first'
      }, { status: 500 })
    }

    // Send the email
    console.log(`📧 SENDING EMAIL WITH ${emailHtml.length} CHARACTERS`)
    const emailSent = await sendEmail({
      to: qrCodeData.customerEmail || '',
      subject: emailSubject,
      html: emailHtml
    })

    if (emailSent) {
      console.log(`✅ Rebuy email sent successfully to ${qrCodeData.customerEmail}`)
      
      // Update analytics to mark as sent
      if (qrCodeData.analytics) {
        await prisma.qRCodeAnalytics.update({
          where: { id: qrCodeData.analytics.id },
          data: { rebuyEmailScheduled: false } // Mark as sent
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Passes/PayPal rebuy email sent successfully using default template',
        qrCode: qrCode,
        email: qrCodeData.customerEmail,
        hoursLeft: hoursLeft,
        template: rebuyTemplate?.name || 'Default rebuy template',
        templateSource: 'Database default rebuy template',
        originalHtmlLength: rebuyTemplate?.customHTML?.length || 0,
        finalHtmlLength: emailHtml.length,
        subjectUsed: emailSubject,
        containsVideo: emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video'),
        containsTimer: emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer'),
        containsPartners: emailHtml.includes('Featured Partners') || emailHtml.includes('partners')
      })
    } else {
      console.log(`❌ Failed to send rebuy email to ${qrCodeData.customerEmail}`)
      return NextResponse.json({
        success: false,
        message: 'Failed to send rebuy email'
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