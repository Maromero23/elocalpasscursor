import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    
    console.log(`📋 Fetching order details for: ${orderId}`)
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    console.log('📋 Order found:', {
      id: order.id,
      customerName: order.customerName,
      paymentId: order.paymentId,
      status: order.status
    })
    
    // 🚀 AUTO-SEND WELCOME EMAIL FOR PAYPAL ORDERS
    // Check if this is a PayPal order that needs welcome email
    if (order.paymentId && order.paymentId.startsWith('PAYPAL_') && order.status === 'PAID') {
      console.log('📧 PayPal order detected - checking if welcome email was sent...')
      
      // Check if QR code exists and if email was sent
      const existingQR = await prisma.qRCode.findFirst({
        where: {
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          cost: order.amount,
          createdAt: {
            gte: new Date(order.createdAt.getTime() - 15 * 60 * 1000) // Within 15 minutes of order
          }
        },
        include: {
          analytics: true
        }
      })
      
      if (existingQR) {
        console.log('📋 QR code found:', existingQR.code)
        
        // Check if welcome email was already sent
        const emailAlreadySent = existingQR.analytics?.welcomeEmailSent || false
        console.log('📧 Email already sent:', emailAlreadySent)
        
        if (!emailAlreadySent) {
          console.log('📧 SENDING WELCOME EMAIL WITH BRANDED TEMPLATE...')
          
          try {
            // Import email service
            const { sendEmail } = await import('@/lib/email-service')
            const { formatDate } = await import('@/lib/translations')
            
            // Get default template (NEWEST one if multiple exist)
            const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
              where: { isDefault: true },
              orderBy: { createdAt: 'desc' } // Get the newest default template
            })
            
            if (defaultTemplate && defaultTemplate.customHTML) {
              console.log('📧 Using branded default template')
              
              const formattedExpirationDate = formatDate(existingQR.expiresAt, 'en')
              const magicLinkUrl = `https://elocalpasscursor.vercel.app/customer/access`
              
              // Replace variables in template
              const emailHtml = defaultTemplate.customHTML
                .replace(/\{customerName\}/g, order.customerName)
                .replace(/\{qrCode\}/g, existingQR.code)
                .replace(/\{guests\}/g, order.guests.toString())
                .replace(/\{days\}/g, order.days.toString())
                .replace(/\{expirationDate\}/g, formattedExpirationDate)
                .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
                .replace(/\{magicLink\}/g, magicLinkUrl)
              
              const emailSubject = defaultTemplate.subject
                .replace(/\{customerName\}/g, order.customerName)
                .replace(/\{qrCode\}/g, existingQR.code)
              
              // Send email
              const emailSent = await sendEmail({
                to: order.customerEmail,
                subject: emailSubject,
                html: emailHtml
              })
              
              console.log(`📧 Welcome email sent: ${emailSent ? '✅ SUCCESS' : '❌ FAILED'}`)
              
              // Update analytics to mark email as sent
              if (emailSent && existingQR.analytics) {
                await prisma.qRCodeAnalytics.update({
                  where: { id: existingQR.analytics.id },
                  data: { welcomeEmailSent: true }
                })
                console.log('📊 Analytics updated - email marked as sent')
              }
            } else {
              console.log('⚠️ No default template found')
            }
          } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError)
          }
        } else {
          console.log('📧 Welcome email already sent - skipping')
        }
      } else {
        console.log('⚠️ No QR code found for this PayPal order')
      }
    }
    
    return NextResponse.json(
      { 
        success: true,
        order: order
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('❌ Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
} 