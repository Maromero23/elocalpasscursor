'use client'

import React, { useState, useEffect } from 'react'

interface LandingPageTemplateProps {
  // QR Configuration Data (from admin settings)
  qrConfigId: string
  businessName: string
  logoUrl?: string
  headerText: string
  descriptionText: string
  ctaButtonText: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // QR Config Rules
  allowCustomGuests: boolean
  defaultGuests: number
  maxGuests: number
  allowCustomDays: boolean
  defaultDays: number
  maxDays: number
}

export function LandingPageTemplate({
  qrConfigId,
  businessName,
  logoUrl,
  headerText,
  descriptionText,
  ctaButtonText,
  primaryColor,
  secondaryColor,
  backgroundColor,
  allowCustomGuests,
  defaultGuests,
  maxGuests,
  allowCustomDays,
  defaultDays,
  maxDays
}: LandingPageTemplateProps) {
  const [selectedGuests, setSelectedGuests] = useState(defaultGuests)
  const [selectedDays, setSelectedDays] = useState(defaultDays)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailConfirmation: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailMatchError, setEmailMatchError] = useState(false)

  // Set initial values when props change
  useEffect(() => {
    setSelectedGuests(defaultGuests)
    setSelectedDays(defaultDays)
  }, [defaultGuests, defaultDays])

  // Check email match in real time
  useEffect(() => {
    if (formData.emailConfirmation && formData.email !== formData.emailConfirmation) {
      setEmailMatchError(true)
    } else {
      setEmailMatchError(false)
    }
  }, [formData.email, formData.emailConfirmation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.email !== formData.emailConfirmation) {
      alert('Email addresses do not match')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/landing-page/create-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrConfigId,
          customerData: {
            name: formData.name,
            email: formData.email,
            guests: selectedGuests,
            days: selectedDays
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        // TODO: Redirect to success page or show success message
        alert('Success! Check your email for login instructions.')
      } else {
        throw new Error('Failed to create QR code')
      }
    } catch (error) {
      console.error('Error creating QR:', error)
      alert('Error creating your pass. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Top Section with Logo and Message */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            
            {/* Logo Section */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={businessName}
                    className="w-48 h-32 object-contain mx-auto mb-4"
                  />
                ) : (
                  <div className="w-48 h-32 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-center">
                      <div className="text-blue-600 text-xl font-bold">{businessName}</div>
                      <div className="text-blue-500 text-sm">Members Only</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Section */}
            <div className="flex items-center">
              <div className="text-center md:text-left">
                <h1 
                  className="text-2xl md:text-3xl font-bold mb-4"
                  style={{ color: primaryColor }}
                >
                  {headerText}
                </h1>
                <p 
                  className="text-lg"
                  style={{ color: primaryColor }}
                >
                  {descriptionText}
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div 
            className="rounded-lg p-8 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-center mb-6">
              <h2 className="text-white text-xl font-bold mb-2">
                SIGN UP TO GET YOUR FREE ELOCALPASS!
              </h2>
              <p 
                className="text-lg font-medium"
                style={{ color: secondaryColor }}
              >
                JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Guest Selection */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                    👥
                  </div>
                  <span className="text-sm font-bold text-white">
                    CHOOSE THE NUMBER OF PEOPLE BETWEEN 1 AND {maxGuests}
                  </span>
                </div>

                {allowCustomGuests ? (
                  <div className="bg-white/20 p-4 rounded-lg max-w-xs mx-auto">
                    <label className="block text-white text-sm font-bold mb-2 text-center">
                      Enter number of guests (1-{maxGuests}):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxGuests}
                      value={selectedGuests}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (value >= 1 && value <= maxGuests) {
                          setSelectedGuests(value)
                        }
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center mx-auto block"
                      placeholder={defaultGuests.toString()}
                    />
                    {selectedGuests < 1 || selectedGuests > maxGuests ? (
                      <p className="text-red-200 text-sm mt-1 text-center">
                        Please enter a number between 1 and {maxGuests}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="bg-white/20 p-4 rounded-lg max-w-xs mx-auto">
                    <p className="text-white text-lg font-bold text-center">
                      {defaultGuests} Guests (Fixed)
                    </p>
                  </div>
                )}
              </div>

              {/* Days Selection */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                    📅
                  </div>
                  <span className="text-sm font-bold text-white">
                    CHOOSE NUMBER OF DAYS (up to {maxDays})
                  </span>
                </div>

                {allowCustomDays ? (
                  <div className="bg-white/20 p-4 rounded-lg max-w-xs mx-auto">
                    <label className="block text-white text-sm font-bold mb-2 text-center">
                      Enter number of days (1-{maxDays}):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxDays}
                      value={selectedDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (value >= 1 && value <= maxDays) {
                          setSelectedDays(value)
                        }
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center mx-auto block"
                      placeholder={defaultDays.toString()}
                    />
                    {selectedDays < 1 || selectedDays > maxDays ? (
                      <p className="text-red-200 text-sm mt-1 text-center">
                        Please enter a number between 1 and {maxDays}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="bg-white/20 p-4 rounded-lg max-w-xs mx-auto">
                    <p className="text-white text-lg font-bold text-center">
                      {defaultDays} Days (Fixed)
                    </p>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Name: (IT MUST MATCH YOUR ID)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email: (TO RECEIVE YOUR ELOCALPASS)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email confirmation: (TO RECEIVE YOUR ELOCALPASS)"
                    value={formData.emailConfirmation}
                    onChange={(e) => setFormData({ ...formData, emailConfirmation: e.target.value })}
                    required
                    className={`w-full px-4 py-3 rounded-lg border-0 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-orange-300 ${
                      emailMatchError ? 'bg-red-100 border-red-300' : ''
                    }`}
                  />
                  {emailMatchError && (
                    <p className="text-red-200 text-sm mt-1">Emails do not match</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || emailMatchError || !formData.name || !formData.email || !formData.emailConfirmation}
                  className="px-8 py-4 rounded-lg font-bold text-lg text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {isSubmitting ? 'Processing...' : ctaButtonText}
                </button>
              </div>
            </form>

            {/* Privacy Notice */}
            <div className="mt-6 text-center">
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.
                </p>
              </div>
              <p className="text-white text-xs mt-2">
                Click HERE to read the privacy notice and data usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
