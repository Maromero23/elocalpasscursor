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
    
    // Get the DEFAULT rebuy email template from database
    console.log('📧 Loading default rebuy email template from database...')
    const defaultRebuyTemplate = await prisma.rebuyEmailTemplate.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'desc' }
    })

    let emailHtml: string
    let emailSubject: string

    if (defaultRebuyTemplate && defaultRebuyTemplate.customHTML) {
      console.log(`✅ Found default rebuy template: ${defaultRebuyTemplate.name}`)
      console.log(`📧 Template HTML length: ${defaultRebuyTemplate.customHTML.length} characters`)
      
      // Create comprehensive placeholder replacements
      const customerPortalUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/customer/access?token=${qrCodeData.customerEmail}`
      const rebuyUrl = `${process.env.NEXTAUTH_URL || 'https://elocalpasscursor.vercel.app'}/passes`
      const qrExpirationTimestamp = qrCodeData.expiresAt.toISOString()
      
      console.log(`📧 Replacing placeholders:`)
      console.log(`- customerName: ${customerName}`)
      console.log(`- qrCode: ${qrCodeData.code}`)
      console.log(`- guests: ${qrCodeData.guests}`)
      console.log(`- days: ${qrCodeData.days}`)
      console.log(`- hoursLeft: ${hoursLeft}`)
      console.log(`- qrExpirationTimestamp: ${qrExpirationTimestamp}`)
      console.log(`- customerPortalUrl: ${customerPortalUrl}`)
      console.log(`- rebuyUrl: ${rebuyUrl}`)
      
      // Use the default rebuy template and replace ALL possible placeholders
      emailHtml = defaultRebuyTemplate.customHTML
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
        // Add any other common placeholders that might be in the template
        .replace(/\{passType\}/g, 'day')
        .replace(/\{cost\}/g, qrCodeData.cost?.toString() || '0')
        .replace(/\{deliveryMethod\}/g, 'now')

      emailSubject = defaultRebuyTemplate.subject || `Your ELocalPass expires in ${hoursLeft} hours - Get another one!`
      
      // Also replace placeholders in subject
      emailSubject = emailSubject
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())
        .replace(/\{qrCode\}/g, qrCodeData.code)
      
      console.log(`📧 Using default rebuy template: ${defaultRebuyTemplate.name}`)
      console.log(`📧 Subject: ${emailSubject}`)
      console.log(`📧 Final HTML length: ${emailHtml.length} characters`)
      
      // Log first 500 characters to verify content
      console.log(`📧 HTML preview: ${emailHtml.substring(0, 500)}...`)
      
    } else {
      console.log('❌ No default rebuy template found in database')
      return NextResponse.json({ 
        error: 'No default rebuy email template found',
        message: 'Please create a default rebuy email template first'
      }, { status: 500 })
    }

    // Send the email
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
        template: defaultRebuyTemplate?.name || 'Default rebuy template',
        templateSource: 'Database default rebuy template',
        htmlLength: emailHtml.length,
        subjectUsed: emailSubject
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