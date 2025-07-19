'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    paypal: any
  }
}

export default function TestPayPalPage() {
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testOrderData = {
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    passType: 'Test Pass',
    guests: 1,
    days: 1,
    deliveryType: 'now',
    sellerId: 'test-seller',
    amount: 1.00
  }

  useEffect(() => {
    console.log('🔧 Loading PayPal script...')
    
    // Load PayPal script
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?client-id=AVhVRUYbs8mzjMm4X6_BwvaA9dT4-9KOImWI5gN3kQCPawuDdTx1IRAOeeyzE3lh81_MJsiHsg8Q2Mn9&currency=USD&intent=capture'
    script.async = true
    
    script.onload = () => {
      console.log('✅ PayPal script loaded')
      
      if (window.paypal) {
        console.log('🎯 Creating PayPal buttons...')
        window.paypal.Buttons({
          createOrder: function(data: any, actions: any) {
            console.log('📝 Creating order...')
            setIsLoading(true)
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: '1.00'
                },
                description: 'ELocalPass Test Purchase - $1 USD',
                custom_id: JSON.stringify(testOrderData)
              }]
            })
          },
          onApprove: function(data: any, actions: any) {
            console.log('✅ Payment approved, capturing...')
            setIsLoading(true)
            return actions.order.capture().then(async function(details: any) {
              console.log('💰 Payment completed:', details)
              
              try {
                const response = await fetch('/api/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    paymentId: details.id,
                    orderData: testOrderData
                  }),
                })

                const result = await response.json()
                
                if (result.success) {
                  setPaymentStatus('Payment successful! Redirecting...')
                  // Redirect to success page
                  if (result.redirectUrl) {
                    setTimeout(() => {
                      window.location.href = result.redirectUrl
                    }, 2000)
                  }
                } else {
                  setPaymentStatus('Payment verification failed')
                }
              } catch (error) {
                console.error('Error verifying payment:', error)
                setPaymentStatus('Error verifying payment')
              } finally {
                setIsLoading(false)
              }
            })
          },
          onError: function(err: any) {
            console.error('❌ PayPal error:', err)
            setPaymentStatus('PayPal error: ' + err.message)
            setIsLoading(false)
          },
          onCancel: function() {
            setPaymentStatus('Payment cancelled')
            setIsLoading(false)
          }
        }).render('#paypal-button-container').then(() => {
          console.log('✅ PayPal button rendered successfully')
        }).catch((err: any) => {
          console.error('❌ PayPal button render error:', err)
        })
      } else {
        console.error('❌ window.paypal is not available')
      }
    }
    
    script.onerror = () => {
      console.error('❌ Failed to load PayPal script')
      setPaymentStatus('Failed to load PayPal')
    }
    
    document.body.appendChild(script)

    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {
        console.log('Script already removed')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 PayPal Test
          </h1>
          <p className="text-gray-600">
            Test real PayPal integration with $1 USD
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Test QR Code Details:</h2>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• <strong>Price:</strong> $1.00 USD</div>
            <div>• <strong>Guests:</strong> 1 person</div>
            <div>• <strong>Duration:</strong> 1 day</div>
            <div>• <strong>Delivery:</strong> Immediate</div>
            <div>• <strong>Customer:</strong> Test Customer</div>
            <div>• <strong>Email:</strong> test@example.com</div>
          </div>
        </div>

        {paymentStatus && (
          <div className={`mb-6 p-4 rounded-lg ${
            paymentStatus.includes('successful') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="font-semibold">Status:</div>
            <div>{paymentStatus}</div>
          </div>
        )}

        <div className="space-y-4">
          <div id="paypal-button-container"></div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="mt-2 text-sm text-gray-600">Processing...</div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <div>🔒 This is a test transaction</div>
            <div>💳 Real PayPal integration</div>
            <div>📧 Will send real welcome email</div>
            <div>🎫 Will create real QR code</div>
          </div>
        </div>
      </div>
    </div>
  )
} 