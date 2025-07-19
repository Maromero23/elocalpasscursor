'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    paypal: any
  }
}

export default function TestPayPal() {
  useEffect(() => {
    console.log('🔧 Loading PayPal script...')
    
    // Load PayPal script
    const script = document.createElement('script')
    script.src = 'https://www.sandbox.paypal.com/sdk/js?client-id=AVhVRUYbs8mzjMm4X6_BwvaA9dT4-9KOImWI5gN3kQCPawuDdTx1IRAOeeyzE3lh81_MJsiHsg8Q2Mn9&currency=USD'
    script.async = true
    
    script.onload = () => {
      console.log('✅ PayPal script loaded')
      console.log('🔍 window.paypal:', window.paypal)
      
      if (window.paypal) {
        console.log('🎯 Creating PayPal buttons...')
        window.paypal.Buttons({
          createOrder: function(data: any, actions: any) {
            console.log('📝 Creating order...')
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
            console.log('✅ Payment approved, capturing...')
            return actions.order.capture().then(function(details: any) {
              console.log('💰 Payment completed:', details)
              alert('Payment completed! Check webhook logs.')
            })
          },
          onError: function(err: any) {
            console.error('❌ PayPal error:', err)
            alert('PayPal error: ' + err.message)
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