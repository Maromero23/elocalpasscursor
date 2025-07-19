"use client"

import Link from 'next/link'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <XCircle className="w-16 h-16 text-red-600 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
            
            <Link
              href="/customer/access"
              className="flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 