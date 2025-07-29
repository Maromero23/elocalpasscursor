'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Building2, Users, MapPin, QrCode, Settings, Eye, Plus, Edit3, Palette, Save, Monitor, Mail, EyeOff, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ToastNotifications } from '@/components/toast-notification'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
  button3LandingPageChoice: 'DEFAULT' | 'CUSTOM' | null  // NEW: Track landing page choice
  button4LandingPageRequired: boolean | undefined
  button5SendRebuyEmail: boolean | undefined
  button6AllowFutureQR: boolean | undefined
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

function QRConfigPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const navItems = getNavItems(session?.user?.role || "")

  // DEPLOYMENT TIMESTAMP - Version 4.45.34 deployed at specific time
  

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
    button2PricingType: 'FIXED',
    button2FixedPrice: 0,
    button2VariableBasePrice: 0,
    button2VariableGuestIncrease: 0,
    button2VariableDayIncrease: 0,
    button2VariableCommission: 0,
    button2IncludeTax: false,
    button2TaxPercentage: 0,
    button3DeliveryMethod: 'DIRECT',
    button3LandingPageChoice: null,
    button4LandingPageRequired: false,
    button5SendRebuyEmail: false,
    button6AllowFutureQR: false,
    updatedAt: new Date()
  })

  // Track if user has made a choice for Button 4 (separate from database value)
  const [button4UserChoice, setButton4UserChoice] = useState<boolean | null>(null)
  
  // Track if user has made a choice for Button 5 (separate from database value)
  const [button5UserChoice, setButton5UserChoice] = useState<boolean | null>(null)
  const [button6UserChoice, setButton6UserChoice] = useState<boolean | null>(null)
  const [rebuyTemplateRefresh, setRebuyTemplateRefresh] = useState(0) // Force re-render for radio buttons
  const [userIsInteracting, setUserIsInteracting] = useState(false) // Flag to prevent detection from overriding user actions

  // Current session management for direct database saving
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  
  // Generate or load current session ID
  useEffect(() => {
    let sessionId = localStorage.getItem('elocalpass-current-session-id')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('elocalpass-current-session-id', sessionId)
    }
    setCurrentSessionId(sessionId)
    console.log('🔄 Current session ID:', sessionId)
  }, [])

  const [loading, setLoading] = useState(false)
  const [activeButton, setActiveButton] = useState<number>(1)
  
  // Handle URL parameters for activeButton
  useEffect(() => {
    const activeButtonParam = searchParams.get('activeButton')
    if (activeButtonParam) {
      const buttonNumber = parseInt(activeButtonParam)
      if (buttonNumber >= 1 && buttonNumber <= 5) {
        setActiveButton(buttonNumber)
        console.log('🔗 URL REDIRECT: Setting active button to:', buttonNumber)
      }
    }
  }, [searchParams])
  
  // Handle URL parameters for library navigation (from rebuy config, etc.)
  useEffect(() => {
    const showLibraryParam = searchParams.get('showLibrary')
    const expandConfigParam = searchParams.get('expandConfig')
    
    if (showLibraryParam === 'true') {
      console.log('🔗 URL REDIRECT: Opening QR Configuration Library')
      
      // RACE CONDITION FIX: Force immediate data refresh BEFORE opening library
      console.log('🔄 RACE FIX: Force refreshing configurations to get latest data before opening library')
      loadSavedConfigurations(true).then(() => {
        console.log('✅ RACE FIX: Fresh data loaded, now opening library')
        setShowConfigLibrary(true)
        
        if (expandConfigParam) {
          console.log('🔗 URL REDIRECT: Expanding configuration:', expandConfigParam)
          setExpandedConfigs(new Set([expandConfigParam]))
        }
      }).catch(error => {
        console.error('❌ RACE FIX: Error loading fresh data:', error)
        // Still open library even if refresh fails
        setShowConfigLibrary(true)
        if (expandConfigParam) {
          setExpandedConfigs(new Set([expandConfigParam]))
        }
      })
      
      // Clear the URL parameters after processing to prevent auto-opening on page refresh
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('showLibrary')
      newUrl.searchParams.delete('expandConfig')
      window.history.replaceState({}, '', newUrl.toString())
      console.log('🧹 URL REDIRECT: Cleaned up URL parameters to prevent auto-opening on refresh')
    }
  }, [searchParams])
  
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
    updatedAt: Date;
  }>>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showConfigLibrary, setShowConfigLibrary] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [progressRestored, setProgressRestored] = useState(false)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)

  // Search and filter states for QR Configuration Library
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPricingType, setFilterPricingType] = useState('ALL')
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState('ALL')
  const [sortBy, setSortBy] = useState('DATE_DESC')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  // Bulk delete states
  const [selectedConfigIds, setSelectedConfigIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  // Single delete states
  const [showSingleDeleteModal, setShowSingleDeleteModal] = useState(false)
  const [singleDeleteConfigId, setSingleDeleteConfigId] = useState<string | null>(null)
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false)

  // URL Management states  
  const [sellerUrls, setSellerUrls] = useState<Array<{
    id: string
    name: string
    url: string | null
    description?: string | null
    isActive?: boolean
    createdAt?: string
    isTemp?: boolean
    isDefault?: boolean
  }>>([])
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [editingUrl, setEditingUrl] = useState<{
    id: string
    name: string
    url: string | null
    description?: string | null
    isTemp?: boolean
  } | null>(null)
  const [urlFormData, setUrlFormData] = useState({
    name: '',
    url: '',
    description: ''
  })
  const [selectedUrlIds, setSelectedUrlIds] = useState<string[]>([])

  // Filter and sort configurations based on search and filters
  const filteredConfigurations = savedConfigurations
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

  // Pagination calculations
  const totalConfigurations = filteredConfigurations.length
  const totalPages = Math.ceil(totalConfigurations / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedConfigurations = filteredConfigurations.slice(startIndex, endIndex)

  // For backward compatibility, keep the old variable name
  const filteredAndSortedConfigurations = paginatedConfigurations

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterPricingType, filterDeliveryMethod, sortBy, itemsPerPage])

  // Helper function to check if a button configuration has been actively modified
  const isButtonConfigured = (buttonNum: number): boolean => {
    // Special logic for Button 3 - check landing page choice when URLs or BOTH is selected
    if (buttonNum === 3) {
      const hasDeliveryMethod = globalConfig.button3DeliveryMethod !== 'DIRECT'
      const hasLandingPageChoice = globalConfig.button3LandingPageChoice !== null
      
      // If URLs or BOTH is selected, require landing page choice
      if (hasDeliveryMethod && !hasLandingPageChoice) {
        return false
      }
      
      // For DIRECT method, just check if it's in configured buttons
      if (!hasDeliveryMethod) {
        return Array.from(configuredButtons).includes(buttonNum)
      }
      
      // For URLs or BOTH, require both delivery method and landing page choice
      return Array.from(configuredButtons).includes(buttonNum) && hasLandingPageChoice
    }
    
    // For other buttons, use the existing logic
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

  // Clear current progress and return to starting point
  const clearProgress = async () => {
    setShowClearConfirmModal(true)
  }

  // EMERGENCY CLEANUP: Clear leftover URLs from previous sessions
  const clearLeftoverUrls = () => {
    console.log('🧹 EMERGENCY CLEANUP: Clearing leftover URLs from previous sessions')
    setSellerUrls([])
    setSelectedUrlIds([])
    localStorage.removeItem('elocalpass-current-qr-progress')
    localStorage.removeItem('elocalpass-new-temp-urls')
    localStorage.removeItem('elocalpass-new-temp-url')
    console.log('✅ EMERGENCY CLEANUP: All leftover URLs cleared')
    toast.success('Cleanup Complete', 'All leftover URLs from previous sessions have been cleared')
  }

  const handleConfirmClear = async () => {
    setShowClearConfirmModal(false)
    
    try {
      // STEP 1: Reset database configuration to default values
      const defaultConfig = {
        // Button 1 defaults
        button1AllowCustomGuestsDays: false,
        button1DefaultGuests: 2,
        button1DefaultDays: 3,
        button1MaxGuests: 10,
        button1MaxDays: 30,
        button1GuestsLocked: true,
        button1GuestsDefault: 2,
        button1GuestsRangeMax: 10,
        button1DaysLocked: true,
        button1DaysDefault: 3,
        button1DaysRangeMax: 30,
        
        // Button 2 defaults
        button2PricingType: 'FIXED' as const,
        button2FixedPrice: 0,
        button2VariableBasePrice: 0,
        button2VariableGuestIncrease: 0,
        button2VariableDayIncrease: 0,
        button2VariableCommission: 0,
        button2IncludeTax: false,
        button2TaxPercentage: 0,
        
        // Button 3 defaults
        button3DeliveryMethod: 'DIRECT' as const,
        button3LandingPageChoice: null,
        
        // Button 4 defaults
        button4LandingPageRequired: undefined,
        
        // Button 5 defaults
        button5SendRebuyEmail: undefined,
        
        // Button 6 defaults
        button6AllowFutureQR: undefined,
        
        updatedAt: new Date()
      }
      
      // Save default config to database
      const response = await fetch('/api/admin/qr-global-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultConfig),
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset database configuration')
      }
      
      // STEP 2: Clear database session (temporary URLs and progress)
      if (currentSessionId) {
        try {
          const deleteResponse = await fetch(`/api/admin/saved-configs/${currentSessionId}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          console.log('🗑️ CLEAR PROGRESS: Database session cleared:', deleteResponse.ok ? 'SUCCESS' : 'FAILED')
        } catch (error) {
          console.warn('⚠️ CLEAR PROGRESS: Could not clear database session:', error)
        }
      }
      
      // STEP 3: Clear ALL progress-related localStorage items
      localStorage.removeItem('elocalpass-current-qr-progress')
      localStorage.removeItem('elocalpass-current-welcome-template')
      localStorage.removeItem('elocalpass-current-rebuy-template')
      localStorage.removeItem('elocalpass-current-landing-template')
      localStorage.removeItem('elocalpass-welcome-email-config')
      localStorage.removeItem('elocalpass-rebuy-email-config')
      localStorage.removeItem('elocalpass-landing-config')
      localStorage.removeItem('elocalpass-new-temp-urls')
      localStorage.removeItem('elocalpass-new-temp-url')
      
      // STEP 3.1: Clear button configuration localStorage items
          localStorage.removeItem('elocalpass-button1-config')
    localStorage.removeItem('elocalpass-button2-config')
    localStorage.removeItem('elocalpass-button3-config')
    localStorage.removeItem('elocalpass-button3-urls')
    localStorage.removeItem('elocalpass-button4-config')
    localStorage.removeItem('elocalpass-button5-config')
      localStorage.removeItem('elocalpass-button6-config')
      
      console.log('🧹 CLEAR PROGRESS: All button configurations cleared from localStorage')
      
      // STEP 4: Reset visual states to starting point
      setGlobalConfig(defaultConfig)
      setConfiguredButtons(new Set())
      setSelectedUrlIds([])
      setSellerUrls([]) // Clear temporary URLs
      setActiveButton(1)
      setSaveStatus('')
      setProgressRestored(false)
      setButton4UserChoice(null) // Reset Button 4 user choice to "no selection"
    setButton5UserChoice(null) // Reset Button 5 user choice to "no selection"
      setButton6UserChoice(null) // Reset Button 6 user choice to "no selection"
      
      console.log('🧹 CLEAR PROGRESS: All progress and database configuration reset to defaults')
      
      // STEP 5: Clear URL parameters and refresh to ensure clean state
      window.history.replaceState({}, document.title, window.location.pathname)
      window.location.reload()
      
    } catch (error) {
      console.error('❌ Failed to clear progress:', error)
      alert('Failed to clear progress. Please try again.')
    }
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
        if (data && data.config) {
          console.log('🔍 FETCH: Received globalConfig from API:', data.config)
          console.log('🔍 FETCH: button4LandingPageRequired value:', data.config.button4LandingPageRequired)
          setGlobalConfig(data.config)
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
    
    // BUTTON 1 PERSISTENCE: Save Button 1 data to localStorage when it changes
    const button1Fields = [
      'button1GuestsLocked', 'button1GuestsDefault', 'button1GuestsRangeMax',
      'button1DaysLocked', 'button1DaysDefault', 'button1DaysRangeMax',
      'button1AllowCustomGuestsDays', 'button1DefaultGuests', 'button1DefaultDays', 'button1MaxGuests', 'button1MaxDays'
    ]
    
    const hasButton1Changes = Object.keys(updates).some(key => button1Fields.includes(key))
    
    if (hasButton1Changes) {
      const button1Data = {
        button1GuestsLocked: updatedConfig.button1GuestsLocked,
        button1GuestsDefault: updatedConfig.button1GuestsDefault,
        button1GuestsRangeMax: updatedConfig.button1GuestsRangeMax,
        button1DaysLocked: updatedConfig.button1DaysLocked,
        button1DaysDefault: updatedConfig.button1DaysDefault,
        button1DaysRangeMax: updatedConfig.button1DaysRangeMax,
        button1AllowCustomGuestsDays: updatedConfig.button1AllowCustomGuestsDays,
        button1DefaultGuests: updatedConfig.button1DefaultGuests,
        button1DefaultDays: updatedConfig.button1DefaultDays,
        button1MaxGuests: updatedConfig.button1MaxGuests,
        button1MaxDays: updatedConfig.button1MaxDays,
        timestamp: new Date().toISOString()
      }
      
      try {
        localStorage.setItem('elocalpass-button1-config', JSON.stringify(button1Data))
        console.log('💾 Button 1 data saved to localStorage:', button1Data)
      } catch (error) {
        console.error('Failed to save Button 1 to localStorage:', error)
      }
    }

    // BUTTON 2 PERSISTENCE: Save Button 2 data to localStorage when it changes
    const button2Fields = [
      'button2PricingType', 'button2FixedPrice', 'button2VariableBasePrice',
      'button2VariableGuestIncrease', 'button2VariableDayIncrease', 'button2VariableCommission',
      'button2IncludeTax', 'button2TaxPercentage'
    ]
    
    const hasButton2Changes = Object.keys(updates).some(key => button2Fields.includes(key))
    
    if (hasButton2Changes) {
      const button2Data = {
        button2PricingType: updatedConfig.button2PricingType,
        button2FixedPrice: updatedConfig.button2FixedPrice,
        button2VariableBasePrice: updatedConfig.button2VariableBasePrice,
        button2VariableGuestIncrease: updatedConfig.button2VariableGuestIncrease,
        button2VariableDayIncrease: updatedConfig.button2VariableDayIncrease,
        button2VariableCommission: updatedConfig.button2VariableCommission,
        button2IncludeTax: updatedConfig.button2IncludeTax,
        button2TaxPercentage: updatedConfig.button2TaxPercentage,
        timestamp: new Date().toISOString()
      }
      
      try {
        localStorage.setItem('elocalpass-button2-config', JSON.stringify(button2Data))
        console.log('💾 Button 2 data saved to localStorage:', button2Data)
      } catch (error) {
        console.error('Failed to save Button 2 to localStorage:', error)
      }
    }

    // BUTTON 3 PERSISTENCE: Save Button 3 delivery method to localStorage when it changes
    const button3Fields = ['button3DeliveryMethod']
    
    const hasButton3Changes = Object.keys(updates).some(key => button3Fields.includes(key))
    
    if (hasButton3Changes) {
      const button3Data = {
        button3DeliveryMethod: updatedConfig.button3DeliveryMethod,
        timestamp: new Date().toISOString()
      }
      
      try {
        localStorage.setItem('elocalpass-button3-config', JSON.stringify(button3Data))
        console.log('💾 Button 3 delivery method saved to localStorage:', button3Data)
      } catch (error) {
        console.error('Failed to save Button 3 to localStorage:', error)
      }
    }
    
    // Manual save only
    setIsAutoSaving(true)
    setSaveStatus('Saving...')
    
    try {
      const response = await fetch('/api/admin/qr-global-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      })

      if (response.ok) {
        // Auto-save removed
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        // Auto-save removed
        setTimeout(() => setSaveStatus(''), 3000)
      }
    } catch (error) {
      // Auto-save removed
      // Auto-save removed
      setTimeout(() => setSaveStatus(''), 3000)
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Load saved configurations on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (currentSessionId) {
        await loadCurrentProgress()
      }
      await loadSavedConfigurations()
    }
    
    initializeData()
  }, [currentSessionId]) // Add currentSessionId as dependency

  // Check for new temporary URLs from landing page creation
  useEffect(() => {
    console.log('🔄 useEffect triggered - checking for new temporary URLs')
    console.log('🔍 Current sellerUrls state:', sellerUrls)
    const checkForNewTempUrl = () => {
      // Check for new list-based approach first
      const newTempUrls = localStorage.getItem('elocalpass-new-temp-urls')
      // Also check for old single-URL approach for backward compatibility
      const newTempUrl = localStorage.getItem('elocalpass-new-temp-url')
      
      let newUrlsToProcess = []
      
      // Process list-based approach
      if (newTempUrls) {
        try {
          const urlsList = JSON.parse(newTempUrls)
          newUrlsToProcess = Array.isArray(urlsList) ? urlsList : []
          console.log('🔍 Found', newUrlsToProcess.length, 'new temporary URLs in list')
        } catch (error) {
          console.error('Error parsing new temp URLs list:', error)
        }
      }
      
      // Process old single-URL approach
      if (newTempUrl) {
        try {
          const tempUrlData = JSON.parse(newTempUrl)
          newUrlsToProcess.push(tempUrlData)
          console.log('🔍 Found 1 new temporary URL in old format')
        } catch (error) {
          console.error('Error parsing new temp URL data:', error)
        }
      }
      
      if (newUrlsToProcess.length > 0) {
        // Get existing temporary URLs from saved progress
        const savedProgress = localStorage.getItem('elocalpass-current-qr-progress')
        let existingTempUrls: any[] = []
        
        if (savedProgress) {
          try {
            const progressData = JSON.parse(savedProgress)
            existingTempUrls = progressData.temporaryUrls || []
          } catch (error) {
            console.error('Error parsing saved progress:', error)
          }
        }
        
        console.log('🔍 PROCESSING: New URLs to process:', newUrlsToProcess)
        console.log('🔍 PROCESSING: Existing temp URLs:', existingTempUrls)
        
        // Process each new URL
        let urlsAdded = 0
        const finalTempUrls = [...existingTempUrls]
        
        newUrlsToProcess.forEach(tempUrlData => {
          const existsInProgress = finalTempUrls.some(url => url.id === tempUrlData.id)
          
          if (!existsInProgress) {
            console.log('✅ Adding new temporary URL:', tempUrlData.name)
            finalTempUrls.push(tempUrlData)
            urlsAdded++
          } else {
            console.log('⚠️ Temporary URL already exists, skipping:', tempUrlData.name)
          }
        })
        
        if (urlsAdded > 0) {
          console.log('🔍 FINAL TEMP URLS after processing:', finalTempUrls)
          
          setSellerUrls(prev => {
            // Remove any existing temp URLs and add all temp URLs
            const nonTempUrls = prev.filter(url => !url.isTemp)
            const result = [...nonTempUrls, ...finalTempUrls]
            console.log('🔍 FINAL SELLER URLS:', result)
            return result
          })
          
          setConfiguredButtons(prev => new Set(prev).add(3))
        }
        
        // Clean up both storage keys
        localStorage.removeItem('elocalpass-new-temp-urls')
        localStorage.removeItem('elocalpass-new-temp-url')
      }
    }

    // Check immediately on mount
    checkForNewTempUrl()
    
    // Also check when the window gains focus (when returning from landing page editor)
    const handleFocus = () => {
      console.log('🔄 Window focused - checking for new temporary URLs')
      console.log('🔍 DEBUG: Current localStorage contents:')
      console.log('- elocalpass-new-temp-urls:', localStorage.getItem('elocalpass-new-temp-urls'))
      console.log('- elocalpass-new-temp-url:', localStorage.getItem('elocalpass-new-temp-url'))
      console.log('- elocalpass-current-qr-progress:', localStorage.getItem('elocalpass-current-qr-progress'))
      checkForNewTempUrl()
    }
    
    window.addEventListener('focus', handleFocus)
    
    // Also check periodically in case focus events are missed
    const interval = setInterval(() => {
      console.log('🔄 Periodic check for new temporary URLs')
      checkForNewTempUrl()
    }, 2000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [])

  const loadSavedConfigurations = async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 Loading configurations from database first...', forceRefresh ? '(force refresh)' : '')
      
      // Add cache-busting timestamp, especially important when force refreshing after edits
      const timestamp = Date.now()
      const cacheBuster = forceRefresh ? `?t=${timestamp}&force=true` : `?t=${timestamp}`
      
      // PRIORITY 1: Load from DATABASE (where proper data is saved)
      const dbResponse = await fetch(`/api/admin/saved-configs${cacheBuster}`, {
        credentials: 'include',
        cache: forceRefresh ? 'no-store' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } : {}
      })
      
      if (dbResponse.ok) {
        const dbConfigs = await dbResponse.json()
        console.log('✅ LOAD CONFIGS SUCCESS:', {
          timestamp: new Date().toISOString(),
          loadedCount: dbConfigs.length,
          forceRefresh,
                      configDetails: dbConfigs.map((config: any) => ({
            id: config.id,
            name: config.name,
            updatedAt: config.updatedAt,
            hasNewStructure: !!config.landingPageConfig?.temporaryUrls,
            hasLegacyStructure: !!(config as any).button3UrlsConfig?.temporaryUrls,
            newStructureUrlCount: config.landingPageConfig?.temporaryUrls?.length || 0,
            legacyStructureUrlCount: (config as any).button3UrlsConfig?.temporaryUrls?.length || 0,
            urlIds: [
              ...(config.landingPageConfig?.temporaryUrls?.map((u: any) => `NEW:${u.id}:${u.name}:${u.url}`) || []),
              ...((config as any).button3UrlsConfig?.temporaryUrls?.map((u: any) => `LEGACY:${u.id}:${u.name}:${u.url}`) || [])
            ]
          }))
        })
        
        // DO NOT extract URLs from saved configurations - they belong to those specific configs
        // URLs should only appear in current session when creating new configurations
        
        // Use database configurations directly - they have the proper structure
        setSavedConfigurations(dbConfigs)
        
        // Run data consistency check after loading configurations
        setTimeout(() => validateDataConsistency(), 1000)
        
        return // Exit early - database is the source of truth
      } else {
        console.log('⚠️ Could not load from database, status:', dbResponse.status)
      }
      
      // FALLBACK: Only use localStorage if database fails
      console.log('📦 Falling back to localStorage...')
      const saved = localStorage.getItem('elocalpass-saved-configurations')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const localConfigs = parsed.map((config: any) => ({
            ...config,
            createdAt: new Date(config.createdAt),
            source: 'localStorage'
          }))
          console.log('✅ Loaded', localConfigs.length, 'configurations from localStorage')
          
          // DO NOT extract URLs from saved configurations - they belong to those specific configs
          // URLs should only appear in current session when creating new configurations
          
          setSavedConfigurations(localConfigs)
        } catch (error) {
          console.error('Error parsing saved configurations:', error)
          setSavedConfigurations([])
        }
      } else {
        console.log('❌ No configurations found anywhere')
        setSavedConfigurations([])
      }
      
    } catch (error) {
      console.error('❌ Error loading configurations:', error)
      setSavedConfigurations([])
    }
  }

  const loadCurrentProgress = async () => {
    try {
      console.log('🔄 RESTORE: Loading current session from database...')
      
      // Load temporary URLs from database using current session ID
      if (currentSessionId) {
        const response = await fetch(`/api/admin/saved-configs/${currentSessionId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const sessionConfig = await response.json()
          console.log('✅ RESTORE: Loaded session config from database:', sessionConfig)
          
          // Restore temporary URLs if they exist
          if (sessionConfig.landingPageConfig?.temporaryUrls) {
            setSellerUrls(sessionConfig.landingPageConfig.temporaryUrls)
            console.log('✅ RESTORE: Loaded', sessionConfig.landingPageConfig.temporaryUrls.length, 'temporary URLs from database')
            setConfiguredButtons(prev => {
              const newSet = new Set(prev)
              newSet.add(3) // Mark button 3 as configured
              console.log('🔧 RESTORE: Preserving existing configured buttons and adding button 3:', Array.from(newSet))
              return newSet
            })
          }
          
          // Restore selected URL IDs if they exist
          if (sessionConfig.selectedUrlIds) {
            setSelectedUrlIds(sessionConfig.selectedUrlIds)
            console.log('✅ RESTORE: Loaded', sessionConfig.selectedUrlIds.length, 'selected URL IDs from database')
          }
          
          setProgressRestored(true)
          console.log('✅ Restored QR configuration progress from database')
          
          // Hide the progress restored indicator after 5 seconds
          setTimeout(() => {
            setProgressRestored(false)
            console.log('Progress restored indicator hidden')
          }, 5000)
        } else {
          console.log('ℹ️ RESTORE: No existing session configuration found in database')
        }
      }
    } catch (error) {
      console.error('❌ RESTORE: Error loading current progress from database:', error)
    }
  }

  // Check if all 6 buttons are configured
  const areAllButtonsConfigured = (): boolean => {
    // Use the enhanced isButtonConfigured function for each button
    return [1, 2, 3, 4, 5, 6].every(buttonNum => isButtonConfigured(buttonNum))
  }

  // BUTTON 3: Save URL data to localStorage
  const saveButton3UrlData = () => {
    const button3UrlData = {
      temporaryUrls: sellerUrls.filter(url => url.isTemp),
      selectedUrlIds: selectedUrlIds,
      timestamp: new Date().toISOString()
    }
    
    try {
      localStorage.setItem('elocalpass-button3-urls', JSON.stringify(button3UrlData))
      console.log('💾 Button 3 URL data saved to localStorage:', button3UrlData)
    } catch (error) {
      console.error('Failed to save Button 3 URL data to localStorage:', error)
    }
  }

  // IMMEDIATE DATABASE SAVE: Save selectedUrlIds to database session immediately
  const saveSelectedUrlsToDatabase = async (newSelectedUrlIds: string[]) => {
    if (!currentSessionId) return
    
    try {
      // Get current session data
      const response = await fetch(`/api/admin/saved-configs/${currentSessionId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const sessionConfig = await response.json()
        
        // Update selectedUrlIds in the session
        const updatedConfig = {
          ...sessionConfig,
          selectedUrlIds: newSelectedUrlIds
        }
        
        // Save back to database
        const saveResponse = await fetch(`/api/admin/saved-configs/${currentSessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatedConfig)
        })
        
        if (saveResponse.ok) {
          console.log('✅ IMMEDIATE SAVE: selectedUrlIds saved to database:', newSelectedUrlIds)
        } else {
          console.error('❌ IMMEDIATE SAVE: Failed to save selectedUrlIds to database')
        }
      }
    } catch (error) {
      console.error('❌ IMMEDIATE SAVE: Error saving selectedUrlIds to database:', error)
    }
  }

  // Save current progress to localStorage
  const saveCurrentProgress = () => {
    if (!globalConfig) return // Don't save if no config loaded yet
    
    const progressData = {
      globalConfig,
      configuredButtons: Array.from(configuredButtons),
      selectedUrlIds,
      temporaryUrls: sellerUrls.filter(url => url.isTemp), // Save temporary URLs
      timestamp: new Date().toISOString()
    }
    
    try {
      localStorage.setItem('elocalpass-current-qr-progress', JSON.stringify(progressData))
      console.log('💾 Progress saved with', progressData.temporaryUrls.length, 'temporary URLs')
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // Auto-save progress when state changes
  useEffect(() => {
    if (globalConfig) { // Only save if config is loaded
      console.log('🔄 AUTO-SAVE: useEffect triggered, configuredButtons:', Array.from(configuredButtons))
      const timeoutId = setTimeout(saveCurrentProgress, 500) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [globalConfig, configuredButtons, selectedUrlIds, sellerUrls])

  // BUTTON 3: Auto-save URL data when it changes
  useEffect(() => {
    if (sellerUrls.length > 0 || selectedUrlIds.length > 0) {
      const timeoutId = setTimeout(saveButton3UrlData, 500) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [sellerUrls, selectedUrlIds])

  // Separate useEffect to continuously check for new temporary URLs
  useEffect(() => {
    const checkForNewUrls = () => {
      const newTempUrls = localStorage.getItem('elocalpass-new-temp-urls')
      if (newTempUrls) {
        try {
          const urlsList = JSON.parse(newTempUrls)
          if (Array.isArray(urlsList) && urlsList.length > 0) {
            console.log('🔍 CONTINUOUS CHECK: Found new URLs to process:', urlsList)
            
            setSellerUrls(prev => {
              const currentTempUrls = prev.filter(url => url.isTemp)
              const nonTempUrls = prev.filter(url => !url.isTemp)
              
              // Check which URLs are actually new
              const newUrls = urlsList.filter(newUrl => 
                !currentTempUrls.some(existing => existing.id === newUrl.id)
              )
              
              if (newUrls.length > 0) {
                console.log('✅ CONTINUOUS CHECK: Adding', newUrls.length, 'new URLs')
                const allTempUrls = [...currentTempUrls, ...newUrls]
                localStorage.removeItem('elocalpass-new-temp-urls') // Clean up
                setConfiguredButtons(prev => new Set(prev).add(3))
                return [...nonTempUrls, ...allTempUrls]
              }
              
              return prev
            })
          }
        } catch (error) {
          console.error('Error in continuous check:', error)
        }
      }
    }
    
    // Check immediately
    checkForNewUrls()
    
         // Check every 500ms for faster detection
     const interval = setInterval(checkForNewUrls, 500)
    
    return () => clearInterval(interval)
  }, []) // Empty dependency array so it runs once and sets up the interval

  // Helper function to check Button 4 configuration from database
  const checkButton4Configuration = (): boolean => {
    try {
      // Check if Button 4 choice is stored in globalConfig (database)
      if (globalConfig.button4LandingPageRequired === false) {
        // Default template chosen - always configured
        console.log('🔧 BUTTON 4: Default template configured in database')
        return true
      } else if (globalConfig.button4LandingPageRequired === true) {
        // Custom template chosen - check if template exists
        // TODO: Move this to database check instead of localStorage
        const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
        const hasTemplate = !!(welcomeEmailConfig && welcomeEmailConfig !== 'null')
        console.log('🔧 BUTTON 4: Custom template configured in database, template exists:', hasTemplate)
        return hasTemplate
      }
      
      // No choice made yet - check localStorage for temporary state
      const button4Config = localStorage.getItem('elocalpass-button4-config')
      if (button4Config) {
        try {
          const parsed = JSON.parse(button4Config)
          if (parsed && parsed.choice) {
            console.log('🔧 BUTTON 4: Found temporary choice in localStorage:', parsed.choice)
            return parsed.choice === 'default' || (parsed.choice === 'custom' && parsed.hasTemplate)
          }
        } catch (error) {
          console.warn('Error parsing Button 4 localStorage config:', error)
        }
      }
      
      console.log('🔧 BUTTON 4: No configuration found')
      return false
    } catch (error) {
      console.warn('Error checking Button 4 configuration:', error)
      return false
    }
  }

  // Detect configuration status from database and localStorage (runs after page load)
  useEffect(() => {
    // Skip if this is the initial render before any restoration
    if (!globalConfig) return

    console.log('🔍 DETECTION: Checking configuration status from database and localStorage')
    console.log('🔍 DETECTION: Current globalConfig.button4LandingPageRequired:', globalConfig.button4LandingPageRequired)
    console.log('🔍 DETECTION: Current button4UserChoice:', button4UserChoice)
    
    const configuredButtonsSet = new Set<number>()
    
    // Check Button 1 (Personalization) - check if localStorage has config
    const button1Config = localStorage.getItem('elocalpass-button1-config')
    if (button1Config) {
      try {
        const parsed = JSON.parse(button1Config)
        if (parsed && Object.keys(parsed).length > 0) {
          configuredButtonsSet.add(1)
          console.log('🔧 DETECTION: Button 1 configured (localStorage found)')
        }
      } catch (error) {
        console.warn('Warning: Could not parse Button 1 config:', error)
      }
    }
    
    // Check Button 2 (Pricing) - check if localStorage has config
    const button2Config = localStorage.getItem('elocalpass-button2-config')
    if (button2Config) {
      try {
        const parsed = JSON.parse(button2Config)
        if (parsed && Object.keys(parsed).length > 0) {
          configuredButtonsSet.add(2)
          console.log('🔧 DETECTION: Button 2 configured (localStorage found)')
        }
      } catch (error) {
        console.warn('Warning: Could not parse Button 2 config:', error)
      }
    }
    
    // Check Button 3 (Delivery Method) - check if localStorage has config OR if URLs exist
    const button3Config = localStorage.getItem('elocalpass-button3-config')
    const button3UrlsConfig = localStorage.getItem('elocalpass-button3-urls')
    
    let button3Configured = false
    
    // Check for explicit Button 3 configuration
    if (button3Config) {
      try {
        const parsed = JSON.parse(button3Config)
        if (parsed && Object.keys(parsed).length > 0) {
          button3Configured = true
          console.log('🔧 DETECTION: Button 3 configured (localStorage config found)')
        }
      } catch (error) {
        console.warn('Warning: Could not parse Button 3 config:', error)
      }
    }
    
    // DO NOT auto-configure Button 3 just because URLs exist
    // For fresh master configurations, all buttons should start as "Need to configure"
    // Button 3 should only be marked as configured when user explicitly chooses a delivery method
    console.log('🔧 DETECTION: Button 3 - only marking as configured if explicit choice made, not just because URLs exist')
    
    if (button3Configured) {
      configuredButtonsSet.add(3)
    }
    
    // Check Button 4 (Welcome Email) - IGNORE database defaults, only use explicit user choices
    // Check localStorage first for explicit user choice
    const button4Config = localStorage.getItem('elocalpass-button4-config')
    if (button4Config && !userIsInteracting) { // Don't override if user is actively interacting
      try {
        const parsed = JSON.parse(button4Config)
        if (parsed && parsed.choice) {
          // Add extra protection for Default Template choice to prevent interference
          const isDefaultChoice = parsed.choice === 'default'
          const shouldSetState = !isDefaultChoice || !userIsInteracting
          
          if (shouldSetState) {
            setButton4UserChoice(parsed.choice === 'custom' ? true : false)
          }
          
          // Check for template existence in real-time (not from stored hasTemplate flag)
          const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
          const hasTemplate = !!(welcomeEmailConfig && welcomeEmailConfig !== 'null')
          
          const isConfigured = parsed.choice === 'default' || (parsed.choice === 'custom' && hasTemplate)
          if (isConfigured) {
            configuredButtonsSet.add(4)
          }
          console.log('🔧 DETECTION: Button 4 explicit user choice found:', parsed.choice, 'hasTemplate:', hasTemplate, 'configured:', isConfigured, 'shouldSetState:', shouldSetState)
        } else {
          // localStorage exists but no valid choice - treat as no selection
          setButton4UserChoice(null)
          console.log('🔧 DETECTION: Button 4 localStorage exists but no valid choice - no selection')
        }
      } catch (error) {
        console.warn('Error parsing Button 4 localStorage config:', error)
        setButton4UserChoice(null)
      }
    } else if (!button4Config && !userIsInteracting) {
      // No localStorage choice - check if database has been explicitly set by user
      // We'll only trust database values if localStorage confirms user made a choice
      // Since there's no localStorage, treat as no selection regardless of database value
      setButton4UserChoice(null)
      console.log('🔧 DETECTION: Button 4 no explicit user choice found - showing no selection')
    }
    
    // Check Button 5 (Rebuy Email) - database-first approach like Button 4
    const button5LocalConfig = localStorage.getItem('elocalpass-button5-config')
    if (button5LocalConfig && !userIsInteracting) { // Don't override if user is actively interacting
      try {
        const parsed = JSON.parse(button5LocalConfig)
        if (parsed && parsed.choice) {
          // User has made a choice - set the user choice state
          const userChoice = parsed.choice === 'yes' ? true : false
          setButton5UserChoice(userChoice)
          configuredButtonsSet.add(5)
          console.log('🔧 DETECTION: Button 5 user choice found in localStorage:', parsed.choice, '- marking as configured')
        }
      } catch (error) {
        console.warn('Warning: Could not parse Button 5 config:', error)
      }
    } else if (!button5LocalConfig && !userIsInteracting) {
      // No localStorage choice - check if database has been explicitly set by user
      // We'll only trust database values if localStorage confirms user made a choice
      // Since there's no localStorage, treat as no selection regardless of database value
      setButton5UserChoice(null)
      console.log('🔧 DETECTION: Button 5 no explicit user choice found - showing no selection')
    }
    
    // Check Button 6 (Allow Future QR) - database-first approach like Button 4 & 5
    const button6LocalConfig = localStorage.getItem('elocalpass-button6-config')
    if (button6LocalConfig && !userIsInteracting) { // Don't override if user is actively interacting
      try {
        const parsed = JSON.parse(button6LocalConfig)
        if (parsed && parsed.choice) {
          // User has made a choice - set the user choice state
          const userChoice = parsed.choice === 'yes' ? true : false
          setButton6UserChoice(userChoice)
          configuredButtonsSet.add(6)
          console.log('🔧 DETECTION: Button 6 user choice found in localStorage:', parsed.choice, '- marking as configured')
        }
      } catch (error) {
        console.warn('Warning: Could not parse Button 6 config:', error)
      }
    } else if (!button6LocalConfig && !userIsInteracting) {
      // No localStorage choice - check if database has been explicitly set by user
      // We'll only trust database values if localStorage confirms user made a choice
      // Since there's no localStorage, treat as no selection regardless of database value
      setButton6UserChoice(null)
      console.log('🔧 DETECTION: Button 6 no explicit user choice found - showing no selection')
    }
    
    console.log('🎯 DETECTION: Final configuredButtonsSet:', Array.from(configuredButtonsSet))
    
    // Only update if something changed
    if (configuredButtonsSet.size !== configuredButtons.size || 
        !Array.from(configuredButtonsSet).every(btn => configuredButtons.has(btn))) {
      console.log('🔄 DETECTION: Updating configuredButtons state')
      setConfiguredButtons(configuredButtonsSet)
    }
  }, [globalConfig, userIsInteracting]) // Run when globalConfig changes

  // Re-run detection when user returns to the page (e.g., after creating a template or landing page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 FOCUS: Page focused - re-running detection for Buttons 3 & 4')
      
      // Re-check Button 3 configuration when page gets focus (for new landing pages)
      const button3UrlsConfig = localStorage.getItem('elocalpass-button3-urls')
      if (button3UrlsConfig) {
        try {
          const urlsData = JSON.parse(button3UrlsConfig)
          if (urlsData && urlsData.temporaryUrls && urlsData.temporaryUrls.length > 0) {
            // URLs exist - update sellerUrls state but DO NOT auto-mark Button 3 as configured
            // Button 3 should only be marked as configured when user explicitly chooses delivery method
            setSellerUrls(urlsData.temporaryUrls)
            
            // IMPORTANT: Auto-select all URLs (ensure all URLs are in selectedUrlIds)
            const allUrlIds = urlsData.temporaryUrls.map((url: any) => url.id)
            const currentSelectedIds = urlsData.selectedUrlIds || []
            
            // Check if any URLs are missing from selectedUrlIds
            const missingUrlIds = allUrlIds.filter((id: string) => !currentSelectedIds.includes(id))
            
            if (missingUrlIds.length > 0) {
              // Add missing URLs to selectedUrlIds
              const updatedSelectedIds = [...currentSelectedIds, ...missingUrlIds]
              setSelectedUrlIds(updatedSelectedIds)
              
              // Update localStorage with all URLs selected
              const updatedUrlsData = {
                ...urlsData,
                selectedUrlIds: updatedSelectedIds
              }
              localStorage.setItem('elocalpass-button3-urls', JSON.stringify(updatedUrlsData))
              
              console.log('🔧 FOCUS: Auto-selected missing URLs:', missingUrlIds)
              console.log('🔧 FOCUS: All URLs now selected:', updatedSelectedIds)
            } else {
              setSelectedUrlIds(currentSelectedIds)
            }
            
            console.log('🔧 FOCUS: Button 3 URLs detected - updating URL state only (not marking as configured)')
          }
        } catch (error) {
          console.warn('Error parsing Button 3 URLs config on focus:', error)
        }
      }
      
      // Re-check Button 4 configuration when page gets focus
      const button4Config = localStorage.getItem('elocalpass-button4-config')
      if (button4Config) {
        try {
          const parsed = JSON.parse(button4Config)
          if (parsed && parsed.choice === 'custom') {
            // Check if template now exists
            const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
            const hasTemplate = !!(welcomeEmailConfig && welcomeEmailConfig !== 'null')
            
            if (hasTemplate) {
              // Template now exists - mark as configured
              setConfiguredButtons((prev) => new Set(prev).add(4))
              console.log('🔧 FOCUS: Button 4 template detected - marking as configured')
            }
          }
        } catch (error) {
          console.warn('Error parsing Button 4 config on focus:', error)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    
    // Also listen for localStorage changes (for same-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'elocalpass-welcome-email-config') {
        console.log('🔄 STORAGE: Welcome email config changed - re-running Button 4 detection')
        handleFocus() // Reuse the same logic
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Auto-select all URLs on component mount (ensure URLs are always selected)
  useEffect(() => {
    const autoSelectAllUrls = () => {
      const button3UrlsConfig = localStorage.getItem('elocalpass-button3-urls')
      if (button3UrlsConfig) {
        try {
          const urlsData = JSON.parse(button3UrlsConfig)
          if (urlsData && urlsData.temporaryUrls && urlsData.temporaryUrls.length > 0) {
            // Get all URL IDs
            const allUrlIds = urlsData.temporaryUrls.map((url: any) => url.id)
            const currentSelectedIds = urlsData.selectedUrlIds || []
            
            // Check if any URLs are missing from selectedUrlIds
            const missingUrlIds = allUrlIds.filter((id: string) => !currentSelectedIds.includes(id))
            
            if (missingUrlIds.length > 0) {
              // Add missing URLs to selectedUrlIds
              const updatedSelectedIds = [...currentSelectedIds, ...missingUrlIds]
              
              // Update localStorage with all URLs selected
              const updatedUrlsData = {
                ...urlsData,
                selectedUrlIds: updatedSelectedIds
              }
              localStorage.setItem('elocalpass-button3-urls', JSON.stringify(updatedUrlsData))
              
              // Update React state
              setSelectedUrlIds(updatedSelectedIds)
              setSellerUrls(urlsData.temporaryUrls)
              
              console.log('🔧 MOUNT: Auto-selected missing URLs:', missingUrlIds)
              console.log('🔧 MOUNT: All URLs now selected:', updatedSelectedIds)
            } else if (currentSelectedIds.length > 0) {
              // All URLs already selected, just update state
              setSelectedUrlIds(currentSelectedIds)
              setSellerUrls(urlsData.temporaryUrls)
              console.log('🔧 MOUNT: All URLs already selected:', currentSelectedIds)
            }
          }
        } catch (error) {
          console.warn('Error auto-selecting URLs on mount:', error)
        }
      }
    }
    
    // Run auto-selection after a short delay to ensure other useEffects have run
    const timer = setTimeout(autoSelectAllUrls, 100)
    return () => clearTimeout(timer)
  }, [])

  // Save current configuration with a name
  const saveNamedConfiguration = async () => {
    if (!areAllButtonsConfigured()) {
      toast.error('Configuration Incomplete', 'Please complete all 6 button configurations before saving')
      return
    }

    if (!newConfigName.trim()) {
      toast.error('Missing Information', 'Please enter a configuration name')
      return
    }

    // BUTTON 1: Gather Button 1 data from localStorage
    const button1Config = localStorage.getItem('elocalpass-button1-config')
    let parsedButton1Config = null
    
    try {
      if (button1Config) {
        parsedButton1Config = JSON.parse(button1Config)
        console.log('💾 SAVE: Button 1 data loaded from localStorage:', parsedButton1Config)
      }
    } catch (error) {
      console.warn('Warning: Could not parse Button 1 configuration:', error)
    }

    // BUTTON 2: Gather Button 2 data from localStorage
    const button2Config = localStorage.getItem('elocalpass-button2-config')
    let parsedButton2Config = null
    
    try {
      if (button2Config) {
        parsedButton2Config = JSON.parse(button2Config)
        console.log('💾 SAVE: Button 2 data loaded from localStorage:', parsedButton2Config)
      }
    } catch (error) {
      console.warn('Warning: Could not parse Button 2 configuration:', error)
    }

    // BUTTON 3: Gather Button 3 data from localStorage
    const button3Config = localStorage.getItem('elocalpass-button3-config')
    const button3UrlsConfig = localStorage.getItem('elocalpass-button3-urls')
    let parsedButton3Config = null
    let parsedButton3UrlsConfig = null
    
    try {
      if (button3Config) {
        parsedButton3Config = JSON.parse(button3Config)
        console.log('💾 SAVE: Button 3 delivery method loaded from localStorage:', parsedButton3Config)
      }
      if (button3UrlsConfig) {
        parsedButton3UrlsConfig = JSON.parse(button3UrlsConfig)
        console.log('💾 SAVE: Button 3 URL data loaded from localStorage:', parsedButton3UrlsConfig)
      }
    } catch (error) {
      console.warn('Warning: Could not parse Button 3 configuration:', error)
    }

    // Gather template configurations - including email templates if they exist
    const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
    const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
    
    let parsedWelcomeEmail = null
    let parsedRebuyEmail = null
    
    try {
      if (welcomeEmailConfig) {
        parsedWelcomeEmail = JSON.parse(welcomeEmailConfig)
      }
      if (rebuyEmailConfig) {
        parsedRebuyEmail = JSON.parse(rebuyEmailConfig)
      }
    } catch (error) {
      console.warn('Warning: Could not parse template configurations:', error)
    }

    // Get landing page data from localStorage (Button 3 URLs) instead of React state
    const temporaryUrls = parsedButton3UrlsConfig?.temporaryUrls || []
    const selectedUrlIdsFromStorage = parsedButton3UrlsConfig?.selectedUrlIds || []
    
    let landingPageData = {
      temporaryUrls: temporaryUrls,
      selectedUrlIds: selectedUrlIdsFromStorage,
      urlMappings: {} as any
    }
    
    // If default template is selected, include the default template data
    if (globalConfig.button3LandingPageChoice === 'DEFAULT') {
      const defaultLandingConfig = localStorage.getItem('elocalpass-landing-page-config')
      if (defaultLandingConfig) {
        try {
          const parsedDefaultConfig = JSON.parse(defaultLandingConfig)
          // Merge default template data with URL data
          landingPageData = {
            ...landingPageData,
            ...parsedDefaultConfig
          }
          console.log('💾 SAVE: Default template data included in landing page config')
        } catch (error) {
          console.warn('Warning: Could not parse default landing page config:', error)
        }
      }
    }
    
    // Create URL mappings for each temporary URL
    temporaryUrls.forEach((url: any) => {
      const urlWithQrId = url as any // Type assertion to access qrId
      if (urlWithQrId.qrId) {
        landingPageData.urlMappings[urlWithQrId.qrId] = {
          name: url.name,
          url: url.url,
          description: url.description,
          createdAt: url.createdAt,
          isTemp: url.isTemp
        }
      }
    })
    
    console.log('💾 SAVE: Landing page data being saved from localStorage:', landingPageData)

    const newConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      description: newConfigDescription.trim() || 'No description provided',
      config: { ...globalConfig },
      selectedUrlIds: selectedUrlIdsFromStorage, // Use selected URL IDs from localStorage
      button1Config: parsedButton1Config, // Include Button 1 localStorage data
      button2Config: parsedButton2Config, // Include Button 2 localStorage data
      button3Config: parsedButton3Config, // Include Button 3 delivery method
      button3UrlsConfig: parsedButton3UrlsConfig, // Include Button 3 URL data
      emailTemplates: {
        welcomeEmail: parsedWelcomeEmail,  // Preserve custom welcome email template
        rebuyEmail: parsedRebuyEmail       // Preserve custom rebuy email template
      },
      landingPageConfig: landingPageData,
      createdAt: new Date()
    }
    
    console.log('🐛 DEBUG: Saving configuration with selectedUrlIds:', selectedUrlIds)
    console.log('🐛 DEBUG: newConfig being saved:', newConfig)
    
    // Save to DATABASE instead of localStorage
    try {
      console.log('💾 SAVE: Saving configuration to database...')
      console.log('💾 SAVE: Configuration data:', newConfig)
      
      const response = await fetch('/api/admin/saved-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newConfig.name,
          description: newConfig.description,
          config: newConfig.config,
          button1Config: newConfig.button1Config,
          button2Config: newConfig.button2Config,
          button3Config: newConfig.button3Config,
          button3UrlsConfig: newConfig.button3UrlsConfig,
          emailTemplates: newConfig.emailTemplates,
          landingPageConfig: newConfig.landingPageConfig,
          selectedUrlIds: newConfig.selectedUrlIds
        })
      })
      
      if (response.ok) {
        const savedConfig = await response.json()
        console.log('✅ Configuration saved to database successfully:', savedConfig)
        
        // Update local state with the saved configuration
        const updatedConfigs = [...savedConfigurations, savedConfig]
        setSavedConfigurations(updatedConfigs)
        
        // Clear modal state
        setNewConfigName('')
        setNewConfigDescription('')
        setShowSaveModal(false)
        
        // CRITICAL: Delete the current session configuration from database
        if (currentSessionId) {
          try {
            console.log('🗑️ CLEANUP: Deleting current session from database:', currentSessionId)
            const deleteResponse = await fetch(`/api/admin/saved-configs/${currentSessionId}`, {
              method: 'DELETE',
              credentials: 'include'
            })
            if (deleteResponse.ok) {
              console.log('✅ CLEANUP: Current session deleted from database successfully')
            } else {
              console.warn('⚠️ CLEANUP: Failed to delete current session from database')
            }
          } catch (error) {
            console.warn('⚠️ CLEANUP: Error deleting current session from database:', error)
          }
        }
        
        // Clear all temporary data and reset to fresh state
        console.log('🧹 CLEANUP: Starting post-save cleanup...')
        
        // Clear temporary URLs
        setSellerUrls([])
        setSelectedUrlIds([])
        
        // Clear current progress
        localStorage.removeItem('elocalpass-current-qr-progress')
        
        // Clear temporary templates and button configurations
        localStorage.removeItem('elocalpass-button1-config') // Clear Button 1 localStorage
        localStorage.removeItem('elocalpass-button2-config') // Clear Button 2 localStorage
        localStorage.removeItem('elocalpass-button3-config') // Clear Button 3 delivery method
        localStorage.removeItem('elocalpass-button3-urls') // Clear Button 3 URL data
        localStorage.removeItem('elocalpass-button4-config') // Clear Button 4 localStorage
        localStorage.removeItem('elocalpass-button5-config') // Clear Button 5 localStorage
        localStorage.removeItem('elocalpass-button6-config') // Clear Button 6 localStorage
        localStorage.removeItem('elocalpass-landing-config')
        localStorage.removeItem('elocalpass-welcome-email-config')
        localStorage.removeItem('elocalpass-rebuy-email-config')
        
        // Clear any pending new URLs
        localStorage.removeItem('elocalpass-new-temp-urls')
        localStorage.removeItem('elocalpass-new-temp-url')
        
            // Reset global config to defaults
    const defaultConfig = {
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
          button2VariableBasePrice: 10,
          button2VariableGuestIncrease: 5,
          button2VariableDayIncrease: 3,
          button2VariableCommission: 0,
          button2IncludeTax: false,
          button2TaxPercentage: 0,
          button3DeliveryMethod: 'DIRECT' as const,
          button3LandingPageChoice: null,
          button4LandingPageRequired: undefined,
          button5SendRebuyEmail: undefined,
          button6AllowFutureQR: undefined,
          updatedAt: new Date()
        }
        
        setGlobalConfig(defaultConfig)
        
        // Reset configured buttons state
        setConfiguredButtons(new Set())
        
        // Reset button choice states
        setButton4UserChoice(null)
        setButton5UserChoice(null)
        setButton6UserChoice(null)
        
        // Generate a new session ID for the next configuration
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentSessionId(newSessionId)
        console.log('🆕 CLEANUP: Generated new session ID for next configuration:', newSessionId)
        
        console.log('✅ CLEANUP: All temporary data cleared, ready for next configuration')
        
        // Redirect to QR Configuration Library with the newly created configuration expanded
        setExpandedConfigs(new Set([savedConfig.id])) // Expand the newly created configuration
        setShowConfigLibrary(true) // Open the library modal
        
        toast.success('Configuration Saved!', `Configuration "${savedConfig.name}" saved successfully! Redirecting to library...`)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to save to database:', errorData)
        toast.error('Save Failed', 'Failed to save configuration to database')
        return
      }
    } catch (error) {
      console.error('❌ Database save error:', error)
      toast.error('Save Failed', 'Failed to save configuration to database')
      return
    }
  }

  // Delete a saved configuration
  const deleteConfiguration = (configId: string) => {
    setSingleDeleteConfigId(configId)
    setShowSingleDeleteModal(true)
  }

  // Confirm single delete
  const confirmSingleDelete = async () => {
    if (!singleDeleteConfigId) return
    
    setSingleDeleteLoading(true)
    
    try {
      console.log('🗑️ DELETE: Deleting configuration from database:', singleDeleteConfigId)
      
      // Call API to delete from database
      const response = await fetch(`/api/admin/saved-configs/${singleDeleteConfigId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete configuration')
      }
      
      console.log('✅ DELETE: Configuration deleted from database successfully')
      
      // First, clean up any orphaned templates
      cleanupOrphanedTemplates(singleDeleteConfigId)
      
      // Then remove the configuration from the local state
      const updatedConfigs = savedConfigurations.filter(config => config.id !== singleDeleteConfigId)
      setSavedConfigurations(updatedConfigs)
      
      // Also remove from selected configs if it was selected
      const newSelectedIds = new Set(selectedConfigIds)
      newSelectedIds.delete(singleDeleteConfigId)
      setSelectedConfigIds(newSelectedIds)
      
      // Close modal and reset state
      setShowSingleDeleteModal(false)
      setSingleDeleteConfigId(null)
      
      toast.success('Configuration Deleted', 'Configuration deleted successfully from database!')
      
    } catch (error) {
      console.error('❌ DELETE: Failed to delete configuration:', error)
      toast.error('Delete Failed', `Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setSingleDeleteLoading(false)
  }

  // Bulk delete configurations
  const bulkDeleteConfigurations = async () => {
    if (selectedConfigIds.size === 0) {
      toast.warning('No Selection', 'Please select configurations to delete')
      return
    }
    
    setShowBulkDeleteModal(true)
  }

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true)
    
    try {
      const configIdsArray = Array.from(selectedConfigIds)
      console.log('🗑️ BULK DELETE: Deleting configurations from database:', configIdsArray)
      
      // Call API to bulk delete from database
      const response = await fetch('/api/admin/saved-configs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ configIds: configIdsArray })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete configurations')
      }
      
      const result = await response.json()
      console.log('✅ BULK DELETE: Configurations deleted from database successfully:', result)
      
      // Clean up orphaned templates for each deleted config
      configIdsArray.forEach(configId => cleanupOrphanedTemplates(configId))
      
      // Remove the configurations from local state
      const updatedConfigs = savedConfigurations.filter(config => !selectedConfigIds.has(config.id))
      setSavedConfigurations(updatedConfigs)
      
      // Clear selection
      setSelectedConfigIds(new Set())
      setShowBulkDeleteModal(false)
      
      toast.success('Bulk Delete Complete', `Successfully deleted ${result.deletedCount} configurations from database!`)
      
    } catch (error) {
      console.error('❌ BULK DELETE: Failed to delete configurations:', error)
      toast.error('Bulk Delete Failed', `Failed to delete configurations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setBulkDeleteLoading(false)
  }

  // Toggle configuration selection
  const toggleConfigSelection = (configId: string) => {
    const newSelected = new Set(selectedConfigIds)
    if (newSelected.has(configId)) {
      newSelected.delete(configId)
    } else {
      newSelected.add(configId)
    }
    setSelectedConfigIds(newSelected)
  }

  // Select all visible configurations
  const selectAllConfigurations = () => {
    const allVisibleIds = new Set(filteredAndSortedConfigurations.map(config => config.id))
    setSelectedConfigIds(allVisibleIds)
  }

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedConfigIds(new Set())
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

  // Temporary URL Management Functions (for current configuration session only)
  const handleCreateTempUrl = () => {
    if (!urlFormData.name.trim()) {
      toast.error('Missing Information', 'Please enter a name for the URL')
      return
    }

    // Create temporary URL with unique ID
    const tempUrl = {
      id: `temp-${Date.now()}`,
      name: urlFormData.name.trim(),
      url: urlFormData.url.trim() || null,
      description: urlFormData.description.trim() || null,
      isTemp: true
    }

    // Add to temporary URLs list
    setSellerUrls(prev => [...prev, tempUrl])

    // Automatically select the newly created URL
    const newSelectedUrlIds = [...selectedUrlIds, tempUrl.id]
    setSelectedUrlIds(newSelectedUrlIds)

    // Save the updated selectedUrlIds to database immediately
    saveSelectedUrlsToDatabase(newSelectedUrlIds)
    
    // Clear form and close modal
    setUrlFormData({ name: '', url: '', description: '' })
    setShowUrlModal(false)
    
    // Mark Button 3 as configured and preserve existing configured buttons
    setConfiguredButtons((prev) => {
      const newSet = new Set(prev)
      newSet.add(3)
      console.log('🔧 PRESERVE: Explicitly preserving configured buttons after URL creation:', Array.from(newSet))
      console.log('🔧 PRESERVE: Previous configured buttons were:', Array.from(prev))
      return newSet
    })
    
    toast.success('Temporary URL Created', 'URL added to current configuration session')
  }

  const handleUpdateTempUrl = () => {
    if (!editingUrl || !urlFormData.name.trim()) {
      toast.error('Missing Information', 'Please enter a name for the URL')
      return
    }

    // Update the temporary URL
    setSellerUrls(prev => prev.map(url => 
      url.id === editingUrl.id 
        ? {
            ...url,
            name: urlFormData.name.trim(),
            url: urlFormData.url.trim() || null,
            description: urlFormData.description.trim() || null
          }
        : url
    ))

    // Clear form and close modal
    setUrlFormData({ name: '', url: '', description: '' })
    setEditingUrl(null)
    setShowUrlModal(false)
    
    toast.success('Temporary URL Updated', 'URL updated in current configuration session')
  }

  const handleDeleteTempUrl = (urlId: string) => {
    if (!confirm('Are you sure you want to remove this URL from the current configuration?')) {
      return
    }

    // Remove from temporary URLs list
    setSellerUrls(prev => prev.filter(url => url.id !== urlId))
    
    // Remove from selected URLs if it was selected
    if (selectedUrlIds.includes(urlId)) {
      setSelectedUrlIds(selectedUrlIds.filter(id => id !== urlId))
    }
    
    toast.success('Temporary URL Removed', 'URL removed from current configuration session')
  }

  const openUrlModal = (url?: any) => {
    if (url) {
      setEditingUrl(url)
      setUrlFormData({
        name: url.name,
        url: url.url || '',
        description: url.description || ''
      })
    } else {
      setEditingUrl(null)
      setUrlFormData({ name: '', url: '', description: '' })
    }
    setShowUrlModal(true)
  }

  // AUTO-SAVE REMOVED: No longer auto-saving on every change for stability

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

  // DATA CONSISTENCY CHECK: Verify URL entries have correct configuration IDs
  const validateDataConsistency = async () => {
    try {
      console.log('🔍 Running data consistency check...')
      
      const response = await fetch('/api/admin/saved-configs', {
        credentials: 'include'
      })
      
      if (!response.ok) return
      
      const configs = await response.json()
      let inconsistenciesFound = 0
      const configsToFix = []
      
      for (const config of configs) {
        if (config.landingPageConfig?.temporaryUrls) {
          let configNeedsFix = false
          const fixedUrls = config.landingPageConfig.temporaryUrls.map((url: {
            id: string
            name: string
            url: string | null
            description?: string | null
            isActive?: boolean
            createdAt?: string
            isTemp?: boolean
          }) => {
            if (url.url && url.url.includes('/landing-enhanced/')) {
              const urlMatch = url.url.match(/\/landing-enhanced\/([^?]+)\?/)
              if (urlMatch) {
                const urlConfigId = urlMatch[1]
                if (urlConfigId !== config.id) {
                  console.warn(`⚠️ INCONSISTENCY DETECTED: Config ${config.id} has URL with wrong ID: ${urlConfigId}`)
                  inconsistenciesFound++
                  configNeedsFix = true
                  
                  // Fix the URL
                  const urlParams = url.url.split('?')[1]
                  return {
                    ...url,
                    url: `${window.location.origin}/landing-enhanced/${config.id}?${urlParams}`,
                    qrId: config.id
                  }
                }
              }
            }
            return url
          })
          
          if (configNeedsFix) {
            configsToFix.push({
              ...config,
              landingPageConfig: {
                ...config.landingPageConfig,
                temporaryUrls: fixedUrls
              }
            })
          }
        }
      }
      
      // Auto-fix inconsistencies if found
      if (configsToFix.length > 0) {
        console.log(`🔧 AUTO-FIXING ${configsToFix.length} configurations with URL inconsistencies...`)
        
        for (const configToFix of configsToFix) {
          try {
            const fixResponse = await fetch(`/api/admin/saved-configs/${configToFix.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(configToFix)
            })
            
            if (fixResponse.ok) {
              console.log(`✅ AUTO-FIX: Fixed configuration ${configToFix.id}`)
            } else {
              console.error(`❌ AUTO-FIX: Failed to fix configuration ${configToFix.id}`)
            }
          } catch (error) {
            console.error(`❌ AUTO-FIX: Error fixing configuration ${configToFix.id}:`, error)
          }
        }
        
        // Reload configurations after fixes
        setTimeout(() => loadSavedConfigurations(), 2000)
        
      } else if (inconsistenciesFound === 0) {
        console.log('✅ Data consistency check passed - all URLs have correct configuration IDs')
      }
      
    } catch (error) {
      console.error('❌ Data consistency check failed:', error)
    }
  }

  // Function to fetch and save default landing page template
  const fetchAndSaveDefaultTemplate = async () => {
    try {
      console.log('🔍 Fetching default landing page template...')
      const response = await fetch('/api/landing/default-template')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.template) {
          console.log('✅ Default template fetched:', result.template.name)
          
          // Create a temporary URL entry for the default template
          const defaultTempUrl = {
            id: `default-template-${Date.now()}`,
            name: 'Default Landing Page Template',
            url: '/landing/default',
            description: 'System default landing page template with professional branding',
            createdAt: new Date().toISOString(),
            isTemp: true,
            isDefault: true,
            templateData: {
              headerText: result.template.headerText,
              descriptionText: result.template.descriptionText,
              ctaButtonText: result.template.ctaButtonText,
              primaryColor: result.template.primaryColor,
              secondaryColor: result.template.secondaryColor,
              backgroundColor: result.template.backgroundColor,
              logoUrl: result.template.logoUrl,
              formTitleText: 'Complete Your Details',
              formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
              footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
              defaultGuests: globalConfig.button1GuestsDefault || 2,
              defaultDays: globalConfig.button1DaysDefault || 2
            }
          }
          
          // Add to sellerUrls state so it shows up in the UI
          setSellerUrls(prev => {
            // Remove any existing default template entries
            const filtered = prev.filter(url => !url.isDefault)
            return [...filtered, defaultTempUrl]
          })
          
          // Auto-select the default template
          setSelectedUrlIds([defaultTempUrl.id])
          
          // Create landing page config with default template data
          const defaultLandingConfig = {
            temporaryUrls: [defaultTempUrl],
            selectedUrlIds: [defaultTempUrl.id],
            urlMappings: {
              [defaultTempUrl.id]: {
                name: defaultTempUrl.name,
                url: defaultTempUrl.url,
                description: defaultTempUrl.description,
                createdAt: defaultTempUrl.createdAt,
                isTemp: defaultTempUrl.isTemp,
                isDefault: defaultTempUrl.isDefault
              }
            },
            // Include the default template data
            headerText: result.template.headerText,
            descriptionText: result.template.descriptionText,
            ctaButtonText: result.template.ctaButtonText,
            primaryColor: result.template.primaryColor,
            secondaryColor: result.template.secondaryColor,
            backgroundColor: result.template.backgroundColor,
            logoUrl: result.template.logoUrl,
            formTitleText: 'Complete Your Details',
            formInstructionsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
            footerDisclaimerText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
            defaultGuests: globalConfig.button1GuestsDefault || 2,
            defaultDays: globalConfig.button1DaysDefault || 2
          }
          
          // Save to localStorage for immediate use
          localStorage.setItem('elocalpass-landing-page-config', JSON.stringify(defaultLandingConfig))
          console.log('✅ Default template data saved to localStorage and added to temporary URLs')
          
          return defaultLandingConfig
        } else {
          console.error('❌ Failed to fetch default template:', result.error)
          return null
        }
      } else {
        console.error('❌ HTTP error fetching default template:', response.status)
        return null
      }
    } catch (error) {
      console.error('❌ Error fetching default template:', error)
      return null
    }
  }

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
                <span className="text-xs text-gray-300">1:50 PM</span>
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
                  <p className="text-gray-600 mt-1">Configure the 6-button QR generation system for all sellers</p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Auto-save status indicator */}
                  {false && (
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
                    Manual save only
                  </div>
                  
                  {/* Clear Progress button */}
                  <button
                    onClick={clearProgress}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Clear Progress
                  </button>
                  
                  {/* Emergency cleanup button for leftover URLs */}
                  {sellerUrls.length > 0 && (
                    <button
                      onClick={clearLeftoverUrls}
                      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      title="Clear leftover URLs from previous sessions"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Leftover URLs
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Button Navigation */}
            <div className="mb-8">
              <div className="grid grid-cols-6 gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
                  },
                  { 
                    num: 6, 
                    title: "Future QR?", 
                    value: globalConfig.button6AllowFutureQR ? "Enabled" : "Disabled"
                  }
                ].map((button, index) => (
                  <div key={button.num} className="flex flex-col items-center">
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
                      {configuredButtons.size}/6 Complete
                    </span>
                    {areAllButtonsConfigured() && (
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        💾 Save Master Configuration
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
                <div className="grid grid-cols-6 gap-2">
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
                    },
                    { 
                      num: 6, 
                      title: "Future QR?", 
                      value: globalConfig.button6AllowFutureQR ? "Enabled" : "Disabled"
                    }
                  ].map((button, index) => (
                    <div key={button.num} className="flex flex-col">
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
                          <div className="text-green-600 text-xs mt-1 font-medium">✓ Saved</div>
                        ) : (
                          <div className="text-gray-500 text-xs mt-1">Need to configure</div>
                        )}
                      </div>
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
                                setConfiguredButtons((prev) => {
                                  const newSet = new Set(prev).add(1)
                                  console.log('🔧 BUTTON 1: Configured! New set:', Array.from(newSet))
                                  return newSet
                                })
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
                          setConfiguredButtons((prev) => {
                            const newSet = new Set(prev).add(2)
                            console.log('🔧 BUTTON 2: Configured! New set:', Array.from(newSet))
                            return newSet
                          })
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
                        // Clear URLs when switching TO 'DIRECT' (leaving URL-based modes)
                        if (globalConfig.button3DeliveryMethod === 'URLS' || globalConfig.button3DeliveryMethod === 'BOTH') {
                          console.log('🧹 DIRECT: Clearing URLs when switching from URL-based modes to DIRECT')
                          setSellerUrls([])
                          setSelectedUrlIds([])
                          
                          // Clear localStorage URL data
                          localStorage.removeItem('elocalpass-button3-urls')
                          localStorage.removeItem('elocalpass-current-qr-progress')
                          localStorage.removeItem('elocalpass-new-temp-urls')
                          localStorage.removeItem('elocalpass-new-temp-url')
                          
                          console.log('✅ DIRECT: URLs cleared, switching to direct delivery')
                        }
                        
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
                              // Clear URLs when switching TO 'DIRECT' (leaving URL-based modes)
                              if (globalConfig.button3DeliveryMethod === 'URLS' || globalConfig.button3DeliveryMethod === 'BOTH') {
                                console.log('🧹 DIRECT: Clearing URLs when switching from URL-based modes to DIRECT')
                                setSellerUrls([])
                                setSelectedUrlIds([])
                                
                                // Clear localStorage URL data
                                localStorage.removeItem('elocalpass-button3-urls')
                                localStorage.removeItem('elocalpass-current-qr-progress')
                                localStorage.removeItem('elocalpass-new-temp-urls')
                                localStorage.removeItem('elocalpass-new-temp-url')
                                
                                console.log('✅ DIRECT: URLs cleared, switching to direct delivery')
                              }
                              
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
                        // Only clear URLs if switching FROM 'DIRECT' TO 'URLS' (new session)
                        // Keep URLs when switching between 'URLS' ↔ 'BOTH' (same session)
                        if (globalConfig.button3DeliveryMethod === 'DIRECT') {
                          console.log('🧹 URLS: Clearing URLs when switching from DIRECT to URLS')
                          setSellerUrls([])
                          setSelectedUrlIds([])
                          
                          // Clear localStorage URL data from previous sessions
                          localStorage.removeItem('elocalpass-button3-urls')
                          localStorage.removeItem('elocalpass-current-qr-progress')
                          localStorage.removeItem('elocalpass-new-temp-urls')
                          localStorage.removeItem('elocalpass-new-temp-url')
                          
                          console.log('✅ URLS: Clean slate ready for new configuration')
                        } else {
                          console.log('🔄 URLS: Keeping existing URLs when switching from BOTH to URLS')
                        }
                        
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
                              // Only clear URLs if switching FROM 'DIRECT' TO 'URLS' (new session)
                              // Keep URLs when switching between 'URLS' ↔ 'BOTH' (same session)
                              if (globalConfig.button3DeliveryMethod === 'DIRECT') {
                                console.log('🧹 URLS: Clearing URLs when switching from DIRECT to URLS')
                                setSellerUrls([])
                                setSelectedUrlIds([])
                                
                                // Clear localStorage URL data from previous sessions
                                localStorage.removeItem('elocalpass-button3-urls')
                                localStorage.removeItem('elocalpass-current-qr-progress')
                                localStorage.removeItem('elocalpass-new-temp-urls')
                                localStorage.removeItem('elocalpass-new-temp-url')
                                
                                console.log('✅ URLS: Clean slate ready for new configuration')
                              } else {
                                console.log('🔄 URLS: Keeping existing URLs when switching from BOTH to URLS')
                              }
                              
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
                        // Only clear URLs if switching FROM 'DIRECT' TO 'BOTH' (new session)
                        // Keep URLs when switching between 'URLS' ↔ 'BOTH' (same session)
                        if (globalConfig.button3DeliveryMethod === 'DIRECT') {
                          console.log('🧹 BOTH: Clearing URLs when switching from DIRECT to BOTH')
                          setSellerUrls([])
                          setSelectedUrlIds([])
                          
                          // Clear localStorage URL data from previous sessions
                          localStorage.removeItem('elocalpass-button3-urls')
                          localStorage.removeItem('elocalpass-current-qr-progress')
                          localStorage.removeItem('elocalpass-new-temp-urls')
                          localStorage.removeItem('elocalpass-new-temp-url')
                          
                          console.log('✅ BOTH: Clean slate ready for new configuration')
                        } else {
                          console.log('🔄 BOTH: Keeping existing URLs when switching from URLS to BOTH')
                        }
                        
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
                              // Only clear URLs if switching FROM 'DIRECT' TO 'BOTH' (new session)
                              // Keep URLs when switching between 'URLS' ↔ 'BOTH' (same session)
                              if (globalConfig.button3DeliveryMethod === 'DIRECT') {
                                console.log('🧹 BOTH: Clearing URLs when switching from DIRECT to BOTH')
                                setSellerUrls([])
                                setSelectedUrlIds([])
                                
                                // Clear localStorage URL data from previous sessions
                                localStorage.removeItem('elocalpass-button3-urls')
                                localStorage.removeItem('elocalpass-current-qr-progress')
                                localStorage.removeItem('elocalpass-new-temp-urls')
                                localStorage.removeItem('elocalpass-new-temp-url')
                                
                                console.log('✅ BOTH: Clean slate ready for new configuration')
                              } else {
                                console.log('🔄 BOTH: Keeping existing URLs when switching from URLS to BOTH')
                              }
                              
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

                  {/* Landing Page Choice - Required when URLs or BOTH is selected */}
                  {(globalConfig.button3DeliveryMethod === 'URLS' || globalConfig.button3DeliveryMethod === 'BOTH') && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-3">Landing Page Template Choice</h4>
                      <p className="text-sm text-yellow-800 mb-4">
                        You must choose a landing page template before proceeding to the next step.
                      </p>
                      
                      <div className="space-y-3">
                        {/* Default Template Option */}
                        <div className="flex items-center space-x-3 p-3 bg-white rounded border-2 hover:border-blue-300 transition-colors">
                          <input
                            type="radio"
                            id="default-landing"
                            name="landing-page-choice"
                            checked={globalConfig.button3LandingPageChoice === 'DEFAULT'}
                            onChange={async () => {
                              updateConfig({ button3LandingPageChoice: 'DEFAULT' })
                              setConfiguredButtons((prev) => new Set(prev).add(3))
                              // Fetch and save default template data
                              await fetchAndSaveDefaultTemplate()
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor="default-landing" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">Use Default Landing Page Template</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  Use the system's default landing page template with professional branding
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-green-600 font-medium">✓ Ready to use</span>
                                <span className="text-blue-600 text-lg">
                                  {globalConfig.button3LandingPageChoice === 'DEFAULT' ? '✓' : ''}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>

                        {/* Custom Template Option */}
                        <div className="flex items-center space-x-3 p-3 bg-white rounded border-2 hover:border-blue-300 transition-colors">
                          <input
                            type="radio"
                            id="custom-landing"
                            name="landing-page-choice"
                            checked={globalConfig.button3LandingPageChoice === 'CUSTOM'}
                            onChange={() => {
                              updateConfig({ button3LandingPageChoice: 'CUSTOM' })
                              setConfiguredButtons((prev) => new Set(prev).add(3))
                            }}
                            className="h-4 w-4 text-blue-600"
                          />
                          <label htmlFor="custom-landing" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">Create Custom Landing Page</span>
                                <p className="text-sm text-gray-600 mt-1">
                                  Design your own landing page with custom branding and content
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-600 font-medium">Custom design</span>
                                <span className="text-blue-600 text-lg">
                                  {globalConfig.button3LandingPageChoice === 'CUSTOM' ? '✓' : ''}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Warning if no choice made */}
                      {!globalConfig.button3LandingPageChoice && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-800">
                            <strong>⚠️ Required:</strong> Please select a landing page template to continue.
                          </p>
                        </div>
                      )}

                      {/* Success message when choice is made */}
                      {globalConfig.button3LandingPageChoice && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>✅ Selected:</strong> {
                              globalConfig.button3LandingPageChoice === 'DEFAULT' 
                                ? 'Default landing page template' 
                                : 'Custom landing page template'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {globalConfig.button3DeliveryMethod === 'URLS' && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Landing Page System</h4>
                      <p className="text-sm text-blue-800">
                        When URLs method is selected, each QR code will generate a unique landing page where guests can enter their details. 
                        Create temporary URLs below for this configuration session - they will be saved when you save the complete configuration.
                      </p>
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-800">
                          <strong>Note:</strong> URLs created here are temporary and only exist during this configuration session. 
                          They will be permanently saved only when you save the complete 6-button configuration.
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/admin/qr-config/create?sessionId=${currentSessionId}`)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create Custom Landing Page →
                      </button>
                    </div>
                  )}
                  
                  {globalConfig.button3DeliveryMethod === 'BOTH' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Dual Delivery System</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        When Both method is selected, sellers can choose between direct email delivery or landing page URLs on a per-QR basis. This provides maximum flexibility.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Left side - Direct Option */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Direct Option</h5>
                          <p className="text-xs text-gray-600">Instant QR generation with email delivery</p>
                        </div>
                        
                        {/* Right side - URL Option */}
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">URL Option</h5>
                          <p className="text-xs text-gray-600">Custom landing page with guest details form</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-800">
                          <strong>Note:</strong> URLs created here are temporary and only exist during this configuration session. 
                          They will be permanently saved only when you save the complete 6-button configuration.
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/admin/qr-config/create?sessionId=${currentSessionId}`)}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Create Custom Landing Page →
                      </button>
                    </div>
                  )}
                  
                  {(globalConfig.button3DeliveryMethod === 'URLS' || globalConfig.button3DeliveryMethod === 'BOTH') && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">Temporary URLs (Current Session)</h4>
                      </div>

                      {(() => {
                        console.log('🔍 UI RENDER: sellerUrls state:', sellerUrls)
                        console.log('🔍 UI RENDER: sellerUrls length:', sellerUrls.length)
                        console.log('🔍 UI RENDER: Temporary URLs only:', sellerUrls.filter(url => url.isTemp))
                        return null
                      })()}
                      
                      {sellerUrls.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-gray-500 mb-2">No temporary URLs created yet</p>
                          <p className="text-sm text-gray-400 mt-1">Add temporary URLs for this configuration session</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sellerUrls.filter(url => url.isTemp).map((url) => (
                            <div 
                              key={url.id} 
                              className="p-4 border rounded-lg border-green-500 bg-green-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-gray-900">{url.name}</h5>
                                      <p className="text-sm text-gray-600 truncate max-w-md">{url.url}</p>
                                      {url.description && (
                                        <p className="text-xs text-gray-500 mt-1">{url.description}</p>
                                      )}
                                      <p className="text-xs text-green-600 mt-1 font-medium">✓ Automatically attached to configuration</p>
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
                                    title="Edit URL"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTempUrl(url.id)}
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
                        </div>
                      )}



                      {/* URLs are now automatically attached - no need for selection warnings */}
                      {sellerUrls.filter(url => url.isTemp).length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">✓ All URLs automatically attached:</span> All landing page URLs are automatically included in this configuration.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Button 4: Welcome Email */}
              {activeButton === 4 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 4: Welcome Email Template</h2>
                    <p className="text-gray-600 mt-1">All clients receive welcome emails. Choose template type for this seller.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button4UserChoice === true}
                        onChange={() => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton4UserChoice(true)
                          
                          // Handle async operations separately to avoid blocking UI
                          const handleAsyncUpdate = async () => {
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button4LandingPageRequired: true })
                              
                              // 🔧 FIX: Clear any default template data from localStorage when switching to Custom Template
                              const existingConfig = localStorage.getItem('elocalpass-welcome-email-config')
                              let hasTemplate = false
                              
                              if (existingConfig && existingConfig !== 'null') {
                                try {
                                  const parsed = JSON.parse(existingConfig)
                                  // Only keep if it's a real custom template (not a default template)
                                  if (parsed.customHTML !== 'USE_DEFAULT_TEMPLATE') {
                                    hasTemplate = true
                                  } else {
                                    // Clear default template data when switching to custom
                                    localStorage.removeItem('elocalpass-welcome-email-config')
                                    console.log('🔧 BUTTON 4: Cleared default template data when switching to Custom Template')
                                  }
                                } catch (error) {
                                  localStorage.removeItem('elocalpass-welcome-email-config')
                                }
                              }
                              
                              // Also save to localStorage for immediate UI feedback
                              localStorage.setItem('elocalpass-button4-config', JSON.stringify({
                                choice: 'custom',
                                hasTemplate: hasTemplate,
                                timestamp: new Date().toISOString()
                              }))
                              
                              if (hasTemplate) {
                                setConfiguredButtons((prev) => new Set(prev).add(4))
                                console.log('🔧 BUTTON 4: Custom template selected with existing template - saved to database and marked as configured')
                              } else {
                                // Remove from configured buttons since no template exists yet
                                setConfiguredButtons((prev) => {
                                  const newSet = new Set(prev)
                                  newSet.delete(4)
                                  return newSet
                                })
                                console.log('🔧 BUTTON 4: Custom template selected but no template exists - saved to database but not marked as configured')
                              }
                              
                              // Clear interaction flag after a longer delay for Default Template
                              setTimeout(() => setUserIsInteracting(false), 1000)
                            } catch (error) {
                              console.error('Error updating Button 4 config:', error)
                              setUserIsInteracting(false)
                            }
                          }
                          
                          handleAsyncUpdate()
                        }}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Custom Template</span>
                        <p className="text-sm text-gray-600">Use seller-specific template with custom branding, messages, and promotions</p>
                        {(() => {
                          const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
                          const hasTemplate = welcomeEmailConfig && welcomeEmailConfig !== 'null'
                          if (!hasTemplate) {
                            return (
                              <p className="text-xs text-orange-600 mt-1">
                                ⚠️ You must create a custom welcome email template first
                              </p>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </label>

                    {/* Custom Template Features - Show immediately when Custom Template is selected */}
                    {button4UserChoice === true && (
                      <div className="ml-7 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        {(() => {
                          const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
                          if (welcomeEmailConfig) {
                            try {
                              const emailConfig = JSON.parse(welcomeEmailConfig)
                              if (emailConfig.isActive) {
                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-2 text-green-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Welcome Email Template Created</span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <p><strong>Name:</strong> <span className="text-gray-900">{emailConfig.name}</span></p>
                                      <p><strong>Created:</strong> <span className="text-gray-900">{new Date(emailConfig.createdAt).toLocaleDateString()}</span></p>
                                      <p><strong>Template ID:</strong> <span className="text-gray-900">{emailConfig.id}</span></p>
                                    </div>
                                  </div>
                                )
                              }
                            } catch (error) {
                              console.log('Error parsing welcome email config:', error)
                            }
                          }
                          
                          return (
                            <button 
                              onClick={() => router.push('/admin/qr-config/email-config')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                              Create Custom Welcome Email →
                            </button>
                          )
                        })()}
                      </div>
                    )}

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button4UserChoice === false}
                        onChange={async () => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton4UserChoice(false)
                          
                          // ✅ AUTO-COMPLETE: Immediately mark as configured and save default template
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button4LandingPageRequired: false })
                              
                            // 🔧 FIX: Clear any existing custom template data when switching to Default Template
                            const existingConfig = localStorage.getItem('elocalpass-welcome-email-config')
                            if (existingConfig) {
                              try {
                                const parsed = JSON.parse(existingConfig)
                                if (parsed.customHTML !== 'USE_DEFAULT_TEMPLATE') {
                                  localStorage.removeItem('elocalpass-welcome-email-config')
                                  console.log('🔧 BUTTON 4: Cleared custom template data when switching to Default Template')
                                }
                              } catch (error) {
                                localStorage.removeItem('elocalpass-welcome-email-config')
                              }
                            }
                            
                            // Save default template configuration automatically
                            const defaultEmailConfig = {
                              id: `default-template-${Date.now()}`,
                              name: 'ELocalPass Default Template',
                              subject: 'Your ELocalPass is Ready - Instant Access',
                              content: 'Default ELocalPass welcome email template',
                              customHTML: 'USE_DEFAULT_TEMPLATE',
                              htmlContent: 'USE_DEFAULT_TEMPLATE',
                              emailConfig: { useDefaultEmail: true },
                              createdAt: new Date(),
                              isActive: true
                            }
                            
                            // Save to localStorage for immediate feedback
                            localStorage.setItem('elocalpass-welcome-email-config', JSON.stringify(defaultEmailConfig))
                              localStorage.setItem('elocalpass-button4-config', JSON.stringify({
                                choice: 'default',
                              configured: true,
                                timestamp: new Date().toISOString()
                              }))
                              
                            // ✅ Mark as configured immediately
                              setConfiguredButtons((prev) => new Set(prev).add(4))
                            
                            // Show success toast
                            toast.success('Default Template Selected', 'Button 4 configured with ELocalPass default template!')
                            
                            console.log('✅ BUTTON 4: Default template auto-configured - saved to database and marked as configured')
                              
                            // Clear interaction flag
                              setTimeout(() => setUserIsInteracting(false), 1000)
                            } catch (error) {
                            console.error('Error auto-configuring default template:', error)
                            toast.error('Configuration Error', 'Failed to save default template configuration')
                              setUserIsInteracting(false)
                            }
                        }}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Default Template</span>
                        <p className="text-sm text-gray-600">Use standard ELocalPass template (same for all sellers)</p>
                      </div>
                    </label>

                    {/* Default Template Preview - Show immediately when Default Template is selected */}
                    {button4UserChoice === false && (
                      <div className="ml-7 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center space-x-2 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium text-gray-900">✅ Default Template Selected - Button 4 Configured!</span>
                          </div>
                        </div>
                        
                        {/* Inline Preview */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                          <div className="text-sm text-gray-600 mb-3">
                            <strong>📧 Email Preview:</strong>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="text-center mb-3">
                              <div className="bg-blue-600 text-white px-4 py-2 rounded-t text-lg font-bold">
                                Welcome to eLocalPass!
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><strong>Subject:</strong> Your ELocalPass is Ready - Instant Access</p>
                              <p><strong>Header:</strong> Welcome to eLocalPass!</p>
                              <p><strong>Message:</strong> Congratulations! Starting today you will be able to pay like a local while on vacation with eLocalPass</p>
                              <div className="bg-blue-600 text-white px-3 py-1 rounded text-center text-xs inline-block">
                                Create Your Account & Access Your eLocalPass
                              </div>
                              <p className="text-red-600 text-xs"><strong>⚠️ IMPORTANT:</strong> Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.</p>
                              <p className="text-gray-500 text-xs">Enjoy hundreds of discounts throughout your destination!</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Optional Full Preview Button */}
                        <div className="flex gap-2">
                        <button 
                          onClick={() => router.push('/admin/qr-config/email-config?mode=default')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                            📖 View Full Preview
                        </button>
                          <span className="text-xs text-green-600 flex items-center">
                            Template automatically saved - no further action needed!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Button 5: Send Rebuy Email */}
              {activeButton === 5 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 5: Send Rebuy Email?</h2>
                    <p className="text-gray-600 mt-1">Automatically send follow-up emails before QR expiration</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button5UserChoice === true}
                        onChange={() => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton5UserChoice(true)
                          
                          // Handle async operations separately to avoid blocking UI
                          const handleAsyncUpdate = async () => {
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button5SendRebuyEmail: true })
                              
                              // Also save to localStorage for immediate UI feedback
                              localStorage.setItem('elocalpass-button5-config', JSON.stringify({
                                choice: 'yes',
                                timestamp: new Date().toISOString()
                              }))
                              
                              setConfiguredButtons((prev) => new Set(prev).add(5))
                              console.log('🔧 BUTTON 5: Yes selected - saved to database and marked as configured')
                              
                              // Clear interaction flag after a short delay
                              setTimeout(() => setUserIsInteracting(false), 500)
                            } catch (error) {
                              console.error('Error updating Button 5 config:', error)
                              setUserIsInteracting(false)
                            }
                          }
                          
                          handleAsyncUpdate()
                        }}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Yes</span>
                        <p className="text-sm text-gray-600">System will automatically send a follow-up email 12 hours before each QR code expires, 
                          encouraging guests to purchase a new QR code for continued access.
                        </p>
                      </div>
                    </label>

                    {button5UserChoice === true && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Rebuy Email System</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          When enabled, the system will automatically send a follow-up email 12 hours before each QR code expires, 
                          encouraging guests to purchase a new QR code for continued access.
                        </p>
                        
                        {/* Template Selection Options */}
                        <div className="space-y-3 mt-4">
                          <h5 className="font-medium text-blue-900">Choose Template Type:</h5>
                          
                          {/* Default Template Option */}
                          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-blue-200 rounded-md hover:bg-blue-25">
                            <input
                              type="radio"
                              name="rebuyTemplateType"
                              checked={(() => {
                                // Use refresh state to trigger re-evaluation
                                rebuyTemplateRefresh; // Force dependency
                                const rebuyConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                                if (!rebuyConfig) return false // Don't default to any option
                                try {
                                  const config = JSON.parse(rebuyConfig)
                                  return config.customHTML === 'USE_DEFAULT_TEMPLATE'
                                } catch {
                                  return false
                                }
                              })()}
                              onChange={async () => {
                                try {
                                  console.log('🎯 REBUY: Loading default template from database...')
                                  
                                  // Load default template from database
                                  const response = await fetch('/api/admin/rebuy-templates', {
                                    method: 'GET',
                                    credentials: 'include'
                                  })

                                  let defaultRebuyConfig
                                  
                                  if (response.ok) {
                                    const result = await response.json()
                                    if (result.template && result.template.customHTML) {
                                      console.log('✅ REBUY: Default template loaded from database')
                                      
                                      // Create config with database default template content
                                      defaultRebuyConfig = {
                                        id: 'default-rebuy-template',
                                        name: 'Default Rebuy Template',
                                        customHTML: 'USE_DEFAULT_TEMPLATE',
                                        rebuyConfig: {
                                          emailSubject: result.template.subject || 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
                                          // Extract settings from database template or use defaults
                                          emailHeader: 'Don\'t Miss Out!',
                                          emailMessage: 'Your eLocalPass expires soon. Renew now with an exclusive discount!',
                                          emailCta: 'Get Another ELocalPass',
                                          emailFooter: 'Thank you for choosing ELocalPass!',
                                          enableDiscountCode: true,
                                          discountValue: 15,
                                          discountType: 'percentage'
                                        },
                                        createdAt: new Date(),
                                        isActive: true
                                      }
                                    } else {
                                      console.log('⚠️ REBUY: No default template in database, using fallback')
                                      throw new Error('No default template found')
                                    }
                                  } else {
                                    throw new Error('Failed to load default template')
                                  }
                                  
                                  // Save to localStorage
                                  localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(defaultRebuyConfig))
                                  
                                  // Force re-render
                                  setButton5UserChoice(true)
                                  setRebuyTemplateRefresh(prev => prev + 1) // Trigger radio button re-render
                                  
                                  console.log('✅ REBUY: Default template configured successfully')
                                  
                                } catch (error) {
                                  console.error('❌ REBUY: Error loading default template:', error)
                                  
                                  // Fallback to basic default config
                                  const fallbackConfig = {
                                    id: 'default-rebuy-template',
                                    name: 'Default Rebuy Template',
                                    customHTML: 'USE_DEFAULT_TEMPLATE',
                                    rebuyConfig: {
                                      emailSubject: 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
                                      emailHeader: 'Don\'t Miss Out!',
                                      emailMessage: 'Your eLocalPass expires soon. Renew now with an exclusive discount!',
                                      emailCta: 'Get Another ELocalPass',
                                      emailFooter: 'Thank you for choosing ELocalPass!',
                                      enableDiscountCode: true,
                                      discountValue: 15,
                                      discountType: 'percentage'
                                    },
                                    createdAt: new Date(),
                                    isActive: true
                                  }
                                  
                                  localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(fallbackConfig))
                                  setButton5UserChoice(true)
                                  setRebuyTemplateRefresh(prev => prev + 1) // Trigger radio button re-render
                                  
                                  console.log('✅ REBUY: Fallback default template configured')
                                }
                              }}
                              className="mt-1 h-4 w-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">Use Default Template</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Quick setup with our professional rebuy email template. Perfect for most businesses.
                              </p>
                        {(() => {
                                // Use refresh state to trigger re-evaluation
                                rebuyTemplateRefresh; // Force dependency
                                const rebuyConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                                if (!rebuyConfig) return null // Don't show any status when nothing is selected
                                try {
                                  const config = JSON.parse(rebuyConfig)
                                  if (config.customHTML === 'USE_DEFAULT_TEMPLATE') {
                                    return <div className="text-green-600 text-sm mt-1">✓ Currently selected</div>
                                  }
                                } catch {
                                  return null
                                }
                                return null
                              })()}
                            </div>
                          </label>

                          {/* Custom Template Option */}
                          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-blue-200 rounded-md hover:bg-blue-25">
                            <input
                              type="radio"
                              name="rebuyTemplateType"
                              checked={(() => {
                                // Use refresh state to trigger re-evaluation
                                rebuyTemplateRefresh; // Force dependency
                                const rebuyConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                                if (!rebuyConfig) return false
                                try {
                                  const config = JSON.parse(rebuyConfig)
                                  return config.customHTML !== 'USE_DEFAULT_TEMPLATE'
                                } catch {
                                  return false
                                }
                              })()}
                              onChange={() => {
                                // Check if we already have a custom template
                                const rebuyConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                                if (rebuyConfig) {
                                  try {
                                    const config = JSON.parse(rebuyConfig)
                                    if (config.customHTML !== 'USE_DEFAULT_TEMPLATE') {
                                      // Already have custom template, just select it
                                      setButton5UserChoice(true)
                                      setRebuyTemplateRefresh(prev => prev + 1) // Trigger radio button re-render
                                      console.log('✅ REBUY: Custom template already configured, selected')
                                      return
                                    }
                                  } catch (error) {
                                    console.log('Error parsing existing rebuy config:', error)
                                  }
                                }
                                
                                // Navigate to custom template configuration
                                console.log('🎯 REBUY: Navigating to custom template configuration...')
                                window.location.href = '/admin/qr-config/rebuy-config'
                              }}
                              className="mt-1 h-4 w-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">Configure Custom Template</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Create a personalized rebuy email with custom branding, colors, and messaging.
                              </p>
                              
                              {/* Show custom template info if exists */}
                              {(() => {
                                // Use refresh state to trigger re-evaluation
                                rebuyTemplateRefresh; // Force dependency
                          const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                          if (rebuyEmailConfig) {
                            try {
                              const rebuy = JSON.parse(rebuyEmailConfig)
                                    // Only show if it's actually a custom template (not default)
                                    if (rebuy.customHTML !== 'USE_DEFAULT_TEMPLATE') {
                              return (
                                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                          <div className="text-green-600 text-sm">✓ Custom template configured</div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            <span className="font-medium">Template:</span> {rebuy.name}<br/>
                                            <span className="font-medium">Created:</span> {new Date(rebuy.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )
                                    }
                            } catch {
                                    return null
                            }
                          }
                                return null
                        })()}
                            </div>
                          </label>
                        
                          {/* Configure Custom Template Button - Only show if custom is selected */}
                          {localStorage.getItem('elocalpass-rebuy-email-config') && (
                            <div className="pt-2">
                        <Link href="/admin/qr-config/rebuy-config">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                                  Reconfigure Custom Template →
                          </button>
                        </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button5UserChoice === false}
                        onChange={() => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton5UserChoice(false)
                          
                          // Handle async operations separately to avoid blocking UI
                          const handleAsyncUpdate = async () => {
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button5SendRebuyEmail: false })
                              
                              // Also save to localStorage for immediate UI feedback
                              localStorage.setItem('elocalpass-button5-config', JSON.stringify({
                                choice: 'no',
                                timestamp: new Date().toISOString()
                              }))
                              
                              setConfiguredButtons((prev) => new Set(prev).add(5))
                              console.log('🔧 BUTTON 5: No selected - saved to database and marked as configured')
                              
                              // Clear interaction flag after a short delay
                              setTimeout(() => setUserIsInteracting(false), 500)
                            } catch (error) {
                              console.error('Error updating Button 5 config:', error)
                              setUserIsInteracting(false)
                            }
                          }
                          
                          handleAsyncUpdate()
                        }}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">No</span>
                        <p className="text-sm text-gray-600">No follow-up emails will be sent</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Button 6: Allow Future QR */}
              {activeButton === 6 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 6: Allow Future QR Creation?</h2>
                    <p className="text-gray-600 mt-1">Enable sellers to create QR codes in the future (only applies to DIRECT delivery method)</p>
            </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button6UserChoice === true}
                        onChange={() => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton6UserChoice(true)
                          
                          // Handle async operations separately to avoid blocking UI
                          const handleAsyncUpdate = async () => {
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button6AllowFutureQR: true })
                              
                              // Also save to localStorage for immediate UI feedback
                              localStorage.setItem('elocalpass-button6-config', JSON.stringify({
                                choice: 'yes',
                                timestamp: new Date().toISOString()
                              }))
                              
                              setConfiguredButtons((prev) => new Set(prev).add(6))
                              console.log('🔧 BUTTON 6: Yes selected - saved to database and marked as configured')
                              
                              // Clear interaction flag after a short delay
                              setTimeout(() => setUserIsInteracting(false), 500)
                            } catch (error) {
                              console.error('Error updating Button 6 config:', error)
                              setUserIsInteracting(false)
                            }
                          }
                          
                          handleAsyncUpdate()
                        }}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Yes</span>
                        <p className="text-sm text-gray-600">Sellers can create QR codes in the future. 
                          This only applies when delivery method is set to "DIRECT" (QR sent via email).
                        </p>
          </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={button6UserChoice === false}
                        onChange={() => {
                          // Set interaction flag to prevent detection from overriding
                          setUserIsInteracting(true)
                          
                          // Set user choice first for immediate UI feedback
                          setButton6UserChoice(false)
                          
                          // Handle async operations separately to avoid blocking UI
                          const handleAsyncUpdate = async () => {
                            try {
                              // Update database - this ensures cross-device compatibility
                              await updateConfig({ button6AllowFutureQR: false })
                              
                              // Also save to localStorage for immediate UI feedback
                              localStorage.setItem('elocalpass-button6-config', JSON.stringify({
                                choice: 'no',
                                timestamp: new Date().toISOString()
                              }))
                              
                              setConfiguredButtons((prev) => new Set(prev).add(6))
                              console.log('🔧 BUTTON 6: No selected - saved to database and marked as configured')
                              
                              // Clear interaction flag after a short delay
                              setTimeout(() => setUserIsInteracting(false), 500)
                            } catch (error) {
                              console.error('Error updating Button 6 config:', error)
                              setUserIsInteracting(false)
                            }
                          }
                          
                          handleAsyncUpdate()
                        }}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">No</span>
                        <p className="text-sm text-gray-600">Sellers cannot create QR codes in the future</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Master Configuration Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save QR Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="e.g., Premium Package, Basic Deal, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  placeholder="Brief description of this configuration..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600">
                  This will save your current 6-button configuration for reuse with any seller.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setNewConfigName('')
                  setNewConfigDescription('')
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNamedConfiguration}
                disabled={!newConfigName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Master Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Management Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingUrl ? 'Edit Temporary URL' : 'Add Temporary URL'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Name *
                </label>
                <input
                  type="text"
                  value={urlFormData.name}
                  onChange={(e) => setUrlFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Summer Promo, Weekend Special"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-gray-500">(Optional - can be added later)</span>
                </label>
                <input
                  type="url"
                  value={urlFormData.url}
                  onChange={(e) => setUrlFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/landing-page (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                                  <p className="text-xs text-gray-500 mt-1">
                    💡 Temporary URLs are only for this configuration session. They'll be saved when you save the complete configuration.
                  </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={urlFormData.description}
                  onChange={(e) => setUrlFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this temporary URL..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUrlModal(false)
                  setEditingUrl(null)
                  setUrlFormData({ name: '', url: '', description: '' })
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingUrl ? handleUpdateTempUrl : handleCreateTempUrl}
                disabled={!urlFormData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingUrl ? 'Update URL' : 'Add URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Library Modal */}
      {showConfigLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-900">QR Configuration Library</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowConfigLibrary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {savedConfigurations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Saved Configurations</h4>
                <p className="text-gray-600 mb-4">Complete all 6 button configurations and save them to see them here.</p>
                <button
                  onClick={() => setShowConfigLibrary(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search and Filter Controls */}
                {savedConfigurations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Configurations</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Clear Button */}
                      {(searchQuery || filterPricingType !== 'ALL' || filterDeliveryMethod !== 'ALL' || sortBy !== 'DATE_DESC') && (
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setFilterPricingType('ALL')
                            setFilterDeliveryMethod('ALL')
                            setSortBy('DATE_DESC')
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Pricing Type Filter */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
                        <select
                          value={filterPricingType}
                          onChange={(e) => setFilterPricingType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">All Pricing Types</option>
                          <option value="FREE">Free</option>
                          <option value="FIXED">Fixed Price</option>
                          <option value="VARIABLE">Variable Price</option>
                        </select>
                      </div>

                      {/* Delivery Method Filter */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                        <select
                          value={filterDeliveryMethod}
                          onChange={(e) => setFilterDeliveryMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">All Delivery Methods</option>
                          <option value="DIRECT">Direct</option>
                          <option value="URLS">URLs</option>
                          <option value="BOTH">Both</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DATE_DESC">Newest First</option>
                          <option value="DATE_ASC">Oldest First</option>
                          <option value="NAME_ASC">Name A-Z</option>
                          <option value="NAME_DESC">Name Z-A</option>
                        </select>
                      </div>
                    </div>

                    {/* Results Counter and Pagination Controls */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          Showing {startIndex + 1}-{Math.min(endIndex, totalConfigurations)} of {totalConfigurations} configurations
                          {totalConfigurations !== savedConfigurations.length && ` (filtered from ${savedConfigurations.length} total)`}
                        </span>
                        {searchQuery && (
                          <span className="text-blue-600">
                            Searching for: "{searchQuery}"
                          </span>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {totalConfigurations > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700">Items per page:</label>
                            <select
                              value={itemsPerPage}
                              onChange={(e) => setItemsPerPage(Number(e.target.value))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={20}>20</option>
                              <option value={25}>25</option>
                            </select>
                          </div>

                          {totalPages > 1 && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum
                                  if (totalPages <= 5) {
                                    pageNum = i + 1
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                  } else {
                                    pageNum = currentPage - 2 + i
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`px-3 py-1 border rounded text-sm ${
                                        currentPage === pageNum
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                })}
                              </div>
                              
                              <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                {filteredAndSortedConfigurations.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedConfigIds.size === filteredAndSortedConfigurations.length && filteredAndSortedConfigurations.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAllConfigurations()
                              } else {
                                clearAllSelections()
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {selectedConfigIds.size === 0 
                              ? 'Select All' 
                              : `${selectedConfigIds.size} selected`
                            }
                          </span>
                        </div>
                        
                        {selectedConfigIds.size > 0 && (
                          <button
                            onClick={clearAllSelections}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {selectedConfigIds.size > 0 && (
                          <button
                            onClick={bulkDeleteConfigurations}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete Selected ({selectedConfigIds.size})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {filteredAndSortedConfigurations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Matching Configurations</h4>
                    <p className="text-gray-600 mb-4">Try adjusting your search terms or filters to find configurations.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setFilterPricingType('ALL')
                        setFilterDeliveryMethod('ALL')
                        setSortBy('DATE_DESC')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div>
                    {filteredAndSortedConfigurations.map((config) => (
                      <div key={config.id} id={`config-${config.id}`} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                        {/* Compact Header */}
                        <div 
                          className={`flex items-center justify-between p-4 transition-colors ${
                            expandedConfigs.has(config.id) ? 'bg-blue-50 border-b border-blue-200' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedConfigIds.has(config.id)}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    toggleConfigSelection(config.id)
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div 
                                  className="cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                  onClick={() => toggleConfigExpanded(config.id)}
                                >
                                  <h4 className="font-semibold text-gray-900">{config.name}</h4>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Created {new Date(config.createdAt).toLocaleDateString()} • ID: {config.id}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">{config.description || 'No description'}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    showSellerSelectionModal(config)
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                >
                                  Pair with Seller
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteConfiguration(config.id)
                                  }}
                                  className="text-red-400 hover:text-red-600"
                                  title="Delete Configuration"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <div 
                                  className="text-gray-400 cursor-pointer hover:text-gray-600"
                                  onClick={() => toggleConfigExpanded(config.id)}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {expandedConfigs.has(config.id) ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    )}
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Configuration Grid */}
                        {expandedConfigs.has(config.id) && (
                          <div className="p-6 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              
                              {/* 1. Guest & Day Limits */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    1
                                  </div>
                                  <h5 className="font-semibold text-gray-900">Guest & Day Limits</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Guests:</strong> {config.config.button1GuestsLocked 
                                    ? `Fixed at ${config.config.button1GuestsDefault}`
                                    : `1-${config.config.button1GuestsRangeMax} Open`
                                  }</p>
                                  <p><strong>Days:</strong> {config.config.button1DaysLocked 
                                    ? `Fixed at ${config.config.button1DaysDefault}`
                                    : `1-${config.config.button1DaysRangeMax} Open`
                                  }</p>
                                </div>
                              </div>

                              {/* 2. Pricing */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    2
                                  </div>
                                  <h5 className="font-semibold text-gray-900">Pricing</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Type:</strong> {config.config.button2PricingType === 'FIXED' ? 'Fixed' : config.config.button2PricingType === 'VARIABLE' ? 'Variable' : 'Free'}</p>
                                  {config.config.button2PricingType === 'FIXED' && config.config.button2FixedPrice && (
                                    <>
                                      {config.config.button2IncludeTax ? (
                                        <>
                                          <p><strong>Price:</strong> ${config.config.button2FixedPrice} + ${(config.config.button2FixedPrice * (config.config.button2TaxPercentage / 100)).toFixed(2)} ({config.config.button2TaxPercentage}% tax)</p>
                                          <p><strong>Total:</strong> ${(config.config.button2FixedPrice * (1 + config.config.button2TaxPercentage / 100)).toFixed(2)}</p>
                                        </>
                                      ) : (
                                        <p><strong>Price:</strong> ${config.config.button2FixedPrice}</p>
                                      )}
                                    </>
                                  )}
                                  {config.config.button2PricingType === 'VARIABLE' && (
                                    <>
                                      <p><strong>Base Price:</strong> ${config.config.button2VariableBasePrice}</p>
                                      <p><strong>Per Guest:</strong> +${config.config.button2VariableGuestIncrease}</p>
                                      <p><strong>Per Day:</strong> +${config.config.button2VariableDayIncrease}</p>
                                      <p><strong>Commission:</strong> {config.config.button2VariableCommission}%</p>
                                      {config.config.button2IncludeTax && (
                                        <p><strong>Tax:</strong> +{config.config.button2TaxPercentage}% (added to final amount)</p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 3. QR Delivery */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    3
                                  </div>
                                  <h5 className="font-semibold text-gray-900">QR Delivery</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Method:</strong> {
                                    config.config.button3DeliveryMethod === 'DIRECT' ? 'Direct Download' :
                                    config.config.button3DeliveryMethod === 'URLS' ? 'Landing Pages' :
                                    config.config.button3DeliveryMethod === 'BOTH' ? 'Both Options' : 'Button Trigger'
                                  }</p>
                                  <p><strong>Available delivery options configured</strong></p>
                                  {/* Only show landing page info for URLS or BOTH delivery methods, NOT for DIRECT */}
                                  {(config.selectedUrlIds?.length > 0 || config.landingPageConfig?.temporaryUrls?.length > 0 || config.landingPageConfig) && config.config.button3DeliveryMethod !== 'DIRECT' && (
                                    <div className="mt-2 space-y-1">
                                      {/* Show selected URLs if available (new multi-URL system) */}
                                                                              {(config.selectedUrlIds?.length > 0 || config.landingPageConfig?.temporaryUrls?.length > 0) ? (
                                          <div>
                                            <p><strong>Landing Page{(config.selectedUrlIds?.length || config.landingPageConfig?.temporaryUrls?.length || 0) > 1 ? 's' : ''}:</strong></p>
                                            {/* Display URLs from selectedUrlIds (legacy) or temporaryUrls (new system) */}
                                            {(config.selectedUrlIds || config.landingPageConfig?.temporaryUrls || []).map((urlIdOrUrl: any, index) => {
                                              // Handle both legacy selectedUrlIds format and new temporaryUrls format
                                              const urlId = typeof urlIdOrUrl === 'string' ? urlIdOrUrl : urlIdOrUrl.id;
                                            // Find the URL details from SAVED CONFIGURATION DATA, not current session
                                            // PRIORITY: Always check the new structure first (landingPageConfig) as it gets updated on edits
                                            // Then fallback to legacy structure only if not found in new structure
                                            
                                            // DEBUG: Check both data sources separately
                                            const newStructureUrl = config.landingPageConfig?.temporaryUrls?.find((url: any) => url.id === urlId);
                                            const legacyStructureUrl = (config as any).button3UrlsConfig?.temporaryUrls?.find((url: any) => url.id === urlId);
                                            const urlDetails = newStructureUrl || legacyStructureUrl;
                                            
                                            // COMPREHENSIVE DEBUG LOGGING
                                            console.log('🔍 SERVER DATA RACE DEBUG:', {
                                              timestamp: new Date().toISOString(),
                                              urlId,
                                              configId: config.id,
                                              configUpdatedAt: config.updatedAt,
                                              
                                              // Data structure analysis
                                              newStructure: {
                                                exists: !!config.landingPageConfig?.temporaryUrls,
                                                count: config.landingPageConfig?.temporaryUrls?.length || 0,
                                                foundUrl: !!newStructureUrl,
                                                urlData: newStructureUrl ? {
                                                  id: newStructureUrl.id,
                                                  name: newStructureUrl.name,
                                                  url: newStructureUrl.url,
                                                  hasCustomizations: !!newStructureUrl.customizations
                                                } : null
                                              },
                                              
                                              legacyStructure: {
                                                exists: !!(config as any).button3UrlsConfig?.temporaryUrls,
                                                count: (config as any).button3UrlsConfig?.temporaryUrls?.length || 0,
                                                foundUrl: !!legacyStructureUrl,
                                                urlData: legacyStructureUrl ? {
                                                  id: legacyStructureUrl.id,
                                                  name: legacyStructureUrl.name,
                                                  url: legacyStructureUrl.url,
                                                  hasCustomizations: !!legacyStructureUrl.customizations
                                                } : null
                                              },
                                              
                                              // Final result
                                              finalResult: {
                                                found: !!urlDetails,
                                                dataSource: newStructureUrl ? 'NEW_STRUCTURE' : (legacyStructureUrl ? 'LEGACY_STRUCTURE' : 'NONE'),
                                                finalUrl: urlDetails?.url || 'NOT_FOUND',
                                                finalName: urlDetails?.name || 'NOT_FOUND'
                                              },
                                              
                                              // Data conflict detection
                                              dataConflict: !!(newStructureUrl && legacyStructureUrl && newStructureUrl.url !== legacyStructureUrl.url)
                                            });
                                            // Check for custom edits in the correct data structure (NEW structure first, then legacy)
                                            const urlEntry = config.landingPageConfig?.temporaryUrls?.find((url: any) => url.id === urlId);
                                            const hasCustomEdits = urlEntry?.customizations || (config as any).templates?.landingPage?.urlCustomContent?.[urlId];
                                            
                                            // Add cache-busting timestamp to prevent browser caching of edited content
                                            const cacheBreaker = config.updatedAt ? `&t=${new Date(config.updatedAt).getTime()}` : '';
                                            
                                            // CRITICAL FIX: Always use the saved configuration ID for database-saved URLs
                                            // Never use the potentially stale urlDetails.url which may contain session-based URLs
                                            const displayUrl = urlDetails 
                                              ? `/landing-enhanced/${config.id}?urlId=${urlId}${cacheBreaker}` 
                                              : '#';
                                            
                                            // Get the configuration name from the custom content (check new structure first, then legacy)
                                            const customConfigName = urlEntry?.customizations?.configurationName 
                                              || (config as any).templates?.landingPage?.urlCustomContent?.[urlId]?.configurationName 
                                              || null;
                                            
                                            // Display priority: 1. Custom config name, 2. URL name, 3. Fallback to URL number
                                            const displayName = customConfigName || urlDetails?.name || `URL ${index + 1}`;
                                            
                                            return (
                                              <div key={urlId} className="ml-4 mt-1 flex items-center justify-between">
                                                <a 
                                                  href={displayUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
                                                  onClick={(e) => {
                                                    // Simple click handler - let the href handle the navigation
                                                    // The cache-busting is already in the displayUrl
                                                  }}
                                                >
                                                  {displayName}
                                                </a>
                                                <button
                                                  onClick={() => {
                                                    // Load the latest URL-specific custom content for editing
                                                    if (urlDetails) {
                                                      let urlConfig;
                                                      
                                                      console.log('🎯 EDIT: Loading latest content for URL ID:', urlId);
                                                      console.log('🎯 EDIT: Config ID:', config.id);
                                                      
                                                      // Check if URL-specific custom content exists in the new structure
                                                      const urlEntry = config.landingPageConfig?.temporaryUrls?.find((url: any) => url.id === urlId);
                                                      const urlSpecificContent = urlEntry?.customizations;
                                                      console.log('🎯 EDIT: Found URL-specific content for', urlId, ':', urlSpecificContent ? 'YES' : 'NO');
                                                      console.log('🎯 EDIT: URL entry:', urlEntry);
                                                      console.log('🎯 EDIT: Customizations:', urlSpecificContent);
                                                      
                                                      if (urlSpecificContent) {
                                                        // Use the latest URL-specific custom content
                                                        urlConfig = {
                                                          landingConfig: {
                                                            ...urlSpecificContent,
                                                            configurationName: urlDetails.name,
                                                            landingUrl: urlDetails.url
                                                          }
                                                        };
                                                        console.log('🎯 EDIT: Using URL-specific custom content for', urlId);
                                                      } else {
                                                        // Create default config specific to this URL - DO NOT use shared config-level content
                                                        urlConfig = {
                                                          landingConfig: {
                                                            configurationName: urlDetails.name,
                                                            businessName: urlDetails.name,
                                                            landingUrl: urlDetails.url,
                                                            // Add default values for required fields
                                                            headerText: 'Welcome to Our Business',
                                                            headerTextColor: '#f97316',
                                                            headerFontFamily: 'Arial, sans-serif',
                                                            headerFontSize: '32',
                                                            descriptionText: 'Thanks you very much for giving yourself the opportunity to discover the benefits of the club. To receive your 7-day full access gift to eLocalPass, simply fill out the fields below and you will receive your free eLocalPass via email.',
                                                            descriptionTextColor: '#1e40af',
                                                            descriptionFontFamily: 'Arial, sans-serif',
                                                            descriptionFontSize: '18',
                                                            ctaButtonText: 'GET YOUR ELOCALPASS NOW',
                                                            ctaButtonTextColor: '#ffffff',
                                                            ctaButtonFontFamily: 'Arial, sans-serif',
                                                            ctaButtonFontSize: '18'
                                                          }
                                                        };
                                                        console.log('🎯 EDIT: Using fresh default config for', urlId, '- no URL-specific content found');
                                                      }
                                                      
                                                      localStorage.setItem('elocalpass-qr-config', JSON.stringify(config.config))
                                                      localStorage.setItem('elocalpass-landing-config', JSON.stringify(urlConfig))
                                                      console.log('🐛 DEBUG: Loading URL template for edit:', urlConfig)
                                                    }
                                                    // Navigate to create page in EDIT mode to load the template for this URL
                                                    window.open(`/admin/qr-config/create?mode=edit&qrId=${config.id}&urlId=${urlId}`, '_blank')
                                                  }}
                                                  className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-2 text-sm"
                                                >
                                                  Edit
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        /* Show legacy single landing page (old system) */
                                        config.landingPageConfig && (
                                          <div>
                                            <p><strong>Landing Page:</strong> 
                                              <a 
                                                href={config.landingPageConfig.landingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
                                              >
                                                {config.landingPageConfig.landingUrl}
                                              </a>
                                            </p>
                                            <p><strong>Template:</strong> 
                                              <button 
                                                onClick={() => {
                                                  // First, restore this configuration's landing page data to localStorage
                                                  if (config.landingPageConfig) {
                                                    localStorage.setItem('elocalpass-landing-config', JSON.stringify(config.landingPageConfig))
                                                  }
                                                  // Then navigate to create page in EDIT mode to load the template
                                                  window.open('/admin/qr-config/create?mode=edit', '_blank')
                                                }}
                                                className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                              >
                                                Edit
                                              </button>
                                            </p>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 4. Welcome Email */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    4
                                  </div>
                                  <h5 className="font-semibold text-gray-900">Welcome Email</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Enabled:</strong> {config.config.button4LandingPageRequired !== undefined ? (config.config.button4LandingPageRequired ? "Yes (Custom)" : "Yes (Default)") : "Not Configured"}</p>
                                  {config.config.button4LandingPageRequired && (
                                    <>
                                      <div className="flex items-center">
                                        <span className="text-green-600">✓</span>
                                        <span>{config.emailTemplates?.welcomeEmail ? 'Custom template configured' : 'Default template'}</span>
                                      </div>
                                      {config.emailTemplates?.welcomeEmail && (
                                        <div className="mt-2 space-y-1">
                                          <p><strong>Template:</strong> 
                                            <button 
                                              onClick={() => {
                                                // First, restore this configuration's template data to localStorage
                                                if (config.emailTemplates?.welcomeEmail) {
                                                  localStorage.setItem('elocalpass-welcome-email-config', JSON.stringify(config.emailTemplates.welcomeEmail))
                                                }
                                                // Then navigate to email-config page in EDIT mode to load the template
                                                window.open(`/admin/qr-config/email-config?mode=edit&qrId=${config.id}`, '_blank')
                                              }}
                                              className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                            >
                                              Welcome Email Template - {new Date(config.createdAt).toLocaleDateString()}
                                            </button>
                                          </p>
                                          <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 5. Rebuy Email */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    5
                                  </div>
                                  <h5 className="font-semibold text-gray-900">Rebuy Email</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Enabled:</strong> {config.config.button5SendRebuyEmail ? "Yes" : "No"}</p>
                                  {config.config.button5SendRebuyEmail && (
                                    <>
                                      <div className="flex items-center">
                                        <span className="text-green-600">✓</span>
                                        <span>
                                          {config.emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE' 
                                            ? 'Default template used' 
                                            : config.emailTemplates?.rebuyEmail 
                                            ? 'Custom template configured' 
                                            : 'Default template'}
                                        </span>
                                      </div>
                                      {config.emailTemplates?.rebuyEmail && config.emailTemplates.rebuyEmail.customHTML !== 'USE_DEFAULT_TEMPLATE' && (
                                        <div className="mt-2 space-y-1">
                                          <p><strong>Template:</strong> 
                                            <button 
                                              onClick={() => {
                                                // First, restore this configuration's rebuy template data to localStorage
                                                if (config.emailTemplates?.rebuyEmail) {
                                                  localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(config.emailTemplates.rebuyEmail))
                                                }
                                                // Then navigate to rebuy-config page in EDIT mode to load the template
                                                window.open(`/admin/qr-config/rebuy-config?mode=edit&qrId=${config.id}`, '_blank')
                                              }}
                                              className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                            >
                                              Rebuy Email Template - {new Date(config.createdAt).toLocaleDateString()}
                                            </button>
                                          </p>
                                          <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                        </div>
                                      )}
                                      {config.emailTemplates?.rebuyEmail?.customHTML === 'USE_DEFAULT_TEMPLATE' && (
                                        <div className="mt-2 space-y-1">
                                          <p><strong>Template:</strong> 
                                            <button 
                                              onClick={() => {
                                                // Create a temporary config for viewing the default template
                                                const defaultTemplateConfig = {
                                                  id: 'default-template-view',
                                                  name: 'Default Rebuy Template (Preview)',
                                                  customHTML: 'USE_DEFAULT_TEMPLATE',
                                                  rebuyConfig: {
                                                    emailSubject: 'Your ELocalPass Expires Soon - Don\'t Miss Out!',
                                                    emailHeader: 'Don\'t Miss Out!',
                                                    emailMessage: 'Your eLocalPass expires soon. Renew now with an exclusive discount!',
                                                    emailCta: 'Get Another ELocalPass',
                                                    emailFooter: 'Thank you for choosing ELocalPass!',
                                                    enableDiscountCode: true,
                                                    discountValue: 15,
                                                    discountType: 'percentage'
                                                  },
                                                  createdAt: new Date(),
                                                  isActive: true
                                                }
                                                
                                                // Store in localStorage for the preview page
                                                localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(defaultTemplateConfig))
                                                
                                                // Navigate to rebuy-config page in VIEW mode to preview the default template
                                                window.open(`/admin/qr-config/rebuy-config?mode=view&template=default`, '_blank')
                                              }}
                                              className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                            >
                                              Default Rebuy Email Template - {new Date(config.createdAt).toLocaleDateString()}
                                            </button>
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            <strong>Type:</strong> System default template
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 6. Future QR */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    6
                                  </div>
                                  <h5 className="font-semibold text-gray-900">Future QR</h5>
                                </div>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p><strong>Enabled:</strong> {config.config.button6AllowFutureQR ? "Yes" : "No"}</p>
                                  <p><strong>Description:</strong> {config.config.button6AllowFutureQR 
                                    ? "Customers can access future QR codes for upcoming bookings"
                                    : "Future QR code access is disabled for this configuration"
                                  }</p>
                                </div>
                              </div>

                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => {
                                    // Clone this configuration into the main form
                                    updateConfig(config.config)
                                    
                                    // Restore selected URLs for multi-URL support
                                    if (config.selectedUrlIds?.length > 0) {
                                      setSelectedUrlIds(config.selectedUrlIds)
                                    }
                                    
                                    // Restore email templates to localStorage for editing
                                    if (config.emailTemplates?.welcomeEmail) {
                                      localStorage.setItem('elocalpass-welcome-email-config', JSON.stringify(config.emailTemplates.welcomeEmail))
                                    }
                                    if (config.emailTemplates?.rebuyEmail) {
                                      localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(config.emailTemplates.rebuyEmail))
                                    }
                                    
                                    setShowConfigLibrary(false)
                                    toast.success('Configuration Cloned', `"${config.name}" has been cloned. Make your changes and save as a new configuration.`)
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                  🔄 Clone Configuration
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Selection Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Configuration to Seller</h3>
            
            {selectedConfig && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Configuration:</strong> {selectedConfig.name}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {loadingSellers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading sellers...</p>
                </div>
              ) : availableSellers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No unassigned sellers available</p>
                  <p className="text-xs text-gray-400 mt-1">All active sellers already have QR configurations assigned</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Sellers (Unassigned)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableSellers.map((seller) => (
                      <div
                        key={seller.id}
                        className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => assignConfigToSeller(seller.email)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{seller.name || 'Unnamed Seller'}</p>
                          <p className="text-sm text-gray-500">{seller.email}</p>
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            assignConfigToSeller(seller.email)
                          }}
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSellerModal(false)
                  setSelectedConfig(null)
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Progress Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Clear All Progress</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                This will permanently clear all current progress and reset the configuration to default values. This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>What will be cleared:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                  <li>All button configurations</li>
                  <li>Temporary URLs</li>
                  <li>Email templates</li>
                  <li>Landing page configurations</li>
                  <li>Database settings reset to defaults</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Selected Configurations</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete {selectedConfigIds.size} selected configuration{selectedConfigIds.size > 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>This will permanently:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  <li>Delete the selected configurations from the database</li>
                  <li>Unassign any sellers currently using these configurations</li>
                  <li>Remove all associated templates and settings</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleteLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {bulkDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedConfigIds.size} Configuration${selectedConfigIds.size > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {showSingleDeleteModal && singleDeleteConfigId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Configuration</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the configuration "{savedConfigurations.find(c => c.id === singleDeleteConfigId)?.name}"? This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>This will permanently:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  <li>Delete the configuration from the database</li>
                  <li>Unassign any sellers currently using this configuration</li>
                  <li>Remove all associated templates and settings</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSingleDeleteModal(false)
                  setSingleDeleteConfigId(null)
                }}
                disabled={singleDeleteLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSingleDelete}
                disabled={singleDeleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {singleDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Configuration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastNotifications 
        notifications={toast.notifications} 
        onRemove={toast.removeToast} 
      />
    </ProtectedRoute>
  )
}

export default function QRConfigPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <QRConfigPageContent />
    </Suspense>
  )
}

