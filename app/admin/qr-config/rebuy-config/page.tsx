'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EmailTemplatePreview from '@/components/email-template-preview'
import { ToastNotifications } from '@/components/toast-notification'
import { useToast } from '@/hooks/use-toast'

// Font families for typography
const fontFamilies = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Open Sans, sans-serif',
  'Roboto, sans-serif',
  'Montserrat, sans-serif',
  'Lato, sans-serif'
]

// Font sizes
const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48']

interface TextWithTypographyProps {
  label: string
  textKey: string
  colorKey: string
  fontFamilyKey: string
  fontSizeKey: string
  isTextarea?: boolean
  rows?: number
  formData: any
  setFormData: (data: any) => void
}

const TextWithTypography: React.FC<TextWithTypographyProps> = ({
  label,
  textKey,
  colorKey,
  fontFamilyKey,
  fontSizeKey,
  isTextarea = false,
  rows = 2,
  formData,
  setFormData
}) => {
  const InputComponent = isTextarea ? 'textarea' : 'input'

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      
      {/* Text Input */}
      <InputComponent
        type={isTextarea ? undefined : "text"}
        value={formData[textKey]}
        onChange={(e: any) => setFormData({...formData, [textKey]: e.target.value})}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={isTextarea ? rows : undefined}
      />
      
      {/* Typography Controls */}
      <div className="flex gap-2 items-end">
        {/* Color */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <input
            type="color"
            value={formData[colorKey]}
            onChange={(e) => setFormData({...formData, [colorKey]: e.target.value})}
            className="w-12 h-6 border border-gray-300 rounded cursor-pointer"
          />
        </div>
        
        {/* Font Family */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Font</label>
          <select
            value={formData[fontFamilyKey]}
            onChange={(e) => setFormData({...formData, [fontFamilyKey]: e.target.value})}
            className="w-24 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font.split(',')[0]}</option>
            ))}
          </select>
        </div>
        
        {/* Font Size */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Size</label>
          <select
            value={formData[fontSizeKey]}
            onChange={(e) => setFormData({...formData, [fontSizeKey]: e.target.value})}
            className="w-24 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function RebuyEmailConfigPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  
  // Get qrId from URL params for redirection back to specific config
  const qrId = searchParams.get('qrId')
  
  // Debug: Log qrId on component mount
  useEffect(() => {
    console.log('Rebuy Config Page - qrId from URL:', qrId)
    console.log('Current URL search params:', window.location.search)
  }, [qrId])
  
  // Rebuy Email Configuration State
  const [rebuyConfig, setRebuyConfig] = useState({
    // Timing Configuration
    triggerHoursBefore: 12,
    enableRebuyEmail: true,
    
    // Seller Tracking & Commission
    enableSellerTracking: true,
    commissionRate: 10, // percentage
    trackingMethod: 'url_param', // 'url_param' or 'discount_code'
    renewalWebsiteUrl: 'https://elocalpass.com/renew',
    trackingParameter: 'seller_id',
    
    // Discount Configuration
    enableDiscountCode: true,
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 15,
    codePrefix: 'REBUY',
    codeValidityDays: 7,
    
    // Enhanced Email Template Configuration
    emailSubject: 'Your eLocalPass expires soon - Get 15% off renewal!',
    
    // Header Typography
    emailHeader: 'Don\'t Miss Out!',
    emailHeaderColor: '#dc2626',
    emailHeaderFontFamily: 'Arial, sans-serif',
    emailHeaderFontSize: '28',
    
    // Main Message Typography  
    emailMessage: 'Your eLocalPass expires in 12 hours. Renew now with an exclusive discount!',
    emailMessageColor: '#374151',
    emailMessageFontFamily: 'Arial, sans-serif',
    emailMessageFontSize: '16',
    
    // CTA Button Typography
    emailCta: 'Renew with 15% Off',
    emailCtaColor: '#ffffff',
    emailCtaFontFamily: 'Arial, sans-serif',
    emailCtaFontSize: '18',
    emailCtaBackgroundColor: '#dc2626',
    
    // Footer Typography
    emailFooter: 'This exclusive offer expires soon. Renew now to keep enjoying local discounts!',
    emailFooterColor: '#6b7280',
    emailFooterFontFamily: 'Arial, sans-serif', 
    emailFooterFontSize: '14',
    
    // Brand Colors
    emailPrimaryColor: '#dc2626',
    emailSecondaryColor: '#f97316',
    emailBackgroundColor: '#ffffff',
    
    // Media Content
    logoUrl: '',
    bannerImages: [] as string[],
    newBannerUrl: '',
    videoUrl: '',
    
    // Affiliate Configuration
    enableFeaturedPartners: true,
    selectedAffiliates: [] as string[],
    customAffiliateMessage: 'Don\'t forget these amazing discounts are waiting for you:',
    
    // Advanced Options
    customCssStyles: '',
    urgencyMessage: 'Only {hours_left} hours left!',
    showExpirationTimer: true
  })

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedConfig, setGeneratedConfig] = useState('')
  const [rebuyTemplates, setRebuyTemplates] = useState<Array<{id: string, name: string, data: any, createdAt: Date}>>([])
  const [currentTemplateName, setCurrentTemplateName] = useState('')
  const [defaultTemplate, setDefaultTemplate] = useState<any>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    // Check for preview mode first
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    setIsPreviewMode(mode === 'preview')
    
    // Load saved templates (which includes loading custom templates in edit/preview mode)
    loadSavedTemplates()
    
    // Only load default template if NOT in edit or preview mode
    if (mode !== 'edit' && mode !== 'preview') {
      loadDefaultTemplate()
    }
  }, [])

  const loadSavedTemplates = () => {
    // Check if we're in edit mode or preview mode and load existing rebuy email config
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    
    if (mode === 'edit' || mode === 'preview') {
      const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
      if (rebuyEmailConfig) {
        try {
          const savedConfig = JSON.parse(rebuyEmailConfig)
          // Convert createdAt string back to Date object if it exists
          if (savedConfig.createdAt && typeof savedConfig.createdAt === 'string') {
            savedConfig.createdAt = new Date(savedConfig.createdAt)
          }
          setRebuyConfig(savedConfig.rebuyConfig)
          console.log('✅ Loaded existing rebuy email configuration for', mode)
        } catch (error) {
          console.log('Could not load rebuy email configuration:', error)
        }
      }
    }
    
    const savedTemplates = localStorage.getItem('elocalpass-rebuy-templates')
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates)
        // Convert createdAt strings back to Date objects
        const templatesWithDates = templates.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt)
        }))
        setRebuyTemplates(templatesWithDates)
      } catch (error) {
        console.log('Error loading rebuy templates:', error)
        setRebuyTemplates([])
      }
    }
  }

  const loadDefaultTemplate = () => {
    const defaultTemplate = localStorage.getItem('elocalpass-rebuy-default-template')
    if (defaultTemplate) {
      const parsedTemplate = JSON.parse(defaultTemplate)
      setDefaultTemplate(parsedTemplate)
      // Automatically apply the default template to the form
      setRebuyConfig(parsedTemplate)
    }
  }

  const saveTemplate = () => {
    if (!currentTemplateName.trim()) {
      toast.warning('Missing Template Name', 'Please enter a template name')
      return
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: currentTemplateName,
      data: rebuyConfig,
      createdAt: new Date()
    }

    const updatedTemplates = [...rebuyTemplates, newTemplate]
    setRebuyTemplates(updatedTemplates)
    localStorage.setItem('elocalpass-rebuy-templates', JSON.stringify(updatedTemplates))
    setCurrentTemplateName('')
    toast.success('Template Saved', `Template "${newTemplate.name}" saved successfully!`)
  }

  const loadTemplate = (template: any) => {
    setRebuyConfig(template.data)
    toast.success('Template Loaded', `Template "${template.name}" loaded successfully!`)
  }

  const saveAsDefault = () => {
    localStorage.setItem('elocalpass-rebuy-default-template', JSON.stringify(rebuyConfig))
    setDefaultTemplate(rebuyConfig)
    toast.success('Default Saved', 'Current configuration saved as default template!')
  }

  const loadDefault = () => {
    if (defaultTemplate) {
      setRebuyConfig(defaultTemplate)
      toast.success('Default Loaded', 'Default template loaded successfully!')
    }
  }

  const addBannerImage = () => {
    if (rebuyConfig.newBannerUrl.trim()) {
      setRebuyConfig({
        ...rebuyConfig,
        bannerImages: [...rebuyConfig.bannerImages, rebuyConfig.newBannerUrl],
        newBannerUrl: ''
      })
    }
  }

  const removeBannerImage = (index: number) => {
    setRebuyConfig({
      ...rebuyConfig,
      bannerImages: rebuyConfig.bannerImages.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call for now
      setTimeout(() => {
        const configId = Math.random().toString(36).substr(2, 9)
        
        // Save the rebuy email configuration to indicate Button 5 is complete
        const rebuyEmailConfig = {
          id: configId,
          name: `Rebuy Email Template - ${new Date().toLocaleDateString()}`,
          rebuyConfig: { ...rebuyConfig },
          createdAt: new Date(),
          isActive: true
        }
        
        // Save to localStorage so main QR config page knows Button 5 is configured
        localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(rebuyEmailConfig))
        
        // CRITICAL: Also update the saved configurations library if this template belongs to a saved config
        const savedConfigurations = JSON.parse(localStorage.getItem('elocalpass-saved-configurations') || '[]')
        const updatedConfigurations = savedConfigurations.map((config: any) => {
          // If this config has email templates, update the rebuy email template
          if (config.emailTemplates?.rebuyEmail) {
            return {
              ...config,
              emailTemplates: {
                ...config.emailTemplates,
                rebuyEmail: rebuyEmailConfig
              }
            }
          }
          return config
        })
        localStorage.setItem('elocalpass-saved-configurations', JSON.stringify(updatedConfigurations))
        
        // Set the generated config ID to display success message with ID
        setGeneratedConfig(configId)
        
        console.log('Rebuy email configuration saved:', rebuyConfig)
        toast.success('Rebuy Email Template Created', `Template "${rebuyEmailConfig.name}" created successfully! ID: ${configId}`)
        
        // Optional: Redirect back to QR config after 2 seconds
        setTimeout(() => {
          console.log('Rebuy Config - qrId for redirect:', qrId)
          if (qrId) {
            // Redirect back to specific QR config and expand it
            console.log('Redirecting to:', `/admin/qr-config?expand=${qrId}`)
            router.push(`/admin/qr-config?expand=${qrId}`)
          } else {
            // Redirect to main QR config page
            console.log('Redirecting to main QR config page')
            router.push('/admin/qr-config')
          }
        }, 2000)
        
        setIsSubmitting(false)
      }, 1000)
    } catch (error) {
      console.error('Error creating rebuy email configuration:', error)
      toast.error('Error Creating Rebuy Email Template', 'Error creating rebuy email configuration')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Button 5: Rebuy Email Configuration</h1>
              <p className="text-gray-600 text-sm">
                Configure automated rebuy emails sent 12 hours before QR code expiration
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to QR Configuration
            </button>
          </div>
        </div>

        {/* Template Management Section */}
        <div className="mb-6">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Template Management</h2>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Load Existing Template */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Load Saved Template
                </label>
                <select
                  onChange={(e) => {
                    const template = rebuyTemplates.find(t => t.id === e.target.value)
                    if (template) loadTemplate(template)
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a saved template...</option>
                  {rebuyTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (saved {new Date(template.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Current Template */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Save Current Configuration
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentTemplateName}
                    onChange={(e) => setCurrentTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={saveTemplate}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Default Template Actions */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Template {defaultTemplate ? '✅' : ''}
                </label>
                <div className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={saveAsDefault}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                    title="Save current configuration as the default template"
                  >
                    Save as Default
                  </button>
                  <button
                    type="button"
                    onClick={loadDefault}
                    disabled={!defaultTemplate}
                    className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-1 ${
                      defaultTemplate 
                        ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={defaultTemplate ? "Load the default template" : "No default template saved"}
                  >
                    Load Default
                  </button>
                </div>
                {defaultTemplate && (
                  <p className="text-xs text-green-600 mt-1">Default template auto-loaded ✨</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration Forms */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Timing Configuration */}
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                <h2 className="text-lg font-bold text-purple-900 mb-2">Email Timing Configuration</h2>
                <p className="text-purple-700 text-sm mb-2">Configure when rebuy emails are automatically sent</p>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-purple-700 mb-1">
                      Trigger Email Hours Before Expiration
                    </label>
                    <select
                      value={rebuyConfig.triggerHoursBefore}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, triggerHoursBefore: parseInt(e.target.value)})}
                      className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value={6}>6 hours before</option>
                      <option value={12}>12 hours before</option>
                      <option value={24}>24 hours before</option>
                      <option value={48}>48 hours before</option>
                    </select>
                  </div>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rebuyConfig.showExpirationTimer}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, showExpirationTimer: e.target.checked})}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-purple-900">
                      Show Live Countdown Timer in Email (12:00:00 → 00:00:00)
                    </span>
                  </label>
                  <p className="text-xs text-purple-600 mt-1 ml-6">
                    Timer starts when email is sent, shows actual time remaining until QR code expires
                  </p>
                </div>
              </div>

              {/* Seller Tracking & Commission Configuration */}
              <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                <h2 className="text-lg font-bold text-blue-900 mb-2">Seller Tracking & Commission</h2>
                <p className="text-blue-700 text-sm mb-2">Track sales to give commission to original sellers</p>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rebuyConfig.enableSellerTracking}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, enableSellerTracking: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-blue-900">
                      Enable Seller Tracking for Commissions
                    </span>
                  </label>

                  {rebuyConfig.enableSellerTracking && (
                    <div className="space-y-2 ml-5">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          Commission Rate (%)
                        </label>
                        <input
                          type="number"
                          value={rebuyConfig.commissionRate}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, commissionRate: parseFloat(e.target.value)})}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          Tracking Method
                        </label>
                        <select
                          value={rebuyConfig.trackingMethod}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, trackingMethod: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="url_param">URL Parameter (seller_id)</option>
                          <option value="discount_code">Discount Code Prefix</option>
                          <option value="both">Both URL + Discount Code</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          Website Renewal URL
                        </label>
                        <input
                          type="url"
                          value={rebuyConfig.renewalWebsiteUrl}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, renewalWebsiteUrl: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="https://elocalpass.com/renew"
                        />
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <p className="text-xs text-blue-700">
                          <strong>Preview URL:</strong> {rebuyConfig.renewalWebsiteUrl}?seller_id=SELLER123&discount=REBUY15
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount Code Configuration */}
              <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                <h2 className="text-lg font-bold text-green-900 mb-2">Discount Code Configuration</h2>
                <p className="text-green-700 text-sm mb-2">Automatic discount codes to incentivize renewals</p>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rebuyConfig.enableDiscountCode}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, enableDiscountCode: e.target.checked})}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs font-medium text-green-900">
                      Include Discount Codes in Rebuy Emails
                    </span>
                  </label>

                  {rebuyConfig.enableDiscountCode && (
                    <div className="space-y-2 ml-5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Discount Type
                          </label>
                          <select
                            value={rebuyConfig.discountType}
                            onChange={(e) => setRebuyConfig({...rebuyConfig, discountType: e.target.value})}
                            className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            value={rebuyConfig.discountValue}
                            onChange={(e) => setRebuyConfig({...rebuyConfig, discountValue: parseFloat(e.target.value)})}
                            className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Code Prefix
                          </label>
                          <input
                            type="text"
                            value={rebuyConfig.codePrefix}
                            onChange={(e) => setRebuyConfig({...rebuyConfig, codePrefix: e.target.value.toUpperCase()})}
                            className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            maxLength={10}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Code Validity (Days)
                          </label>
                          <select
                            value={rebuyConfig.codeValidityDays}
                            onChange={(e) => setRebuyConfig({...rebuyConfig, codeValidityDays: parseInt(e.target.value)})}
                            className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value={3}>3 Days</option>
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-green-100 p-2 rounded">
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
              <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200">
                <h2 className="text-lg font-bold text-yellow-900 mb-2">Email Template Customization</h2>
                <p className="text-yellow-700 text-sm mb-2">Customize the email template to fit your brand</p>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={rebuyConfig.emailSubject}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, emailSubject: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>

                  <TextWithTypography
                    label="Header Text"
                    textKey="emailHeader"
                    colorKey="emailHeaderColor"
                    fontFamilyKey="emailHeaderFontFamily"
                    fontSizeKey="emailHeaderFontSize"
                    formData={rebuyConfig}
                    setFormData={setRebuyConfig}
                  />

                  <TextWithTypography
                    label="Main Message"
                    textKey="emailMessage"
                    colorKey="emailMessageColor"
                    fontFamilyKey="emailMessageFontFamily"
                    fontSizeKey="emailMessageFontSize"
                    isTextarea={true}
                    rows={3}
                    formData={rebuyConfig}
                    setFormData={setRebuyConfig}
                  />

                  <TextWithTypography
                    label="CTA Button Text"
                    textKey="emailCta"
                    colorKey="emailCtaColor"
                    fontFamilyKey="emailCtaFontFamily"
                    fontSizeKey="emailCtaFontSize"
                    formData={rebuyConfig}
                    setFormData={setRebuyConfig}
                  />

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      CTA Button Background Color
                    </label>
                    <input
                      type="color"
                      value={rebuyConfig.emailCtaBackgroundColor}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, emailCtaBackgroundColor: e.target.value})}
                      className="w-12 h-6 border border-yellow-300 rounded cursor-pointer"
                    />
                  </div>

                  <TextWithTypography
                    label="Footer Text"
                    textKey="emailFooter"
                    colorKey="emailFooterColor"
                    fontFamilyKey="emailFooterFontFamily"
                    fontSizeKey="emailFooterFontSize"
                    formData={rebuyConfig}
                    setFormData={setRebuyConfig}
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={rebuyConfig.emailPrimaryColor}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, emailPrimaryColor: e.target.value})}
                        className="w-12 h-6 border border-yellow-300 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        value={rebuyConfig.emailSecondaryColor}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, emailSecondaryColor: e.target.value})}
                        className="w-12 h-6 border border-yellow-300 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={rebuyConfig.emailBackgroundColor}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, emailBackgroundColor: e.target.value})}
                        className="w-12 h-6 border border-yellow-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={rebuyConfig.logoUrl}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, logoUrl: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Banner Images
                    </label>
                    <input
                      type="url"
                      value={rebuyConfig.newBannerUrl}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, newBannerUrl: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={addBannerImage}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Add Banner Image
                    </button>
                    {rebuyConfig.bannerImages.length > 0 && (
                      <div className="space-y-1">
                        {rebuyConfig.bannerImages.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2 bg-yellow-100 p-1 rounded">
                            <span className="text-xs text-yellow-700 flex-1 truncate">{url}</span>
                            <button
                              type="button"
                              onClick={() => removeBannerImage(index)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 text-xs rounded"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={rebuyConfig.videoUrl}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, videoUrl: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Affiliate Configuration
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={rebuyConfig.enableFeaturedPartners}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, enableFeaturedPartners: e.target.checked})}
                        className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <span className="text-xs font-medium text-yellow-900">
                        Enable Featured Partners
                      </span>
                    </label>
                    {rebuyConfig.enableFeaturedPartners && (
                      <div>
                        <label className="block text-xs font-medium text-yellow-700 mb-1">
                          Selected Affiliates
                        </label>
                        <input
                          type="text"
                          value={rebuyConfig.selectedAffiliates.join(', ')}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, selectedAffiliates: e.target.value.split(', ').filter(Boolean)})}
                          className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">
                        Custom Affiliate Message
                      </label>
                      <input
                        type="text"
                        value={rebuyConfig.customAffiliateMessage}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, customAffiliateMessage: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-yellow-700 mb-1">
                      Advanced Options
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={rebuyConfig.showExpirationTimer}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, showExpirationTimer: e.target.checked})}
                        className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <span className="text-xs font-medium text-yellow-900">
                        Show Expiration Timer
                      </span>
                    </label>
                    {rebuyConfig.showExpirationTimer && (
                      <div>
                        <label className="block text-xs font-medium text-yellow-700 mb-1">
                          Urgency Message
                        </label>
                        <input
                          type="text"
                          value={rebuyConfig.urgencyMessage}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, urgencyMessage: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">
                        Custom CSS Styles
                      </label>
                      <textarea
                        value={rebuyConfig.customCssStyles}
                        onChange={(e) => setRebuyConfig({...rebuyConfig, customCssStyles: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center py-4">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Generated Config Display */}
            {generatedConfig && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2">✅ Rebuy Email Template Created!</h3>
                <div className="space-y-2">
                  <div className="text-sm text-green-700">
                    <p><strong>Template Name:</strong> Rebuy Email Template - {new Date().toLocaleDateString()}</p>
                    <p><strong>Configuration ID:</strong></p>
                    <div className="bg-white p-3 rounded border border-green-200 mt-1">
                      <code className="text-sm text-green-800 break-all">{generatedConfig}</code>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> This template is now saved and Button 5 is marked as complete. 
                      You'll be redirected back to the QR configuration page shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Email Preview */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-lg sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Live Email Preview</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <EmailTemplatePreview
                emailConfig={{
                  useDefaultEmail: false,
                  emailHeaderText: rebuyConfig.emailHeader,
                  emailHeaderTextColor: rebuyConfig.emailHeaderColor,
                  emailHeaderFontFamily: rebuyConfig.emailHeaderFontFamily,
                  emailHeaderFontSize: rebuyConfig.emailHeaderFontSize,
                  emailMessageText: rebuyConfig.emailMessage,
                  emailMessageTextColor: rebuyConfig.emailMessageColor,
                  emailMessageFontFamily: rebuyConfig.emailMessageFontFamily,
                  emailMessageFontSize: rebuyConfig.emailMessageFontSize,
                  emailCtaText: rebuyConfig.emailCta,
                  emailCtaTextColor: rebuyConfig.emailCtaColor,
                  emailCtaFontFamily: rebuyConfig.emailCtaFontFamily,
                  emailCtaFontSize: rebuyConfig.emailCtaFontSize,
                  emailCtaBackgroundColor: rebuyConfig.emailCtaBackgroundColor,
                  emailNoticeText: rebuyConfig.urgencyMessage || "Limited time offer!",
                  emailNoticeTextColor: rebuyConfig.emailMessageColor,
                  emailNoticeFontFamily: rebuyConfig.emailMessageFontFamily,
                  emailNoticeFontSize: rebuyConfig.emailMessageFontSize,
                  emailFooterText: rebuyConfig.emailFooter,
                  emailFooterTextColor: rebuyConfig.emailFooterColor,
                  emailFooterFontFamily: rebuyConfig.emailFooterFontFamily,
                  emailFooterFontSize: rebuyConfig.emailFooterFontSize,
                  emailPrimaryColor: rebuyConfig.emailPrimaryColor,
                  emailSecondaryColor: rebuyConfig.emailSecondaryColor,
                  emailBackgroundColor: rebuyConfig.emailBackgroundColor,
                  logoUrl: rebuyConfig.logoUrl,
                  bannerImages: rebuyConfig.bannerImages,
                  videoUrl: rebuyConfig.videoUrl,
                  customAffiliateMessage: rebuyConfig.customAffiliateMessage,
                  enableLocationBasedAffiliates: rebuyConfig.enableFeaturedPartners,
                  emailAccountCreationUrl: "https://elocalpass.com/register",
                  showExpirationTimer: rebuyConfig.showExpirationTimer,
                  sentTimestamp: new Date(Date.now() - (2 * 60 * 60 * 1000)) // Mock: email sent 2 hours ago for demo
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastNotifications 
        notifications={toast.notifications} 
        onRemove={toast.removeToast} 
      />
    </div>
  )
}
