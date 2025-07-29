"use client"

import { useEffect, useState } from 'react'

export default function TestDefaultTemplate() {
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDefaultTemplate = async () => {
      try {
        console.log('🔍 Loading default template for test...')
        const response = await fetch('/api/landing/default-template')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.template) {
            console.log('✅ Default template loaded:', result.template.name)
            setTemplate({
              ...result.template,
              // Add form-specific fields
              formTitleText: 'Complete Your Details',
              formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
              footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.'
            })
          } else {
            setError('Default template not found')
          }
        } else {
          setError('Failed to load default template')
        }
      } catch (err) {
        console.error('❌ Error loading default template:', err)
        setError('Failed to load default template')
      } finally {
        setLoading(false)
      }
    }

    loadDefaultTemplate()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading default template...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Template</h1>
          <p className="text-gray-600">{error || 'Template not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: template.backgroundColor }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {template.logoUrl && (
            <img 
              src={template.logoUrl} 
              alt="Logo" 
              className="mx-auto mb-4 h-16 w-auto"
            />
          )}
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ color: template.primaryColor }}
          >
            {template.headerText}
          </h1>
          <p 
            className="text-lg mb-6"
            style={{ color: template.secondaryColor }}
          >
            {template.descriptionText}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            {template.formTitleText}
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            {template.formInstructionsText}
          </p>
          
          <form className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Days
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or notes..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 text-white font-medium rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: template.primaryColor }}
            >
              {template.ctaButtonText}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            {template.footerDisclaimerText}
          </p>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Template Debug Info:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(template, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 