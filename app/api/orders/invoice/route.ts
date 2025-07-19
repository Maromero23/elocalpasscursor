import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`📄 Generating invoice for order: ${orderId}`)
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(order)
    
    // For now, we'll return a simple PDF URL
    // In production, you'd want to use a proper PDF generation service
    const invoiceUrl = `${process.env.NEXTAUTH_URL}/api/orders/invoice/${orderId}/pdf`
    
    console.log(`✅ Invoice generated for order: ${orderId}`)
    
    return NextResponse.json({
      success: true,
      invoiceUrl: invoiceUrl,
      invoiceHtml: invoiceHtml // For debugging
    })
    
  } catch (error) {
    console.error('❌ Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceHtml(order: any) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 30px; }
        .customer-details { margin-bottom: 30px; }
        .items { margin-bottom: 30px; }
        .total { border-top: 2px solid #000; padding-top: 10px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ELocalPass</h1>
        <h2>INVOICE</h2>
      </div>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${order.id}</p>
        <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
      
      <div class="customer-details">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
      </div>
      
      <div class="items">
        <h3>Order Details</h3>
        <p><strong>Pass Type:</strong> ${order.passType}</p>
        <p><strong>Guests:</strong> ${order.guests}</p>
        <p><strong>Duration:</strong> ${order.days} days</p>
        <p><strong>Delivery:</strong> ${order.deliveryType === 'now' ? 'Immediate' : 'Scheduled'}</p>
        ${order.deliveryDate ? `<p><strong>Delivery Date:</strong> ${formatDate(order.deliveryDate)}</p>` : ''}
        ${order.deliveryTime ? `<p><strong>Delivery Time:</strong> ${order.deliveryTime}</p>` : ''}
      </div>
      
      <div class="total">
        <p><strong>Total Amount:</strong> ${formatCurrency(order.amount, order.currency)}</p>
        ${order.discountCode ? `<p><strong>Discount Code:</strong> ${order.discountCode}</p>` : ''}
      </div>
      
      <div class="footer">
        <p>Thank you for your purchase!</p>
        <p>For support, contact: support@elocalpass.com</p>
      </div>
    </body>
    </html>
  `
} 