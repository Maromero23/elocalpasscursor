import React, { useState, useEffect } from 'react'

interface EnhancedLandingPageTemplateProps {
  // QR Configuration Data (from admin settings)
  qrConfigId: string
  businessName: string
  logoUrl?: string
  
  // Main Header Text with Typography
  headerText: string
  headerTextColor?: string
  headerFontFamily?: string
  headerFontSize?: string
  
  // Description Text with Typography
  descriptionText: string
  descriptionTextColor?: string
  descriptionFontFamily?: string
  descriptionFontSize?: string
  
  // CTA Button Text with Typography
  ctaButtonText: string
  ctaButtonTextColor?: string
  ctaButtonFontFamily?: string
  ctaButtonFontSize?: string
  
  // Form Title Text with Typography
  formTitleText?: string
  formTitleTextColor?: string
  formTitleFontFamily?: string
  formTitleFontSize?: string
  
  // Form Instructions Text with Typography
  formInstructionsText?: string
  formInstructionsTextColor?: string
  formInstructionsFontFamily?: string
  formInstructionsFontSize?: string
  
  // Footer Disclaimer Text with Typography
  footerDisclaimerText?: string
  footerDisclaimerTextColor?: string
  footerDisclaimerFontFamily?: string
  footerDisclaimerFontSize?: string
  
  // Brand Colors
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // Individual Box Colors
  guestSelectionBoxColor?: string
  daySelectionBoxColor?: string
  footerDisclaimerBoxColor?: string
  
  // QR Config Rules
  allowCustomGuests: boolean
  defaultGuests: number
  maxGuests: number
  allowCustomDays: boolean
  defaultDays: number
  maxDays: number
}

export function EnhancedLandingPageTemplate({
  qrConfigId,
  businessName,
  logoUrl,
  headerText,
  headerTextColor = '#2563eb',
  headerFontFamily = 'Arial, sans-serif',
  headerFontSize = '28',
  descriptionText,
  descriptionTextColor = '#2563eb',
  descriptionFontFamily = 'Arial, sans-serif',
  descriptionFontSize = '16',
  ctaButtonText,
  ctaButtonTextColor = '#ffffff',
  ctaButtonFontFamily = 'Arial, sans-serif',
  ctaButtonFontSize = '18',
  formTitleText = 'SIGN UP TO GET YOUR FREE ELOCALPASS!',
  formTitleTextColor = '#ffffff',
  formTitleFontFamily = 'Arial, sans-serif',
  formTitleFontSize = '24',
  formInstructionsText = 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
  formInstructionsTextColor = '#f97316',
  formInstructionsFontFamily = 'Arial, sans-serif',
  formInstructionsFontSize = '16',
  footerDisclaimerText = 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
  footerDisclaimerTextColor = '#f97316',
  footerDisclaimerFontFamily = 'Arial, sans-serif',
  footerDisclaimerFontSize = '14',
  primaryColor,
  secondaryColor,
  backgroundColor,
  guestSelectionBoxColor,
  daySelectionBoxColor,
  footerDisclaimerBoxColor,
  allowCustomGuests,
  defaultGuests,
  maxGuests,
  allowCustomDays,
  defaultDays,
  maxDays
}: EnhancedLandingPageTemplateProps) {
  const [selectedGuests, setSelectedGuests] = useState(defaultGuests)
  const [selectedDays, setSelectedDays] = useState(defaultDays)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailConfirmation: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailMatchError, setEmailMatchError] = useState(false)

  // Validate email confirmation in real-time
  useEffect(() => {
    if (formData.emailConfirmation && formData.email) {
      setEmailMatchError(formData.email !== formData.emailConfirmation)
    } else {
      setEmailMatchError(false)
    }
  }, [formData.email, formData.emailConfirmation])

  const handleGuestChange = (guests: number) => {
    if (allowCustomGuests && guests >= 1 && guests <= maxGuests) {
      setSelectedGuests(guests)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (emailMatchError) {
      alert('Email addresses do not match. Please check and try again.')
      return
    }

    if (!formData.name || !formData.email || !formData.emailConfirmation) {
      alert('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implement actual form submission to your backend
      console.log('Form submission:', {
        qrConfigId,
        guests: selectedGuests,
        days: selectedDays,
        userData: formData
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Thank you! Your eLocalPass request has been submitted successfully. You will receive your pass via email shortly.')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        emailConfirmation: ''
      })
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was an error submitting your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            {logoUrl && logoUrl.trim() && (logoUrl.includes('.jpg') || logoUrl.includes('.jpeg') || logoUrl.includes('.png') || logoUrl.includes('.gif') || logoUrl.includes('.svg') || logoUrl.includes('.webp')) && (
              <div className="mb-6">
                <img 
                  src={logoUrl} 
                  alt={businessName}
                  className="h-32 mx-auto object-contain"
                  onError={(e) => {
                    console.warn('Logo failed to load:', logoUrl)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => console.log('Logo loaded successfully:', logoUrl)}
                />
              </div>
            )}
            
            {/* Main Header Text with Custom Typography */}
            <h1 
              className="mb-6 font-bold leading-tight"
              style={{
                color: headerTextColor,
                fontFamily: headerFontFamily,
                fontSize: `${headerFontSize}px`
              }}
            >
              {headerText}
            </h1>
            
            {/* Description Text with Custom Typography */}
            <p 
              className="mb-8 leading-relaxed"
              style={{
                color: descriptionTextColor,
                fontFamily: descriptionFontFamily,
                fontSize: `${descriptionFontSize}px`
              }}
            >
              {descriptionText}
            </p>
          </div>

          {/* Form Section */}
          <div 
            className="rounded-lg p-8 shadow-xl"
            style={{ backgroundColor: primaryColor }}
          >
            {/* Form Title with Custom Typography */}
            <h2 
              className="text-center mb-2 font-bold"
              style={{
                color: formTitleTextColor,
                fontFamily: formTitleFontFamily,
                fontSize: `${formTitleFontSize}px`
              }}
            >
              {formTitleText}
            </h2>
            
            {/* Form Instructions with Custom Typography */}
            <p 
              className="text-center mb-8"
              style={{
                color: formInstructionsTextColor,
                fontFamily: formInstructionsFontFamily,
                fontSize: `${formInstructionsFontSize}px`
              }}
            >
              {formInstructionsText}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Guest Selection */}
              <div 
                className="bg-white bg-opacity-20 p-4 rounded-lg max-w-md mx-auto"
                style={{ backgroundColor: guestSelectionBoxColor }}
              >
                <div className="flex items-center justify-center mb-3">
                  <h3 className="text-white font-medium text-sm">CHOOSE THE NUMBER OF PEOPLE BETWEEN 1 AND {maxGuests}</h3>
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <label className="text-white text-xs">Enter number of guests (1-{maxGuests}):</label>
                  {allowCustomGuests ? (
                    <input
                      key="guest-input"
                      type="number"
                      min="1"
                      max={maxGuests}
                      value={selectedGuests}
                      onChange={(e) => handleGuestChange(parseInt(e.target.value))}
                      className="px-2 py-1 rounded border-0 bg-white text-gray-900 font-medium text-center"
                      style={{ width: '60px' }}
                    />
                  ) : (
                    <div className="px-2 py-1 rounded bg-white text-gray-900 font-medium text-center" style={{ width: '60px' }}>
                      {selectedGuests}
                    </div>
                  )}
                </div>
              </div>

              {/* Day Selection */}
              <div 
                className="bg-white bg-opacity-20 p-4 rounded-lg max-w-md mx-auto"
                style={{ backgroundColor: daySelectionBoxColor }}
              >
                <div className="flex items-center justify-center mb-3">
                  <h3 className="text-white font-medium text-sm">CHOOSE NUMBER OF DAYS (up to {maxDays})</h3>
                </div>
                
                <div className="flex items-center justify-center">
                  {allowCustomDays ? (
                    <div className="text-white flex items-center">
                      <span className="text-xs">Days selected: </span>
                      <input
                        key="days-input"
                        type="number"
                        min="1"
                        max={maxDays}
                        value={selectedDays}
                        onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                        className="px-2 py-1 rounded border-0 bg-white text-gray-900 font-medium text-center ml-2"
                        style={{ width: '60px' }}
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded bg-white bg-opacity-30 text-white font-medium text-sm">
                      {selectedDays} Days (Fixed)
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 max-w-md mx-auto">
                <div>
                  <input
                    type="text"
                    placeholder="Name: (IT MUST MATCH YOUR ID)"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email: (TO RECEIVE YOUR ELOCALPASS)"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email confirmation: (TO RECEIVE YOUR ELOCALPASS)"
                    value={formData.emailConfirmation}
                    onChange={(e) => setFormData({...formData, emailConfirmation: e.target.value})}
                    className={`w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm ${
                      emailMatchError ? 'ring-2 ring-red-500' : ''
                    }`}
                    required
                  />
                  {emailMatchError && (
                    <p className="text-red-200 text-sm mt-1">Email addresses do not match</p>
                  )}
                </div>
              </div>

              {/* Submit Button with Custom Typography */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || emailMatchError}
                  className="px-8 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: secondaryColor,
                    color: ctaButtonTextColor,
                    fontFamily: ctaButtonFontFamily,
                    fontSize: `${ctaButtonFontSize}px`
                  }}
                >
                  {isSubmitting ? 'Processing...' : ctaButtonText}
                </button>
              </div>
            </form>

            {/* Footer Disclaimer with Custom Typography */}
            <div 
              className="mt-8 p-4 bg-white bg-opacity-20 rounded-lg"
              style={{ backgroundColor: footerDisclaimerBoxColor }}
            >
              <p 
                className="text-center leading-relaxed"
                style={{
                  color: footerDisclaimerTextColor,
                  fontFamily: footerDisclaimerFontFamily,
                  fontSize: `${footerDisclaimerFontSize}px`
                }}
              >
                {footerDisclaimerText}
              </p>
              
              <div className="text-center mt-4">
                <a 
                  href="/privacy" 
                  className="text-white underline text-sm hover:text-opacity-80"
                >
                  Click HERE to read the privacy notice and data usage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
