'use client'

import { useState } from 'react'



export default function TestPayPalPage() {
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

  const handlePayPalPayment = () => {
    setIsLoading(true)
    console.log('🔧 Redirecting to PayPal...')
    
    // Create PayPal redirect URL (same as working implementation)
    const paypalUrl = new URL('https://www.sandbox.paypal.com/cgi-bin/webscr')
    paypalUrl.searchParams.set('cmd', '_xclick')
    paypalUrl.searchParams.set('business', 'sb-wtnhb38075507@business.example.com') // Sandbox business email
    paypalUrl.searchParams.set('item_name', `ELocalPass Test - $1 USD`)
    paypalUrl.searchParams.set('amount', '1.00')
    paypalUrl.searchParams.set('currency_code', 'USD')
    paypalUrl.searchParams.set('return', `${window.location.origin}/payment-success`)
    paypalUrl.searchParams.set('cancel_return', `${window.location.origin}/payment/cancel`)
    
    // Add order data as custom field
    paypalUrl.searchParams.set('custom', JSON.stringify(testOrderData))
    
    // Redirect to PayPal
    window.location.href = paypalUrl.toString()
  }

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



        <div className="space-y-4">
          <button
            onClick={handlePayPalPayment}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Redirecting to PayPal...
              </>
            ) : (
              <>
                💳 Pay $1.00 with PayPal
              </>
            )}
          </button>

          {isLoading && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600">You will be redirected to PayPal to complete the payment</p>
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