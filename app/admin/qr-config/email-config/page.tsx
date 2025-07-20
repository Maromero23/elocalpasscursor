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
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Text Content</label>
          <InputComponent
            type={isTextarea ? undefined : "text"}
            value={formData[textKey] || ''}
            onChange={(e) => setFormData({...formData, [textKey]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={isTextarea ? rows : undefined}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Color</label>
            <input
              type="color"
              value={formData[colorKey] || '#000000'}
              onChange={(e) => setFormData({...formData, [colorKey]: e.target.value})}
              className="w-full h-10 rounded-md border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Font</label>
            <select
              value={formData[fontFamilyKey] || 'Arial, sans-serif'}
              onChange={(e) => setFormData({...formData, [fontFamilyKey]: e.target.value})}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>{font.split(',')[0]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Size</label>
            <select
              value={formData[fontSizeKey] || '16'}
              onChange={(e) => setFormData({...formData, [fontSizeKey]: e.target.value})}
              className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailConfigPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  
  // Get qrId from URL params for redirection back to specific config
  const qrId = searchParams.get('qrId')
  
  // Auto-detect template mode from URL or previous page choice
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    
    if (mode === 'custom') {
      setEmailConfig(prev => ({ ...prev, useDefaultEmail: false }))
    } else if (mode === 'default') {
      setEmailConfig(prev => ({ ...prev, useDefaultEmail: true }))
    }
  }, [])

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedEmailConfig, setGeneratedEmailConfig] = useState('')
  
  // Template Management State
  const [emailTemplates, setEmailTemplates] = useState<Array<{id: string, name: string, data: any, createdAt: Date}>>([])
  const [currentEmailTemplateName, setCurrentEmailTemplateName] = useState('')
  const [showEmailSaveDialog, setShowEmailSaveDialog] = useState(false)
  const [defaultTemplateStatus, setDefaultTemplateStatus] = useState<any>(null)
  
  // Button 4 - Welcome Email Configuration State
  const [emailConfig, setEmailConfig] = useState({
    useDefaultEmail: false, // true = default, false = custom
    
    // Email Header
    emailHeaderText: 'Welcome to eLocalPass!',
    emailHeaderColor: '#3b82f6',
    emailHeaderTextColor: '#1e40af',
    emailHeaderFontFamily: 'Arial, sans-serif',
    emailHeaderFontSize: '28',
    
    // Main Message
    emailMessageText: 'Congratulations! Starting today you will be able to pay like a local while on vacation with eLocalPass',
    emailMessageTextColor: '#374151',
    emailMessageFontFamily: 'Arial, sans-serif',
    emailMessageFontSize: '16',
    
    // CTA Button
    emailCtaText: 'Create Your Account & Access Your eLocalPass',
    emailCtaTextColor: '#ffffff',
    emailCtaFontFamily: 'Arial, sans-serif',
    emailCtaFontSize: '18',
    emailCtaBackgroundColor: '#3b82f6',
    
    // Important Notice
    emailNoticeText: 'IMPORTANT: Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.',
    emailNoticeTextColor: '#dc2626',
    emailNoticeFontFamily: 'Arial, sans-serif',
    emailNoticeFontSize: '14',
    
    // Footer Message
    emailFooterText: 'Enjoy hundreds of discounts throughout your destination! Click below and discover all the benefits.',
    emailFooterTextColor: '#6b7280',
    emailFooterFontFamily: 'Arial, sans-serif',
    emailFooterFontSize: '14',
    
    // Brand Colors
    emailPrimaryColor: '#3b82f6',
    emailSecondaryColor: '#f97316',
    emailBackgroundColor: '#ffffff',
    
    // Media Content
    logoUrl: '',
    bannerImages: [] as string[], // Array of banner image URLs
    newBannerUrl: '',
    videoUrl: '', // Video attachment URL
    
    // Affiliate Configuration
    enableLocationBasedAffiliates: true,
    selectedAffiliates: [], // Array of affiliate IDs
    customAffiliateMessage: 'Discover amazing local discounts at these partner establishments:',
    
    // Advanced Options
    includeQRInEmail: false, // We send link instead
    emailAccountCreationUrl: 'https://elocalpass.com/create-account',
    customCssStyles: '',
    
    // Default Template Fields
    companyName: 'ELocalPass',
    defaultWelcomeMessage: 'Welcome to your local pass experience!'
  })

  useEffect(() => {
    // Check for preview mode first
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    const isPreviewMode = mode === 'preview'
    setIsPreviewMode(isPreviewMode)
    
    // Load saved templates (which includes loading custom templates in edit/preview mode)
    loadSavedTemplates()
    
    // Load default template status
    getDefaultTemplateStatus()
    
    // Only load default template if NOT in edit or preview mode
    if (mode !== 'edit' && mode !== 'preview') {
      loadDefaultEmailTemplate()
    }
  }, [])

  const loadSavedTemplates = () => {
    const savedEmailTemplates = localStorage.getItem('elocalpass-email-templates')
    if (savedEmailTemplates) {
      setEmailTemplates(JSON.parse(savedEmailTemplates))
    }
    
    // Check if we're in edit mode or preview mode and load existing welcome email config
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    const qrId = urlParams.get('qrId')
    
    if (mode === 'edit' || mode === 'preview') {
      console.log('🔧 EMAIL CONFIG: Edit/Preview mode detected, qrId:', qrId)
      
      if (qrId) {
        // NEW: Load from database first (prioritize database)
        loadConfigurationForEdit(qrId)
      } else {
        // FALLBACK: Load from localStorage (legacy)
        const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
        if (welcomeEmailConfig) {
          try {
            const savedConfig = JSON.parse(welcomeEmailConfig)
            setEmailConfig(savedConfig.emailConfig)
            console.log('✅ Loaded existing welcome email configuration from localStorage for', mode)
          } catch (error) {
            console.log('Could not load welcome email configuration from localStorage:', error)
          }
        }
      }
    }
  }

  // NEW: Load configuration for editing from database
  const loadConfigurationForEdit = async (qrId: string) => {
    console.log('✅ EMAIL LOAD DEBUG: Loading config from database for QR ID:', qrId)
    
    try {
      // Load configuration from database
      const response = await fetch(`/api/admin/saved-configs/${qrId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const config = await response.json()
        console.log('✅ EMAIL LOAD DEBUG: Loaded config from database:', config)
        
        // Extract welcome email template from the configuration
        if (config.emailTemplates?.welcomeEmail?.emailConfig) {
          console.log('✅ EMAIL LOAD DEBUG: Found welcome email template in database config')
          setEmailConfig(config.emailTemplates.welcomeEmail.emailConfig)
          console.log('✅ EMAIL LOAD DEBUG: Setting email config from database:', config.emailTemplates.welcomeEmail.emailConfig)
          return // Successfully loaded from database
        } else {
          console.log('❌ EMAIL LOAD DEBUG: No welcome email template found in database config')
        }
      } else {
        console.error('❌ EMAIL LOAD DEBUG: Failed to load config from database. Status:', response.status)
        const errorText = await response.text()
        console.error('❌ EMAIL LOAD DEBUG: Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ EMAIL LOAD DEBUG: Error loading config from database:', error)
    }
    
    // Database load failed - fallback to localStorage
    console.log('❌ EMAIL LOAD DEBUG: Database load failed, falling back to localStorage')
    const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
    if (welcomeEmailConfig) {
      try {
        const savedConfig = JSON.parse(welcomeEmailConfig)
        setEmailConfig(savedConfig.emailConfig)
        console.log('✅ EMAIL LOAD DEBUG: Loaded from localStorage fallback')
      } catch (error) {
        console.log('❌ EMAIL LOAD DEBUG: Could not load from localStorage either:', error)
      }
    }
  }

  const loadDefaultEmailTemplate = async () => {
    try {
      console.log('🔧 LOADING DEFAULT TEMPLATE FROM DATABASE...')
      
      const response = await fetch('/api/admin/email-templates?isDefault=true')
      const result = await response.json()
      
      if (response.ok && result.templates && result.templates.length > 0) {
        const defaultTemplate = result.templates[0] // Get the first (and should be only) default template
        
        console.log('✅ DEFAULT TEMPLATE LOADED FROM DATABASE:', defaultTemplate.name)
        
        // Convert database template back to emailConfig format
        if (defaultTemplate.emailConfig) {
          setEmailConfig(defaultTemplate.emailConfig)
                 } else {
           // Fallback: create emailConfig from template fields
           const emailConfig = {
             useDefaultEmail: true,
             emailHeaderText: defaultTemplate.headerText || 'Welcome to eLocalPass!',
             emailHeaderColor: defaultTemplate.primaryColor || '#3b82f6',
             emailHeaderTextColor: '#ffffff',
             emailHeaderFontFamily: 'Arial, sans-serif',
             emailHeaderFontSize: '28',
             emailMessageText: defaultTemplate.bodyText || 'Congratulations! Starting today you will be able to pay like a local while on vacation with eLocalPass',
             emailMessageTextColor: '#374151',
             emailMessageFontFamily: 'Arial, sans-serif',
             emailMessageFontSize: '16',
             emailCtaText: defaultTemplate.buttonText || 'View Your Pass',
             emailCtaTextColor: '#ffffff',
             emailCtaFontFamily: 'Arial, sans-serif',
             emailCtaFontSize: '18',
             emailCtaBackgroundColor: defaultTemplate.buttonColor || '#3b82f6',
             emailNoticeText: 'IMPORTANT: Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.',
             emailNoticeTextColor: '#dc2626',
             emailNoticeFontFamily: 'Arial, sans-serif',
             emailNoticeFontSize: '14',
             emailFooterText: defaultTemplate.footerText || 'Enjoy hundreds of discounts throughout your destination! Click below and discover all the benefits.',
             emailFooterTextColor: '#6b7280',
             emailFooterFontFamily: 'Arial, sans-serif',
             emailFooterFontSize: '14',
             emailPrimaryColor: defaultTemplate.primaryColor || '#3b82f6',
             emailSecondaryColor: '#f97316',
             emailBackgroundColor: defaultTemplate.backgroundColor || '#ffffff',
             logoUrl: '',
             bannerImages: [] as string[],
             newBannerUrl: '',
             videoUrl: '',
             enableLocationBasedAffiliates: true,
             selectedAffiliates: [],
             customAffiliateMessage: 'Discover amazing local discounts at these partner establishments:',
             includeQRInEmail: false,
             emailAccountCreationUrl: 'https://elocalpass.com/create-account',
             customCssStyles: '',
             companyName: 'ELocalPass',
             defaultWelcomeMessage: 'Welcome to your local pass experience!'
           }
           setEmailConfig(emailConfig)
         }
        
        toast.success('Default Template Loaded', 'Default template loaded from database successfully!')
      } else {
        console.log('⚠️ No default template found in database')
        toast.warning('No Default Template', 'No default template found in database')
      }
    } catch (error) {
      console.error('❌ Error loading default template from database:', error)
      toast.error('Load Failed', 'Network error while loading default template from database')
    }
  }

  const saveAsDefaultTemplate = async () => {
    try {
      console.log('🔧 SAVING DEFAULT TEMPLATE TO DATABASE')
      
      // Generate the custom HTML for the template
      const generateCustomEmailHtml = (config: any) => {
        if (config.useDefaultEmail) {
          return 'USE_DEFAULT_TEMPLATE'
        }
        
        // Generate custom HTML template (same logic as in handleSubmit)
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to eLocalPass</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${config.emailBackgroundColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${config.emailPrimaryColor}; padding: 24px; text-align: center; }
        .header h1 { color: ${config.emailHeaderTextColor}; font-family: ${config.emailHeaderFontFamily}; font-size: ${config.emailHeaderFontSize}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${config.emailMessageTextColor}; font-family: ${config.emailMessageFontFamily}; font-size: ${config.emailMessageFontSize}px; line-height: 1.5; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor}; color: ${config.emailCtaTextColor}; font-family: ${config.emailCtaFontFamily}; font-size: ${config.emailCtaFontSize}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; }
        .footer p { color: ${config.emailFooterTextColor}; font-family: ${config.emailFooterFontFamily}; font-size: ${config.emailFooterFontSize}px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${config.emailHeaderText}</h1>
        </div>
        
        <div class="content">
            <div class="message">
                <p>${config.emailMessageText}</p>
            </div>
            
            <div class="cta-button">
                <a href="{customerPortalUrl}">${config.emailCtaText}</a>
            </div>
            
            <div class="message">
                <p style="color: ${config.emailNoticeTextColor}; font-size: ${config.emailNoticeFontSize}px; font-weight: 500;">${config.emailNoticeText}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>${config.emailFooterText}</p>
        </div>
    </div>
</body>
</html>`
      }
      
      const customHTML = generateCustomEmailHtml(emailConfig)
      
      // First, delete ALL existing default templates to save space
      console.log('🗑️ CLEANING UP OLD DEFAULT TEMPLATES...')
      const deleteResponse = await fetch('/api/admin/email-templates/cleanup-defaults', {
        method: 'DELETE'
      })
      
      if (deleteResponse.ok) {
        console.log('✅ Old default templates cleaned up')
      } else {
        console.log('⚠️ Could not clean up old templates, continuing anyway')
      }
      
      // Save new default template to database
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Welcome Email Template - ${new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`,
          subject: 'Welcome to ELocalPass!',
          customHTML: customHTML,
          isDefault: true,
          emailConfig: emailConfig
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ DEFAULT TEMPLATE SAVED TO DATABASE:', result.templateId)
        toast.success('Default Template Saved', 'Default template saved to database and will be used system-wide!')
      } else {
        console.error('❌ Failed to save default template to database:', result.error)
        toast.error('Save Failed', result.error || 'Failed to save default template to database')
      }
    } catch (error) {
      console.error('❌ Error saving default template to database:', error)
      toast.error('Save Failed', 'Network error while saving default template to database')
    }
  }

  const clearDefaultTemplate = async () => {
    try {
      console.log('🔧 ADMIN PANEL: Clearing default template from database...')
      
      const response = await fetch('/api/admin/default-email-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clearDefault'
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ ADMIN PANEL: Default template cleared from database successfully')
        toast.success('Default Template Cleared', 'Default email template cleared from database successfully!')
        
        // Also clear from localStorage for backward compatibility
        localStorage.removeItem('elocalpass-default-email-template')
      } else {
        console.error('❌ ADMIN PANEL: Failed to clear default template:', result.error)
        toast.error('Clear Failed', result.error || 'Failed to clear default template from database')
      }
    } catch (error) {
      console.error('❌ ADMIN PANEL: Error clearing default template:', error)
      toast.error('Clear Failed', 'Network error while clearing default template')
    }
  }

  const getDefaultTemplateStatus = async () => {
    try {
      const response = await fetch('/api/admin/email-templates?isDefault=true')
      const result = await response.json()
      
      if (response.ok && result.templates && result.templates.length > 0) {
        setDefaultTemplateStatus(result.templates[0])
        return result.templates[0]
      }
      setDefaultTemplateStatus(null)
      return null
    } catch (error) {
      console.error('Error getting default template status:', error)
      setDefaultTemplateStatus(null)
      return null
    }
  }

  const saveEmailTemplate = async () => {
    if (!currentEmailTemplateName.trim()) {
      toast.warning('Missing Template Name', 'Please enter a template name')
      return
    }
    
    try {
      console.log('🔧 SAVING NAMED TEMPLATE TO DATABASE:', currentEmailTemplateName)
      
      // Generate the custom HTML for the template (simple version)
      const customHTML = emailConfig.useDefaultEmail ? 'USE_DEFAULT_TEMPLATE' : 'CUSTOM_TEMPLATE'
      
      // Save to database via API
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentEmailTemplateName,
          subject: 'Welcome to ELocalPass!',
          customHTML: customHTML,
          isDefault: false,
          emailConfig: emailConfig
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ NAMED TEMPLATE SAVED TO DATABASE:', result.templateId)
        
        // Add to local state for immediate UI update
        const newTemplate = {
          id: result.templateId,
          name: currentEmailTemplateName,
          data: { ...emailConfig },
          createdAt: new Date()
        }
        
        const updatedTemplates = [...emailTemplates, newTemplate]
        setEmailTemplates(updatedTemplates)
        
        setShowEmailSaveDialog(false)
        setCurrentEmailTemplateName('')
        toast.success('Template Saved to Database', `Template "${currentEmailTemplateName}" saved successfully and available system-wide!`)
      } else {
        console.error('❌ Failed to save template to database:', result.error)
        toast.error('Save Failed', result.error || 'Failed to save template to database')
      }
    } catch (error) {
      console.error('❌ Error saving template to database:', error)
      toast.error('Save Failed', 'Network error while saving template to database')
    }
  }

  const loadEmailTemplate = (template: { name: string, data: any }) => {
    setEmailConfig({ ...template.data })
    toast.success('Template Loaded', `Template "${template.name}" loaded successfully!`)
  }

  const deleteEmailTemplate = (index: number) => {
    if (confirm(`Are you sure you want to delete template "${emailTemplates[index].name}"?`)) {
      const updatedTemplates = emailTemplates.filter((template, i) => i !== index)
      setEmailTemplates(updatedTemplates)
      localStorage.setItem('elocalpass-email-templates', JSON.stringify(updatedTemplates))
      setCurrentEmailTemplateName('')
      toast.success('Template Deleted', `Template "${emailTemplates[index].name}" deleted successfully!`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const urlParams = new URLSearchParams(window.location.search)
      const qrId = urlParams.get('qrId')
      
      // Generate the actual HTML template from the configuration
      const generateCustomEmailHtml = (config: any, sellerLocation: string = "Playa del Carmen") => {
        if (config.useDefaultEmail) {
          // Return special marker for default email - system will use built-in default
          return 'USE_DEFAULT_TEMPLATE'
        }
        
        // Generate custom HTML template
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to eLocalPass</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${config.emailBackgroundColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: ${config.emailPrimaryColor}; padding: 24px; text-align: center; }
        .header h1 { color: ${config.emailHeaderTextColor}; font-family: ${config.emailHeaderFontFamily}; font-size: ${config.emailHeaderFontSize}px; font-weight: bold; margin: 0; }
        .content { padding: 24px; }
        .message { text-align: center; margin-bottom: 24px; }
        .message p { color: ${config.emailMessageTextColor}; font-family: ${config.emailMessageFontFamily}; font-size: ${config.emailMessageFontSize}px; line-height: 1.5; margin: 0; }
        .cta-button { text-align: center; margin: 24px 0; }
        .cta-button a { background-color: ${config.emailCtaBackgroundColor}; color: ${config.emailCtaTextColor}; font-family: ${config.emailCtaFontFamily}; font-size: ${config.emailCtaFontSize}px; font-weight: 500; padding: 12px 32px; border-radius: 8px; text-decoration: none; display: inline-block; }
        .notice { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; }
        .notice p { color: ${config.emailNoticeTextColor}; font-family: ${config.emailNoticeFontFamily}; font-size: ${config.emailNoticeFontSize}px; font-weight: 500; margin: 0; }
        .affiliates { background-color: ${config.emailSecondaryColor}20; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .affiliates h3 { color: ${config.emailSecondaryColor}; font-weight: 600; margin: 0 0 12px 0; }
        .affiliate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .affiliate-item { background-color: white; padding: 8px; border-radius: 4px; text-align: center; border: 1px solid #e5e7eb; }
        .affiliate-placeholder { width: 100%; height: 32px; background-color: #e5e7eb; border-radius: 4px; margin-bottom: 4px; }
        .footer-message { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; }
        .footer-message p { color: ${config.emailFooterTextColor}; font-family: ${config.emailFooterFontFamily}; font-size: ${config.emailFooterFontSize}px; margin: 0; }
        .email-footer { background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; }
        @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .content { padding: 16px; }
            .affiliate-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            ${config.logoUrl ? `<div style="margin-bottom: 16px;"><img src="${config.logoUrl}" alt="Logo" style="height: 40px; width: auto;"></div>` : ''}
            <h1>${config.emailHeaderText}</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Welcome Message -->
            <div class="message">
                <p>${config.emailMessageText}</p>
            </div>
            
            <!-- Video Section -->
            ${config.videoUrl ? `
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <div style="background-color: #e5e7eb; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <div style="color: #6b7280;">
                        🎥 Welcome Video<br>
                        <span style="font-size: 12px;">Click to play</span>
                    </div>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Watch this quick intro to get started!</p>
            </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div class="cta-button">
                <a href="{magicLink}">${config.emailCtaText}</a>
            </div>
            
            <!-- Important Notice -->
            <div class="notice">
                <p>⚠️ ${config.emailNoticeText}</p>
            </div>
            
            <!-- Location-Based Affiliates -->
            ${config.enableLocationBasedAffiliates ? `
            <div class="affiliates">
                <h3>Featured Partners in ${sellerLocation}</h3>
                <div class="affiliate-grid">
                    <div class="affiliate-item">
                        <div class="affiliate-placeholder"></div>
                        <div style="font-size: 12px;">Local Restaurant</div>
                    </div>
                    <div class="affiliate-item">
                        <div class="affiliate-placeholder"></div>
                        <div style="font-size: 12px;">Adventure Tours</div>
                    </div>
                </div>
                <p style="color: ${config.emailSecondaryColor}; font-size: 14px; margin: 12px 0 0 0;">${config.customAffiliateMessage}</p>
            </div>
            ` : ''}
            
            <!-- Footer Message -->
            <div class="footer-message">
                <p>${config.emailFooterText}</p>
            </div>
        </div>
        
        <!-- Email Footer -->
        <div class="email-footer">
            <p>© 2025 eLocalPass. All rights reserved.</p>
            <p style="margin-top: 4px;">
                You received this email because you obtained an eLocalPass.
                <a href="#" style="color: #3b82f6;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>`
      }
      
      // Generate the HTML template
      const customHTML = generateCustomEmailHtml(emailConfig)
      
      // Create the welcome email configuration object
      const welcomeEmailConfig = {
        id: qrId || Math.random().toString(36).substr(2, 9),
        name: `Welcome Email Template - ${new Date().toLocaleDateString()}`,
        subject: emailConfig.useDefaultEmail ? 'Your ELocalPass is Ready - Instant Access' : 'Welcome to eLocalPass!',
        content: emailConfig.useDefaultEmail ? 'Use default ELocalPass welcome email template' : 'Custom email content',
        customHTML: customHTML,
        htmlContent: emailConfig.useDefaultEmail ? 'USE_DEFAULT_TEMPLATE' : null, // Signal to use default template
        emailConfig: { ...emailConfig },
        createdAt: new Date(),
        isActive: true
      }
      
      if (qrId) {
        // Save to database
        console.log('✅ EMAIL SAVE DEBUG: Saving to database for QR ID:', qrId)
        console.log('✅ EMAIL SAVE DEBUG: Generated customHTML length:', customHTML ? customHTML.length : 0)
        
        try {
          // Load existing configuration from database
          const response = await fetch(`/api/admin/saved-configs/${qrId}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const existingConfig = await response.json()
            console.log('✅ EMAIL SAVE DEBUG: Loaded existing config from database')
            
            // Update the configuration with the new welcome email template
            const updatedConfig = {
              ...existingConfig,
              emailTemplates: {
                ...existingConfig.emailTemplates,
                welcomeEmail: welcomeEmailConfig
              }
            }
            
            console.log('✅ EMAIL SAVE DEBUG: Updated config with welcomeEmail:', updatedConfig.emailTemplates.welcomeEmail)
            
            // Save updated configuration back to database
            const updateResponse = await fetch(`/api/admin/saved-configs/${qrId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(updatedConfig)
            })
            
            if (updateResponse.ok) {
              console.log('✅ EMAIL SAVE DEBUG: Successfully saved to database')
              setGeneratedEmailConfig(qrId)
              
              // Improved messaging based on template type
              if (emailConfig.useDefaultEmail) {
                toast.success('Default Template Confirmed', `ELocalPass default template confirmed and configured! Returning to QR Config...`)
              } else {
                toast.success('Custom Email Template Saved', `Custom welcome email template saved to database successfully! Returning to QR Config...`)
              }
              
              // Redirect back to QR config after 2 seconds
              setTimeout(() => {
                router.push(`/admin/qr-config?expand=${qrId}`)
              }, 2000)
              
              return // Successfully saved to database
            } else {
              const errorText = await updateResponse.text()
              console.error('❌ EMAIL SAVE DEBUG: Failed to update config in database. Status:', updateResponse.status, 'Error:', errorText)
              throw new Error(`Database update failed: ${updateResponse.status} - ${errorText}`)
            }
          } else {
            console.error('❌ EMAIL SAVE DEBUG: Failed to load existing config from database. Status:', response.status)
            throw new Error(`Failed to load existing config: ${response.status}`)
          }
        } catch (error) {
          console.error('❌ EMAIL SAVE DEBUG: Error saving to database:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          toast.error('Database Save Failed', `Failed to save welcome email to database: ${errorMessage}`)
          setIsSubmitting(false)
          return // Stop here - don't fall back to localStorage
        }
      } else {
        // No qrId provided - save as standalone template to localStorage for later use
        console.log('✅ EMAIL SAVE DEBUG: No qrId provided, saving as standalone template')
        localStorage.setItem('elocalpass-welcome-email-config', JSON.stringify(welcomeEmailConfig))
        
        setGeneratedEmailConfig(welcomeEmailConfig.id)
        toast.success('Email Template Saved', `Welcome Email Template saved successfully! This template will be used for new QR configurations.`)
        
        // Redirect back to QR config after 2 seconds
        setTimeout(() => {
          router.push('/admin/qr-config')
        }, 2000)
      }
      
    } catch (error) {
      console.error('Error creating email configuration:', error)
      toast.error('Error Creating Email Configuration', 'Error creating email configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [bannerIntervalId, setBannerIntervalId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (emailConfig.bannerImages.length > 3) {
      const intervalId = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => {
          const maxStartIndex = Math.max(0, emailConfig.bannerImages.length - 3)
          return prevIndex >= maxStartIndex ? 0 : prevIndex + 3
        })
      }, 3000)
      setBannerIntervalId(intervalId)
      return () => clearInterval(intervalId)
    } else {
      if (bannerIntervalId) {
        clearInterval(bannerIntervalId)
        setBannerIntervalId(null)
      }
      setCurrentBannerIndex(0)
    }
  }, [emailConfig.bannerImages.length])

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isPreviewMode ? '👀 Welcome Email Preview' : 'Welcome Email Configuration'}
              </h1>
              <p className="mt-2 text-gray-600">
                {isPreviewMode 
                  ? 'Preview of your saved welcome email template'
                  : 'Configure welcome email templates for QR recipients'
                }
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
              ← {qrId ? 'Back to QR Config Library' : 'Back to QR Config'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Button 4 - Welcome Email Configuration */}
              <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-200">
                <h2 className="text-xl font-bold text-indigo-900 mb-4">📧 Welcome Email Configuration</h2>
                <p className="text-indigo-700 text-sm mb-4">Configure the welcome email sent to QR recipients. Choose between default or custom email templates.</p>
                
                {/* Email Type Selection */}
                <div className="mb-6">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${!emailConfig.useDefaultEmail ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {!emailConfig.useDefaultEmail ? 'Custom Email Template' : 'Default Email Template'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {!emailConfig.useDefaultEmail 
                              ? 'Creating a personalized email template with custom branding'
                              : 'Using the standard ELocalPass email template'
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailConfig({...emailConfig, useDefaultEmail: !emailConfig.useDefaultEmail})}
                        className="px-3 py-1 text-sm border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                      >
                        Switch to {!emailConfig.useDefaultEmail ? 'Default' : 'Custom'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Default Email Template Configuration */}
                {emailConfig.useDefaultEmail && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">Default Email Template Preview</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        This is the standard ELocalPass welcome email template. You can customize the basic text content and branding elements.
                      </p>
                      
                      {/* Basic customizations for default template */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Company/Seller Name</label>
                          <input
                            type="text"
                            value={emailConfig.companyName || 'ELocalPass'}
                            onChange={(e) => setEmailConfig({...emailConfig, companyName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter company/seller name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                          <textarea
                            value={emailConfig.defaultWelcomeMessage || 'Welcome to your local pass experience!'}
                            onChange={(e) => setEmailConfig({...emailConfig, defaultWelcomeMessage: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                            placeholder="Enter welcome message"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Email Configuration */}
                {!emailConfig.useDefaultEmail && (
                  <div className="space-y-6">
                    
                    {/* Email Header */}
                    <TextWithTypography
                      label="Email Header Text"
                      textKey="emailHeaderText"
                      colorKey="emailHeaderTextColor"
                      fontFamilyKey="emailHeaderFontFamily"
                      fontSizeKey="emailHeaderFontSize"
                      formData={emailConfig}
                      setFormData={setEmailConfig}
                    />
                    
                    {/* Main Message */}
                    <TextWithTypography
                      label="Main Welcome Message"
                      textKey="emailMessageText"
                      colorKey="emailMessageTextColor"
                      fontFamilyKey="emailMessageFontFamily"
                      fontSizeKey="emailMessageFontSize"
                      isTextarea={true}
                      rows={3}
                      formData={emailConfig}
                      setFormData={setEmailConfig}
                    />
                    
                    {/* CTA Button */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Call-to-Action Button</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <TextWithTypography
                          label="CTA Button Text"
                          textKey="emailCtaText"
                          colorKey="emailCtaTextColor"
                          fontFamilyKey="emailCtaFontFamily"
                          fontSizeKey="emailCtaFontSize"
                          formData={emailConfig}
                          setFormData={setEmailConfig}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Button Background Color</label>
                          <input
                            type="color"
                            value={emailConfig.emailCtaBackgroundColor}
                            onChange={(e) => setEmailConfig({...emailConfig, emailCtaBackgroundColor: e.target.value})}
                            className="w-full h-12 rounded-md border border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Important Notice */}
                    <TextWithTypography
                      label="Important Notice Text"
                      textKey="emailNoticeText"
                      colorKey="emailNoticeTextColor"
                      fontFamilyKey="emailNoticeFontFamily"
                      fontSizeKey="emailNoticeFontSize"
                      isTextarea={true}
                      rows={2}
                      formData={emailConfig}
                      setFormData={setEmailConfig}
                    />
                    
                    {/* Footer Message */}
                    <TextWithTypography
                      label="Footer Message"
                      textKey="emailFooterText"
                      colorKey="emailFooterTextColor"
                      fontFamilyKey="emailFooterFontFamily"
                      fontSizeKey="emailFooterFontSize"
                      isTextarea={true}
                      rows={2}
                      formData={emailConfig}
                      setFormData={setEmailConfig}
                    />
                    
                    {/* Brand Colors */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">🎨 Brand Colors</h3>
                      <p className="text-sm text-gray-600 mb-4">Customize the main brand colors used throughout the email template</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Header Background Color</label>
                          <input
                            type="color"
                            value={emailConfig.emailPrimaryColor}
                            onChange={(e) => setEmailConfig({...emailConfig, emailPrimaryColor: e.target.value})}
                            className="w-full h-12 rounded-md border border-gray-300"
                          />
                          <p className="text-xs text-gray-500 mt-1">Main header background color</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                          <input
                            type="color"
                            value={emailConfig.emailSecondaryColor}
                            onChange={(e) => setEmailConfig({...emailConfig, emailSecondaryColor: e.target.value})}
                            className="w-full h-12 rounded-md border border-gray-300"
                          />
                          <p className="text-xs text-gray-500 mt-1">Featured partners & accents</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Background</label>
                          <input
                            type="color"
                            value={emailConfig.emailBackgroundColor}
                            onChange={(e) => setEmailConfig({...emailConfig, emailBackgroundColor: e.target.value})}
                            className="w-full h-12 rounded-md border border-gray-300"
                          />
                          <p className="text-xs text-gray-500 mt-1">Overall email background</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Media Content */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Media Content</h3>
                      <div className="space-y-6">
                        
                        {/* Email Logo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Logo URL</label>
                          <input
                            type="url"
                            value={emailConfig.logoUrl}
                            onChange={(e) => setEmailConfig({...emailConfig, logoUrl: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/logo.png"
                          />
                          {emailConfig.logoUrl && (
                            <div className="mt-2">
                              <img 
                                src={emailConfig.logoUrl} 
                                alt="Logo preview" 
                                className="h-16 w-auto border rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Custom Banners */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Email Banners</label>
                          <p className="text-xs text-gray-500 mb-3">Add custom banner images for your email header or content sections</p>
                          
                          {/* Banner Input */}
                          <div className="flex gap-2 mb-3">
                            <input
                              type="url"
                              value={emailConfig.newBannerUrl || ''}
                              onChange={(e) => setEmailConfig({...emailConfig, newBannerUrl: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com/banner.jpg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (emailConfig.newBannerUrl && emailConfig.newBannerUrl.trim()) {
                                  const updatedBanners = [...(emailConfig.bannerImages || []), emailConfig.newBannerUrl.trim()]
                                  if (updatedBanners.length > 10) {
                                    toast.warning('Maximum Banners Reached', 'Maximum 10 banners allowed')
                                  } else {
                                    setEmailConfig({...emailConfig, bannerImages: updatedBanners, newBannerUrl: ''})
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Add Banner
                            </button>
                          </div>

                          {/* Banner Preview Carousel */}
                          {emailConfig.bannerImages && emailConfig.bannerImages.length > 0 && (
                            <div className="space-y-3">
                              {/* Banner Count and Limit Info */}
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                  {emailConfig.bannerImages.length} / 10 banners
                                  {emailConfig.bannerImages.length > 3 && (
                                    <span className="ml-2 text-xs text-blue-600">• Auto-rotating every 3s</span>
                                  )}
                                </p>
                                {emailConfig.bannerImages.length > 3 && (
                                  <div className="flex gap-1">
                                    {Array.from({ length: Math.ceil(emailConfig.bannerImages.length / 3) }).map((_, groupIndex) => (
                                      <button
                                        key={groupIndex}
                                        onClick={() => {
                                          setCurrentBannerIndex(groupIndex * 3)
                                          if (bannerIntervalId) clearInterval(bannerIntervalId)
                                        }}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                          Math.floor(currentBannerIndex / 3) === groupIndex 
                                            ? 'bg-blue-600' 
                                            : 'bg-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Carousel Container */}
                              <div className="relative overflow-hidden rounded-lg">
                                <div className="grid grid-cols-3 gap-3">
                                  {emailConfig.bannerImages
                                    .slice(currentBannerIndex, currentBannerIndex + 3)
                                    .concat(
                                      emailConfig.bannerImages.length > currentBannerIndex + 3 
                                        ? [] 
                                        : Array(3 - (emailConfig.bannerImages.length - currentBannerIndex)).fill(null)
                                    )
                                    .slice(0, 3)
                                    .map((bannerUrl, index) => {
                                      const actualIndex = currentBannerIndex + index
                                      if (!bannerUrl) {
                                        return (
                                          <div key={`empty-${index}`} className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex items-center justify-center">
                                            <span className="text-xs text-gray-400">Empty Slot</span>
                                          </div>
                                        )
                                      }
                                      return (
                                        <div key={actualIndex} className="relative border rounded-lg overflow-hidden bg-white">
                                          <img 
                                            src={bannerUrl} 
                                            alt={`Banner ${actualIndex + 1}`}
                                            className="w-full h-24 object-cover"
                                            onError={(e) => {
                                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg=='
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedBanners = emailConfig.bannerImages.filter((_, i) => i !== actualIndex)
                                              setEmailConfig({...emailConfig, bannerImages: updatedBanners})
                                              // Reset carousel if we removed from current view
                                              if (currentBannerIndex >= updatedBanners.length) {
                                                setCurrentBannerIndex(Math.max(0, updatedBanners.length - 3))
                                              }
                                            }}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                                            title="Remove banner"
                                          >
                                            ×
                                          </button>
                                          <div className="p-2">
                                            <p className="text-xs text-gray-600 truncate" title={bannerUrl}>
                                              Banner {actualIndex + 1}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                </div>

                                {/* Navigation Arrows (only show if more than 3 banners) */}
                                {emailConfig.bannerImages.length > 3 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newIndex = Math.max(0, currentBannerIndex - 3)
                                        setCurrentBannerIndex(newIndex)
                                        if (bannerIntervalId) clearInterval(bannerIntervalId)
                                      }}
                                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                                      disabled={currentBannerIndex === 0}
                                    >
                                      ‹
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newIndex = Math.min(emailConfig.bannerImages.length - 3, currentBannerIndex + 3)
                                        setCurrentBannerIndex(newIndex)
                                        if (bannerIntervalId) clearInterval(bannerIntervalId)
                                      }}
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
                                      disabled={currentBannerIndex >= emailConfig.bannerImages.length - 3}
                                    >
                                      ›
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {(!emailConfig.bannerImages || emailConfig.bannerImages.length === 0) && (
                            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                              <p className="text-sm text-gray-500">No custom banners added yet</p>
                              <p className="text-xs text-gray-400 mt-1">Add banner URLs above to preview them here</p>
                            </div>
                          )}
                        </div>

                        {/* Video URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (Optional)</label>
                          <input
                            type="url"
                            value={emailConfig.videoUrl}
                            onChange={(e) => setEmailConfig({...emailConfig, videoUrl: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                          />
                          {emailConfig.videoUrl && (
                            <p className="text-xs text-green-600 mt-1">✓ Video URL added - will be embedded in email</p>
                          )}
                        </div>

                        {/* Upload Instructions */}
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">📸 Image Upload Tips</h4>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Use hosted images (Upload to your website, Cloudinary, AWS S3, etc.)</li>
                            <li>• Recommended banner size: 600px wide x 300px high for best results</li>
                            <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                            <li>• Custom banners appear separate from affiliate logos</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Partners Configuration */}
              <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                <h2 className="text-xl font-bold text-orange-900 mb-4">🏪 Featured Partners Configuration</h2>
                <p className="text-orange-700 text-sm mb-4">Configure which local partners appear in your welcome emails.</p>
                
                {/* Enable/Disable Featured Partners */}
                <div className="mb-6">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={emailConfig.enableLocationBasedAffiliates}
                      onChange={(e) => setEmailConfig({...emailConfig, enableLocationBasedAffiliates: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-orange-900">
                      Enable Featured Partners Section
                    </span>
                  </label>
                  <p className="text-xs text-orange-600 mt-1 ml-7">
                    Show local business partners and affiliate recommendations in the email
                  </p>
                </div>

                {emailConfig.enableLocationBasedAffiliates && (
                  <div className="space-y-4">
                    {/* Custom Affiliate Message */}
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">
                        Partner Introduction Message
                      </label>
                      <textarea
                        value={emailConfig.customAffiliateMessage}
                        onChange={(e) => setEmailConfig({...emailConfig, customAffiliateMessage: e.target.value})}
                        placeholder="Enter a custom message to introduce your featured partners..."
                        rows={2}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-orange-600 mt-1">
                        This message appears below the partner listings
                      </p>
                    </div>

                    {/* Partner Management Note */}
                    <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                      <h4 className="text-sm font-medium text-orange-900 mb-2">📋 Partner Management</h4>
                      <p className="text-sm text-orange-700 mb-2">
                        Featured partners are automatically populated based on the recipient's location. 
                        Currently showing sample partners for preview.
                      </p>
                      <p className="text-xs text-orange-600">
                        💡 In the full system, this will integrate with your partner database and show relevant local businesses based on the QR recipient's city/region.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Template Management */}
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h2 className="text-xl font-bold text-green-900 mb-4">🎨 Email Template Management</h2>
                <p className="text-green-700 text-sm mb-4">Save, load, and delete email templates. Templates store all email customization settings for quick reuse.</p>
                
                {/* Saved Email Templates */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Saved Email Templates</label>
                    <div className="grid gap-2">
                      {emailTemplates.map((template, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                          <div>
                            <span className="text-sm text-green-800 font-medium">{template.name}</span>
                            <p className="text-xs text-green-600">
                              {template.data.useDefaultEmail ? 'Default Email' : 'Custom Email'} • 
                              Created {new Date(template.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-x-2">
                            <button
                              type="button"
                              onClick={() => loadEmailTemplate(template)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEmailTemplate(index)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {emailTemplates.length === 0 && (
                        <div className="text-sm text-green-600 bg-white p-3 rounded border border-green-200 text-center">
                          No email templates saved yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Email Template */}
                  <div className="space-y-4">
                    {/* Default Template Status */}
                    <div className="bg-white p-4 rounded border border-green-200">
                      <h4 className="text-sm font-medium text-green-700 mb-2">📌 Default Template Status</h4>
                      {defaultTemplateStatus ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-800">
                              ✅ Default template is set
                            </p>
                            <p className="text-xs text-green-600">
                              Created: {new Date(defaultTemplateStatus.createdAt).toLocaleDateString()} - 
                              Loads automatically when you open this page
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearDefaultTemplate}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          🔄 No default template set - Configure your email and click "Save as Default Template" below
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowEmailSaveDialog(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Save Current Email as Template
                      </button>
                      <button
                        type="button"
                        onClick={saveAsDefaultTemplate}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Save as Default Template
                      </button>
                      <button
                        type="button"
                        onClick={clearDefaultTemplate}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Clear Default Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Save Dialog */}
                {showEmailSaveDialog && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Save Email Template</h3>
                      <input
                        type="text"
                        value={currentEmailTemplateName}
                        onChange={(e) => setCurrentEmailTemplateName(e.target.value)}
                        placeholder="Enter email template name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex gap-4">
                        <button
                          type="button"
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          onClick={saveEmailTemplate}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            setShowEmailSaveDialog(false)
                            setCurrentEmailTemplateName('')
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                >
                  {isSubmitting ? 
                    (emailConfig.useDefaultEmail ? 'Confirming Default Template...' : 'Creating Custom Email Configuration...') 
                    : 
                    (emailConfig.useDefaultEmail ? 'Confirm Default Template' : 'Create Custom Email Configuration')
                  }
                </button>
              </div>
            </form>

            {/* Generated Config Display */}
            {generatedEmailConfig && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2">✅ Welcome Email Template Created!</h3>
                <div className="space-y-2">
                  <div className="text-sm text-green-700">
                    <p><strong>Template Name:</strong> Welcome Email Template - {new Date().toLocaleDateString()}</p>
                    <p><strong>Configuration ID:</strong></p>
                    <div className="bg-white p-3 rounded border border-green-200 mt-1">
                      <code className="text-sm text-green-800 break-all">{generatedEmailConfig}</code>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> This template is now saved and Button 4 is marked as complete. 
                      You'll be redirected back to the QR configuration page shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8">
            <EmailTemplatePreview emailConfig={emailConfig} />
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

export default function EmailConfigPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <EmailConfigPageContent />
    </Suspense>
  )
}
