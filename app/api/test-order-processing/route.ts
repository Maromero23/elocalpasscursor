import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId') || 'cmdasmec30000o8kruvl74gmt'
    
    console.log('🧪 TESTING ORDER PROCESSING FOR:', orderId)
    
    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    console.log('📋 Order found:', {
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status
    })
    
    // Check if QR already exists
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        cost: order.amount,
        createdAt: {
          gte: new Date(order.createdAt.getTime() - 10 * 60 * 1000) // Within 10 minutes
        }
      }
    })
    
    if (existingQR) {
      console.log('✅ QR already exists:', existingQR.code)
      
      // Try to send email for existing QR
      const { sendEmail } = await import('@/lib/email-service')
      const { formatDate } = await import('@/lib/translations')
      
      // Get default template (NEWEST one if multiple exist)
      const defaultTemplate = await prisma.welcomeEmailTemplate.findFirst({
        where: { isDefault: true },
        orderBy: { createdAt: 'desc' } // Get the newest default template
      })
      
      if (defaultTemplate && defaultTemplate.customHTML) {
        console.log('📧 Found default template, sending email...')
        
        const formattedExpirationDate = formatDate(existingQR.expiresAt, 'en')
        const magicLinkUrl = `https://elocalpasscursor.vercel.app/customer/access`
        
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
        
        console.log('📧 Sending email with branded template...')
        
        const emailSent = await sendEmail({
          to: order.customerEmail,
          subject: emailSubject,
          html: emailHtml
        })
        
        return NextResponse.json({
          success: true,
          message: 'Email sent for existing QR',
          order: order,
          qrCode: existingQR.code,
          emailSent: emailSent,
          templateUsed: 'branded_default'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'No default template found',
          order: order,
          qrCode: existingQR.code,
          templateFound: false
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'No QR code found for this order',
        order: order,
        qrCodeExists: false
      })
    }
    
  } catch (error) {
    console.error('❌ Test order processing error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 