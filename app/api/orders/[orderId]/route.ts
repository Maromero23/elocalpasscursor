import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    
    console.log(`📋 Fetching order details for: ${orderId}`)
    
    // Check if this is a repeat request (user navigating back)
    const referer = request.headers.get('referer') || ''
    const isNavigatingBack = referer.includes('/payment-success')
    
    if (isNavigatingBack) {
      console.log('🔄 User navigating back to payment success page - skipping email logic')
    }
    
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
    
    // 🚀 AUTO-SEND WELCOME EMAIL FOR PAYPAL ORDERS (ONLY ONCE)
    // Check if this is a PayPal order that needs welcome email AND not a back navigation
    if (!isNavigatingBack && order.paymentId && order.paymentId.startsWith('PAYPAL_') && order.status === 'PAID') {
      console.log('📧 PayPal order detected - checking if welcome email was sent...')
      
      // ENHANCED DUPLICATE PREVENTION - Check multiple sources
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
        
        // MULTIPLE CHECKS to prevent duplicate emails
        const emailAlreadySent = existingQR.analytics?.welcomeEmailSent || false
        
        // Additional check: Look for ANY welcome email sent to this customer in the last 24 hours
        const anyRecentWelcomeEmail = await prisma.qRCodeAnalytics.findFirst({
          where: {
            customerEmail: order.customerEmail,
            welcomeEmailSent: true,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
            }
          }
        })
        
        // Additional check: Look for ANY QR code for this customer that has email sent
        const anyQRWithEmailSent = await prisma.qRCode.findFirst({
          where: {
            customerEmail: order.customerEmail,
            createdAt: {
              gte: new Date(order.createdAt.getTime() - 30 * 60 * 1000) // Within 30 minutes of this order
            }
          },
          include: {
            analytics: true
          }
        })
        
        const hasEmailSentForSimilarQR = anyQRWithEmailSent?.analytics?.welcomeEmailSent || false
        
        console.log('📧 Email status checks:', {
          currentQREmailSent: emailAlreadySent,
          anyRecentWelcomeEmail: !!anyRecentWelcomeEmail,
          hasEmailSentForSimilarQR: hasEmailSentForSimilarQR
        })
        
        // If ANY of these checks show email was sent, skip sending
        if (emailAlreadySent || anyRecentWelcomeEmail || hasEmailSentForSimilarQR) {
          console.log('📧 Welcome email already sent (multiple checks) - skipping to prevent duplicates')
        } else {
          console.log('📧 SENDING WELCOME EMAIL WITH BRANDED TEMPLATE...')
          
          try {
            // Import email service
            const { sendEmail } = await import('@/lib/email-service')
            const { formatDate } = await import('@/lib/translations')
            
            // Get PayPal-specific template (NEWEST one if multiple exist)
            const paypalTemplate = await prisma.welcomeEmailTemplate.findFirst({
              where: { 
                name: {
                  contains: 'Paypal welcome email template'
                }
              },
              orderBy: { createdAt: 'desc' } // Always get the latest copy
            })
            
            console.log('📧 PayPal template search result:', {
              found: !!paypalTemplate,
              name: paypalTemplate?.name,
              id: paypalTemplate?.id,
              createdAt: paypalTemplate?.createdAt,
              hasCustomHTML: !!paypalTemplate?.customHTML
            })
            
                         if (paypalTemplate && paypalTemplate.customHTML) {
               console.log('📧 Using PayPal-specific branded template')
              
              const formattedExpirationDate = formatDate(existingQR.expiresAt, 'en')
              const magicLinkUrl = `https://elocalpasscursor.vercel.app/customer/access`
              
              // Replace variables in template
              const emailHtml = paypalTemplate.customHTML
                .replace(/\{customerName\}/g, order.customerName)
                .replace(/\{qrCode\}/g, existingQR.code)
                .replace(/\{guests\}/g, order.guests.toString())
                .replace(/\{days\}/g, order.days.toString())
                .replace(/\{expirationDate\}/g, formattedExpirationDate)
                .replace(/\{customerPortalUrl\}/g, magicLinkUrl)
                .replace(/\{magicLink\}/g, magicLinkUrl)
              
              const emailSubject = paypalTemplate.subject
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
               console.log('⚠️ No PayPal template found - falling back to generic template')
            }
          } catch (emailError) {
            console.error('❌ Error sending welcome email:', emailError)
          }
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