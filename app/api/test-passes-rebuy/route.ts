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
    const rebuySubject = `Your ELocalPass expires in ${hoursLeft} hours - Get another one!`
    
    const rebuyEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${rebuySubject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 24px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px;">Don't Miss Out!</h1>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            Hello ${customerName},
          </p>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            Your ELocalPass expires soon. Don't miss out on amazing local experiences - get another pass now!
          </p>
          
          <!-- Enhanced Countdown Timer -->
          <div style="background: #f9fafb; border: 2px solid #e5e7eb; padding: 20px; margin: 24px 0; border-radius: 8px; text-align: center;">
            <p style="color: #dc2626; font-weight: 600; margin: 0 0 16px 0;">⏰ Time Remaining Until Expiration:</p>
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
                ">${hoursLeft}</td>
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
            <p style="font-size: 12px; color: #6b7280; margin: 8px 0; font-style: italic;">
              🚨 Don't wait - your pass expires soon!
            </p>
          </div>
          
          <!-- Current Pass Details -->
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <h3 style="color: #374151; font-weight: 600; margin: 0 0 12px 0;">Your Current ELocalPass Details:</h3>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #6b7280; font-weight: 500;">Guests:</span>
              <span style="color: #374151; font-weight: 600;">${qrCodeData.guests} people</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #6b7280; font-weight: 500;">Duration:</span>
              <span style="color: #374151; font-weight: 600;">${qrCodeData.days} days</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 8px 0;">
              <span style="color: #6b7280; font-weight: 500;">Expires:</span>
              <span style="color: #374151; font-weight: 600;">In ${hoursLeft} hours</span>
            </div>
          </div>
          
          <!-- Urgency Notice -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="color: #92400e; font-weight: 500; margin: 0;">
              ⏰ Your ELocalPass expires in <span style="font-weight: bold; color: #dc2626;">${hoursLeft} hours</span> - Don't miss out on amazing local experiences!
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://elocalpasscursor.vercel.app/passes" 
               style="
                 background: linear-gradient(135deg, #dc2626, #ef4444);
                 color: white;
                 font-size: 18px;
                 font-weight: 600;
                 padding: 16px 32px;
                 border-radius: 8px;
                 text-decoration: none;
                 display: inline-block;
                 box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
               ">
              Get Another ELocalPass
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
            Thank you for choosing ELocalPass for your local adventures!
          </p>
          
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #6b7280;">
          <p>© 2025 eLocalPass. All rights reserved.</p>
          <p style="margin-top: 4px;">
            You received this email because your ELocalPass is expiring soon.
          </p>
        </div>
        
      </body>
      </html>
    `

    // Send the email
    const emailSent = await sendEmail({
      to: qrCodeData.customerEmail || '',
      subject: rebuySubject,
      html: rebuyEmailHtml
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
        message: 'Passes/PayPal rebuy email sent successfully',
        qrCode: qrCode,
        email: qrCodeData.customerEmail,
        hoursLeft: hoursLeft,
        template: 'Default passes/PayPal rebuy email'
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