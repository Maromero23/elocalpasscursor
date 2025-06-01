'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RebuyEmailConfigPage() {
  const router = useRouter()
  
  // Rebuy Email Configuration State
  const [rebuyConfig, setRebuyConfig] = useState({
    // Timing Configuration
    triggerHoursBefore: 12,
    enableRebuyEmail: true,
    
    // Seller Tracking & Commission
    enableSellerTracking: true,
    commissionRate: 10, // percentage
    trackingMethod: 'url_param', // 'url_param' or 'discount_code'
    
    // Discount Configuration
    enableDiscountCode: true,
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 15,
    codePrefix: 'REBUY',
    codeValidityDays: 7,
    
    // Email Template Configuration
    emailSubject: 'Your eLocalPass expires soon - Get 15% off renewal!',
    emailHeaderText: 'Don\'t Miss Out!',
    emailMainMessage: 'Your eLocalPass expires in 12 hours. Renew now with an exclusive discount!',
    emailCtaText: 'Renew with 15% Off',
    emailFooterText: 'This exclusive offer expires soon. Renew now to keep enjoying local discounts!',
    
    // Website Configuration
    renewalWebsiteUrl: 'https://elocalpass.com/renew',
    trackingParameter: 'seller_id'
  })

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedConfig, setGeneratedConfig] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Add your submit logic here
    console.log(rebuyConfig)
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to QR Configuration
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Button 5: Rebuy Email Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure automatic emails sent before QR expiration to encourage renewals with seller tracking and discount codes.
          </p>
        </div>

        {/* Configuration Panel */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Timing Configuration */}
          <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <h2 className="text-xl font-bold text-red-900 mb-4">⏰ Email Timing Configuration</h2>
            <p className="text-red-700 text-sm mb-4">Configure when rebuy emails are automatically sent</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Trigger Email Hours Before Expiration
                </label>
                <select
                  value={rebuyConfig.triggerHoursBefore}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, triggerHoursBefore: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={6}>6 hours before</option>
                  <option value={12}>12 hours before</option>
                  <option value={24}>24 hours before</option>
                  <option value={48}>48 hours before</option>
                </select>
              </div>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={rebuyConfig.enableRebuyEmail}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, enableRebuyEmail: e.target.checked})}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-900">
                  Enable Automatic Rebuy Emails
                </span>
              </label>
            </div>
          </div>

          {/* Seller Tracking & Commission Configuration */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-bold text-blue-900 mb-4">🎯 Seller Tracking & Commission</h2>
            <p className="text-blue-700 text-sm mb-4">Track sales to give commission to original sellers</p>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={rebuyConfig.enableSellerTracking}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, enableSellerTracking: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-900">
                  Enable Seller Tracking for Commissions
                </span>
              </label>

              {rebuyConfig.enableSellerTracking && (
                <div className="space-y-4 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={rebuyConfig.commissionRate}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, commissionRate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Tracking Method
                    </label>
                    <select
                      value={rebuyConfig.trackingMethod}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, trackingMethod: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="url_param">URL Parameter (seller_id)</option>
                      <option value="discount_code">Discount Code Prefix</option>
                      <option value="both">Both URL + Discount Code</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Website Renewal URL
                    </label>
                    <input
                      type="url"
                      value={rebuyConfig.renewalWebsiteUrl}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, renewalWebsiteUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://elocalpass.com/renew"
                    />
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-xs text-blue-700">
                      <strong>Preview URL:</strong> {rebuyConfig.renewalWebsiteUrl}?seller_id=SELLER123&discount=REBUY15
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discount Code Configuration */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h2 className="text-xl font-bold text-green-900 mb-4">🎫 Discount Code Configuration</h2>
            <p className="text-green-700 text-sm mb-4">Automatic discount codes to incentivize renewals</p>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={rebuyConfig.enableDiscountCode}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, enableDiscountCode: e.target.checked})}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-900">
                  Include Discount Codes in Rebuy Emails
                </span>
              </label>

              {rebuyConfig.enableDiscountCode && (
                <div className="space-y-4 ml-7">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={rebuyConfig.discountType}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, discountType: e.target.value})}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        value={rebuyConfig.discountValue}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, discountValue: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Code Prefix
                      </label>
                      <input
                        type="text"
                        value={rebuyConfig.codePrefix}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, codePrefix: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Code Validity (Days)
                      </label>
                      <select
                        value={rebuyConfig.codeValidityDays}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, codeValidityDays: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-green-100 p-3 rounded">
                    <p className="text-xs text-green-700">
                      <strong>Example Code:</strong> {rebuyConfig.codePrefix}ABC123 - 
                      {rebuyConfig.discountType === 'percentage' ? `${rebuyConfig.discountValue}% off` : `$${rebuyConfig.discountValue} off`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Template Customization */}
          <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
            <h2 className="text-xl font-bold text-yellow-900 mb-4">✍️ Email Template Customization</h2>
            <p className="text-yellow-700 text-sm mb-4">Customize the email template to fit your brand</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={rebuyConfig.emailSubject}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, emailSubject: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-2">
                  Email Header Text
                </label>
                <input
                  type="text"
                  value={rebuyConfig.emailHeaderText}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeaderText: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-2">
                  Email Main Message
                </label>
                <textarea
                  value={rebuyConfig.emailMainMessage}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, emailMainMessage: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-2">
                  Email CTA Text
                </label>
                <input
                  type="text"
                  value={rebuyConfig.emailCtaText}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, emailCtaText: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-700 mb-2">
                  Email Footer Text
                </label>
                <textarea
                  value={rebuyConfig.emailFooterText}
                  onChange={(e) => setRebuyConfig({...rebuyConfig, emailFooterText: e.target.value})}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center py-8">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
