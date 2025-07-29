"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface DefaultLandingPageProps {
  qrId: string
}

export default function DefaultLandingPage({ qrId }: DefaultLandingPageProps) {
  const params = useParams()
  const { success, error } = useToast()
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    phone: '',
    guests: 2,
    days: 3,
    specialRequests: ''
  })

  useEffect(() => {
    loadDefaultTemplate()
  }, [])

  const loadDefaultTemplate = async () => {
    try {
      const response = await fetch('/api/admin/landing-page-templates?isDefault=true')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.templates.length > 0) {
          setTemplate(result.templates[0])
        } else {
          error('Template Error', 'Default template not found')
        }
      } else {
        error('Template Error', 'Failed to load default template')
      }
    } catch (err) {
      error('Template Error', 'Failed to load default template')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      error('Missing Information', 'Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/landing/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrId: params.qrId,
          ...formData
        })
      })

      if (response.ok) {
        success('Success!', 'Your ELocalPass has been created and sent to your email!')
        // Reset form
        setFormData({
          clientName: '',
          clientEmail: '',
          phone: '',
          guests: 2,
          days: 3,
          specialRequests: ''
        })
      } else {
        const errorData = await response.json()
        error('Submission Failed', errorData.error || 'Failed to submit form')
      }
    } catch (err) {
      error('Submission Failed', 'Failed to submit form')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your ELocalPass...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Template Not Found</h1>
          <p className="text-gray-600">The default landing page template could not be loaded.</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests
              </label>
              <select
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
              <select
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
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
            FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.
          </p>
        </div>
      </div>
    </div>
  )
} 