"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function DefaultLandingPage() {
  const params = useParams()
  const { success, error } = useToast()
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    phone: '',
    guests: 2,
    days: 3,
    specialRequests: ''
  })

  useEffect(() => {
    if (params.qrId) {
      loadDefaultTemplate()
    }
  }, [params.qrId])

  const loadDefaultTemplate = async () => {
    try {
      console.log('🔍 Loading default landing page for qrId:', params.qrId)
      setErrorMessage(null) // Clear any previous errors
      
      // First, try to load the saved configuration from database
      const configResponse = await fetch(`/api/landing/config/${params.qrId}`)
      
      if (configResponse.ok) {
        const savedConfig = await configResponse.json()
        console.log('✅ Loaded saved configuration:', savedConfig.name)
        
        // Check if this configuration uses default landing page template
        const config = JSON.parse(savedConfig.config)
        if (config.button3LandingPageChoice === 'DEFAULT') {
          console.log('✅ Configuration uses default landing page template')
          
          // Get the default template from database
          const templateResponse = await fetch('/api/landing/default-template')
          if (templateResponse.ok) {
            const result = await templateResponse.json()
            if (result.success && result.template) {
              console.log('✅ Loaded default template:', result.template.name)
              
              // Use the saved configuration's data but with the default template's styling
              const configData = savedConfig.landingPageConfig ? JSON.parse(savedConfig.landingPageConfig) : {}
              
              // Check if we have any saved landing page data
              const hasLandingPageData = configData && (
                configData.headerText || 
                configData.descriptionText || 
                configData.ctaButtonText ||
                configData.primaryColor ||
                configData.secondaryColor ||
                configData.backgroundColor
              )
              
              if (hasLandingPageData) {
                console.log('✅ Using saved configuration data with default template')
                // Merge default template with saved configuration data
                setTemplate({
                  ...result.template,
                  // Use saved configuration data if available, otherwise use template defaults
                  headerText: configData.headerText || result.template.headerText,
                  descriptionText: configData.descriptionText || result.template.descriptionText,
                  ctaButtonText: configData.ctaButtonText || result.template.ctaButtonText,
                  primaryColor: configData.primaryColor || result.template.primaryColor,
                  secondaryColor: configData.secondaryColor || result.template.secondaryColor,
                  backgroundColor: configData.backgroundColor || result.template.backgroundColor,
                  logoUrl: configData.logoUrl || result.template.logoUrl,
                  // Use saved configuration for form fields
                  formTitleText: configData.formTitleText || 'Complete Your Details',
                  formInstructionsText: configData.formInstructionsText || 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
                  footerDisclaimerText: configData.footerDisclaimerText || 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.'
                })
                
                // Set form defaults from saved configuration
                if (configData.defaultGuests) {
                  setFormData(prev => ({ ...prev, guests: configData.defaultGuests }))
                }
                if (configData.defaultDays) {
                  setFormData(prev => ({ ...prev, days: configData.defaultDays }))
                }
              } else {
                console.log('✅ No saved landing page data, using default template directly')
                // Use the default template directly with some enhancements
                setTemplate({
                  ...result.template,
                  // Add form-specific fields that the template doesn't have
                  formTitleText: 'Complete Your Details',
                  formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
                  footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.'
                })
                
                // Set form defaults from the QR configuration
                if (config.button1GuestsDefault) {
                  setFormData(prev => ({ ...prev, guests: config.button1GuestsDefault }))
                }
                if (config.button1DaysDefault) {
                  setFormData(prev => ({ ...prev, days: config.button1DaysDefault }))
                }
              }
              
              setLoading(false)
              return
            } else {
              const errorMsg = result.error || 'Default template not found'
              console.error('❌ Template API error:', errorMsg)
              setErrorMessage(errorMsg)
            }
          } else {
            const errorMsg = `Failed to load default template (HTTP ${templateResponse.status})`
            console.error('❌ Template API HTTP error:', errorMsg)
            setErrorMessage(errorMsg)
          }
        } else {
          const errorMsg = 'This configuration does not use the default landing page template'
          console.log('⚠️ Configuration does not use default template')
          setErrorMessage(errorMsg)
        }
      } else {
        const errorMsg = `Failed to load configuration (HTTP ${configResponse.status})`
        console.error('❌ Config API HTTP error:', errorMsg)
        setErrorMessage(errorMsg)
      }
      
      // Fallback: load just the default template
      console.log('🔄 Falling back to default template only')
      const response = await fetch('/api/landing/default-template')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.template) {
          setTemplate({
            ...result.template,
            // Add form-specific fields that the template doesn't have
            formTitleText: 'Complete Your Details',
            formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
            footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.'
          })
        } else {
          const errorMsg = result.error || 'Default template not found'
          console.error('❌ Fallback template API error:', errorMsg)
          setErrorMessage(errorMsg)
        }
      } else {
        const errorMsg = `Failed to load default template (HTTP ${response.status})`
        console.error('❌ Fallback template API HTTP error:', errorMsg)
        setErrorMessage(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load default template'
      console.error('❌ Error loading default template:', err)
      setErrorMessage(errorMsg)
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

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error: {errorMessage}</h1>
          <p className="text-gray-600">The default landing page could not be loaded due to an error.</p>
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
          {errorMessage && (
            <p className="text-sm text-red-500 mt-2">Error: {errorMessage}</p>
          )}
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