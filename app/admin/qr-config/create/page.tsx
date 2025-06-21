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
  const [editMode, setEditMode] = useState(false)
  const [editQrId, setEditQrId] = useState<string | null>(null)
  const [editUrlId, setEditUrlId] = useState<string | null>(null)
  const [cameFromLibrary, setCameFromLibrary] = useState(false)
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
  const [isLoading, setIsLoading] = useState(true)
  
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
    console.log('🎯 CREATE PAGE: useEffect triggered!')
    
    const initializePage = async () => {
      try {
        // Always fetch global config first
        await fetchGlobalConfig()
        
        // Check for edit mode and load existing configurations only for edit
        const urlParams = new URLSearchParams(window.location.search)
        const mode = urlParams.get('mode')
        const qrId = urlParams.get('qrId')
        const urlId = urlParams.get('urlId')
        
        console.log('🔧 LANDING EDITOR: URL params:', { mode, qrId, urlId })
        console.log('🔧 LANDING EDITOR: Current URL:', window.location.href)
        
        if (mode === 'edit') {
          console.log('✅ EDIT MODE DETECTED! Setting up edit mode...')
          setEditMode(true)
          setEditQrId(qrId)
          setEditUrlId(urlId)
          setCameFromLibrary(true) // We came from the library if in edit mode
          
          // Only load saved templates when editing existing configurations
          loadSavedTemplates()
          
          // Load configuration from database instead of localStorage
          if (qrId) {
            console.log('🚀 CALLING loadConfigurationForEdit with qrId:', qrId, 'urlId:', urlId)
            await loadConfigurationForEdit(qrId, urlId)
          } else {
            console.log('❌ Missing qrId for edit mode!')
          }
        } else {
          // For fresh/new configurations, start with empty templates
          console.log('✅ Starting fresh configuration - not loading saved templates')
        }
      } catch (error) {
        console.error('❌ Error initializing page:', error)
      } finally {
        // Always set loading to false when done
        console.log('✅ Initialization complete, setting loading to false')
        setIsLoading(false)
      }
    }
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Safety timeout triggered - forcing loading to false')
      setIsLoading(false)
    }, 5000) // 5 second timeout
    
    initializePage().finally(() => {
      clearTimeout(safetyTimeout)
    })
    
    // Cleanup timeout on unmount
    return () => {
      clearTimeout(safetyTimeout)
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
        console.log('✅ Global config loaded successfully')
      } else {
        console.error('Failed to fetch global config:', response.status)
        throw new Error(`Failed to fetch global config: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching global config:', error)
      throw error
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
    
    // Also save to QR configuration if in edit mode
    if (editMode && editQrId) {
      saveToQRConfiguration()
    }
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

  const saveToQRConfiguration = async () => {
    if (!editMode || !editQrId) {
      console.log('❌ SAVE DEBUG: Not in edit mode or missing QR ID', { editMode, editQrId })
      return
    }

    try {
      console.log('💾 SAVE DEBUG: Starting save process for QR ID:', editQrId)
      console.log('💾 SAVE DEBUG: URL ID:', editUrlId)
      console.log('💾 SAVE DEBUG: Current form data:', formData)
      
      // First, let's check what configurations exist in the database
      console.log('🔍 SAVE DEBUG: Checking available configurations in database...')
      try {
        const listResponse = await fetch('/api/admin/saved-configs', {
          credentials: 'include'
        })
        if (listResponse.ok) {
          const allConfigs = await listResponse.json()
          console.log('🔍 SAVE DEBUG: Available configs in database:', allConfigs.map((c: any) => ({ id: c.id, name: c.name })))
          console.log('🔍 SAVE DEBUG: Looking for QR ID:', editQrId)
          const foundConfig = allConfigs.find((c: any) => c.id === editQrId)
          console.log('🔍 SAVE DEBUG: Found matching config:', foundConfig ? 'YES' : 'NO')
          if (foundConfig) {
            console.log('🔍 SAVE DEBUG: Found config details:', foundConfig)
          }
        }
      } catch (listError) {
        console.log('⚠️ SAVE DEBUG: Could not list configs:', listError)
      }
      
      // Load existing saved configuration from database
      const response = await fetch(`/api/admin/saved-configs/${editQrId}`, {
        credentials: 'include'
      })
      
      let existingConfig = null
      let useDatabase = false
      
      if (response.ok) {
        existingConfig = await response.json()
        useDatabase = true
        console.log('💾 SAVE DEBUG: Loaded config from database:', existingConfig)
      } else {
        console.log('❌ SAVE DEBUG: Configuration not found in database')
        console.log('❌ SAVE DEBUG: Response status:', response.status)
        toast.error('Configuration Not Found', 'Could not find the QR configuration to update in database')
        return
      }
      
      // Update the configuration with landing page content
      const updatedConfig = { ...existingConfig }
      
      // Ensure landingPageConfig structure exists
      if (!updatedConfig.landingPageConfig) {
        updatedConfig.landingPageConfig = {}
      }
      
      // Save the current form data as custom content FOR THIS SPECIFIC URL
      if (editUrlId) {
        // NEW STRUCTURE: Save to temporaryUrls array where the landing page will look for it
        if (!updatedConfig.landingPageConfig.temporaryUrls) {
          updatedConfig.landingPageConfig.temporaryUrls = []
        }
        
        // Find the URL entry in temporaryUrls array
        const urlIndex = updatedConfig.landingPageConfig.temporaryUrls.findIndex((url: any) => url.id === editUrlId)
        
        if (urlIndex !== -1) {
          // Update existing URL entry with new customizations AND name
          updatedConfig.landingPageConfig.temporaryUrls[urlIndex].customizations = { ...formData }
          // IMPORTANT: Also update the URL name to match the configuration name
          if (formData.configurationName) {
            updatedConfig.landingPageConfig.temporaryUrls[urlIndex].name = formData.configurationName
            console.log('💾 SAVE DEBUG: Updated URL name to:', formData.configurationName)
          }
          console.log('💾 SAVE DEBUG: Updated existing URL entry customizations for:', editUrlId)
        } else {
          // Create new URL entry (shouldn't happen in edit mode, but just in case)
          updatedConfig.landingPageConfig.temporaryUrls.push({
            id: editUrlId,
            name: formData.configurationName || 'Edited Landing Page',
            url: `${window.location.origin}/landing-enhanced/${editQrId}?urlId=${editUrlId}`,
            customizations: { ...formData },
            isTemp: true,
            createdAt: new Date().toISOString()
          })
          console.log('💾 SAVE DEBUG: Created new URL entry with customizations for:', editUrlId)
        }
      } else {
        // If no specific URL ID, save to the main landing page config
        Object.assign(updatedConfig.landingPageConfig, formData)
        console.log('💾 SAVE DEBUG: Saved to main landing page config')
      }
      
      console.log('💾 SAVE DEBUG: Form data being saved:', formData)
      console.log('💾 SAVE DEBUG: Updated config with new content:', updatedConfig)
      
      if (useDatabase) {
        // Try to save to database
        console.log('💾 SAVE DEBUG: Attempting database save...')
        console.log('💾 SAVE DEBUG: Payload being sent:', {
          name: updatedConfig.name,
          description: updatedConfig.description,
          config: updatedConfig.config,
          emailTemplates: updatedConfig.emailTemplates,
          landingPageConfig: updatedConfig.landingPageConfig,
          selectedUrlIds: updatedConfig.selectedUrlIds
        })
        
        const updateResponse = await fetch(`/api/admin/saved-configs/${editQrId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: updatedConfig.name,
            description: updatedConfig.description,
            config: updatedConfig.config,
            emailTemplates: updatedConfig.emailTemplates,
            landingPageConfig: updatedConfig.landingPageConfig,
            selectedUrlIds: updatedConfig.selectedUrlIds
          })
        })
        
        console.log('💾 SAVE DEBUG: Database response status:', updateResponse.status)
        
        if (updateResponse.ok) {
          const savedConfigData = await updateResponse.json()
          console.log('✅ SAVE DEBUG: Successfully saved to database')
          console.log('✅ SAVE DEBUG: Saved config data:', savedConfigData)
          
          // Update editQrId to use the correct saved configuration ID
          const actualConfigId = savedConfigData.id
          console.log('✅ SAVE DEBUG: Using actual config ID for redirect:', actualConfigId)
          
          // Store the correct ID for redirect
          window.sessionStorage.setItem('redirectConfigId', actualConfigId)
          
          toast.success('Configuration Saved', 'Landing page configuration saved to database successfully!')
        } else {
          const errorData = await updateResponse.json()
          console.log('❌ SAVE DEBUG: Database save failed, response:', errorData)
          toast.error('Save Failed', 'Failed to save configuration to database')
          return
        }
      }
      
      // Always try to update qrConfigurations Map for landing page display
      try {
        console.log('💾 SAVE DEBUG: Updating qrConfigurations Map with form data:', formData)
        const mapUpdateResponse = await fetch('/api/admin/qr-config/update-map', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            qrId: editQrId,
            configData: formData
          })
        })
        
        if (mapUpdateResponse.ok) {
          console.log('✅ SAVE DEBUG: Successfully updated qrConfigurations Map')
          const mapResult = await mapUpdateResponse.json()
          console.log('✅ SAVE DEBUG: Map update result:', mapResult)
        } else {
          const mapError = await mapUpdateResponse.text()
          console.log('⚠️ SAVE DEBUG: Failed to update Map, response:', mapError)
        }
      } catch (mapError) {
        console.log('⚠️ SAVE DEBUG: Map update error (save still succeeded):', mapError)
      }
      
      // Navigate back to QR configuration page with the specific config expanded
      setTimeout(() => {
        // Use the correct saved configuration ID for redirect
        const redirectConfigId = window.sessionStorage.getItem('redirectConfigId') || editQrId
        console.log('✅ REDIRECT DEBUG: Using config ID for redirect:', redirectConfigId)
        
        if (cameFromLibrary && redirectConfigId) {
          // If we came from the library, go back to library with config expanded
          router.push(`/admin/qr-config?showLibrary=true&expandConfig=${redirectConfigId}`)
        } else {
          // Otherwise use the old expand parameter
          router.push(`/admin/qr-config?expand=${redirectConfigId}`)
        }
        
        // Clean up session storage
        window.sessionStorage.removeItem('redirectConfigId')
      }, 1500) // Wait for toast to be visible
      
    } catch (error) {
      console.error('❌ SAVE DEBUG: Error saving:', error)
      toast.error('Save Failed', 'Failed to save landing page changes')
    }
  }

  // Load configuration for editing from database
  const loadConfigurationForEdit = async (qrId: string, urlId?: string | null) => {
    console.log('✅ LOAD DEBUG: Loading config from database for QR ID:', qrId)
    console.log('✅ LOAD DEBUG: URL ID:', urlId)
    
    try {
      // Load configuration from database first (prioritize database)
      const response = await fetch(`/api/admin/saved-configs/${qrId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const config = await response.json()
        console.log('✅ LOAD DEBUG: Loaded config from database:', config)
        
        let configToLoad = null
        
        if (urlId) {
          // For URL-specific editing: Look for customizations in temporaryUrls array
          console.log('🔍 LOAD DEBUG: Looking for URL-specific customizations for urlId:', urlId)
          console.log('🔍 LOAD DEBUG: landingPageConfig structure:', config.landingPageConfig)
          console.log('🔍 LOAD DEBUG: temporaryUrls array:', config.landingPageConfig?.temporaryUrls)
          
          // Look for the specific URL in temporaryUrls array
          if (config.landingPageConfig?.temporaryUrls) {
            const urlEntry = config.landingPageConfig.temporaryUrls.find((url: any) => url.id === urlId)
            console.log('🔍 LOAD DEBUG: Found URL entry:', urlEntry)
            
            if (urlEntry && urlEntry.customizations) {
              configToLoad = urlEntry.customizations
              console.log('✅ LOAD DEBUG: Found customizations for URL:', urlId, configToLoad)
            } else {
              console.log('❌ LOAD DEBUG: No customizations found for URL:', urlId)
              // Fallback to general landing page config
              if (config.landingPageConfig) {
                configToLoad = config.landingPageConfig
                console.log('✅ LOAD DEBUG: Using general landing page config as fallback')
              }
            }
          } else {
            console.log('❌ LOAD DEBUG: No temporaryUrls array found')
            // Fallback to general landing page config
            if (config.landingPageConfig) {
              configToLoad = config.landingPageConfig
              console.log('✅ LOAD DEBUG: Using general landing page config as fallback')
            }
          }
        } else {
          // For general landing page editing: Use general landing page config
          if (config.landingPageConfig) {
            configToLoad = config.landingPageConfig
            console.log('✅ LOAD DEBUG: Using general landing page config for non-URL-specific edit')
          } else {
            console.log('❌ LOAD DEBUG: No general landing page config found')
          }
        }
        
        if (configToLoad) {
          console.log('✅ LOAD DEBUG: Setting form data from database:', configToLoad)
          // Merge loaded config with existing formData to preserve defaults for missing fields
          setFormData(prevFormData => ({
            ...prevFormData,
            ...configToLoad
          }))
          console.log('✅ LOAD DEBUG: Form data updated successfully')
          return // Successfully loaded from database
        } else {
          console.log('❌ LOAD DEBUG: No suitable configuration found in database')
        }
      } else {
        console.error('❌ LOAD DEBUG: Failed to load config from database. Status:', response.status)
        const errorText = await response.text()
        console.error('❌ LOAD DEBUG: Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ LOAD DEBUG: Error loading config from database:', error)
    }
    
    // Database load failed - use default values
    console.log('❌ LOAD DEBUG: Database load failed, using default form values')
    // The form will use its default state values
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // If in edit mode, save to QR configuration instead of creating new
      if (editMode && editQrId) {
        await saveToQRConfiguration()
        setIsSubmitting(false)
        return
      }

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
        
        // DIRECT DATABASE SAVING: Save landing page URL and customizations directly to database
        console.log('💾 DIRECT SAVE: Saving landing page directly to database...')
        
        try {
          // Check if we're creating this from a QR configuration context
          const sessionId = new URLSearchParams(window.location.search).get('sessionId')
          
          if (sessionId) {
            console.log('💾 DIRECT SAVE: Found session ID:', sessionId, '- saving to temporary configuration')
            
            // VALIDATION: Ensure sessionId is valid
            if (!sessionId || sessionId.length < 10) {
              console.error('❌ VALIDATION ERROR: Invalid session ID:', sessionId)
              toast.error('Configuration Error', 'Invalid session ID - please refresh and try again')
              return
            }
            
            // Create URL entry with complete customization data
            const urlId = `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const urlEntry = {
              id: urlId,
              name: formData.configurationName.trim(),
              url: `${window.location.origin}/landing-enhanced/${sessionId}?urlId=${urlId}`,
              description: `Custom landing page configuration created on ${new Date().toLocaleDateString()}`,
              isTemp: true,
              createdAt: new Date().toISOString(),
              qrId: sessionId, // Use session ID (configuration ID) instead of individual landing page ID
              // Include complete form data for customizations
              customizations: configData
            }
            
            // VALIDATION: Ensure URL contains correct configuration ID
            if (!urlEntry.url.includes(`/landing-enhanced/${sessionId}`)) {
              console.error('❌ VALIDATION ERROR: URL does not contain correct configuration ID')
              console.error('Expected:', sessionId, 'Found in URL:', urlEntry.url)
              toast.error('Configuration Error', 'URL generation failed - please try again')
              return
            }
            
            console.log('✅ VALIDATION PASSED: URL entry created with correct configuration ID:', sessionId)
            
            // Try to find existing temporary configuration
            let tempConfigResponse = await fetch(`/api/admin/saved-configs/${sessionId}`, {
              credentials: 'include'
            })
            
            let tempConfig
            if (tempConfigResponse.ok) {
              // Update existing configuration
              tempConfig = await tempConfigResponse.json()
              console.log('💾 DIRECT SAVE: Found existing temp config:', tempConfig)
              
              // Ensure landingPageConfig structure exists
              if (!tempConfig.landingPageConfig) {
                tempConfig.landingPageConfig = {}
              }
              if (!tempConfig.landingPageConfig.temporaryUrls) {
                tempConfig.landingPageConfig.temporaryUrls = []
              }
              
              // Add the new URL to the configuration
              tempConfig.landingPageConfig.temporaryUrls.push(urlEntry)
              
              // Also save the form data as the general landing page configuration
              Object.assign(tempConfig.landingPageConfig, configData)
              
            } else {
              // Create new temporary configuration
              console.log('💾 DIRECT SAVE: Creating new temp config for session:', sessionId)
              tempConfig = {
                id: sessionId,
                name: `Temp Session ${sessionId.slice(-8)}`,
                description: 'Temporary configuration for current session',
                config: {},
                landingPageConfig: {
                  ...configData,
                  temporaryUrls: [urlEntry]
                }
              }
            }
            
            // Save to database (use PUT for updates, POST for new)
            const saveResponse = await fetch(
              tempConfigResponse.ok 
                ? `/api/admin/saved-configs/${sessionId}` // Update existing
                : '/api/admin/saved-configs', // Create new
              {
                method: tempConfigResponse.ok ? 'PUT' : 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(tempConfig)
              }
            )
            
            if (saveResponse.ok) {
              console.log('✅ DIRECT SAVE: Successfully saved landing page directly to database!')
              
              // IMPORTANT: Mark Button 3 as configured and auto-select the new URL
              console.log('🔧 AUTO-CONFIG: Setting Button 3 as configured and auto-selecting URL')
              
              // 1. Save Button 3 configuration to localStorage (so it shows as green)
              const button3Config = {
                deliveryMethod: 'URLS',
                configured: true,
                timestamp: new Date().toISOString()
              }
              localStorage.setItem('elocalpass-button3-config', JSON.stringify(button3Config))
              
              // 2. Auto-select the newly created URL (add to selectedUrlIds)
              const existingButton3Urls = localStorage.getItem('elocalpass-button3-urls')
              let button3UrlsData: {
                temporaryUrls: any[]
                selectedUrlIds: string[]
              } = {
                temporaryUrls: [],
                selectedUrlIds: []
              }
              
              if (existingButton3Urls) {
                try {
                  button3UrlsData = JSON.parse(existingButton3Urls)
                } catch (error) {
                  console.warn('Could not parse existing Button 3 URLs:', error)
                }
              }
              
              // Add the new URL to temporaryUrls if not already there
              const existingUrl = button3UrlsData.temporaryUrls.find((url: any) => url.id === urlId)
              if (!existingUrl) {
                button3UrlsData.temporaryUrls.push(urlEntry)
              }
              
              // Auto-select the new URL (add to selectedUrlIds)
              if (!button3UrlsData.selectedUrlIds.includes(urlId)) {
                button3UrlsData.selectedUrlIds.push(urlId)
                console.log('🔧 AUTO-SELECT: Added URL to selectedUrlIds:', urlId)
              }
              
              // Save updated Button 3 URLs data
              localStorage.setItem('elocalpass-button3-urls', JSON.stringify(button3UrlsData))
              
              toast.success('Landing Page Created & Saved', `"${formData.configurationName}" created and automatically attached to Button 3 configuration!`)
            } else {
              console.log('⚠️ DIRECT SAVE: Failed to save to database')
              toast.error('Save Error', 'Landing page created but failed to save to database')
            }
            
          } else {
            console.log('💾 DIRECT SAVE: No session ID found - creating standalone landing page')
            
            // For standalone landing pages, still save to seller URLs for management
            const urlResponse = await fetch('/api/seller/landing-urls', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                name: formData.configurationName.trim(),
                url: `${window.location.origin}${landingUrl}`,
                description: `Custom landing page configuration created on ${new Date().toLocaleDateString()}`,
                customizations: configData // Include customizations
              })
            })
            
            if (urlResponse.ok) {
              toast.success('Landing Page Created', `"${formData.configurationName}" created and saved to your URL management!`)
            } else {
              toast.error('Save Error', 'Landing page created but failed to save to URL management')
            }
          }
        } catch (saveError) {
          console.error('Error in direct database save:', saveError)
          toast.error('Save Error', 'Landing page created but failed to save customizations')
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
        
        // Redirect back to appropriate location after 2 seconds
        setTimeout(() => {
          if (cameFromLibrary && editQrId) {
            // If we came from the library, go back to library with config expanded
            window.location.href = `/admin/qr-config?showLibrary=true&expandConfig=${editQrId}`
          } else {
            // Otherwise go to Button 3 view
            window.location.href = '/admin/qr-config?activeButton=3'
          }
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

  // Show loading screen while data is being loaded to prevent hydration errors
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading landing page editor...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                  onClick={() => {
                    if (cameFromLibrary && editQrId) {
                      // Navigate back to QR config with library open and config expanded
                      router.push(`/admin/qr-config?showLibrary=true&expandConfig=${editQrId}`)
                    } else {
                      // Otherwise just go back to the main QR config page
                      router.push('/admin/qr-config')
                    }
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← {cameFromLibrary ? 'Back to QR Config Library' : 'Back to QR Config'}
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
                  {isSubmitting 
                    ? (editMode ? 'Saving Changes...' : 'Saving Landing Page Configuration...') 
                    : (editMode ? '💾 Save Changes to QR Configuration' : 'Save Landing Page Configuration')
                  }
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
