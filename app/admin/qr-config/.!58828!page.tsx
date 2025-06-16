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
    button2PricingType: 'FIXED',
    button2FixedPrice: 0,
    button2VariableBasePrice: 0,
    button2VariableGuestIncrease: 0,
    button2VariableDayIncrease: 0,
    button2VariableCommission: 0,
    button2IncludeTax: false,
    button2TaxPercentage: 0,
    button3DeliveryMethod: 'DIRECT',
    button4LandingPageRequired: false,
    button5SendRebuyEmail: false,
    updatedAt: new Date()
  })

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
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)

  // Search and filter states for QR Configuration Library
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPricingType, setFilterPricingType] = useState('ALL')
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState('ALL')
  const [sortBy, setSortBy] = useState('DATE_DESC')

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
    url: string | null
    description?: string | null
    isActive?: boolean
    createdAt?: string
    isTemp?: boolean
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

  // Clear current progress and return to starting point
  const clearProgress = async () => {
    setShowClearConfirmModal(true)
  }

  // EMERGENCY CLEANUP: Clear leftover URLs from previous sessions
  const clearLeftoverUrls = () => {
    console.log('🧹 EMERGENCY CLEANUP: Clearing leftover URLs from previous sessions')
    setSellerUrls([])
    setSelectedUrlIds([])
    localStorage.removeItem('elocalpass-button3-urls')
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
        
        // Button 4 defaults
        button4LandingPageRequired: false,
        
        // Button 5 defaults
        button5SendRebuyEmail: false,
        
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
      localStorage.removeItem('elocalpass-button1-config')
      localStorage.removeItem('elocalpass-button2-config')
      localStorage.removeItem('elocalpass-button3-config')
      localStorage.removeItem('elocalpass-button3-urls')
      localStorage.removeItem('elocalpass-new-temp-urls')
      localStorage.removeItem('elocalpass-new-temp-url')
      
      // STEP 4: Reset visual states to starting point
      setGlobalConfig(defaultConfig)
      setConfiguredButtons(new Set())
      setSelectedUrlIds([])
      setSellerUrls([]) // Clear temporary URLs
      setActiveButton(1)
      setSaveStatus('')
      setProgressRestored(false)
      
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

  const loadSavedConfigurations = async () => {
    try {
      console.log('🔄 Loading configurations from database first...')
      
      // PRIORITY 1: Load from DATABASE (where proper data is saved)
      const dbResponse = await fetch('/api/admin/saved-configs', {
        credentials: 'include'
      })
      
      if (dbResponse.ok) {
        const dbConfigs = await dbResponse.json()
        console.log('✅ Loaded', dbConfigs.length, 'configurations from database')
        console.log('🔍 Database configs:', dbConfigs)
        
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
            setConfiguredButtons(prev => new Set(prev).add(3)) // Mark button 3 as configured
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

  // Check if all 5 buttons are configured
  const areAllButtonsConfigured = (): boolean => {
    return configuredButtons.size === 5
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
    
    // Check Button 1 (Personalization) - mark as configured only if explicitly configured by user
    const hasButton1Config = configuredButtons.has(1) || globalConfig.button1AllowCustomGuestsDays !== false || globalConfig.button1GuestsDefault !== 2 || globalConfig.button1DaysDefault !== 3 || globalConfig.button1GuestsRangeMax !== 10 || globalConfig.button1DaysRangeMax !== 30
    console.log('- Button 1 detection:', { hasButton1Config, inConfiguredButtons: configuredButtons.has(1) })
    if (hasButton1Config) {
      configuredButtonsSet.add(1)
    }
    
    // Check Button 2 (Pricing) - mark as configured only if explicitly configured by user
    const hasButton2Config = configuredButtons.has(2) || (globalConfig.button2PricingType === 'FIXED' && (globalConfig.button2FixedPrice || 0) > 0) || (globalConfig.button2PricingType === 'VARIABLE' && (globalConfig.button2VariableBasePrice > 0 || globalConfig.button2VariableGuestIncrease > 0 || globalConfig.button2VariableDayIncrease > 0 || globalConfig.button2VariableCommission > 0)) || globalConfig.button2PricingType === 'FREE' || globalConfig.button2IncludeTax === true || globalConfig.button2TaxPercentage > 0
    console.log('- Button 2 detection:', { 
      hasButton2Config, 
      pricingType: globalConfig.button2PricingType,
      fixedPrice: globalConfig.button2FixedPrice,
      includeTax: globalConfig.button2IncludeTax,
      inConfiguredButtons: configuredButtons.has(2) 
    })
    if (hasButton2Config) {
    const hasButton3Config = configuredButtons.has(3) || globalConfig.button3DeliveryMethod !== 'DIRECT'
    }
    
    // Check Button 3 (Delivery Method) - mark as configured only if explicitly configured by user
    const hasButton3Config = configuredButtons.has(3)
    console.log('- Button 3 detection:', { hasButton3Config, deliveryMethod: globalConfig.button3DeliveryMethod, tempUrlsCount: sellerUrls.filter(url => url.isTemp).length, inConfiguredButtons: configuredButtons.has(3) })
    if (hasButton3Config) {
    const hasButton4Config = configuredButtons.has(4) || globalConfig.button4LandingPageRequired === true
    }
    
    // Check Button 4 (Welcome Email) - mark as configured only if explicitly configured by user
    const hasButton4Config = configuredButtons.has(4)
    console.log('- Button 4 detection:', { hasButton4Config, button4Required: globalConfig.button4LandingPageRequired, inConfiguredButtons: configuredButtons.has(4) })
    if (hasButton4Config) {
    const hasButton5Config = configuredButtons.has(5) || globalConfig.button5SendRebuyEmail === true
    }
    
    // Check Button 5 (Rebuy Email) - mark as configured only if explicitly configured by user
    const hasButton5Config = configuredButtons.has(5)
    console.log('- Button 5 detection:', { hasButton5Config, rebuyEnabled: globalConfig.button5SendRebuyEmail, inConfiguredButtons: configuredButtons.has(5) })
    if (hasButton5Config) {
      configuredButtonsSet.add(5)
    }
    
    console.log('🎯 DETECTION: Final configuredButtonsSet:', Array.from(configuredButtonsSet))
    
    // Only update if something changed
    if (configuredButtonsSet.size !== configuredButtons.size || 
        !Array.from(configuredButtonsSet).every(btn => configuredButtons.has(btn))) {
      console.log('🔄 DETECTION: Updating configuredButtons state')
      setConfiguredButtons(configuredButtonsSet)
    }
  }, [globalConfig, sellerUrls]) // Run when these change

  // Save current configuration with a name
  const saveNamedConfiguration = async () => {
    if (!areAllButtonsConfigured()) {
      toast.error('Configuration Incomplete', 'Please complete all 5 button configurations before saving')
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
    
    const landingPageData = {
      temporaryUrls: temporaryUrls,
      selectedUrlIds: selectedUrlIdsFromStorage,
      urlMappings: {} as any
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
    
    setNewConfigName('')
    setNewConfigDescription('')
    setShowSaveModal(false)
    
    // Clear all temporary data and reset to fresh state
    console.log('🧹 CLEANUP: Starting post-save cleanup...')
    
    // Clear temporary URLs
    setSellerUrls([])
    setSelectedUrlIds([])
    
    // Keep Button #3 configured and set as active to stay on current view
    // Keep all currently configured buttons (don't clear them after saving)
    setActiveButton(3) // Keep Button #3 active to stay on the current view
    
    // Clear current progress
    localStorage.removeItem('elocalpass-current-qr-progress')
    
    // Clear temporary templates and button configurations
    localStorage.removeItem('elocalpass-button1-config') // Clear Button 1 localStorage
    localStorage.removeItem('elocalpass-button2-config') // Clear Button 2 localStorage
    localStorage.removeItem('elocalpass-button3-config') // Clear Button 3 delivery method
    localStorage.removeItem('elocalpass-button3-urls') // Clear Button 3 URL data
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
      button4LandingPageRequired: false,
      button5SendRebuyEmail: false,
      updatedAt: new Date()
    }
    
    setGlobalConfig(defaultConfig)
    
    console.log('✅ CLEANUP: All temporary data cleared, ready for next configuration')
    
    toast.success('Configuration Saved!', `Configuration "${newConfig.name}" saved successfully! Ready for next configuration.`)
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
    
    // Mark Button 3 as configured
    setConfiguredButtons((prev) => new Set(prev).add(3))
    
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
                          <div className="text-green-600 text-xs mt-1 font-medium">✓ Saved</div>
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
                        Create temporary URLs below for this configuration session - they will be saved when you save the complete configuration.
                      </p>
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-800">
                          <strong>Note:</strong> URLs created here are temporary and only exist during this configuration session. 
                          They will be permanently saved only when you save the complete 5-button configuration.
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/admin/qr-config/create?sessionId=${currentSessionId}`)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
