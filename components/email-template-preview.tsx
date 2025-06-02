'use client'

import React, { useState, useEffect } from 'react'

// Countdown Timer Component
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
      const emailSentTime = sentTimestamp || new Date() // Default to now if no timestamp provided
      const expirationTime = new Date(emailSentTime.getTime() + (hours * 60 * 60 * 1000)) // Add hours in milliseconds
      const remainingMs = expirationTime.getTime() - now.getTime()
      
      // Convert milliseconds to seconds, ensure it doesn't go below 0
      return Math.max(0, Math.floor(remainingMs / 1000))
    }

    // Set initial time
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
    <div 
      className="text-center py-2 px-4 bg-red-50 border border-red-200 rounded-lg"
      style={{ 
        borderColor: textColor,
        backgroundColor: `${textColor}10`
      }}
    >
      <p 
        className="text-sm font-medium mb-1"
        style={{ color: textColor, fontFamily, fontSize: `${parseInt(fontSize) - 2}px` }}
      >
        ⏰ Time Remaining Until Expiration:
      </p>
      <div 
        className="text-2xl font-bold font-mono"
        style={{ 
          color: textColor, 
          fontFamily: 'monospace, ' + fontFamily,
          fontSize: `${parseInt(fontSize) + 4}px`
        }}
      >
        {formatTime(timeLeft)}
      </div>
      <p 
        className="text-xs mt-1"
        style={{ color: textColor, fontFamily, fontSize: `${parseInt(fontSize) - 4}px` }}
      >
        hrs:min:sec
      </p>
      {timeLeft === 0 && (
        <p 
          className="text-xs mt-1 font-bold"
          style={{ color: '#dc2626', fontFamily }}
        >
          🚨 EXPIRED
        </p>
      )}
    </div>
  )
}

interface EmailTemplatePreviewProps {
  emailConfig: {
    useDefaultEmail: boolean
    emailHeaderText: string
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
    logoUrl: string
    bannerImages: string[]
    videoUrl: string
    customAffiliateMessage: string
    enableLocationBasedAffiliates: boolean
    emailAccountCreationUrl: string
    showExpirationTimer?: boolean
    sentTimestamp?: Date
  }
  sellerLocation?: string
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
  
  // Custom Email Template
  const CustomEmailTemplate = () => (
    <div 
      className="max-w-lg mx-auto border rounded-lg shadow-lg overflow-hidden"
      style={{ backgroundColor: emailConfig.emailBackgroundColor }}
    >
      {/* Custom Header */}
      <div 
        className="p-6 text-center"
        style={{ backgroundColor: emailConfig.emailPrimaryColor }}
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
      
      {/* Custom Content */}
      <div className="p-6 space-y-6">
        {/* Custom Message */}
        <div className="text-center">
          <p 
            style={{
              color: emailConfig.emailMessageTextColor,
              fontFamily: emailConfig.emailMessageFontFamily,
              fontSize: `${emailConfig.emailMessageFontSize}px`,
              lineHeight: '1.5'
            }}
          >
            {emailConfig.emailMessageText}
          </p>
        </div>
        
        {/* Custom Video Section */}
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
        
        {/* Custom Banners */}
        {emailConfig.bannerImages.length > 0 && (
          <div className="space-y-3">
            {emailConfig.bannerImages.slice(0, 2).map((banner, index) => (
              <div key={index} className="bg-gray-200 h-20 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Custom Banner {index + 1}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Custom CTA Button */}
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
        
        {/* Countdown Timer */}
        {emailConfig.showExpirationTimer && (
          <CountdownTimer 
            hours={12}
            textColor={emailConfig.emailNoticeTextColor}
            fontFamily={emailConfig.emailNoticeFontFamily}
            fontSize={emailConfig.emailNoticeFontSize}
            sentTimestamp={emailConfig.sentTimestamp}
          />
        )}
        
        {/* Custom Affiliate Section */}
        {emailConfig.enableLocationBasedAffiliates && (
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${emailConfig.emailSecondaryColor}20` }}
          >
            <h3 
              className="font-semibold mb-3"
              style={{ color: emailConfig.emailSecondaryColor }}
            >
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
            <p 
              className="text-sm mt-3"
              style={{ color: emailConfig.emailSecondaryColor }}
            >
              {emailConfig.customAffiliateMessage}
            </p>
          </div>
        )}
        
        {/* Custom Footer Message */}
        <div className="text-center border-t pt-4">
          <p 
            style={{
              color: emailConfig.emailFooterTextColor,
              fontFamily: emailConfig.emailFooterFontFamily,
              fontSize: `${emailConfig.emailFooterFontSize}px`
            }}
          >
            {emailConfig.emailFooterText}
          </p>
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
