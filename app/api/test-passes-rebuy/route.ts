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
    console.log('📧 Loading MASTER PAYPAL DEFAULT REBUY EMAIL template from database...')
    const paypalRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { 
        OR: [
          { name: { contains: "MASTER PAYPAL DEFAULT REBUY EMAIL", mode: 'insensitive' } },
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

      // Use the ACTUAL saved template HTML directly (no fake generation)
      console.log(`📧 REBUY EMAIL: Using actual saved template HTML directly`)
      console.log(`📧 Template HTML length: ${rebuyTemplate.customHTML.length} characters`)
      
      // Define URLs for placeholder replacement
      const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`
      const rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
      
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

      // Replace placeholders in the ACTUAL saved template HTML
      emailHtml = rebuyTemplate.customHTML
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

      // Handle subject with placeholders
      let emailSubject = rebuyTemplate.subject || 'Your eLocalPass expires soon - Get 15% off renewal!'
      emailSubject = emailSubject
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{qrCode\}/g, qrCodeData.code)
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())

      console.log(`📧 REBUY EMAIL: Using actual saved template: ${rebuyTemplate.name}`)
      console.log(`📧 REBUY EMAIL: Using subject: ${emailSubject}`)
      console.log(`📧 REBUY EMAIL: Final HTML length: ${emailHtml.length} characters`)
      console.log(`📧 REBUY EMAIL: Contains video: ${emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video')}`)
      console.log(`📧 REBUY EMAIL: Contains timer: ${emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer')}`)
      console.log(`📧 REBUY EMAIL: Contains partners: ${emailHtml.includes('Featured Partners') || emailHtml.includes('partners')}`)

      // Send the email using the ACTUAL saved template
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
          message: 'Passes/PayPal rebuy email sent successfully using actual saved PayPal template',
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