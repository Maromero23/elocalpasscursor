'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Building2, Users, MapPin, QrCode, Settings, Eye, Plus, Edit3, Palette, Save, Clock, Monitor, Mail, EyeOff, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ToastNotifications } from '@/components/toast-notification'
import Link from 'next/link'

// Configuration interfaces
interface QRButtonConfig {
  id: string
  buttonNumber: 1 | 2 | 3 | 4 | 5
  isActive: boolean
  settings: any
}

interface QRGlobalConfig {
  id?: string
  // OLD Button 1 fields (keep for backward compatibility)
  button1AllowCustomGuestsDays: boolean
  button1DefaultGuests: number
  button1DefaultDays: number
  button1MaxGuests: number
  button1MaxDays: number
  
  // NEW Button 1 fields (parallel system)
  button1GuestsLocked: boolean          // ON = locked to default, OFF = flexible range
  button1GuestsDefault: number          // Default value when locked
  button1GuestsRangeMax: number         // Max range when flexible (1 to max)
  button1DaysLocked: boolean            // ON = locked to default, OFF = flexible range  
  button1DaysDefault: number            // Default value when locked
  button1DaysRangeMax: number           // Max range when flexible (1 to max)
  
  button2PricingType: 'FIXED' | 'VARIABLE' | 'FREE'
  button2FixedPrice?: number
  button2VariableBasePrice: number
  button2VariableGuestIncrease: number
  button2VariableDayIncrease: number
  button2VariableCommission: number
  button2IncludeTax: boolean
  button2TaxPercentage: number
  button3DeliveryMethod: 'DIRECT' | 'URLS' | 'BOTH'
  button4LandingPageRequired: boolean
  button5SendRebuyEmail: boolean
  updatedAt: Date
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
    ]
  }
  return []
}

export default function QRConfigPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const navItems = getNavItems(session?.user?.role || "")

  // State for global configuration
  const [globalConfig, setGlobalConfig] = useState<QRGlobalConfig>({
    button1AllowCustomGuestsDays: false,
    button1DefaultGuests: 2,
    button1DefaultDays: 3,
    button1MaxGuests: 10,
    button1MaxDays: 30,
    button1GuestsLocked: false,
    button1GuestsDefault: 2,
    button1GuestsRangeMax: 10,
    button1DaysLocked: false,
    button1DaysDefault: 3,
    button1DaysRangeMax: 30,
    button2PricingType: 'FIXED' as const,
    button2FixedPrice: 0,
    button2VariableBasePrice: 0,
    button2VariableGuestIncrease: 0,
    button2VariableDayIncrease: 0,
    button2VariableCommission: 0,
    button2IncludeTax: false,
    button2TaxPercentage: 0,
    button3DeliveryMethod: 'DIRECT' as const,
    button4LandingPageRequired: true,
    button5SendRebuyEmail: false,
    updatedAt: new Date(),
  })

  const [loading, setLoading] = useState(false)
  const [activeButton, setActiveButton] = useState<number>(1)
  const [saveStatus, setSaveStatus] = useState<string>('')
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false)
  const [configuredButtons, setConfiguredButtons] = useState<Set<number>>(new Set())
  const [savedConfigurations, setSavedConfigurations] = useState<Array<{
    id: string;
    name: string;
    description: string;
    config: QRGlobalConfig;
    selectedUrlIds: string[]; // Preserve selected URL IDs for multi-URL support
    emailTemplates: {
      welcomeEmail: any;
      rebuyEmail: any;
    };
    landingPageConfig: any;
    createdAt: Date;
  }>>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showConfigLibrary, setShowConfigLibrary] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [progressRestored, setProgressRestored] = useState(false)

  // Search and filter states for QR Configuration Library
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPricingType, setFilterPricingType] = useState('ALL')
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState('ALL')
  const [sortBy, setSortBy] = useState('DATE_DESC')
  const [urlSearchQuery, setUrlSearchQuery] = useState('')

  // Seller assignment states
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [availableSellers, setAvailableSellers] = useState<Array<{
    id: string
    name: string | null
    email: string
    role: string
    hasAssignedConfig: boolean
  }>>([])
  const [selectedConfig, setSelectedConfig] = useState<any>(null)
  const [loadingSellers, setLoadingSellers] = useState(false)

  // URL Management states  
  const [sellerUrls, setSellerUrls] = useState<Array<{
    id: string
    name: string
    url: string
    description?: string
    isActive: boolean
    createdAt: string
  }>>([])
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [editingUrl, setEditingUrl] = useState<{
    id: string
    name: string
    url: string
    description?: string
  } | null>(null)
  const [urlFormData, setUrlFormData] = useState({
    name: '',
    url: '',
    description: ''
  })
  const [selectedUrlIds, setSelectedUrlIds] = useState<string[]>([])

  // Filter and sort configurations based on search and filters
  const filteredAndSortedConfigurations = savedConfigurations
    .filter(config => {
      // Search query filter (name, description)
      const matchesSearch = searchQuery === '' || 
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Pricing type filter
      const matchesPricing = filterPricingType === 'ALL' || 
        config.config.button2PricingType === filterPricingType

      // Delivery method filter
      const matchesDelivery = filterDeliveryMethod === 'ALL' || 
        config.config.button3DeliveryMethod === filterDeliveryMethod

      return matchesSearch && matchesPricing && matchesDelivery
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name)
        case 'NAME_DESC':
          return b.name.localeCompare(a.name)
        case 'DATE_ASC':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'DATE_DESC':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  // Helper function to check if a button configuration has been actively modified
  const isButtonConfigured = (buttonNum: number): boolean => {
    return Array.from(configuredButtons).includes(buttonNum)
  }

  // Helper function to check if any saved configuration uses a specific template
  const isTemplateUsedBySavedConfigs = (templateType: 'welcome' | 'rebuy' | 'landing'): boolean => {
    return savedConfigurations.some(config => {
      switch (templateType) {
        case 'welcome':
          return config.emailTemplates?.welcomeEmail !== null
        case 'rebuy':
          return config.emailTemplates?.rebuyEmail !== null
        case 'landing':
          return config.landingPageConfig !== null
        default:
          return false
      }
    })
  }

  // Helper function to clean up orphaned templates after configuration deletion
  const cleanupOrphanedTemplates = (deletedConfigId: string) => {
    // Get the remaining configurations (after deletion)
    const remainingConfigs = savedConfigurations.filter(config => config.id !== deletedConfigId)
    
    // Check if welcome email template is still used
    const welcomeStillUsed = remainingConfigs.some(config => config.emailTemplates?.welcomeEmail !== null)
    if (!welcomeStillUsed) {
      localStorage.removeItem('elocalpass-welcome-email-config')
      console.log('🧹 Cleaned up orphaned welcome email template')
    }
    
    // Check if rebuy email template is still used
    const rebuyStillUsed = remainingConfigs.some(config => config.emailTemplates?.rebuyEmail !== null)
    if (!rebuyStillUsed) {
      localStorage.removeItem('elocalpass-rebuy-email-config')
      console.log('🧹 Cleaned up orphaned rebuy email template')
    }
    
    // Check if landing page template is still used
    const landingStillUsed = remainingConfigs.some(config => config.landingPageConfig !== null)
    if (!landingStillUsed) {
      localStorage.removeItem('elocalpass-landing-config')
      console.log('🧹 Cleaned up orphaned landing page template')
    }
  }

  // Reset all configurations to defaults
  const resetToDefaults = async () => {
    const defaultConfig = {
      // OLD Button 1 fields (keep for backward compatibility)
      button1AllowCustomGuestsDays: false,
      button1DefaultGuests: 2,
      button1DefaultDays: 3,
      button1MaxGuests: 10,
      button1MaxDays: 30,
      
      // NEW Button 1 fields (reset to defaults)
      button1GuestsLocked: false,
      button1GuestsDefault: 2,
      button1GuestsRangeMax: 10,
      button1DaysLocked: false,
      button1DaysDefault: 3,
      button1DaysRangeMax: 30,
      
      button2PricingType: 'FIXED' as const,
      button2FixedPrice: 0,
      button2VariableBasePrice: 0,
      button2VariableGuestIncrease: 0,
      button2VariableDayIncrease: 0,
      button2VariableCommission: 0,
      button2IncludeTax: false,
      button2TaxPercentage: 0,
      button3DeliveryMethod: 'DIRECT' as const,
      button4LandingPageRequired: true,
      button5SendRebuyEmail: false,
      updatedAt: new Date(),
    }
    
    await updateConfig(defaultConfig)
    
    // Clear ONLY current working templates - NOT saved configurations
    localStorage.removeItem('elocalpass-welcome-email-config')
    localStorage.removeItem('elocalpass-rebuy-email-config')
    localStorage.removeItem('elocalpass-landing-config')
    localStorage.removeItem('elocalpass-current-qr-progress')
    console.log('🧹 Reset cleared current working templates - saved configurations preserved')
    
    // DO NOT delete URLs from database - Reset should only affect current working session
    // The original code was too aggressive and deleted user's saved URLs
    
    // Clear all configured button states so they return to original colors
    setConfiguredButtons(new Set())
    setSelectedUrlIds([])
    setSaveStatus('🔄 Reset to defaults - All current working values reset, saved configurations preserved')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  // Load existing configuration
  useEffect(() => {
    fetchGlobalConfig()
  }, [])

  const fetchGlobalConfig = async () => {
    try {
      const response = await fetch('/api/admin/qr-global-config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setGlobalConfig(data)
        }
      } else {
        console.error('Failed to fetch config:', response.status)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const updateConfig = async (updates: Partial<QRGlobalConfig>) => {
    const updatedConfig = { ...globalConfig, ...updates }
    setGlobalConfig(updatedConfig)
    
    // Note: Removed auto-save to database to prevent phantom config creation
    // Data is still preserved in React state + localStorage auto-save
    // Only saves to database when user explicitly clicks "Save Configuration"
    
    console.log('🔄 Config updated in state (no database auto-save):', updates)
  }

  // Load saved configurations on component mount
  useEffect(() => {
    loadCurrentProgress()
    loadSavedConfigurations()
  }, [])

  const loadSavedConfigurations = async () => {
    // Load from localStorage (named configurations)
    const saved = localStorage.getItem('elocalpass-saved-configurations')
    let localConfigs: any[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        localConfigs = parsed.map((config: any) => ({
          ...config,
          createdAt: new Date(config.createdAt)
        }))
      } catch (error) {
        console.error('Error parsing saved configurations:', error)
      }
    }

    // Load from API (global configurations)
    let apiConfigs: any[] = []
    try {
      const response = await fetch('/api/admin/qr-global-config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // If data is an array, use it; if it's a single object, wrap it in an array
        if (Array.isArray(data)) {
          apiConfigs = data.map((config: any) => ({
            id: config.id || 'global-config',
            name: `Global Config ${config.id?.slice(-8) || 'API'}`,
            description: 'Global configuration from API',
            config: config,
            createdAt: new Date(config.updatedAt || Date.now()),
            source: 'api'
          }))
        } else if (data && typeof data === 'object') {
          // Single global config object - only show if it has a real ID from database
          if (data.id && data.id !== null) {
            apiConfigs = [{
              id: data.id,
              name: `Global Config ${data.id.slice(-8)}`,
              description: 'Global configuration from API',
              config: data,
              createdAt: new Date(data.updatedAt || Date.now()),
              source: 'api'
            }]
          }
        }
      }
    } catch (error) {
      console.error('Error fetching global configurations:', error)
    }

    // Combine both sources, removing duplicates by ID
    const allConfigs = [...localConfigs, ...apiConfigs]
    const uniqueConfigs = allConfigs.filter((config, index, self) => 
      index === self.findIndex(c => c.id === config.id)
    )
    
    setSavedConfigurations(uniqueConfigs)
  }

  const loadCurrentProgress = () => {
    // Try to restore previous progress from localStorage
    const savedProgress = localStorage.getItem('elocalpass-current-qr-progress')
    console.log('🔄 RESTORE: Raw localStorage data:', savedProgress)
    
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress)
        console.log('🔄 RESTORE: Parsed progress data:', progressData)
        
        // Only restore if the progress is recent (within last 24 hours)
        const savedTime = new Date(progressData.timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
        
        console.log('🔄 RESTORE: Time check - Hours diff:', hoursDiff)
        
        if (hoursDiff < 24) {
          console.log('🔄 RESTORE: Restoring data:', {
            globalConfig: progressData.globalConfig,
            configuredButtons: progressData.configuredButtons,
            selectedUrlIds: progressData.selectedUrlIds
          })
          setGlobalConfig(progressData.globalConfig)
          setConfiguredButtons(new Set(progressData.configuredButtons))
          setSelectedUrlIds(progressData.selectedUrlIds || [])
          setProgressRestored(true)
          console.log('✅ Restored QR configuration progress from previous session')
          
          // Hide the progress restored indicator after 5 seconds
          setTimeout(() => {
            setProgressRestored(false)
            console.log('Progress restored indicator hidden')
          }, 5000)
        } else {
          // Clear old progress
          localStorage.removeItem('elocalpass-current-qr-progress')
          console.log('🗑️ RESTORE: Cleared old progress (older than 24 hours)')
        }
      } catch (error) {
        console.log('❌ RESTORE: Could not restore previous progress:', error)
        localStorage.removeItem('elocalpass-current-qr-progress')
      }
    } else {
      console.log('🔄 RESTORE: No saved progress found in localStorage')
    }
  }

  // Check if all 5 buttons are configured
  const areAllButtonsConfigured = (): boolean => {
    return configuredButtons.size === 5
  }

  // Detect configuration status after state changes (runs after restoration)
  useEffect(() => {
    // Skip if this is the initial render before any restoration
    if (!globalConfig) return

    console.log('🔍 DETECTION: Checking configuration status after state change')
    console.log('- Current globalConfig:', globalConfig)
    console.log('- Current configuredButtons:', Array.from(configuredButtons))
    console.log('- Current selectedUrlIds:', selectedUrlIds)
    
    // DEBUG: Show all Button 1 related fields
    const button1Fields = Object.keys(globalConfig).filter(key => key.includes('button1'))
    console.log('🔍 BUTTON 1 FIELDS:', button1Fields.map(field => ({ [field]: (globalConfig as any)[field] })))
    
    const configuredButtonsSet = new Set(configuredButtons)
    
    // Check Button 1 (Personalization) - mark as configured if any personalization settings are non-default
    const hasButton1Config = 
      globalConfig.button1AllowCustomGuestsDays !== false ||
      globalConfig.button1GuestsDefault !== 2 ||
      globalConfig.button1DaysDefault !== 3 ||
      globalConfig.button1GuestsRangeMax !== 10 ||
      globalConfig.button1DaysRangeMax !== 30
    console.log('- Button 1 detection:', { hasButton1Config, inConfiguredButtons: configuredButtons.has(1) })
    if (hasButton1Config || configuredButtons.has(1)) {
      configuredButtonsSet.add(1)
    }
    
    // Check Button 2 (Pricing) - mark as configured if pricing settings are non-default
    const hasButton2Config = 
      globalConfig.button2PricingType !== 'FIXED' ||
      globalConfig.button2FixedPrice !== 0 ||
      globalConfig.button2VariableBasePrice !== 0 ||
      globalConfig.button2VariableGuestIncrease !== 0 ||
      globalConfig.button2VariableDayIncrease !== 0 ||
      globalConfig.button2VariableCommission !== 0 ||
      globalConfig.button2IncludeTax !== false ||
      globalConfig.button2TaxPercentage !== 0
    console.log('- Button 2 detection:', { hasButton2Config, inConfiguredButtons: configuredButtons.has(2) })
    if (hasButton2Config || configuredButtons.has(2)) {
      configuredButtonsSet.add(2)
    }
    
    // Check Button 3 (Delivery Method) - mark as configured if delivery method is set or URLs selected
    const hasButton3Config = 
      globalConfig.button3DeliveryMethod !== 'DIRECT' ||
      selectedUrlIds.length > 0
    console.log('- Button 3 detection:', { hasButton3Config, deliveryMethod: globalConfig.button3DeliveryMethod, urlsSelected: selectedUrlIds.length, inConfiguredButtons: configuredButtons.has(3) })
    if (hasButton3Config || configuredButtons.has(3)) {
      configuredButtonsSet.add(3)
    }
    
    // Check Button 4 (Welcome Email) - mark as configured if template exists
    const hasWelcomeTemplate = !!localStorage.getItem('elocalpass-welcome-email-config')
    console.log('- Button 4 detection:', { hasWelcomeTemplate, inConfiguredButtons: configuredButtons.has(4) })
    if (hasWelcomeTemplate || configuredButtons.has(4)) {
      configuredButtonsSet.add(4)
    }
    
    // Check Button 5 (Rebuy Email) - mark as configured if rebuy is enabled or already marked as configured  
    const hasRebuyTemplate = !!localStorage.getItem('elocalpass-rebuy-email-config')
    console.log('- Button 5 detection:', { rebuyEnabled: globalConfig.button5SendRebuyEmail, hasRebuyTemplate, inConfiguredButtons: configuredButtons.has(5) })
    if (configuredButtons.has(5) || globalConfig.button5SendRebuyEmail === true) {
      configuredButtonsSet.add(5)
    }
    
    console.log('🎯 DETECTION: Final configuredButtonsSet:', Array.from(configuredButtonsSet))
    
    // Only update if something changed
    if (configuredButtonsSet.size !== configuredButtons.size || 
        !Array.from(configuredButtonsSet).every(btn => configuredButtons.has(btn))) {
      console.log('🔄 DETECTION: Updating configuredButtons state')
      setConfiguredButtons(configuredButtonsSet)
    }
  }, [globalConfig, selectedUrlIds]) // Run when these change

  // Save current configuration with a name
  const saveNamedConfiguration = () => {
    if (!areAllButtonsConfigured()) {
      toast.error('Configuration Incomplete', 'Please complete all 5 button configurations before saving')
      return
    }

    if (!newConfigName.trim()) {
      toast.error('Missing Information', 'Please enter a configuration name')
      return
    }

    // Gather template configurations - including email templates if they exist
    const landingPageConfig = localStorage.getItem('elocalpass-landing-config')
    const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
    const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
    
    let parsedLandingPage = null
    let parsedWelcomeEmail = null
    let parsedRebuyEmail = null
    
    try {
      if (landingPageConfig) {
        parsedLandingPage = JSON.parse(landingPageConfig)
      }
      if (welcomeEmailConfig) {
        parsedWelcomeEmail = JSON.parse(welcomeEmailConfig)
      }
      if (rebuyEmailConfig) {
        parsedRebuyEmail = JSON.parse(rebuyEmailConfig)
      }
    } catch (error) {
      console.warn('Warning: Could not parse template configurations:', error)
    }

    const newConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      description: newConfigDescription.trim() || 'No description provided',
      config: { ...globalConfig },
      selectedUrlIds: selectedUrlIds, // Preserve selected URL IDs for multi-URL support
      emailTemplates: {
        welcomeEmail: parsedWelcomeEmail,  // Preserve custom welcome email template
        rebuyEmail: parsedRebuyEmail       // Preserve custom rebuy email template
      },
      landingPageConfig: parsedLandingPage,
      createdAt: new Date()
    }
    
    console.log('🐛 DEBUG: Saving configuration with selectedUrlIds:', selectedUrlIds)
    console.log('🐛 DEBUG: newConfig being saved:', newConfig)
    
    const updatedConfigs = [...savedConfigurations, newConfig]
    setSavedConfigurations(updatedConfigs)
    
    // Robust localStorage saving with error handling
    try {
      localStorage.setItem('elocalpass-saved-configurations', JSON.stringify(updatedConfigs))
      console.log('✅ Configuration saved to localStorage successfully')
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error)
      toast.error('Save Failed', 'Failed to save configuration to browser storage')
      return
    }
    
    setNewConfigName('')
    setNewConfigDescription('')
    setShowSaveModal(false)
    
    toast.success('Configuration Saved!', `Configuration "${newConfig.name}" saved successfully!`)
  }

  // Delete a saved configuration
  const deleteConfiguration = (configId: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      // First, clean up any orphaned templates
      cleanupOrphanedTemplates(configId)
      
      // Then remove the configuration from the library
      const updatedConfigs = savedConfigurations.filter(config => config.id !== configId)
      setSavedConfigurations(updatedConfigs)
      
      try {
        localStorage.setItem('elocalpass-saved-configurations', JSON.stringify(updatedConfigs))
        console.log('✅ Configuration deleted from localStorage successfully')
        toast.success('Configuration Deleted', 'Configuration and unused templates deleted successfully!')
      } catch (error) {
        console.error('❌ Failed to update localStorage:', error)
        toast.error('Delete Failed', 'Failed to update browser storage')
      }
    }
  }

  // Export configurations to file
  const exportConfigurations = () => {
    if (savedConfigurations.length === 0) {
      toast.warning('No Configurations', 'No configurations to export')
      return
    }

    const dataStr = JSON.stringify(savedConfigurations, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `elocalpass-configurations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Export Complete', `Exported ${savedConfigurations.length} configurations`)
  }

  // Import configurations from file
  const importConfigurations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedConfigs = JSON.parse(e.target?.result as string)
        
        // Validate structure
        if (!Array.isArray(importedConfigs)) {
          throw new Error('Invalid file format')
        }

        // Merge with existing configs (avoiding duplicates by ID)
        const existingIds = new Set(savedConfigurations.map(c => c.id))
        const newConfigs = importedConfigs.filter((config: any) => !existingIds.has(config.id))
        
        if (newConfigs.length === 0) {
          toast.warning('No New Configurations', 'All configurations in file already exist')
          return
        }

        const mergedConfigs = [...savedConfigurations, ...newConfigs]
        setSavedConfigurations(mergedConfigs)
        
        // Save to localStorage
        localStorage.setItem('elocalpass-saved-configurations', JSON.stringify(mergedConfigs))
        
        toast.success('Import Successful', `Imported ${newConfigs.length} new configurations`)
      } catch (error) {
        console.error('Import error:', error)
        toast.error('Import Failed', 'Invalid file format or corrupted data')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const toggleConfigExpanded = (configId: string) => {
    const newExpanded = new Set(expandedConfigs)
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId)
    } else {
      newExpanded.add(configId)
    }
    setExpandedConfigs(newExpanded)
  }

  // Fetch available sellers for assignment
  const fetchAvailableSellers = async () => {
    setLoadingSellers(true)
    try {
      // Fetch sellers
      const sellersResponse = await fetch('/api/admin/sellers')
      if (!sellersResponse.ok) {
        toast.error('Error Loading Sellers', 'Failed to fetch available sellers')
        return
      }
      
      const sellers = await sellersResponse.json()
      const activeSellers = sellers.filter((seller: any) => seller.isActive)
      
      // Fetch QR configurations to check which sellers already have configs
      const configsResponse = await fetch('/api/admin/qr-config/sellers')
      let assignedSellerIds: string[] = []
      
      if (configsResponse.ok) {
        const sellersWithConfigs = await configsResponse.json()
        // Extract seller IDs that already have QR configurations (qrConfig is not null)
        assignedSellerIds = sellersWithConfigs
          .filter((seller: any) => seller.qrConfig !== null)
          .map((seller: any) => seller.id)
        console.log('📋 Sellers with existing QR configs:', assignedSellerIds)
      } else {
        console.warn('⚠️ Could not fetch existing QR configurations, showing all sellers')
      }
      
      // Filter out sellers who already have QR configurations
      const unassignedSellers = activeSellers.filter((seller: any) => 
        !assignedSellerIds.includes(seller.id)
      )
      
      console.log(`📊 Total active sellers: ${activeSellers.length}, Unassigned sellers: ${unassignedSellers.length}`)
      
      setAvailableSellers(unassignedSellers.map((seller: any) => ({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
        hasAssignedConfig: false
      })))
      
    } catch (error) {
      console.error('💥 Error fetching sellers:', error)
      toast.error('Error Loading Sellers', 'Failed to fetch available sellers')
    }
    setLoadingSellers(false)
  }

  // Show seller selection modal
  const showSellerSelectionModal = (config: any) => {
    setSelectedConfig(config)
    setShowSellerModal(true)
    fetchAvailableSellers()
  }

  // Updated assignment function with seller selection
  const assignConfigToSeller = async (sellerEmail: string) => {
    if (!selectedConfig) return
    
    console.log('🔧 Assigning config to seller:', { 
      sellerEmail, 
      configId: selectedConfig.id, 
      configName: selectedConfig.name,
      hasConfig: !!selectedConfig.config
    })
    
    try {
      const response = await fetch('/api/admin/assign-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellerEmail: sellerEmail,
          configData: selectedConfig.config,
          configId: selectedConfig.id,
          configName: selectedConfig.name
        })
      })

      if (response.ok) {
        toast.success('Configuration Assigned', `Configuration "${selectedConfig.name}" assigned to ${sellerEmail} successfully!`)
        setShowSellerModal(false)
        setSelectedConfig(null)
        // Refresh seller list
        fetchAvailableSellers()
      } else {
        const error = await response.json()
        toast.error('Assignment Failed', `Error: ${error.error}`)
      }
    } catch (error) {
      toast.error('Assignment Failed', 'Error assigning configuration')
    }
  }

  // URL Management Functions
  const fetchSellerUrls = async () => {
    console.log('🌐 FETCH: Starting fetchSellerUrls...')
    try {
      const response = await fetch('/api/seller/landing-urls')
      console.log('🌐 FETCH: Response status:', response.status)
      if (response.ok) {
        const urls = await response.json()
        console.log('🌐 FETCH: Retrieved URLs from API:', urls.length, urls.map((u: any) => ({id: u.id, name: u.name})))
        setSellerUrls(urls)
        console.log('🌐 FETCH: Set sellerUrls state with', urls.length, 'URLs')
      } else {
        console.error('🌐 FETCH: Failed to fetch seller URLs, status:', response.status)
      }
    } catch (error) {
      console.error('🌐 FETCH: Error fetching seller URLs:', error)
    }
  }

  const handleCreateUrl = async () => {
    if (!urlFormData.name.trim()) {
      toast.error('Missing Information', 'Please enter a name for the URL')
      return
    }

    try {
      const response = await fetch('/api/seller/landing-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(urlFormData)
      })

      if (response.ok) {
        toast.success('URL Created', 'Landing page URL created successfully')
        setUrlFormData({ name: '', url: '', description: '' })
        setShowUrlModal(false)
        fetchSellerUrls()
        setConfiguredButtons((prev) => new Set(prev).add(3))
      } else {
        const error = await response.json()
        toast.error('Creation Failed', `Error: ${error.error}`)
      }
    } catch (error) {
      toast.error('Creation Failed', 'Error creating URL')
    }
  }

  const handleUpdateUrl = async () => {
    if (!editingUrl || !urlFormData.name.trim()) {
      toast.error('Missing Information', 'Please enter a name for the URL')
      return
    }

    try {
      const response = await fetch(`/api/seller/landing-urls/${editingUrl.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(urlFormData)
      })

      if (response.ok) {
        toast.success('URL Updated', 'Landing page URL updated successfully')
        setUrlFormData({ name: '', url: '', description: '' })
        setEditingUrl(null)
        setShowUrlModal(false)
        fetchSellerUrls()
      } else {
        const error = await response.json()
        toast.error('Update Failed', `Error: ${error.error}`)
      }
    } catch (error) {
      toast.error('Update Failed', 'Error updating URL')
    }
  }

  const handleDeleteUrl = async (urlId: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return
    }

    try {
      const response = await fetch(`/api/seller/landing-urls/${urlId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('URL Deleted', 'Landing page URL deleted successfully')
        fetchSellerUrls()
        
        // If this was the selected URL, clear the selection
        if (selectedUrlIds.includes(urlId)) {
          setSelectedUrlIds(selectedUrlIds.filter(id => id !== urlId))
        }
      } else {
        const error = await response.json()
        toast.error('Deletion Failed', `Error: ${error.error}`)
      }
    } catch (error) {
      toast.error('Deletion Failed', 'Error deleting URL')
    }
  }

  const openUrlModal = (url?: any) => {
    if (url) {
      setEditingUrl(url)
      setUrlFormData({
        name: url.name,
        url: url.url,
        description: url.description || ''
      })
    } else {
      setEditingUrl(null)
      setUrlFormData({ name: '', url: '', description: '' })
    }
    setShowUrlModal(true)
  }

  // Load seller URLs when component mounts
  useEffect(() => {
    fetchSellerUrls()
    
    // Reload URLs when returning from editor (window regains focus)
    const handleWindowFocus = () => {
      console.log('🔄 Window focused - refreshing seller URLs')
      fetchSellerUrls()
    }
    
    window.addEventListener('focus', handleWindowFocus)
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  // Auto-save current progress to localStorage
  useEffect(() => {
    const saveCurrentProgress = () => {
      const progressData = {
        globalConfig,
        configuredButtons: Array.from(configuredButtons),
        selectedUrlIds,
        timestamp: new Date().toISOString()
      }
      console.log('💾 AUTO-SAVE: Saving progress data:', progressData)
      localStorage.setItem('elocalpass-current-qr-progress', JSON.stringify(progressData))
    }

    // Save progress whenever globalConfig, configuredButtons, or selectedUrlIds changes
    const timeoutId = setTimeout(saveCurrentProgress, 500) // Debounce saves
    return () => clearTimeout(timeoutId)
  }, [globalConfig, configuredButtons, selectedUrlIds])

  // Handle URL parameters to open specific configuration
  useEffect(() => {
    const openLibrary = searchParams.get('openLibrary')
    const configId = searchParams.get('configId')
    const expandId = searchParams.get('expand')  // New parameter for expanding specific config
    
    if (openLibrary === 'true' && savedConfigurations.length > 0) {
      setShowConfigLibrary(true)
      
      if (configId) {
        // Expand the specific configuration
        setExpandedConfigs(prev => new Set(Array.from(prev).concat(configId)))
      }
    }
    
    // Handle direct expand parameter (from edit page navigation)
    if (expandId && savedConfigurations.length > 0) {
      setShowConfigLibrary(true)  // Open the library
      setExpandedConfigs(prev => new Set(Array.from(prev).concat(expandId)))  // Expand the specific config
      
      // Scroll to the expanded configuration after a brief delay
      setTimeout(() => {
        const configElement = document.getElementById(`config-${expandId}`)
        if (configElement) {
          configElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [searchParams, savedConfigurations])

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-orange-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-orange-500 transition-colors"
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white">Welcome, {session?.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">QR Configuration System</h1>
                  <p className="text-gray-600 mt-1">Configure the 5-button QR generation system for all sellers</p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Auto-save status indicator */}
                  {isAutoSaving && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Auto-saving...</span>
                    </div>
                  )}
                  
                  {/* Progress restored indicator */}
                  {progressRestored && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Progress restored from previous session</span>
                    </div>
                  )}
                  
                  {saveStatus && (
                    <div className={`flex items-center space-x-2 text-green-600 ${
                      saveStatus.includes('✅') 
                        ? 'bg-green-50 px-3 py-1 rounded-md' 
                        : saveStatus.includes('❌')
                        ? 'bg-red-50 px-3 py-1 rounded-md'
                        : 'bg-blue-50 px-3 py-1 rounded-md'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">{saveStatus}</span>
                    </div>
                  )}
                  
                  {/* Auto-save info */}
                  <div className="text-sm text-gray-500">
                    Auto-save enabled
                  </div>
                  
                  {/* Reset to Defaults button */}
                  <button
                    onClick={resetToDefaults}
                    disabled={isAutoSaving}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>

            {/* Button Navigation */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                {[
                  { 
                    num: 1, 
                    title: "Personalized?", 
                    value: globalConfig.button1GuestsDefault !== 2 || globalConfig.button1DaysDefault !== 3
                      ? `Yes: ${globalConfig.button1GuestsDefault} guests, ${globalConfig.button1DaysDefault} days`
                      : `No: Default 2 guests, 3 days`
                  },
                  { 
                    num: 2, 
                    title: "Pricing Type", 
                    value: globalConfig.button2PricingType === 'FIXED' 
                      ? `Fixed: $${globalConfig.button2FixedPrice}${globalConfig.button2IncludeTax ? ` +${globalConfig.button2TaxPercentage}% tax` : ''}`
                      : globalConfig.button2PricingType === 'VARIABLE'
                      ? `Variable: Base $${globalConfig.button2VariableBasePrice} +$${globalConfig.button2VariableGuestIncrease}/guest +$${globalConfig.button2VariableDayIncrease}/day${globalConfig.button2VariableCommission > 0 ? ` +${globalConfig.button2VariableCommission}% commission` : ''}${globalConfig.button2IncludeTax ? ` +${globalConfig.button2TaxPercentage}% tax` : ''}`
                      : 'Free'
                  },
                  { 
                    num: 3, 
                    title: "Delivery Method", 
                    value: globalConfig.button3DeliveryMethod === 'DIRECT' 
                      ? "Direct: QR sent via email"
                      : globalConfig.button3DeliveryMethod === 'URLS'
                      ? "URLs: Landing page links"
                      : "Both: Direct and URLs"
                  },
                  { 
                    num: 4, 
                    title: "Welcome Email", 
                    value: globalConfig.button4LandingPageRequired ? "Customized" : "Default" 
                  },
                  { 
                    num: 5, 
                    title: "Rebuy Email?", 
                    value: globalConfig.button5SendRebuyEmail ? "Customized" : "Default"
                  }
                ].map((button, index) => (
                  <div key={button.num} className="flex items-center flex-1">
                    <button
                      onClick={() => setActiveButton(button.num)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm border-2 ${
                        isButtonConfigured(button.num)
                          ? 'bg-green-500 text-white border-green-500 shadow-md hover:bg-green-600'
                          : activeButton === button.num 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg transform scale-105' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          isButtonConfigured(button.num)
                            ? 'bg-white text-green-500'
                            : activeButton === button.num 
                            ? 'bg-white text-orange-500' 
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {isButtonConfigured(button.num) ? '✓' : button.num}
                        </span>
                        <span className="text-sm">{button.title}</span>
                      </div>
                    </button>
                    
                    {/* Step Arrow */}
                    {index < 4 && (
                      <div className="flex items-center justify-center mx-2">
                        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Tracker */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Configuration Progress</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      areAllButtonsConfigured() 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {configuredButtons.size}/5 Complete
                    </span>
                    {areAllButtonsConfigured() && (
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        💾 Save Configuration
                      </button>
                    )}
                    <button
                      onClick={() => setShowConfigLibrary(true)}
                      className="text-xs px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      📚 Library ({savedConfigurations.length})
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {[
                    { 
                      num: 1, 
                      title: "Personalized?", 
                      value: globalConfig.button1GuestsDefault !== 2 || globalConfig.button1DaysDefault !== 3
                        ? `Yes: ${globalConfig.button1GuestsDefault} guests, ${globalConfig.button1DaysDefault} days`
                        : `No: Default 2 guests, 3 days`
                    },
                    { 
                      num: 2, 
                      title: "Pricing Type", 
                      value: globalConfig.button2PricingType === 'FIXED' 
                        ? `Fixed: $${globalConfig.button2FixedPrice}${globalConfig.button2IncludeTax ? ` +${globalConfig.button2TaxPercentage}% tax` : ''}`
                        : globalConfig.button2PricingType === 'VARIABLE'
                        ? `Variable: Base $${globalConfig.button2VariableBasePrice} +$${globalConfig.button2VariableGuestIncrease}/guest +$${globalConfig.button2VariableDayIncrease}/day${globalConfig.button2VariableCommission > 0 ? ` +${globalConfig.button2VariableCommission}% commission` : ''}${globalConfig.button2IncludeTax ? ` +${globalConfig.button2TaxPercentage}% tax` : ''}`
                        : 'Free'
                    },
                    { 
                      num: 3, 
                      title: "Delivery Method", 
                      value: globalConfig.button3DeliveryMethod === 'DIRECT' 
                        ? "Direct: QR sent via email"
                        : globalConfig.button3DeliveryMethod === 'URLS'
                        ? "URLs: Landing page links"
                        : "Both: Direct and URLs"
                    },
                    { 
                      num: 4, 
                      title: "Welcome Email", 
                      value: globalConfig.button4LandingPageRequired ? "Customized" : "Default" 
                    },
                    { 
                      num: 5, 
                      title: "Rebuy Email?", 
                      value: globalConfig.button5SendRebuyEmail ? "Customized" : "Default"
                    }
                  ].map((button, index) => (
                    <div key={button.num} className="flex items-center flex-1">
                      <div
                        className={`w-full p-3 rounded-lg text-xs text-center transition-all duration-200 border-2 ${
                          isButtonConfigured(button.num) 
                            ? 'bg-green-50 text-green-700 border-green-300 shadow-sm' 
                            : 'bg-gray-50 text-gray-600 border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{button.title}</div>
                        <div className="text-xs mt-1 leading-tight">{button.value}</div>
                        {isButtonConfigured(button.num) ? (
                          <div className="text-green-600 text-xs mt-1 font-medium">✓ Auto-saved</div>
                        ) : (
                          <div className="text-gray-500 text-xs mt-1">Need to configure</div>
                        )}
                      </div>
                      
                      {/* Progress Arrow */}
                      {index < 4 && (
                        <div className="flex items-center justify-center mx-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Panels */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Button 1: Personalized? */}
              {activeButton === 1 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 1: Personalized Settings</h2>
                    <p className="text-gray-600 mt-1">Control guest count and validity days with individual lock/unlock toggles</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Guests Control */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Number of Guests</h3>
                          <p className="text-sm text-blue-700">Control guest selection</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-700">
                            {globalConfig.button1GuestsLocked ? 'Fixed' : 'Open'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={globalConfig.button1GuestsLocked}
                              onChange={(e) => {
                                updateConfig({ button1GuestsLocked: e.target.checked })
                                setConfiguredButtons((prev) => new Set(prev).add(1))
                              }}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              globalConfig.button1GuestsLocked ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                                globalConfig.button1GuestsLocked ? 'translate-x-5' : 'translate-x-1'
                              } mt-0.5`}></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          {globalConfig.button1GuestsLocked ? 'Fixed Guest Count' : 'Maximum Guests (Sellers choose 1 to this number)'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={globalConfig.button1GuestsDefault || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                            if (value <= 10) {
                              updateConfig({ 
                                button1GuestsDefault: value,
                                button1GuestsRangeMax: value // Keep in sync
                              })
                              setConfiguredButtons((prev) => new Set(prev).add(1))
                            }
                          }}
                          className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter number of guests"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          {globalConfig.button1GuestsLocked 
                            ? `Sellers always get exactly ${globalConfig.button1GuestsDefault} guests` 
                            : `Sellers can choose from 1 to ${globalConfig.button1GuestsDefault} guests`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Days Control */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Number of Days</h3>
                          <p className="text-sm text-green-700">Control day selection</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-green-700">
                            {globalConfig.button1DaysLocked ? 'Fixed' : 'Open'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={globalConfig.button1DaysLocked}
                              onChange={(e) => {
                                updateConfig({ button1DaysLocked: e.target.checked })
                                setConfiguredButtons((prev) => new Set(prev).add(1))
                              }}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              globalConfig.button1DaysLocked ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                                globalConfig.button1DaysLocked ? 'translate-x-5' : 'translate-x-1'
                              } mt-0.5`}></div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          {globalConfig.button1DaysLocked ? 'Fixed Day Count' : 'Maximum Days (Sellers choose 1 to this number)'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={globalConfig.button1DaysDefault || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                            if (value <= 365) {
                              updateConfig({ 
                                button1DaysDefault: value,
                                button1DaysRangeMax: value // Keep in sync
                              })
                              setConfiguredButtons((prev) => new Set(prev).add(1))
                            }
                          }}
                          className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter number of days"
                        />
                        <p className="text-xs text-green-600 mt-1">
                          {globalConfig.button1DaysLocked 
                            ? `Sellers always get exactly ${globalConfig.button1DaysDefault} days` 
                            : `Sellers can choose from 1 to ${globalConfig.button1DaysDefault} days`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">Configuration Summary</h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <div>
                        <span className="font-medium">Guests:</span> {globalConfig.button1GuestsLocked 
                          ? `Fixed at ${globalConfig.button1GuestsDefault}`
                          : `Open range (1-${globalConfig.button1GuestsDefault})`
                        }
                      </div>
                      <div>
                        <span className="font-medium">Days:</span> {globalConfig.button1DaysLocked 
                          ? `Fixed at ${globalConfig.button1DaysDefault}`
                          : `Open range (1-${globalConfig.button1DaysDefault})`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Button 2: Pricing Type */}
              {activeButton === 2 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 2: Pricing Type</h2>
                    <p className="text-gray-600 mt-1">Configure how QR codes are priced</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={globalConfig.button2PricingType === 'FIXED'}
                        onChange={() => {
                          updateConfig({ button2PricingType: 'FIXED' })
                          setConfiguredButtons((prev) => new Set(prev).add(2))
                        }}
                        className="mt-1 h-4 w-4 text-yellow-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Fixed price (set by Admin)</span>
                        <p className="text-sm text-gray-600">Same price regardless of guests or days</p>
                      </div>
                    </label>

                    {globalConfig.button2PricingType === 'FIXED' && (
                      <div className="ml-7 p-4 bg-yellow-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={globalConfig.button2FixedPrice || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updateConfig({ button2FixedPrice: value })
                            setConfiguredButtons((prev) => new Set(prev).add(2))
                          }}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          placeholder="0.00"
                        />
                        <div className="mt-4">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={globalConfig.button2IncludeTax}
                              onChange={(e) => {
                                updateConfig({ button2IncludeTax: e.target.checked })
                                setConfiguredButtons((prev) => new Set(prev).add(2))
                              }}
                              className="form-checkbox h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-gray-700">Include Tax</span>
                          </label>
                          {globalConfig.button2IncludeTax && (
                            <div className="mt-2 ml-7">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Percentage (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={globalConfig.button2TaxPercentage || ''}
                                onChange={(e) => {
                                  updateConfig({ button2TaxPercentage: parseFloat(e.target.value) || 0 })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                placeholder="0.00"
                              />
                              <p className="text-sm text-gray-600 mt-1">
                                Tax percentage to add to final price
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={globalConfig.button2PricingType === 'VARIABLE'}
                        onChange={() => {
                          updateConfig({ button2PricingType: 'VARIABLE' })
                          setConfiguredButtons((prev) => new Set(prev).add(2))
                        }}
                        className="mt-1 h-4 w-4 text-yellow-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Variable price</span>
                        <p className="text-sm text-gray-600">Calculated using number of guests × days</p>
                      </div>
                    </label>

                    {globalConfig.button2PricingType === 'VARIABLE' && (
                      <div className="ml-7 p-4 bg-yellow-50 rounded-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left side - Configuration inputs */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={globalConfig.button2VariableBasePrice || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                updateConfig({ button2VariableBasePrice: value })
                                setConfiguredButtons((prev) => new Set(prev).add(2))
                              }}
                              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                              placeholder="0.00"
                            />
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Increase ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={globalConfig.button2VariableGuestIncrease || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  updateConfig({ button2VariableGuestIncrease: value })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                placeholder="0.00"
                              />
                              <p className="text-sm text-gray-600 mt-1">
                                Price increase per guest
                              </p>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Day Increase ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={globalConfig.button2VariableDayIncrease || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  updateConfig({ button2VariableDayIncrease: value })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                placeholder="0.00"
                              />
                              <p className="text-sm text-gray-600 mt-1">
                                Price increase per day
                              </p>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Commission (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={globalConfig.button2VariableCommission || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                  updateConfig({ button2VariableCommission: value })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                placeholder="0.00"
                              />
                              <p className="text-sm text-gray-600 mt-1">
                                Commission percentage for variable pricing
                              </p>
                            </div>
                            <div className="mt-4">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={globalConfig.button2IncludeTax}
                                  onChange={(e) => {
                                    updateConfig({ button2IncludeTax: e.target.checked })
                                    setConfiguredButtons((prev) => new Set(prev).add(2))
                                  }}
                                  className="form-checkbox h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">Include Tax</span>
                              </label>
                              {globalConfig.button2IncludeTax && (
                                <div className="mt-2 ml-7">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Percentage (%)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={globalConfig.button2TaxPercentage || ''}
                                    onChange={(e) => {
                                      updateConfig({ button2TaxPercentage: parseFloat(e.target.value) || 0 })
                                      setConfiguredButtons((prev) => new Set(prev).add(2))
                                    }}
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="0.00"
                                  />
                                  <p className="text-sm text-gray-600 mt-1">
                                    Tax percentage to add to final price
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Pricing Formula</h4>
                              <div className="text-xs text-blue-700 space-y-1">
                                <p><strong>Base Price:</strong> Base + (Guests × Guest Increase) + (Days × Day Increase)</p>
                                <p><strong>With Commission:</strong> Base Price + (Base Price × Commission %)</p>
                                <p><strong>Final Price:</strong> (Base Price + Commission) + ((Base Price + Commission) × Tax %)</p>
                                <p className="text-xs text-gray-600">Limits: Max 10 guests, Max 7 days</p>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Pricing matrix table */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">📊 Pricing Matrix Preview</h4>
                            <div className="w-full max-w-none">
                              <table className="w-full text-xs border border-gray-300 rounded-lg bg-white table-fixed">
                                <thead>
                                  <tr className="bg-gray-800 text-white">
                                    <th className="w-16 px-1 py-1 border-b border-gray-300 text-left font-bold text-xs">Days\Guests</th>
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(guests => (
                                      <th key={guests} className="w-12 px-1 py-1 border-b border-l border-gray-300 text-center font-bold text-xs">
                                        {guests}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.from({ length: 7 }, (_, i) => i + 1).map(days => (
                                    <tr key={days} className="hover:bg-gray-50">
                                      <td className="px-1 py-1 border-b border-gray-300 font-bold bg-gray-100 text-gray-800 text-xs">
                                        {days} day{days > 1 ? 's' : ''}
                                      </td>
                                      {Array.from({ length: 10 }, (_, i) => i + 1).map(guests => {
                                        const basePrice = globalConfig.button2VariableBasePrice + 
                                                    (guests * globalConfig.button2VariableGuestIncrease) + 
                                                    (days * globalConfig.button2VariableDayIncrease);
                                        const commission = basePrice * (globalConfig.button2VariableCommission / 100);
                                        const priceWithCommission = basePrice + commission;
                                        const tax = globalConfig.button2IncludeTax ? (priceWithCommission * (globalConfig.button2TaxPercentage / 100)) : 0;
                                        const finalPrice = priceWithCommission + tax;
                                        return (
                                          <td key={guests} className="px-1 py-1 border-b border-l border-gray-300 text-center text-green-700 font-medium text-xs">
                                            ${finalPrice.toFixed(0)}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              💡 Updates in real-time as you adjust pricing above
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={globalConfig.button2PricingType === 'FREE'}
                        onChange={() => {
                          updateConfig({ button2PricingType: 'FREE' })
                          setConfiguredButtons((prev) => new Set(prev).add(2))
                        }}
                        className="mt-1 h-4 w-4 text-yellow-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Free</span>
                        <p className="text-sm text-gray-600">No charge for QR codes</p>
                      </div>
                    </label>

                    {globalConfig.button2PricingType === 'FREE' && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">✓</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-green-800">Free QR Codes</h3>
                            <p className="text-green-700">Distributors and sellers will not be charged anything for QR code generation.</p>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-green-600">
                          <p><strong>Benefits:</strong></p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>No cost to sellers for QR creation</li>
                            <li>Unlimited QR generation</li>
                            <li>Perfect for promotional campaigns</li>
                            <li>No payment processing required</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Button 3: Delivery Method */}
              {activeButton === 3 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 3: Delivery Method</h2>
                    <p className="text-gray-600 mt-1">Choose how QR codes are delivered to guests</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Direct */}
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                      globalConfig.button3DeliveryMethod === 'DIRECT' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                      onClick={() => {
                        updateConfig({ button3DeliveryMethod: 'DIRECT' })
                        setConfiguredButtons((prev) => new Set(prev).add(3))
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Direct</h3>
                          <input
                            type="radio"
                            checked={globalConfig.button3DeliveryMethod === 'DIRECT'}
                            onChange={() => {
                              updateConfig({ button3DeliveryMethod: 'DIRECT' })
                              setConfiguredButtons((prev) => new Set(prev).add(3))
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-700">
                            {globalConfig.button3DeliveryMethod === 'DIRECT' ? '✓' : ''}
                          </span>
                          <span className="text-gray-900">Instant QR generation</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">
                        QR codes are sent directly to guests via email
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>QR sent via email</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Welcome email included</span>
                        </div>
                      </div>
                    </div>

                    {/* URLs */}
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                      globalConfig.button3DeliveryMethod === 'URLS' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                      onClick={() => {
                        updateConfig({ button3DeliveryMethod: 'URLS' })
                        setConfiguredButtons((prev) => new Set(prev).add(3))
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">URLs</h3>
                          <input
                            type="radio"
                            checked={globalConfig.button3DeliveryMethod === 'URLS'}
                            onChange={() => {
                              updateConfig({ button3DeliveryMethod: 'URLS' })
                              setConfiguredButtons((prev) => new Set(prev).add(3))
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-700">
                            {globalConfig.button3DeliveryMethod === 'URLS' ? '✓' : ''}
                          </span>
                          <span className="text-gray-900">Custom landing page design</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">
                        QR codes are sent as unique landing page links
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Guest enters details on webpage</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Fully branded experience</span>
                        </div>
                      </div>
                    </div>

                    {/* Both */}
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                      globalConfig.button3DeliveryMethod === 'BOTH' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                      onClick={() => {
                        updateConfig({ button3DeliveryMethod: 'BOTH' })
                        setConfiguredButtons((prev) => new Set(prev).add(3))
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Both</h3>
                          <input
                            type="radio"
                            checked={globalConfig.button3DeliveryMethod === 'BOTH'}
                            onChange={() => {
                              updateConfig({ button3DeliveryMethod: 'BOTH' })
                              setConfiguredButtons((prev) => new Set(prev).add(3))
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-700">
                            {globalConfig.button3DeliveryMethod === 'BOTH' ? '✓' : ''}
                          </span>
                          <span className="text-gray-900">Maximum flexibility</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">
                        QR codes are sent both directly and as landing page links
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Instant QR generation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>QR sent via email</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Welcome email included</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Custom landing page design</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Guest enters details on webpage</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span>Fully branded experience</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {globalConfig.button3DeliveryMethod === 'URLS' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Landing Page System</h4>
                      <p className="text-sm text-blue-800">
                        When URLs method is selected, each QR code will generate a unique landing page where guests can enter their details. 
                        This landing page will be customizable per seller/location.
                      </p>
                      {sellerUrls.length === 0 && (
                        <button 
                          onClick={() => router.push('/admin/qr-config/create')}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Create Custom Landing Page →
                        </button>
                      )}
                    </div>
                  )}
                  
                  {globalConfig.button3DeliveryMethod === 'BOTH' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Dual Delivery System</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        When Both method is selected, sellers can choose between direct email delivery or landing page URLs on a per-QR basis. This provides maximum flexibility.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Direct Option</h5>
                          <p className="text-xs text-gray-600">Instant QR generation with email delivery</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">URL Option</h5>
                          <p className="text-xs text-gray-600">Custom landing page with guest details form</p>
                        </div>
                      </div>
                      {sellerUrls.length === 0 && (
                        <button 
                          onClick={() => router.push('/admin/qr-config/create')}
                          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Create Custom Landing Page →
                        </button>
                      )}
                    </div>
                  )}
                  
                  {(globalConfig.button3DeliveryMethod === 'URLS' || globalConfig.button3DeliveryMethod === 'BOTH') && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">Manage Landing Page URLs</h4>
                        <button
                          onClick={() => sellerUrls.length === 0 ? openUrlModal() : router.push('/admin/qr-config/create')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          + Add New URL
                        </button>
                      </div>

                      {/* Search Input */}
                      {sellerUrls.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={urlSearchQuery}
                                onChange={(e) => setUrlSearchQuery(e.target.value)}
                                placeholder="🔍 Search URLs by name, description, or URL..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            {urlSearchQuery && (
                              <button
                                onClick={() => setUrlSearchQuery('')}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* URL List with Search Filter */}
                      {sellerUrls.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-gray-500 mb-2">No landing page URLs configured yet</p>
                          <p className="text-sm text-gray-400 mt-1">Create your first URL to start using the landing page delivery method</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sellerUrls
                            .filter(url => {
                              if (!urlSearchQuery) return true;
                              const query = urlSearchQuery.toLowerCase();
                              return (
                                url.name.toLowerCase().includes(query) ||
                                (url.url && url.url.toLowerCase().includes(query)) ||
                                (url.description && url.description.toLowerCase().includes(query))
                              );
                            })
                            .map((url) => (
                            <div 
                              key={url.id} 
                              className={`p-4 border rounded-lg ${
                                selectedUrlIds.includes(url.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedUrlIds.includes(url.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedUrlIds(prev => [...prev, url.id])
                                        } else {
                                          setSelectedUrlIds(prev => prev.filter(id => id !== url.id))
                                        }
                                      }}
                                      className="h-4 w-4 text-blue-600"
                                    />
                                    <div>
                                      <h5 className="font-medium text-gray-900">{url.name}</h5>
                                      <p className="text-sm text-gray-600 truncate max-w-md">{url.url}</p>
                                      {url.description && (
                                        <p className="text-xs text-gray-500 mt-1">{url.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    url.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {url.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <button
                                    onClick={() => openUrlModal(url)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Edit Details"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUrl(url.id)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                    title="Delete URL"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* No Results Message */}
                          {urlSearchQuery && sellerUrls.filter(url => {
                            const query = urlSearchQuery.toLowerCase();
                            return (
                              url.name.toLowerCase().includes(query) ||
                              (url.url && url.url.toLowerCase().includes(query)) ||
                              (url.description && url.description.toLowerCase().includes(query))
                            );
                          }).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <p>No URLs found matching "{urlSearchQuery}"</p>
                              <button
                                onClick={() => setUrlSearchQuery('')}
                                className="text-blue-600 hover:text-blue-800 underline text-sm mt-1"
                              >
                                Clear search
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {sellerUrls.length > 0 && !selectedUrlIds.length && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">⚠️ Please select URLs:</span> Choose which landing page URLs will be available as options for sellers to use.
                          </p>
                        </div>
                      )}
                      
                      {selectedUrlIds.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">✓ {selectedUrlIds.length} URL{selectedUrlIds.length === 1 ? '' : 's'} selected:</span> These will be available as delivery options for sellers.
                          </p>
                          <button
                            onClick={() => setSelectedUrlIds([])}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUrl ? 'Edit URL Details' : 'Add New Landing Page URL'}
                </h3>
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={editingUrl ? handleUpdateUrl : handleCreateUrl} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  {editingUrl && selectedUrlIds.includes(editingUrl.id) ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={urlFormData.name}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="e.g., Hotel Prueba 3"
                        disabled
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2m0-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        🔒 Cannot edit name - this URL is currently being used in a QR configuration
                      </p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={urlFormData.name}
                      onChange={(e) => setUrlFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Hotel Prueba 3"
                      required
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={urlFormData.description}
                    onChange={(e) => setUrlFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUrlModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingUrl ? 'Update Details' : 'Create URL'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
