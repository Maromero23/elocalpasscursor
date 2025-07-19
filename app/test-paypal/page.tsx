'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    paypal: any
  }
}

export default function TestPayPal() {
  useEffect(() => {
    // Load PayPal script
    const script = document.createElement('script')
    script.src = 'https://www.sandbox.paypal.com/sdk/js?client-id=AVhVRUYbs8mzjMm4X6_BwvaA9dT4-9KOImWI5gN3kQCPawuDdTx1IRAOeeyzE3lh81_MJsiHsg8Q2Mn9&currency=USD'
    script.async = true
    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: function(data: any, actions: any) {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: '15.00'
                },
                description: 'ELocalPass Test Purchase',
                custom_id: JSON.stringify({
                  passType: 'day',
                  guests: 1,
                  days: 1,
                  deliveryType: 'now',
                  customerEmail: 'test@example.com',
                  customerName: 'Test Customer',
                  sellerId: 'test-seller'
                })
              }]
            })
          },
          onApprove: function(data: any, actions: any) {
            return actions.order.capture().then(function(details: any) {
              console.log('Payment completed:', details)
              alert('Payment completed! Check webhook logs.')
            })
          }
        }).render('#paypal-button-container')
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PayPal Webhook Test</h1>
        <p className="text-gray-600 mb-6">
          This test will create a $15.00 payment that should trigger a webhook.
        </p>
        <div id="paypal-button-container" className="mt-4"></div>
      </div>
    </div>
  )
} 