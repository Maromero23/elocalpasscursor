'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
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

function RebuyEmailConfigPageContent() {
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
    emailHeaderTextColor: '#ffffff',
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
    const qrId = urlParams.get('qrId')
    
    if (mode === 'edit' || mode === 'preview') {
      console.log('🔧 REBUY CONFIG: Edit/Preview mode detected, qrId:', qrId)
      
      if (qrId) {
        // NEW: Load from database first (prioritize database)
        loadConfigurationForEdit(qrId)
      } else {
        // FALLBACK: Load from localStorage (legacy)
        const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
        if (rebuyEmailConfig) {
          try {
            const savedConfig = JSON.parse(rebuyEmailConfig)
            // Convert createdAt string back to Date object if it exists
            if (savedConfig.createdAt && typeof savedConfig.createdAt === 'string') {
              savedConfig.createdAt = new Date(savedConfig.createdAt)
            }
            setRebuyConfig(savedConfig.rebuyConfig)
            console.log('✅ Loaded existing rebuy email configuration from localStorage for', mode)
          } catch (error) {
            console.log('Could not load rebuy email configuration from localStorage:', error)
          }
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

  // NEW: Load configuration for editing from database
  const loadConfigurationForEdit = async (qrId: string) => {
    console.log('✅ REBUY LOAD DEBUG: Loading config from database for QR ID:', qrId)
    
    try {
      // Load configuration from database
      const response = await fetch(`/api/admin/saved-configs/${qrId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const config = await response.json()
        console.log('✅ REBUY LOAD DEBUG: Loaded config from database:', config)
        
        // Extract rebuy email template from the configuration
        if (config.emailTemplates?.rebuyEmail?.rebuyConfig) {
          console.log('✅ REBUY LOAD DEBUG: Found rebuy email template in database config')
          setRebuyConfig(config.emailTemplates.rebuyEmail.rebuyConfig)
          console.log('✅ REBUY LOAD DEBUG: Setting rebuy config from database:', config.emailTemplates.rebuyEmail.rebuyConfig)
          return // Successfully loaded from database
        } else {
          console.log('❌ REBUY LOAD DEBUG: No rebuy email template found in database config')
        }
      } else {
        console.error('❌ REBUY LOAD DEBUG: Failed to load config from database. Status:', response.status)
        const errorText = await response.text()
        console.error('❌ REBUY LOAD DEBUG: Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ REBUY LOAD DEBUG: Error loading config from database:', error)
    }
    
    // Database load failed - fallback to localStorage
    console.log('❌ REBUY LOAD DEBUG: Database load failed, falling back to localStorage')
    const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
    if (rebuyEmailConfig) {
      try {
        const savedConfig = JSON.parse(rebuyEmailConfig)
        // Convert createdAt string back to Date object if it exists
        if (savedConfig.createdAt && typeof savedConfig.createdAt === 'string') {
          savedConfig.createdAt = new Date(savedConfig.createdAt)
        }
        setRebuyConfig(savedConfig.rebuyConfig)
        console.log('✅ REBUY LOAD DEBUG: Loaded from localStorage fallback')
      } catch (error) {
        console.log('❌ REBUY LOAD DEBUG: Could not load from localStorage either:', error)
      }
    }
  }

  const loadDefaultTemplate = async () => {
    try {
      const response = await fetch('/api/admin/rebuy-templates', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.template && result.template.customHTML) {
          
          // Try to load the actual saved rebuy configuration
          if (result.template.headerText) {
            try {
              const savedRebuyConfig = JSON.parse(result.template.headerText)
              console.log('✅ Loading actual saved rebuy configuration from database:', savedRebuyConfig)
              setDefaultTemplate(savedRebuyConfig)
              setRebuyConfig(savedRebuyConfig)
              console.log('✅ Default rebuy template loaded from database with saved settings')
              return // Successfully loaded saved configuration
            } catch (error) {
              console.log('⚠️ Could not parse saved rebuy config, using fallback defaults')
            }
          }
          
          // Fallback to basic defaults if no saved configuration
          const defaultConfig = {
            // Timing Configuration
            triggerHoursBefore: 12,
            enableRebuyEmail: true,
            
            // Seller Tracking & Commission
            enableSellerTracking: true,
            commissionRate: 10,
            trackingMethod: 'url_param',
            renewalWebsiteUrl: 'https://elocalpass.com/renew',
            trackingParameter: 'seller_id',
            
            // Discount Configuration
            enableDiscountCode: true,
            discountType: 'percentage',
            discountValue: 15,
            codePrefix: 'REBUY',
            codeValidityDays: 7,
            
            // Enhanced Email Template Configuration
            emailSubject: result.template.subject,
            
            // Header Typography
            emailHeader: 'Don\'t Miss Out!',
            emailHeaderColor: '#dc2626',
            emailHeaderTextColor: '#ffffff',
            emailHeaderFontFamily: 'Arial, sans-serif',
            emailHeaderFontSize: '28',
            
            // Main Message Typography  
            emailMessage: 'Your eLocalPass expires soon. Renew now with an exclusive discount!',
            emailMessageColor: '#374151',
            emailMessageFontFamily: 'Arial, sans-serif',
            emailMessageFontSize: '16',
            
            // CTA Button Typography
            emailCta: 'Get Another ELocalPass',
            emailCtaColor: '#ffffff',
            emailCtaFontFamily: 'Arial, sans-serif',
            emailCtaFontSize: '18',
            emailCtaBackgroundColor: '#dc2626',
            
            // Footer Typography
            emailFooter: 'Thank you for choosing ELocalPass for your local adventures!',
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
          }
          setDefaultTemplate(defaultConfig)
          setRebuyConfig(defaultConfig)
          console.log('⚠️ Using fallback default configuration (no saved config found)')
        }
      } else {
        console.log('ℹ️ No default rebuy template found in database, using fallback')
        // Fallback to localStorage if database fails
        const localTemplate = localStorage.getItem('elocalpass-rebuy-default-template')
        if (localTemplate) {
          const parsedTemplate = JSON.parse(localTemplate)
      setDefaultTemplate(parsedTemplate)
      setRebuyConfig(parsedTemplate)
          console.log('✅ Loaded default template from localStorage fallback')
        }
      }
    } catch (error) {
      console.error('❌ Error loading default template from database:', error)
      // Fallback to localStorage
      const localTemplate = localStorage.getItem('elocalpass-rebuy-default-template')
      if (localTemplate) {
        const parsedTemplate = JSON.parse(localTemplate)
        setDefaultTemplate(parsedTemplate)
        setRebuyConfig(parsedTemplate)
        console.log('✅ Loaded default template from localStorage fallback after error')
      }
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

  const saveAsDefault = async () => {
    try {
      const response = await fetch('/api/admin/rebuy-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rebuyConfig: rebuyConfig,
          action: 'saveAsDefault'
        })
      })

      if (response.ok) {
        const result = await response.json()
    setDefaultTemplate(rebuyConfig)
        toast.success('Default Saved to Database', `Template saved successfully! HTML Length: ${result.template.htmlLength} characters`)
        console.log('✅ Default rebuy template saved to database:', result)
      } else {
        const error = await response.json()
        toast.error('Failed to Save Default', error.details || 'Error saving default template to database')
        console.error('❌ Error saving default template:', error)
      }
    } catch (error) {
      console.error('❌ Error saving default template:', error)
      toast.error('Network Error', 'Failed to save default template')
    }
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
    
    // Generate the actual HTML template from the rebuy configuration
    const generateCustomRebuyEmailHtml = (config: any, sellerLocation: string = "Playa del Carmen") => {
      if (!config.enableRebuyEmail) {
        // Return null for disabled rebuy email - system will not send rebuy emails
        return null
      }
      
      // Generate advanced custom rebuy HTML template with countdown timer and featured partners
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.emailSubject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; background-color: ${config.emailBackgroundColor || '#f5f5f5'}; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${config.emailBackgroundColor || 'white'}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${config.emailHeaderColor || '#dc2626'}; padding: 24px; text-align: center; }
        .header h1 { color: ${config.emailHeaderTextColor || 'white'}; font-family: ${config.emailHeaderFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailHeaderFontSize || '24'}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${config.emailMessageColor || '#374151'}; font-family: ${config.emailMessageFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailMessageFontSize || '16'}px; line-height: 1.5; margin: 0; }
        .highlight-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .highlight-box p { color: #92400e; font-weight: 500; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor || config.emailHeaderColor || '#dc2626'}; color: ${config.emailCtaColor || 'white'}; font-family: ${config.emailCtaFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailCtaFontSize || '16'}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .details { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .details h3 { color: #374151; font-weight: 600; margin: 0 0 12px 0; }
        .detail-item { display: flex; justify-content: space-between; margin: 8px 0; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #374151; font-weight: 600; }
        .discount-banner { background: linear-gradient(135deg, ${config.emailPrimaryColor || '#dc2626'}, ${config.emailSecondaryColor || '#ef4444'}); color: white; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px; }
        .discount-banner h2 { margin: 0 0 8px 0; font-size: 20px; }
        .discount-banner p { margin: 0; font-size: 14px; opacity: 0.9; }
        .countdown-timer { background-color: #f8fafc; border: 2px solid #e2e8f0; padding: 16px; margin: 24px 0; border-radius: 8px; text-align: center; }
        .countdown-timer p { color: #4a5568; font-weight: 500; margin: 0 0 8px 0; font-size: 14px; }
        .countdown-display { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #2d3748; margin: 8px 0; }
        .countdown-label { font-size: 12px; color: #718096; margin: 0; }
        .banner-images { margin: 20px 0; }
        .banner-image { width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; }
        .featured-partners { background-color: #fff7ed; padding: 16px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #f97316; }
        .featured-partners h3 { color: #c2410c; font-weight: 600; margin: 0 0 12px 0; }
        .partners-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .partner-item { background-color: white; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #fed7aa; }
        .partner-placeholder { width: 100%; height: 32px; background-color: #f3f4f6; border-radius: 4px; margin-bottom: 4px; }
        .partner-name { font-size: 11px; color: #9a3412; font-weight: 500; }
        .partners-message { color: #c2410c; font-size: 14px; margin: 12px 0 0 0; }
        .footer-message { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
        .footer-message p { color: ${config.emailFooterColor || '#6b7280'}; font-family: ${config.emailFooterFontFamily || 'Arial, sans-serif'}; font-size: ${config.emailFooterFontSize || '14'}px; margin: 0; }
        .email-footer { background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
        @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content { padding: 16px; }
            .partners-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            ${config.logoUrl ? `<div style="margin-bottom: 16px;"><img src="${config.logoUrl}" alt="Logo" style="height: 40px; width: auto;"></div>` : ''}
            <h1>${config.emailHeader || 'Don\'t Miss Out!'}</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Main Message -->
            <div class="message">
                <p>Hello {customerName},</p>
                <p style="margin-top: 16px;">${config.emailMessage || 'Your eLocalPass expires soon. Renew now with an exclusive discount!'}</p>
            </div>
            
            <!-- Banner Images Section -->
            ${config.bannerImages && config.bannerImages.length > 0 ? `
            <div class="banner-images">
                ${config.bannerImages.map((imageUrl: string) => `
                    <img src="${imageUrl}" alt="Promotional Banner" class="banner-image" />
                `).join('')}
            </div>
            ` : ''}
            
            <!-- Video Section -->
            ${config.videoUrl ? `
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <div style="background-color: #e5e7eb; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <div style="color: #6b7280;">
                        🎥 Promotional Video<br>
                        <span style="font-size: 12px;">Click to watch</span>
                    </div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Watch this special message about your renewal!</p>
                <a href="${config.videoUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">▶ Watch Video</a>
            </div>
            ` : ''}
            
            <!-- Countdown Timer (if enabled) -->
            ${config.showExpirationTimer !== false ? `
            <div class="countdown-timer">
                <p>⏰ Time Remaining Until Expiration:</p>
                <div class="countdown-display" id="countdown-timer">12:00:00</div>
                <p class="countdown-label">hrs:min:sec</p>
            </div>
            <script>
                (function() {
                    function updateCountdown() {
                        try {
                            const now = new Date();
                            // Use the actual expiration timestamp passed from the rebuy email system
                            const expirationTime = new Date('{qrExpirationTimestamp}');
                            
                            const remainingMs = expirationTime.getTime() - now.getTime();
                            const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
                            
                            const hours = Math.floor(remainingSeconds / 3600);
                            const minutes = Math.floor((remainingSeconds % 3600) / 60);
                            const seconds = remainingSeconds % 60;
                            
                            const timeString = hours.toString().padStart(2, '0') + ':' + 
                                             minutes.toString().padStart(2, '0') + ':' + 
                                             seconds.toString().padStart(2, '0');
                            
                            const timerElement = document.getElementById('countdown-timer');
                            if (timerElement) {
                                timerElement.innerHTML = timeString;
                                
                                if (remainingSeconds === 0) {
                                    timerElement.innerHTML = '🚨 EXPIRED';
                                    timerElement.style.color = '#dc2626';
                                    timerElement.style.fontWeight = 'bold';
                                }
                            }
                        } catch (error) {
                            // Fallback to static display if JavaScript fails
                            const timerElement = document.getElementById('countdown-timer');
                            if (timerElement) {
                                timerElement.innerHTML = '{hoursLeft}:00:00';
                            }
                        }
                    }
                    
                    // Start countdown immediately
                    updateCountdown();
                    
                    // Update every second
                    setInterval(updateCountdown, 1000);
                })();
            </script>
            ` : ''}
            
            <!-- Urgency Notice -->
            <div class="highlight-box">
                <p>${config.urgencyMessage ? config.urgencyMessage.replace('{hours_left}', '{hoursLeft}') : '⏰ Your ELocalPass expires in {hoursLeft} hours - Don\'t miss out on amazing local experiences!'}</p>
            </div>
            
            <!-- Current Pass Details -->
            <div class="details">
                <h3>Your Current ELocalPass Details:</h3>
                <div class="detail-item">
                    <span class="detail-label">Guests:</span>
                    <span class="detail-value">{guests} people</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">{days} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Expires:</span>
                    <span class="detail-value">In {hoursLeft} hours</span>
                </div>
            </div>
            
            ${config.enableDiscountCode ? `
            <!-- Discount Offer -->
            <div class="discount-banner">
                <h2>🎉 Special ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} OFF!</h2>
                <p>Get another ELocalPass now and save ${config.discountValue}${config.discountType === 'percentage' ? '%' : '$'} on your next adventure</p>
            </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div class="cta-button">
                <a href="{rebuyUrl}">${config.emailCta || 'Get Another ELocalPass'}</a>
            </div>
            
            <!-- Featured Partners (if enabled) -->
            ${config.enableFeaturedPartners ? `
            <div class="featured-partners">
                <h3>Featured Partners in ${sellerLocation}</h3>
                <div class="partners-grid">
                    <div class="partner-item">
                        <div class="partner-placeholder"></div>
                        <div class="partner-name">Local Restaurant</div>
                    </div>
                    <div class="partner-item">
                        <div class="partner-placeholder"></div>
                        <div class="partner-name">Adventure Tours</div>
                    </div>
                </div>
                <p class="partners-message">${config.customAffiliateMessage || 'Don\'t forget these amazing discounts are waiting for you:'}</p>
            </div>
            ` : ''}
            
            <!-- Seller Tracking Message -->
            ${config.enableSellerTracking ? `
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-weight: 500; margin: 0;">
                    💼 Supporting Local Business: Your purchase helps support the local seller who provided your original pass.
                </p>
            </div>
            ` : ''}
            
            <!-- Footer Message -->
            <div class="footer-message">
                <p>${config.emailFooter || 'Thank you for choosing ELocalPass for your local adventures!'}</p>
                <p style="margin-top: 8px; font-size: 12px;">
                    Need help? Visit your <a href="{customerPortalUrl}" style="color: #3b82f6;">customer portal</a> or contact support.
                </p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div class="email-footer">
            <p>© 2025 eLocalPass. All rights reserved.</p>
            <p style="margin-top: 4px;">
                You received this email because your ELocalPass is expiring soon.
                <a href="#" style="color: #3b82f6;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`
    }

    const saveToLocalStorage = () => {
      setTimeout(() => {
        // CRITICAL FIX: Generate HTML with CURRENT colors every time we save
        const customHTML = generateCustomRebuyEmailHtml(rebuyConfig)
        
        // Create the rebuy email configuration object with customHTML
        const rebuyEmailConfig = {
          id: qrId || Math.random().toString(36).substr(2, 9),
          name: `Rebuy Email Template - ${new Date().toLocaleDateString()}`,
          rebuyConfig: { ...rebuyConfig },
          customHTML: customHTML, // Add the freshly generated HTML
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
        setGeneratedConfig(rebuyEmailConfig.id)
        
        console.log('Rebuy email configuration saved:', rebuyConfig)
        toast.success('Rebuy Email Template Created', `Template "${rebuyEmailConfig.name}" created successfully! ID: ${rebuyEmailConfig.id}`)
        
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
    }
    
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const qrId = urlParams.get('qrId')
      
      // CRITICAL FIX: Generate HTML with CURRENT colors every time we save
      const customHTML = generateCustomRebuyEmailHtml(rebuyConfig)
      
      // Create the rebuy email configuration object
      const rebuyEmailConfig = {
        id: qrId || Math.random().toString(36).substr(2, 9),
        name: `Rebuy Email Template - ${new Date().toLocaleDateString()}`,
        rebuyConfig: { ...rebuyConfig },
        customHTML: customHTML,
        createdAt: new Date(),
        isActive: true
      }
      
      if (qrId) {
        // NEW: Save to database (prioritize database)
        console.log('✅ REBUY SAVE DEBUG: Saving to database for QR ID:', qrId)
        
        // Load existing configuration from database and update it
        fetch(`/api/admin/saved-configs/${qrId}`, {
          credentials: 'include'
        })
        .then(response => {
          if (response.ok) {
            return response.json()
          } else {
            throw new Error(`Failed to load config from database. Status: ${response.status}`)
          }
        })
        .then(existingConfig => {
          console.log('✅ REBUY SAVE DEBUG: Loaded existing config from database:', existingConfig)
          
          // Update the configuration with the new rebuy email template
          const updatedConfig = {
            ...existingConfig,
            emailTemplates: {
              ...existingConfig.emailTemplates,
              rebuyEmail: rebuyEmailConfig
            }
          }
          
          // Save updated configuration back to database
          return fetch(`/api/admin/saved-configs/${qrId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updatedConfig)
          })
        })
        .then(updateResponse => {
          if (updateResponse.ok) {
            console.log('✅ REBUY SAVE DEBUG: Successfully saved to database')
            setGeneratedConfig(qrId)
            toast.success('Rebuy Email Configuration Saved', `Rebuy Email Template saved to database successfully! Returning to QR Config...`)
            
            // Redirect back to QR config after 2 seconds
            setTimeout(() => {
              console.log('Rebuy Config - qrId for redirect:', qrId)
              router.push(`/admin/qr-config?expand=${qrId}`)
            }, 2000)
            
            setIsSubmitting(false)
            return // Successfully saved to database
          } else {
            throw new Error(`Failed to update config in database. Status: ${updateResponse.status}`)
          }
        })
        .catch(error => {
          console.error('❌ REBUY SAVE DEBUG: Error saving to database:', error)
          
          // Database save failed - fallback to localStorage
          console.log('❌ REBUY SAVE DEBUG: Database save failed, falling back to localStorage')
          saveToLocalStorage()
        })
      } else {
        // No qrId - save to localStorage
        saveToLocalStorage()
      }
      
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
              onClick={() => {
                if (qrId) {
                  // If we have a qrId, navigate back to QR config with library open and config expanded
                  router.push(`/admin/qr-config?showLibrary=true&expandConfig=${qrId}`)
                } else {
                  // Otherwise just go back to the main QR config page
                  router.push('/admin/qr-config')
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← {qrId ? 'Back to QR Config Library' : 'Back to QR Configuration'}
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

                  {/* Header Text with separate background and text color controls */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Header Text</label>
                    
                    {/* Header Text Input */}
                    <input
                      type="text"
                      value={rebuyConfig.emailHeader}
                      onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeader: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    {/* Typography Controls */}
                    <div className="flex gap-2 items-end">
                      {/* Header Background Color */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={rebuyConfig.emailHeaderColor}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeaderColor: e.target.value})}
                          className="w-12 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      
                      {/* Header Text Color */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={rebuyConfig.emailHeaderTextColor || '#ffffff'}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeaderTextColor: e.target.value})}
                          className="w-12 h-6 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      
                      {/* Font Family */}
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Font</label>
                        <select
                          value={rebuyConfig.emailHeaderFontFamily}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeaderFontFamily: e.target.value})}
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
                          value={rebuyConfig.emailHeaderFontSize}
                          onChange={(e) => setRebuyConfig({...rebuyConfig, emailHeaderFontSize: e.target.value})}
                          className="w-24 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {fontSizes.map(size => (
                            <option key={size} value={size}>{size}px</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

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
                        Primary Color <span className="text-gray-500">(Discount Banner)</span>
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
                        Secondary Color <span className="text-gray-500">(Partners Section)</span>
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
                        Email Background <span className="text-gray-500">(Overall)</span>
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
                  emailHeaderColor: rebuyConfig.emailHeaderColor,
                  emailHeaderTextColor: rebuyConfig.emailHeaderTextColor,
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

export default function RebuyEmailConfigPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <RebuyEmailConfigPageContent />
    </Suspense>
  )
}
