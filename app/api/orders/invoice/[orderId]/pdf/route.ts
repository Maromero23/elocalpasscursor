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

    // Generate professional invoice HTML with ELocalPass logo and blue design
    const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${orderId}</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 40px;
                background: #f8fafc;
                color: #1f2937;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 40px;
                text-align: center;
                position: relative;
            }
            
            .logo {
                margin-bottom: 20px;
            }
            
            .logo img {
                height: 60px;
                width: auto;
            }
            
            .company-name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                color: white;
            }
            
            .invoice-title {
                font-size: 18px;
                font-weight: 500;
                opacity: 0.9;
                letter-spacing: 2px;
            }
            
            .content {
                padding: 40px;
            }
            
            .invoice-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .invoice-number {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .invoice-id {
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 16px;
                font-weight: bold;
                color: #1f2937;
            }
            
            .invoice-date {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .date-value {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: #dcfce7;
                color: #166534;
            }
            
            .section {
                margin-bottom: 32px;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #3b82f6;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
                margin-bottom: 32px;
            }
            
            .info-item {
                margin-bottom: 12px;
            }
            
            .info-label {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .info-value {
                font-size: 16px;
                font-weight: 500;
                color: #1f2937;
            }
            
            .order-details {
                background: #f8fafc;
                border-radius: 8px;
                padding: 24px;
                margin-bottom: 32px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .detail-row:last-child {
                border-bottom: none;
            }
            
            .detail-label {
                color: #6b7280;
                font-size: 14px;
            }
            
            .detail-value {
                font-weight: 500;
                color: #1f2937;
            }
            
            .total-section {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 24px;
                border-radius: 8px;
                text-align: right;
                margin-bottom: 32px;
            }
            
            .total-label {
                font-size: 18px;
                margin-bottom: 8px;
                opacity: 0.9;
            }
            
            .total-amount {
                font-size: 32px;
                font-weight: bold;
            }
            
            .footer {
                text-align: center;
                padding: 32px;
                background: #f8fafc;
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .footer-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
            }
            
            .print-button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.2s;
            }
            
            .print-button:hover {
                background: #1d4ed8;
            }
            
            @media print {
                body { 
                    background: white; 
                    padding: 0;
                }
                .invoice-container {
                    box-shadow: none;
                    border-radius: 0;
                }
                .print-button {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="logo">
                    <img src="https://elocalpasscursor.vercel.app/images/elocal_logo_2.png" alt="ELocalPass Logo">
                </div>
                <div class="company-name">ELocalPass</div>
                <div class="invoice-title">INVOICE</div>
            </div>
            
            <div class="content">
                <div class="invoice-meta">
                    <div>
                        <div class="invoice-number">Invoice Number:</div>
                        <div class="invoice-id">${orderId.substring(0, 12).toUpperCase()}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="invoice-date">Date:</div>
                        <div class="date-value">${new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</div>
                        <div style="margin-top: 12px;">
                            <span class="status-badge">${order.status}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-grid">
                    <div class="section">
                        <div class="section-title">Customer Information</div>
                        <div class="info-item">
                            <div class="info-label">Name:</div>
                            <div class="info-value">${order.customerName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email:</div>
                            <div class="info-value">${order.customerEmail}</div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Order Details</div>
                        <div class="info-item">
                            <div class="info-label">Pass Type:</div>
                            <div class="info-value">${order.passType?.toUpperCase() || 'DAY'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Duration:</div>
                            <div class="info-value">${order.days} ${order.days === 1 ? 'day' : 'days'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Delivery:</div>
                            <div class="info-value">${order.deliveryType === 'now' ? 'Immediate' : 'Scheduled'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Pass Type:</span>
                        <span class="detail-value">${order.passType?.toUpperCase() || 'DAY'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Guests:</span>
                        <span class="detail-value">${order.guests} ${order.guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${order.days} ${order.days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Delivery:</span>
                        <span class="detail-value">${order.deliveryType === 'now' ? 'Immediate' : 'Scheduled'}</span>
                    </div>
                </div>
                
                <div class="total-section">
                    <div class="total-label">Total Amount</div>
                    <div class="total-amount">$${order.amount.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-title">Thank you for your purchase!</div>
                <p>For support, contact: support@elocalpass.com</p>
                <p>ELocalPass - Local Business QR Code Management System</p>
                <button class="print-button" onclick="window.print()">Print Invoice</button>
            </div>
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