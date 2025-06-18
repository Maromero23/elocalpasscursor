import React, { useState, useEffect } from 'react'
import { detectLanguage, t, getPlural, type SupportedLanguage } from '@/lib/translations'

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
  formTitleText,
  formTitleTextColor = '#ffffff',
  formTitleFontFamily = 'Arial, sans-serif',
  formTitleFontSize = '24',
  formInstructionsText,
  formInstructionsTextColor = '#f97316',
  formInstructionsFontFamily = 'Arial, sans-serif',
  formInstructionsFontSize = '16',
  footerDisclaimerText,
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
  // Detect user language
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  
  useEffect(() => {
    const detectedLang = detectLanguage()
    setLanguage(detectedLang)
  }, [])
  
  // Use preset values from admin configuration
  const selectedGuests = defaultGuests
  const selectedDays = defaultDays
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (emailMatchError) {
      alert(t('landing.error.email.mismatch', language))
      return
    }

    if (!formData.name || !formData.email || !formData.emailConfirmation) {
      alert(t('landing.error.fill.fields', language))
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Submitting landing page form:', {
        qrConfigId,
        guests: selectedGuests,
        days: selectedDays,
        userData: formData
      })

      const response = await fetch('/api/landing-page/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrConfigId,
          formData: {
            name: formData.name,
            email: formData.email,
            guests: selectedGuests,
            days: selectedDays,
            language: language // Pass detected language
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        alert(t('landing.success.message', language))
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          emailConfirmation: ''
        })
      } else {
        const errorData = await response.json()
        alert(`${t('general.error', language)}: ${errorData.error || t('landing.error.general', language)}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert(t('landing.error.general', language))
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
              {formTitleText || t('landing.form.title', language)}
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
              {formInstructionsText || t('landing.form.instructions', language)}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Configuration Info Display */}
              <div className="bg-white bg-opacity-20 p-4 rounded-lg max-w-md mx-auto text-center">
                <div className="text-white space-y-2">
                  <div className="text-sm font-medium">
                    {t('landing.pass.details', language, {
                      guests: selectedGuests.toString(),
                      guestPlural: getPlural(selectedGuests, language, 'guest'),
                      days: selectedDays.toString(),
                      dayPlural: getPlural(selectedDays, language, 'day')
                    })}
                  </div>
                  <div className="text-xs text-white text-opacity-80">
                    {t('landing.pass.preset', language)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 max-w-md mx-auto">
                <div>
                  <input
                    type="text"
                    placeholder={t('landing.form.name.placeholder', language)}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder={t('landing.form.email.placeholder', language)}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder={t('landing.form.email.confirm.placeholder', language)}
                    value={formData.emailConfirmation}
                    onChange={(e) => setFormData({...formData, emailConfirmation: e.target.value})}
                    className={`w-full px-3 py-2 rounded border-0 text-gray-900 placeholder-gray-500 text-sm ${
                      emailMatchError ? 'ring-2 ring-red-500' : ''
                    }`}
                    required
                  />
                  {emailMatchError && (
                    <p className="text-red-200 text-xs mt-1">{t('landing.form.email.mismatch', language)}</p>
                  )}
                </div>
              </div>

              {/* Submit Button with Custom Typography */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: secondaryColor,
                    color: ctaButtonTextColor,
                    fontFamily: ctaButtonFontFamily,
                    fontSize: `${ctaButtonFontSize}px`
                  }}
                >
                  {isSubmitting ? t('landing.form.submit.processing', language) : (ctaButtonText || t('landing.form.submit.default', language))}
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
                {footerDisclaimerText || t('landing.disclaimer', language)}
              </p>
              
              <div className="text-center mt-4">
                <a 
                  href="/privacy" 
                  className="text-white underline text-sm hover:text-opacity-80"
                >
                  {t('landing.privacy.link', language)}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
