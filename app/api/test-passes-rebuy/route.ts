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
      
      // EXTENSIVE DEBUGGING - Check what's in the template
      const originalHtml = defaultRebuyTemplate.customHTML
      console.log(`🔍 TEMPLATE CONTENT CHECK:`)
      console.log(`- Contains GRAND OPENING: ${originalHtml.includes('GRAND OPENING') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Contains promotional video: ${originalHtml.includes('Promotional Video') || originalHtml.includes('promotional') || originalHtml.includes('Watch Video') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Contains Time Remaining: ${originalHtml.includes('Time Remaining') || originalHtml.includes('countdown') || originalHtml.includes('timer') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Contains Featured Partners: ${originalHtml.includes('Featured Partners') || originalHtml.includes('partners') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Contains Supporting Local Business: ${originalHtml.includes('Supporting Local Business') ? '✅ YES' : '❌ NO'}`)
      
      // Show template sections
      console.log(`📄 TEMPLATE SECTIONS:`)
      const sections = originalHtml.split('</div>').length
      console.log(`- Number of </div> tags: ${sections}`)
      console.log(`- First 500 chars: ${originalHtml.substring(0, 500)}`)
      console.log(`- Middle 500 chars: ${originalHtml.substring(Math.floor(originalHtml.length/2) - 250, Math.floor(originalHtml.length/2) + 250)}`)
      console.log(`- Last 500 chars: ${originalHtml.substring(originalHtml.length - 500)}`)
      
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
      emailHtml = originalHtml
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

      console.log(`📧 AFTER PLACEHOLDER REPLACEMENT:`)
      console.log(`- Final HTML length: ${emailHtml.length} characters`)
      console.log(`- Length difference: ${emailHtml.length - originalHtml.length} chars`)
      console.log(`- Still contains GRAND OPENING: ${emailHtml.includes('GRAND OPENING') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Still contains promotional video: ${emailHtml.includes('Promotional Video') || emailHtml.includes('promotional') || emailHtml.includes('Watch Video') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Still contains Time Remaining: ${emailHtml.includes('Time Remaining') || emailHtml.includes('countdown') || emailHtml.includes('timer') ? '✅ YES' : '❌ NO'}`)
      console.log(`- Still contains Featured Partners: ${emailHtml.includes('Featured Partners') || emailHtml.includes('partners') ? '✅ YES' : '❌ NO'}`)
      
      // Check for any remaining unreplaced placeholders
      const remainingPlaceholders = (emailHtml.match(/\{[^}]+\}/g) || []).filter(p => !p.includes('margin') && !p.includes('padding') && !p.includes('color'))
      console.log(`- Remaining placeholders: ${remainingPlaceholders.length}`)
      if (remainingPlaceholders.length > 0) {
        console.log(`- Unreplaced placeholders: ${remainingPlaceholders.slice(0, 5).join(', ')}`)
      }

      emailSubject = defaultRebuyTemplate.subject || `Your ELocalPass expires in ${hoursLeft} hours - Get another one!`
      
      // Also replace placeholders in subject
      emailSubject = emailSubject
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{hoursLeft\}/g, hoursLeft.toString())
        .replace(/\{qrCode\}/g, qrCodeData.code)
      
      console.log(`📧 Using default rebuy template: ${defaultRebuyTemplate.name}`)
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
        template: defaultRebuyTemplate?.name || 'Default rebuy template',
        templateSource: 'Database default rebuy template',
        originalHtmlLength: defaultRebuyTemplate?.customHTML?.length || 0,
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