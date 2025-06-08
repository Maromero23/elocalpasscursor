'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../../../hooks/use-toast'
import { ToastNotifications } from '../../../../components/toast-notification'

interface GlobalConfig {
  button1GuestsLocked: boolean
  button1GuestsDefault: number
  button1GuestsRangeMax: number
  button1DaysLocked: boolean
  button1DaysDefault: number
  button1DaysRangeMax: number
}

// Font family options
const fontFamilies = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Montserrat, sans-serif',
  'Poppins, sans-serif'
]

// Helper component for text with typography controls
const TextWithTypography = ({ 
  label, 
  textKey, 
  colorKey, 
  fontFamilyKey, 
  fontSizeKey,
  isTextarea = false,
  rows = 2,
  formData,
  setFormData
}: {
  label: string
  textKey: string
  colorKey: string
  fontFamilyKey: string
  fontSizeKey: string
  isTextarea?: boolean
  rows?: number
  formData: any
  setFormData: (data: any) => void
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h4 className="font-semibold text-gray-700 mb-3">{label}</h4>
    
    {/* Text Content */}
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-600 mb-1">Text Content</label>
      {isTextarea ? (
        <textarea
          key={`${textKey}-textarea`}
          value={formData[textKey as keyof typeof formData] as string}
          onChange={(e) => setFormData({...formData, [textKey]: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={rows}
        />
      ) : (
        <input
          key={`${textKey}-input`}
          type="text"
          value={formData[textKey as keyof typeof formData] as string}
          onChange={(e) => setFormData({...formData, [textKey]: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
    
    {/* Typography Controls */}
    <div className="grid grid-cols-3 gap-3">
      {/* Text Color */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Text Color</label>
        <input
          key={`${colorKey}-color`}
          type="color"
          value={formData[colorKey as keyof typeof formData] as string}
          onChange={(e) => setFormData({...formData, [colorKey]: e.target.value})}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>
      
      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Font Family</label>
        <select
          key={`${fontFamilyKey}-font`}
          value={formData[fontFamilyKey as keyof typeof formData] as string}
          onChange={(e) => setFormData({...formData, [fontFamilyKey]: e.target.value})}
          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {fontFamilies.map((font) => (
            <option key={font} value={font}>{font.split(',')[0]}</option>
          ))}
        </select>
      </div>
      
      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Font Size (px)</label>
        <input
          key={`${fontSizeKey}-size`}
          type="number"
          min="10"
          max="72"
          value={formData[fontSizeKey as keyof typeof formData] as string}
          onChange={(e) => setFormData({...formData, [fontSizeKey]: e.target.value})}
          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
)

export default function CreateEnhancedLandingPage() {
  const router = useRouter()
  const toast = useToast()
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    logoUrl: '',
    configurationName: '',
    
    // Header Text
    headerText: 'WELCOME TO......',
    headerTextColor: '#f97316', // Orange (as shown in screenshot)
    headerFontFamily: 'Arial, sans-serif',
    headerFontSize: '32',
    
    // Description Text  
    descriptionText: 'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.',
    descriptionTextColor: '#1e40af', // Blue (as shown in screenshot)
    descriptionFontFamily: 'Arial, sans-serif',
    descriptionFontSize: '18',
    
    // CTA Button Text
    ctaButtonText: 'GET YOUR ELOCALPASS NOW',
    ctaButtonTextColor: '#ffffff', // White (as shown in screenshot)
    ctaButtonFontFamily: 'Arial, sans-serif',
    ctaButtonFontSize: '18',
    
    // Form Title Text
    formTitleText: 'SIGN UP FOR YOUR ELOCALPASS',
    formTitleTextColor: '#ffffff', // White (as shown in screenshot)
    formTitleFontFamily: 'Arial, sans-serif',
    formTitleFontSize: '24',
    
    // Form Instructions Text
    formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
    formInstructionsTextColor: '#ffffff', // White (as shown in screenshot)
    formInstructionsFontFamily: 'Arial, sans-serif',
    formInstructionsFontSize: '16',
    
    // Footer Disclaimer Text
    footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
    footerDisclaimerTextColor: '#ffffff', // White (as shown in screenshot)
    footerDisclaimerFontFamily: 'Arial, sans-serif',
    footerDisclaimerFontSize: '14',
    
    // Brand Colors
    primaryColor: '#1e40af', // Darker blue (correct as confirmed)
    secondaryColor: '#f97316',
    backgroundColor: '#ffffff',
    
    // Individual Box Colors
    guestSelectionBoxColor: '#3b82f6', // Blue box for guest selection
    daySelectionBoxColor: '#3b82f6', // Blue box for day selection  
    footerDisclaimerBoxColor: '#1e40af' // Darker blue for footer disclaimer
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  
  // Template Management State
  const [templateType, setTemplateType] = useState<'landing' | 'email'>('landing')
  const [landingTemplates, setLandingTemplates] = useState<Array<{id: string, name: string, data: any}>>([])
  const [currentTemplateName, setCurrentTemplateName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  // Button 4 - Distribution State
  const [distributionConfig, setDistributionConfig] = useState({
    enableUrlSharing: true,
    enableEmailSending: true,
    enableSocialSharing: true,
    enableQRCodeDownload: true,
    customEmailTemplate: '',
    socialMediaText: 'Check out this amazing local experience!',
    distributionNotes: ''
  })

  // Fetch global configuration on component mount
  useEffect(() => {
    fetchGlobalConfig()
    
    // Check for edit mode and load existing configurations only for edit
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    
    if (mode === 'edit') {
      // Only load saved templates when editing existing configurations
      loadSavedTemplates()
      
      const landingConfig = localStorage.getItem('elocalpass-landing-config')
      if (landingConfig) {
        try {
          const savedConfig = JSON.parse(landingConfig)
          setFormData(savedConfig.landingConfig)
          console.log('✅ Loaded existing landing page configuration for edit mode')
        } catch (error) {
          console.log('Could not load landing page configuration:', error)
        }
      }
    } else {
      // For fresh/new configurations, start with empty templates
      console.log('✅ Starting fresh configuration - not loading saved templates')
    }
  }, [])

  const fetchGlobalConfig = async () => {
    try {
      const response = await fetch('/api/admin/qr-global-config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setGlobalConfig(data)
      } else {
        console.error('Failed to fetch global config:', response.status)
      }
    } catch (error) {
      console.error('Error fetching global config:', error)
    }
  }

  const loadSavedTemplates = () => {
    const savedLandingTemplates = localStorage.getItem('elocalpass-landing-templates')
    if (savedLandingTemplates) {
      setLandingTemplates(JSON.parse(savedLandingTemplates))
    }
  }

  const saveTemplate = () => {
    if (!currentTemplateName.trim()) {
      toast.warning('Missing Template Name', 'Please enter a template name')
      return
    }
    
    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: currentTemplateName,
      data: { ...formData }
    }
    
    const updatedTemplates = [...landingTemplates, newTemplate]
    setLandingTemplates(updatedTemplates)
    localStorage.setItem('elocalpass-landing-templates', JSON.stringify(updatedTemplates))
    setShowSaveDialog(false)
    setCurrentTemplateName('')
    toast.success('Template Saved', `Template "${newTemplate.name}" saved successfully!`)
  }

  const loadLandingTemplate = (template: { name: string, data: any }) => {
    setFormData({ ...template.data })
    toast.success('Template Loaded', `Template "${template.name}" loaded successfully!`)
  }

  const deleteLandingTemplate = (index: number) => {
    if (confirm(`Are you sure you want to delete template "${landingTemplates[index].name}"?`)) {
      const updatedTemplates = landingTemplates.filter((template, i) => i !== index)
      setLandingTemplates(updatedTemplates)
      localStorage.setItem('elocalpass-landing-templates', JSON.stringify(updatedTemplates))
      setCurrentTemplateName('')
      toast.success('Template Deleted', `Template "${landingTemplates[index].name}" deleted successfully!`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.configurationName?.trim()) {
        toast.error('Missing Information', 'Please enter a configuration name')
        setIsSubmitting(false)
        return
      }
      
      if (!formData.businessName?.trim()) {
        toast.error('Missing Information', 'Please enter a business name')
        setIsSubmitting(false)
        return
      }

      const configData = {
        ...formData,
        // Include Button 1 settings from global config
        allowCustomGuests: globalConfig ? !globalConfig.button1GuestsLocked : true,
        defaultGuests: globalConfig ? globalConfig.button1GuestsDefault : 2,
        maxGuests: globalConfig ? globalConfig.button1GuestsRangeMax : 10,
        allowCustomDays: globalConfig ? !globalConfig.button1DaysLocked : true,
        defaultDays: globalConfig ? globalConfig.button1DaysDefault : 3,
        maxDays: globalConfig ? globalConfig.button1DaysRangeMax : 30
      }

      const response = await fetch('/api/admin/qr-config/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(configData)
      })

      if (response.ok) {
        const result = await response.json()
        const landingUrl = `/landing-enhanced/${result.qrId}`
        setGeneratedUrl(landingUrl)
        
        // Save the named configuration as a landing page URL entry
        try {
          const urlResponse = await fetch('/api/seller/landing-urls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              name: formData.configurationName.trim(),
              url: `${window.location.origin}${landingUrl}`,
              description: `Custom landing page configuration created on ${new Date().toLocaleDateString()}`
            })
          })
          
          if (urlResponse.ok) {
            toast.success('Landing Page Configuration Saved', `"${formData.configurationName}" created and saved to your URL management! URL: ${landingUrl}`)
          } else {
            toast.error('Save Error', 'Landing page created but failed to save to URL management')
          }
        } catch (urlError) {
          console.error('Error saving landing page URL:', urlError)
          toast.error('Save Error', 'Landing page created but failed to save to URL management')
        }
        
        // Save landing page config to localStorage for QR Config Library display
        const landingConfig = {
          id: result.qrId,
          name: formData.configurationName.trim(),
          landingConfig: { ...configData },
          landingUrl: landingUrl,
          createdAt: new Date(),
          isActive: true
        }
        localStorage.setItem('elocalpass-landing-config', JSON.stringify(landingConfig))
        
        // Redirect back to QR config after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/qr-config'
        }, 2000)
      } else {
        throw new Error('Failed to create landing page')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error Creating Landing Page', 'Please try again.')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create Enhanced Custom Landing Page</h1>
                  <p className="text-gray-600 mt-2">Complete control over text content, colors, fonts, and sizes for your landing page.</p>
                </div>
                <button
                  onClick={() => router.push('/admin/qr-config')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to QR Config
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Basic Configuration */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid md:grid-cols-1 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Configuration Name *
                    </label>
                    <input
                      key="configurationName-input"
                      type="text"
                      value={formData.configurationName || ''}
                      onChange={(e) => setFormData({...formData, configurationName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Summer Promotion Page, Holiday Special, Weekend Deal"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">This name will appear in your URL management list for easy selection.</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      key="businessName-input"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Club Viva"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL (optional)
                    </label>
                    <input
                      key="logoUrl-input"
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>

              {/* Button 1 Configuration - Inherited from Global Settings */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Guest & Day Selection Rules</h2>
                <p className="text-sm text-blue-700 mb-4">These settings are inherited from your QR Configuration System (Button 1) and cannot be modified here.</p>
                
                {globalConfig ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Guest Configuration */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3">Guest Selection</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            {globalConfig.button1GuestsLocked ? 'Fixed at' : 'Flexible up to'}: {' '}
                            <span className="font-medium">{globalConfig.button1GuestsDefault}</span>
                            {!globalConfig.button1GuestsLocked && ` (max: ${globalConfig.button1GuestsRangeMax})`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Day Configuration */}
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-3">Day Selection</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            {globalConfig.button1DaysLocked ? 'Fixed at' : 'Flexible up to'}: {' '}
                            <span className="font-medium">{globalConfig.button1DaysDefault}</span>
                            {!globalConfig.button1DaysLocked && ` (max: ${globalConfig.button1DaysRangeMax})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Loading Button 1 configuration...</div>
                )}
              </div>

              {/* Brand Colors */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-orange-900 mb-4">Brand Colors</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color (Blue Elements)
                    </label>
                    <input
                      key="primaryColor-input"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color (Orange Elements)
                    </label>
                    <input
                      key="secondaryColor-input"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      key="backgroundColor-input"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Individual Box Colors */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-purple-900 mb-4">Individual Box Colors</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest Selection Box Color
                    </label>
                    <input
                      key="guestSelectionBoxColor-input"
                      type="color"
                      value={formData.guestSelectionBoxColor}
                      onChange={(e) => setFormData({...formData, guestSelectionBoxColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day Selection Box Color
                    </label>
                    <input
                      key="daySelectionBoxColor-input"
                      type="color"
                      value={formData.daySelectionBoxColor}
                      onChange={(e) => setFormData({...formData, daySelectionBoxColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Footer Disclaimer Box Color
                    </label>
                    <input
                      key="footerDisclaimerBoxColor-input"
                      type="color"
                      value={formData.footerDisclaimerBoxColor}
                      onChange={(e) => setFormData({...formData, footerDisclaimerBoxColor: e.target.value})}
                      className="w-full h-12 rounded-md border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Text Content & Typography */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-purple-900 mb-6">Text Content & Typography</h2>
                <p className="text-sm text-purple-700 mb-6">Customize all text content, colors, fonts, and sizes for complete control over your landing page appearance.</p>
                
                <div className="space-y-6">
                  
                  {/* Main Header Text */}
                  <TextWithTypography
                    label="Main Header Text"
                    textKey="headerText"
                    colorKey="headerTextColor"
                    fontFamilyKey="headerFontFamily"
                    fontSizeKey="headerFontSize"
                    isTextarea={true}
                    rows={2}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                  {/* Description Text */}
                  <TextWithTypography
                    label="Description Text"
                    textKey="descriptionText"
                    colorKey="descriptionTextColor"
                    fontFamilyKey="descriptionFontFamily"
                    fontSizeKey="descriptionFontSize"
                    isTextarea={true}
                    rows={3}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                  {/* Form Title (Sign Up Text) */}
                  <TextWithTypography
                    label="Form Title Text (Sign Up)"
                    textKey="formTitleText"
                    colorKey="formTitleTextColor"
                    fontFamilyKey="formTitleFontFamily"
                    fontSizeKey="formTitleFontSize"
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                  {/* Form Instructions */}
                  <TextWithTypography
                    label="Form Instructions Text"
                    textKey="formInstructionsText"
                    colorKey="formInstructionsTextColor"
                    fontFamilyKey="formInstructionsFontFamily"
                    fontSizeKey="formInstructionsFontSize"
                    isTextarea={true}
                    rows={2}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                  {/* CTA Button Text */}
                  <TextWithTypography
                    label="CTA Button Text"
                    textKey="ctaButtonText"
                    colorKey="ctaButtonTextColor"
                    fontFamilyKey="ctaButtonFontFamily"
                    fontSizeKey="ctaButtonFontSize"
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                  {/* Footer Disclaimer */}
                  <TextWithTypography
                    label="Footer Disclaimer Text"
                    textKey="footerDisclaimerText"
                    colorKey="footerDisclaimerTextColor"
                    fontFamilyKey="footerDisclaimerFontFamily"
                    fontSizeKey="footerDisclaimerFontSize"
                    isTextarea={true}
                    rows={3}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  
                </div>
              </div>

              {/* Template Management */}
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h2 className="text-xl font-bold text-green-900 mb-4">🎨 Template Management</h2>
                <p className="text-green-700 text-sm mb-4">Save, load, and delete templates for landing pages. Templates store all customization settings for quick reuse.</p>
                
                {/* Template Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-green-700 mb-3">Template Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="templateType"
                        value="landing"
                        checked={templateType === 'landing'}
                        onChange={(e) => setTemplateType(e.target.value as 'landing' | 'email')}
                        className="mr-2"
                      />
                      <span className="text-sm text-green-700">Landing Page Templates</span>
                    </label>
                  </div>
                </div>

                {/* Landing Page Template Management */}
                {templateType === 'landing' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-green-800">🎯 Landing Page Templates</h3>
                    
                    {/* Saved Templates */}
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Saved Landing Page Templates</label>
                      <div className="grid gap-2">
                        {landingTemplates.map((template, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                            <span className="text-sm text-green-800">{template.name}</span>
                            <div className="space-x-2">
                              <button
                                type="button"
                                onClick={() => loadLandingTemplate(template)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteLandingTemplate(index)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        {landingTemplates.length === 0 && (
                          <div className="text-sm text-green-600 bg-white p-3 rounded border border-green-200 text-center">
                            No landing page templates saved yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Save Template */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowSaveDialog(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save Current Landing Page as Template
                      </button>
                    </div>
                  </div>
                )}

                {/* Landing Page Save Dialog */}
                {showSaveDialog && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Save Landing Page Template</h3>
                      <input
                        type="text"
                        value={currentTemplateName}
                        onChange={(e) => setCurrentTemplateName(e.target.value)}
                        placeholder="Enter template name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex gap-4">
                        <button
                          type="button"
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          onClick={saveTemplate}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                          onClick={() => {
                            setShowSaveDialog(false)
                            setCurrentTemplateName('')
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
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                >
                  {isSubmitting ? 'Saving Landing Page Configuration...' : 'Save Landing Page Configuration'}
                </button>
              </div>
            </form>

            {/* Generated URL Display */}
            {generatedUrl && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg">
                <h3 className="text-lg font-bold text-green-900 mb-2">Enhanced Landing Page Created!</h3>
                <p className="text-sm text-green-700 mb-2">Landing Page URL:</p>
                <div className="bg-white p-3 rounded border border-green-200">
                  <code className="text-sm text-green-800 break-all">{generatedUrl}</code>
                </div>
                <div className="mt-4 space-x-4">
                  <button
                    onClick={() => window.open(generatedUrl, '_blank')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View Landing Page
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastNotifications 
        notifications={toast.notifications} 
        onRemove={toast.removeToast} 
      />
    </div>
  )
}
