"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CheckCircle, Download, Clock, Mail, Calendar, Users, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OrderDetails {
  orderId: string
  customerName: string
  customerEmail: string
  amount: number
  currency: string
  guests: number
  days: number
  deliveryType: string
  deliveryDate?: string
  deliveryTime?: string
  discountCode?: string
  discountAmount?: number
  status: string
  createdAt: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const paymentId = searchParams.get('paymentId')
    
    if (orderId) {
      fetchOrderDetails(orderId)
    } else if (paymentId) {
      fetchOrderByPaymentId(paymentId)
    }
  }, [searchParams])

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()
      
      if (data.success) {
        setOrderDetails(data.order)
        generateInvoice(data.order)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrderByPaymentId = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/orders/payment/${paymentId}`)
      const data = await response.json()
      
      if (data.success) {
        setOrderDetails(data.order)
        generateInvoice(data.order)
      }
    } catch (error) {
      console.error('Error fetching order by payment ID:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateInvoice = async (order: OrderDetails) => {
    try {
      const response = await fetch('/api/orders/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: order.orderId })
      })
      
      const data = await response.json()
      if (data.success) {
        setInvoiceUrl(data.invoiceUrl)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
    }
  }

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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your order details.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">Thank you for your purchase. Your order has been confirmed.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="text-sm text-gray-900">{orderDetails.orderId}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {orderDetails.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p className="text-sm text-gray-900">{orderDetails.customerName}</p>
                  <p className="text-sm text-gray-500">{orderDetails.customerEmail}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Date</p>
                  <p className="text-sm text-gray-900">{formatDate(orderDetails.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Pass Details */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pass Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Guests</p>
                    <p className="text-sm text-gray-900">{orderDetails.guests} {orderDetails.guests === 1 ? 'Guest' : 'Guests'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-sm text-gray-900">{orderDetails.days} {orderDetails.days === 1 ? 'Day' : 'Days'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery</p>
                    <p className="text-sm text-gray-900 capitalize">
                      {orderDetails.deliveryType === 'now' ? 'Immediate' : 'Scheduled'}
                    </p>
                  </div>
                </div>
                
                {orderDetails.deliveryType === 'future' && orderDetails.deliveryDate && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Delivery Date</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(orderDetails.deliveryDate)}
                        {orderDetails.deliveryTime && ` at ${formatTime(orderDetails.deliveryTime)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pass Cost</span>
                  <span className="font-medium">{formatCurrency(orderDetails.amount, orderDetails.currency)}</span>
                </div>
                
                {orderDetails.discountCode && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({orderDetails.discountCode})</span>
                    <span>-{formatCurrency(orderDetails.discountAmount || 0, orderDetails.currency)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Paid</span>
                    <span>{formatCurrency(orderDetails.amount, orderDetails.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Download */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice</h3>
              
              {invoiceUrl ? (
                <a
                  href={invoiceUrl}
                  download
                  className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </a>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Generating invoice...</p>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              
              <div className="space-y-4">
                {orderDetails.deliveryType === 'now' ? (
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Welcome Email Sent</p>
                      <p className="text-sm text-gray-500">Check your email for your QR code and access details.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Scheduled Delivery</p>
                        <p className="text-sm text-gray-500">
                          Your QR code will be created and sent on {formatDate(orderDetails.deliveryDate || '')}
                          {orderDetails.deliveryTime && ` at ${formatTime(orderDetails.deliveryTime)}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Welcome Email</p>
                        <p className="text-sm text-gray-500">You'll receive your QR code and access details at the scheduled time.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <ArrowRight className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Need Help?</p>
                    <p className="text-sm text-gray-500">Contact us at support@elocalpass.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Home */}
            <div className="bg-white rounded-lg shadow p-6">
              <Link
                href="/"
                className="flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 