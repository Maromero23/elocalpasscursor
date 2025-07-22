import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate simple invoice HTML
    const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${orderId}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-title { font-size: 28px; margin: 10px 0; }
            .section { margin: 20px 0; }
            .total { border-top: 2px solid #f97316; padding-top: 10px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🎫 ELocalPass</div>
            <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="section">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <div class="section">
            <h3>Customer</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
        </div>
        
        <div class="section">
            <h3>Pass Information</h3>
            <p><strong>Type:</strong> ${order.passType?.toUpperCase() || 'CUSTOM'}</p>
            <p><strong>Guests:</strong> ${order.guests}</p>
            <p><strong>Days:</strong> ${order.days}</p>
            <p><strong>Delivery:</strong> ${order.deliveryType === 'now' ? 'Immediate' : 'Scheduled'}</p>
        </div>
        
        <div class="total">
            <p><strong>Total Paid: $${order.amount.toFixed(2)}</strong></p>
        </div>
        
        <div class="section">
            <p>Thank you for your purchase!</p>
            <p>For support: support@elocalpass.com</p>
        </div>
    </body>
    </html>
    `

    return new NextResponse(invoiceHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.html"`,
      }
    })

  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 