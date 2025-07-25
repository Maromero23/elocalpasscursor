'use client'

import React, { useState, useEffect } from 'react'

// Enhanced interface to match actual email template
interface EmailTemplatePreviewProps {
  emailConfig: {
    useDefaultEmail: boolean
    emailHeaderText: string
    emailHeaderColor: string
    emailHeaderTextColor: string
    emailHeaderFontFamily: string
    emailHeaderFontSize: string
    emailMessageText: string
    emailMessageTextColor: string
    emailMessageFontFamily: string
    emailMessageFontSize: string
    emailCtaText: string
    emailCtaTextColor: string
    emailCtaFontFamily: string
    emailCtaFontSize: string
    emailCtaBackgroundColor: string
    emailNoticeText: string
    emailNoticeTextColor: string
    emailNoticeFontFamily: string
    emailNoticeFontSize: string
    emailFooterText: string
    emailFooterTextColor: string
    emailFooterFontFamily: string
    emailFooterFontSize: string
    emailPrimaryColor: string
    emailSecondaryColor: string
    emailBackgroundColor: string
    logoUrl?: string
    bannerImages: string[]
    videoUrl?: string
    customAffiliateMessage?: string
    enableLocationBasedAffiliates: boolean
    emailAccountCreationUrl: string
    showExpirationTimer: boolean
    sentTimestamp?: Date
    // NEW: Enhanced configuration options to match actual email
    enableDiscountCode?: boolean
    discountValue?: number
    discountType?: 'percentage' | 'fixed'
    enableFeaturedPartners?: boolean
    enableSellerTracking?: boolean
    urgencyMessage?: string
    showCurrentPassDetails?: boolean
    customerName?: string
    qrCode?: string
    guests?: number
    days?: number
    hoursLeft?: number
  }
  sellerLocation?: string
}

// Enhanced Countdown Timer Component
const CountdownTimer: React.FC<{ 
  hours: number, 
  textColor: string, 
  fontFamily: string, 
  fontSize: string,
  sentTimestamp?: Date
}> = ({ hours, textColor, fontFamily, fontSize, sentTimestamp }) => {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const emailSentTime = sentTimestamp || new Date()
      const expirationTime = new Date(emailSentTime.getTime() + (hours * 60 * 60 * 1000))
      const remainingMs = expirationTime.getTime() - now.getTime()
      return Math.max(0, Math.floor(remainingMs / 1000))
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [hours, sentTimestamp])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-50 border-2 border-gray-200 p-4 my-6 rounded-lg text-center">
      <p className="text-gray-600 font-medium mb-2 text-sm">⏰ Time Remaining Until Expiration:</p>
      <div 
        className="font-mono text-2xl font-bold text-gray-800 my-2"
        style={{ 
          fontFamily: 'Courier New, monospace',
          color: '#2d3748'
        }}
      >
        {formatTime(timeLeft)}
      </div>
      <p className="text-gray-500 text-xs">hrs:min:sec</p>
    </div>
  )
}

const EmailTemplatePreview: React.FC<EmailTemplatePreviewProps> = ({ 
  emailConfig, 
  sellerLocation = "Playa del Carmen" 
}) => {
  
  // Default Email Template
  const DefaultEmailTemplate = () => (
    <div className="max-w-lg mx-auto bg-white border rounded-lg shadow-lg overflow-hidden">
      {/* Email Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
        <div className="mb-4">
          <img 
            src="/api/placeholder/120/40" 
            alt="eLocalPass Logo" 
            className="mx-auto h-10 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to eLocalPass!</h1>
        <p className="text-blue-100 text-sm">Your gateway to local experiences</p>
      </div>
      
      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🎉 Congratulations!
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Starting today you will be able to pay like a local while on vacation with eLocalPass. 
            Enjoy exclusive discounts and authentic experiences in <strong>{sellerLocation}</strong>.
          </p>
        </div>
        
        {/* Video Section (if enabled) */}
        {emailConfig.videoUrl && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center mb-3">
              <div className="text-gray-500">
                🎥 Welcome Video<br />
                <span className="text-xs">Click to play</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Watch this quick intro to get started!</p>
          </div>
        )}
        
        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-block">
            Create Your Account & Access Your eLocalPass
          </button>
        </div>
        
        {/* Important Notice */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700 text-sm font-medium">
            ⚠️ IMPORTANT: Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.
          </p>
        </div>
        
        {/* Location-Based Affiliates */}
        {emailConfig.enableLocationBasedAffiliates && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-3">
              Featured Partners in {sellerLocation}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded text-center border">
                <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                Local Restaurant
              </div>
              <div className="bg-white p-2 rounded text-center border">
                <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                Adventure Tours
              </div>
            </div>
            <p className="text-orange-700 text-sm mt-3">
              {emailConfig.customAffiliateMessage || 'Discover amazing local discounts at these partner establishments:'}
            </p>
          </div>
        )}
        
        {/* Footer Message */}
        <div className="text-center text-gray-600 text-sm border-t pt-4">
          <p>Enjoy hundreds of discounts throughout your destination!</p>
          <p className="mt-2">Click below and discover all the benefits.</p>
        </div>
      </div>
      
      {/* Email Footer */}
      <div className="bg-gray-100 p-4 text-center text-xs text-gray-500">
        <p> 2025 eLocalPass. All rights reserved.</p>
        <p className="mt-1">
          You received this email because you obtained an eLocalPass. 
          <a href="#" className="text-blue-600 hover:underline">Unsubscribe</a>
        </p>
      </div>
    </div>
  )
  
  // Enhanced Custom Email Template - Matches Actual Email Design
  const CustomEmailTemplate = () => (
    <div 
      className="max-w-lg mx-auto border rounded-lg shadow-lg overflow-hidden"
      style={{ backgroundColor: emailConfig.emailBackgroundColor }}
    >
      {/* Header */}
      <div 
        className="p-6 text-center"
        style={{ backgroundColor: emailConfig.emailHeaderColor || emailConfig.emailPrimaryColor }}
      >
        {emailConfig.logoUrl && (
          <div className="mb-4">
            <img 
              src={emailConfig.logoUrl} 
              alt="Logo" 
              className="mx-auto h-10 w-auto"
            />
          </div>
        )}
        <h1 
          style={{
            color: emailConfig.emailHeaderTextColor,
            fontFamily: emailConfig.emailHeaderFontFamily,
            fontSize: `${emailConfig.emailHeaderFontSize}px`,
            fontWeight: 'bold',
            margin: 0
          }}
        >
          {emailConfig.emailHeaderText}
        </h1>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Main Message */}
        <div className="text-center">
          <p style={{ margin: 0, marginBottom: '16px', color: emailConfig.emailMessageTextColor }}>
            Hello {emailConfig.customerName || 'peter pereset futuro'},
          </p>
          <p 
            style={{
              color: emailConfig.emailMessageTextColor,
              fontFamily: emailConfig.emailMessageFontFamily,
              fontSize: `${emailConfig.emailMessageFontSize}px`,
              lineHeight: '1.5',
              margin: 0
            }}
          >
            {emailConfig.emailMessageText}
          </p>
        </div>
        
        {/* Banner Images Section */}
        {emailConfig.bannerImages.length > 0 && (
          <div className="space-y-2">
            {emailConfig.bannerImages.slice(0, 2).map((banner, index) => (
              <img 
                key={index} 
                src={banner} 
                alt={`Promotional Banner ${index + 1}`} 
                className="w-full rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ))}
          </div>
        )}
        
        {/* Video Section */}
        {emailConfig.videoUrl && (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="bg-gray-200 h-32 rounded-lg flex items-center justify-center mb-3">
              <div className="text-gray-500">
                🎥 Promotional Video<br />
                <span className="text-xs">Click to watch</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">Watch this special message about your renewal!</p>
            <a href={emailConfig.videoUrl} className="text-blue-600 text-sm">▶ Watch Video</a>
          </div>
        )}
        
        {/* Countdown Timer (if enabled) */}
        {emailConfig.showExpirationTimer && (
          <CountdownTimer 
            hours={emailConfig.hoursLeft || 12}
            textColor={emailConfig.emailNoticeTextColor}
            fontFamily={emailConfig.emailNoticeFontFamily}
            fontSize={emailConfig.emailNoticeFontSize}
            sentTimestamp={emailConfig.sentTimestamp}
          />
        )}
        
        {/* Urgency Notice with Dynamic Countdown */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-800 font-medium text-sm">
            ⏰ Your ELocalPass expires in <span className="font-bold text-red-600">{emailConfig.hoursLeft || 24} hours</span> - Don't miss out on amazing local experiences!
          </p>
        </div>
        
        {/* Current Pass Details */}
        {emailConfig.showCurrentPassDetails !== false && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-gray-800 font-semibold mb-3">Your Current ELocalPass Details:</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Guests:</span>
                <span className="text-gray-800 font-semibold">{emailConfig.guests || 1} people</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Duration:</span>
                <span className="text-gray-800 font-semibold">{emailConfig.days || 1} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Expires:</span>
                <span className="text-gray-800 font-semibold">In {emailConfig.hoursLeft || 24} hours</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Discount Offer */}
        {emailConfig.enableDiscountCode && (
          <div 
            className="p-4 text-white text-center rounded-lg"
            style={{ 
              background: `linear-gradient(135deg, ${emailConfig.emailPrimaryColor}, ${emailConfig.emailSecondaryColor})` 
            }}
          >
            <h2 className="text-xl font-bold mb-2">
              🎉 Special {emailConfig.discountValue}{emailConfig.discountType === 'percentage' ? '%' : '$'} OFF!
            </h2>
            <p className="text-sm opacity-90">
              Get another ELocalPass now and save {emailConfig.discountValue}{emailConfig.discountType === 'percentage' ? '%' : '$'} on your next adventure
            </p>
          </div>
        )}
        
        {/* CTA Button */}
        <div className="text-center">
          <button 
            style={{
              backgroundColor: emailConfig.emailCtaBackgroundColor,
              color: emailConfig.emailCtaTextColor,
              fontFamily: emailConfig.emailCtaFontFamily,
              fontSize: `${emailConfig.emailCtaFontSize}px`,
              fontWeight: '500',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {emailConfig.emailCtaText}
          </button>
        </div>
        
        {/* Featured Partners (if enabled) */}
        {emailConfig.enableFeaturedPartners && (
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <h3 className="text-orange-800 font-semibold mb-3">
              Featured Partners in {sellerLocation}
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white p-2 rounded text-center border border-orange-200">
                <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                <div className="text-xs text-orange-900 font-medium">Local Restaurant</div>
              </div>
              <div className="bg-white p-2 rounded text-center border border-orange-200">
                <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                <div className="text-xs text-orange-900 font-medium">Adventure Tours</div>
              </div>
            </div>
            <p className="text-orange-800 text-sm">
              {emailConfig.customAffiliateMessage || 'Don\'t forget these amazing discounts are waiting for you:'}
            </p>
          </div>
        )}
        
        {/* Seller Tracking Message */}
        {emailConfig.enableSellerTracking && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-800 font-medium text-sm">
              💼 Supporting Local Business: Your purchase helps support the local seller who provided your original pass.
            </p>
          </div>
        )}
        
        {/* Footer Message */}
        <div className="text-center border-t pt-4">
          <p 
            style={{
              color: emailConfig.emailFooterTextColor,
              fontFamily: emailConfig.emailFooterFontFamily,
              fontSize: `${emailConfig.emailFooterFontSize}px`,
              margin: 0
            }}
          >
            {emailConfig.emailFooterText}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Need help? Visit your <a href="#" className="text-blue-600">customer portal</a> or contact support.
          </p>
        </div>
      </div>
      
      {/* Email Footer */}
      <div className="bg-gray-100 p-4 text-center text-xs text-gray-500">
        <p>© 2025 eLocalPass. All rights reserved.</p>
        <p className="mt-1">
          You received this email because your ELocalPass is expiring soon. 
          <a href="#" className="text-blue-600 hover:underline">Unsubscribe</a>
        </p>
      </div>
    </div>
  )
  
  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          📧 Email Template Preview
        </h3>
        <p className="text-sm text-gray-600">
          {emailConfig.useDefaultEmail ? 'Default Email Template' : 'Custom Email Template'}
        </p>
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg">
        {emailConfig.useDefaultEmail ? <DefaultEmailTemplate /> : <CustomEmailTemplate />}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        📱 Email templates are mobile-responsive and work across all major email clients
      </div>
    </div>
  )
}

export default EmailTemplatePreview


