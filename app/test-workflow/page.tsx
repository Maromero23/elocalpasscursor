'use client'

import { useState } from 'react'

export default function TestWorkflow() {
  const [step, setStep] = useState(1)
  const [paymentData, setPaymentData] = useState({
    paymentId: '',
            amount: '1.00',
    customerEmail: 'test@example.com',
    customerName: 'Test Customer',
    passType: 'day',
    guests: '1',
    days: '1'
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    })
  }

  const processOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/manual-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentData,
          deliveryType: 'now'
        })
      })
      
      const data = await response.json()
      setResult(data)
      if (data.success) {
        setStep(4)
      }
    } catch (error) {
      console.error('Error processing order:', error)
      setResult({ error: 'Failed to process order' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Workflow Test</h1>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`flex items-center ${num < 4 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {num}
              </div>
              {num < 4 && <div className={`flex-1 h-1 mx-4 ${step > num ? 'bg-blue-600' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 1: Select Pass & Fill Details</h2>
            <p className="text-gray-600 mb-4">
              In a real scenario, you would go to the passes page, select a pass, and fill in your details.
            </p>
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to PayPal Payment →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 2: PayPal Payment</h2>
            <p className="text-gray-600 mb-4">
              In a real scenario, you would be redirected to PayPal, complete the payment, and get a payment ID.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>For testing:</strong> Go to <a href="/passes" className="underline">the passes page</a>, 
                make a real PayPal payment, then come back here with the payment ID.
              </p>
            </div>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              I completed PayPal payment →
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 3: Process Order</h2>
            <p className="text-gray-600 mb-4">
              Enter the payment details from your PayPal transaction:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PayPal Payment ID *
                </label>
                <input
                  type="text"
                  name="paymentId"
                  value={paymentData.paymentId}
                  onChange={handleInputChange}
                  placeholder="e.g., 29X67989865086450E"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="text"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Type</label>
                  <select
                    name="passType"
                    value={paymentData.passType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Day Pass</option>
                    <option value="week">Week Pass</option>
                    <option value="custom">Custom Pass</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={paymentData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={paymentData.customerEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={processOrder}
                disabled={loading || !paymentData.paymentId}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Process Order & Create QR Code'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Step 4: Order Complete! 🎉</h2>
            
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-800 mb-4">Order Processed Successfully!</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>Order ID:</strong> {result.orderId}</p>
                  <p><strong>QR Code ID:</strong> {result.qrCodeId}</p>
                  <p><strong>QR Code:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{result.qrCode}</span></p>
                </div>
                
                <div className="mt-4 p-4 bg-white rounded border">
                  <p className="text-sm text-gray-600 mb-2"><strong>Next Steps:</strong></p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check Prisma Studio (http://localhost:5555) for database records</li>
                    <li>• Test QR code at affiliate login page</li>
                    <li>• Verify customer can access their pass</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Order Failed</h3>
                <p className="text-sm text-red-700">{result.error}</p>
              </div>
            )}
            
            <button
              onClick={() => {
                setStep(1)
                setResult(null)
                setPaymentData({
                  paymentId: '',
                  amount: '1.00',
                  customerEmail: 'test@example.com',
                  customerName: 'Test Customer',
                  passType: 'day',
                  guests: '1',
                  days: '1'
                })
              }}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Test Another Purchase
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 