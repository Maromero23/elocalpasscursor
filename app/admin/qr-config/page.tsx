'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Building2, Users, MapPin, QrCode, Settings, Eye, Plus, Edit3, Palette, Save, Clock, Monitor, Mail, EyeOff, Trash2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ToastNotifications } from '@/components/toast-notification'
import { useToast } from '@/hooks/use-toast'
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
    createdAt: Date;
  }>>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showConfigLibrary, setShowConfigLibrary] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDescription, setNewConfigDescription] = useState('')
  const [progressRestored, setProgressRestored] = useState(false)

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

  // Helper function to check if a button configuration has been actively modified
  const isButtonConfigured = (buttonNum: number): boolean => {
    return Array.from(configuredButtons).includes(buttonNum)
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
    
    // Clear saved templates and configurations
    localStorage.removeItem('elocalpass-welcome-email-config')
    localStorage.removeItem('elocalpass-rebuy-email-config')
    localStorage.removeItem('elocalpass-landing-config')
    localStorage.removeItem('elocalpass-qr-config-progress')
    localStorage.removeItem('elocalpass-saved-configurations')
    
    // Clear all configured button states so they return to original colors
    setConfiguredButtons(new Set())
    setSaveStatus('🔄 Reset to defaults - All configurations cleared and values reset')
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
    
    // Auto-save the configuration
    setIsAutoSaving(true)
    setSaveStatus('Auto-saving...')
    
    try {
      const response = await fetch('/api/admin/qr-global-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      })

      if (response.ok) {
        setSaveStatus('✅ Auto-saved successfully')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setSaveStatus('❌ Auto-save failed')
        setTimeout(() => setSaveStatus(''), 3000)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('❌ Auto-save error')
      setTimeout(() => setSaveStatus(''), 3000)
    } finally {
      setIsAutoSaving(false)
    }
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
          // Single global config object
          apiConfigs = [{
            id: data.id || 'global-config',
            name: `Global Config ${data.id?.slice(-8) || 'API'}`,
            description: 'Global configuration from API',
            config: data,
            createdAt: new Date(data.updatedAt || Date.now()),
            source: 'api'
          }]
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

  // Load current progress
  const loadCurrentProgress = () => {
    const savedProgress = localStorage.getItem('elocalpass-current-qr-progress')
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress)
        // Only restore if the progress is recent (within last 24 hours)
        const savedTime = new Date(progressData.timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setGlobalConfig(progressData.globalConfig)
          setConfiguredButtons(new Set(progressData.configuredButtons))
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
        }
      } catch (error) {
        console.log('Could not restore previous progress:', error)
        localStorage.removeItem('elocalpass-current-qr-progress')
      }
    }
    
    // Check if Button 4 welcome email configuration exists
    const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
    if (welcomeEmailConfig) {
      try {
        const emailConfig = JSON.parse(welcomeEmailConfig)
        if (emailConfig.isActive) {
          setConfiguredButtons((prev) => new Set(prev).add(4))
          console.log('✅ Found existing welcome email configuration for Button 4')
        }
      } catch (error) {
        console.log('Could not load welcome email configuration:', error)
      }
    }
    
    // Check if Button 5 rebuy email configuration exists
    const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
    if (rebuyEmailConfig) {
      try {
        const emailConfig = JSON.parse(rebuyEmailConfig)
        if (emailConfig.isActive) {
          setConfiguredButtons((prev) => new Set(prev).add(5))
          console.log('✅ Found existing rebuy email configuration for Button 5')
        }
      } catch (error) {
        console.log('Could not load rebuy email configuration:', error)
      }
    }
  }

  // Check if all 5 buttons are configured
  const isConfigurationComplete = (): boolean => {
    return configuredButtons.size === 5
  }

  // Save current configuration with a name
  const saveNamedConfiguration = () => {
    if (!isConfigurationComplete()) {
      toast.error('Configuration Incomplete', 'Please complete all 5 button configurations before saving')
      return
    }

    if (!newConfigName.trim()) {
      toast.error('Missing Information', 'Please enter a configuration name')
      return
    }

    const newConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      description: newConfigDescription.trim() || 'No description provided',
      config: { ...globalConfig },
      createdAt: new Date()
    }
    
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
      const updatedConfigs = savedConfigurations.filter(config => config.id !== configId)
      setSavedConfigurations(updatedConfigs)
      
      try {
        localStorage.setItem('elocalpass-saved-configurations', JSON.stringify(updatedConfigs))
        console.log('✅ Configuration deleted from localStorage successfully')
        toast.success('Configuration Deleted', 'Configuration deleted successfully!')
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
    
    try {
      const response = await fetch('/api/admin/assign-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sellerEmail: sellerEmail,
          configData: selectedConfig.config  // Fixed: changed from 'configuration' to 'configData'
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

  // Auto-save current progress to localStorage
  useEffect(() => {
    const saveCurrentProgress = () => {
      const progressData = {
        globalConfig,
        configuredButtons: Array.from(configuredButtons),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('elocalpass-current-qr-progress', JSON.stringify(progressData))
    }

    // Save progress whenever globalConfig or configuredButtons changes
    const timeoutId = setTimeout(saveCurrentProgress, 500) // Debounce saves
    return () => clearTimeout(timeoutId)
  }, [globalConfig, configuredButtons])

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
                  { num: 1, title: "Personalized?" },
                  { num: 2, title: "Pricing Type" },
                  { num: 3, title: "Send Method" },
                  { num: 4, title: "Welcome Email" },
                  { num: 5, title: "Rebuy Email?" }
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
                      isConfigurationComplete() 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {configuredButtons.size}/5 Complete
                    </span>
                    {isConfigurationComplete() && (
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        💾 Save Configuration
                      </button>
                    )}
                    <button
                      onClick={() => setShowConfigLibrary(true)}
                      className="text-xs px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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
                      value: globalConfig.button1AllowCustomGuestsDays 
                        ? `Yes: Max ${globalConfig.button1MaxGuests} guests, ${globalConfig.button1MaxDays} days`
                        : `No: Default ${globalConfig.button1DefaultGuests} guests, ${globalConfig.button1DefaultDays} days`
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
                      title: "Send Method", 
                      value: globalConfig.button3DeliveryMethod === 'DIRECT' 
                        ? "Direct: QR sent via email"
                        : globalConfig.button3DeliveryMethod === 'URLS'
                        ? "URLs: Landing page links"
                        : "Both: Direct and URLs"
                    },
                    { 
                      num: 4, 
                      title: "Welcome Email", 
                      value: globalConfig.button4LandingPageRequired ? "Custom Template" : "Default Template" 
                    },
                    { 
                      num: 5, 
                      title: "Rebuy Email?", 
                      value: globalConfig.button5SendRebuyEmail ? "Yes: 12hrs before expiry" : "No follow-up" 
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
                            updateConfig({ button2FixedPrice: parseFloat(e.target.value) || 0 })
                            setConfiguredButtons((prev) => new Set(prev).add(2))
                          }}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                updateConfig({ button2VariableBasePrice: parseFloat(e.target.value) || 0 })
                                setConfiguredButtons((prev) => new Set(prev).add(2))
                              }}
                              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                  updateConfig({ button2VariableGuestIncrease: parseFloat(e.target.value) || 0 })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                  updateConfig({ button2VariableDayIncrease: parseFloat(e.target.value) || 0 })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                  updateConfig({ button2VariableCommission: parseFloat(e.target.value) || 0 })
                                  setConfiguredButtons((prev) => new Set(prev).add(2))
                                }}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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

              {/* Button 3: Send Method */}
              {activeButton === 3 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h2 className="text-xl font-semibold text-gray-900">Button 3: Delivery Method</h2>
                    <p className="text-gray-600 mt-1">Choose how QR codes are delivered to guests</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <button 
                        onClick={() => router.push('/admin/qr-config/create')}
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
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Direct Option</h5>
                          <p className="text-xs text-gray-600">Instant QR generation with email delivery</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">URL Option</h5>
                          <p className="text-xs text-gray-600">Custom landing page with guest details form</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push('/admin/qr-config/create')}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        Create Custom Landing Page →
                      </button>
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
                        checked={globalConfig.button4LandingPageRequired === true}
                        onChange={() => {
                          updateConfig({ button4LandingPageRequired: true })
                          setConfiguredButtons((prev) => new Set(prev).add(4))
                        }}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Custom Template</span>
                        <p className="text-sm text-gray-600">Use seller-specific template with custom branding, messages, and promotions</p>
                      </div>
                    </label>

                    {/* Custom Template Features - Show immediately when Custom Template is selected */}
                    {globalConfig.button4LandingPageRequired && (
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
                                    <div className="flex space-x-2">
                                      <button 
                                        onClick={() => router.push('/admin/qr-config/email-config?mode=edit')}
                                        className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                      >
                                        Edit Template
                                      </button>
                                      <button 
                                        onClick={() => {
                                          localStorage.removeItem('elocalpass-welcome-email-config')
                                          setConfiguredButtons((prev) => {
                                            const newSet = new Set(prev)
                                            newSet.delete(4)
                                            return newSet
                                          })
                                          window.location.reload()
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                      >
                                        Delete Template
                                      </button>
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
                              onClick={() => router.push('/admin/qr-config/email-config?mode=custom')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
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
                        checked={globalConfig.button4LandingPageRequired === false}
                        onChange={() => {
                          updateConfig({ button4LandingPageRequired: false })
                          setConfiguredButtons((prev) => new Set(prev).add(4))
                        }}
                        className="mt-1 h-4 w-4 text-purple-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Default Template</span>
                        <p className="text-sm text-gray-600">Use standard ELocalPass template (same for all sellers)</p>
                      </div>
                    </label>

                    {/* Default Template Button - Show when Default Template is selected */}
                    {!globalConfig.button4LandingPageRequired && (
                      <div className="ml-7 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <button 
                          onClick={() => router.push('/admin/qr-config/email-config?mode=default')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          View Default Email Template →
                        </button>
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
                        checked={globalConfig.button5SendRebuyEmail === true}
                        onChange={() => {
                          updateConfig({ button5SendRebuyEmail: true })
                          setConfiguredButtons((prev) => new Set(prev).add(5))
                        }}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Yes</span>
                        <p className="text-sm text-gray-600">System will automatically send a follow-up email 12 hours before QR expires</p>
                      </div>
                    </label>

                    {globalConfig.button5SendRebuyEmail && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Rebuy Email System</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          When enabled, the system will automatically send a follow-up email 12 hours before each QR code expires, 
                          encouraging guests to purchase a new QR code for continued access.
                        </p>
                        
                        {/* Check for existing rebuy email template */}
                        {(() => {
                          const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
                          if (rebuyEmailConfig) {
                            try {
                              const rebuy = JSON.parse(rebuyEmailConfig)
                              return (
                                <div>
                                  <div className="text-green-600">✓ Custom template configured</div>
                                  <div className="mt-1">
                                    <span className="font-medium text-gray-900">Template:</span> <span className="text-gray-900">{rebuy.name}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">Created:</span> <span className="text-gray-900">{new Date(rebuy.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="mt-1">
                                    <a 
                                      href="/admin/qr-config/rebuy-config?mode=edit" 
                                      target="_blank"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      📝 Edit Template
                                    </a>
                                  </div>
                                </div>
                              )
                            } catch {
                              return <div className="text-gray-900">Default template</div>
                            }
                          }
                          return <div className="text-gray-900">Default template</div>
                        })()}
                        
                        <Link href="/admin/qr-config/rebuy-config">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                            {localStorage.getItem('elocalpass-rebuy-email-config') ? 'Reconfigure' : 'Configure'} Rebuy Email →
                          </button>
                        </Link>
                      </div>
                    )}

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={globalConfig.button5SendRebuyEmail === false}
                        onChange={() => {
                          updateConfig({ button5SendRebuyEmail: false })
                          setConfiguredButtons((prev) => new Set(prev).add(5))
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
            </div>
          </div>
        </div>
      </div>

      {/* Save Configuration Modal */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600">
                  This will save your current 5-button configuration for reuse with any seller.
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
                Save Configuration
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
                {/* Export/Import Buttons */}
                <button
                  onClick={exportConfigurations}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                  title="Export configurations to file"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l3-3m0 0l3 3m-3-3v8m-13-5a9 9 0 110 18 9 9 0 010-18z" />
                  </svg>
                  Export
                </button>
                
                <label className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l3-3m0 0l3 3m-3-3v8m13-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfigurations}
                    className="hidden"
                  />
                </label>

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
                <p className="text-gray-600 mb-4">Complete all 5 button configurations and save them to see them here.</p>
                <button
                  onClick={() => setShowConfigLibrary(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedConfigurations.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    {/* Compact Header */}
                    <div 
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        expandedConfigs.has(config.id) ? 'bg-blue-50 border-b border-blue-200' : ''
                      }`}
                      onClick={() => toggleConfigExpanded(config.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 text-lg">{config.name}</h4>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                showSellerSelectionModal(config)
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Assign to Seller
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
                            <div className="text-gray-400">
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
                        <div className="text-sm text-gray-500 mt-1">
                          Created {new Date(config.createdAt).toLocaleDateString()} • ID: {config.id}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{config.description || 'No description'}</div>
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
                              {!config.config.button1GuestsLocked ? (
                                <>
                                  <p><strong>Guests:</strong> 1-{config.config.button1GuestsRangeMax} (default: {config.config.button1GuestsDefault})</p>
                                  <p><strong>Days:</strong> {!config.config.button1DaysLocked ? `1-${config.config.button1DaysRangeMax} (default: ${config.config.button1DaysDefault})` : `Fixed at ${config.config.button1DaysDefault}`}</p>
                                </>
                              ) : (
                                <>
                                  <p><strong>Guests:</strong> Fixed at {config.config.button1GuestsDefault}</p>
                                  <p><strong>Days:</strong> Fixed at {config.config.button1DaysDefault}</p>
                                </>
                              )}
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
                                <p><strong>Price:</strong> ${config.config.button2FixedPrice}</p>
                              )}
                              {config.config.button2PricingType === 'VARIABLE' && (
                                <>
                                  <p><strong>Base Price:</strong> ${config.config.button2VariableBasePrice}</p>
                                  <p><strong>Per Guest:</strong> +${config.config.button2VariableGuestIncrease}</p>
                                  <p><strong>Per Day:</strong> +${config.config.button2VariableDayIncrease}</p>
                                  <p><strong>Commission:</strong> {config.config.button2VariableCommission}%</p>
                                </>
                              )}
                              {config.config.button2IncludeTax && (
                                <p><strong>Tax:</strong> {config.config.button2TaxPercentage}% included</p>
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
                                'Button Trigger'
                              }</p>
                              <p><strong>Available delivery options configured</strong></p>
                            </div>
                          </div>

                          {/* 4. Landing Page */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center mb-3">
                              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                4
                              </div>
                              <h5 className="font-semibold text-gray-900">Landing Page</h5>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <p><strong>Required:</strong> {config.config.button4LandingPageRequired ? 'Yes' : 'No'}</p>
                              {config.config.button4LandingPageRequired && (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-green-600 mr-1">✓</span>
                                    <span>Landing page configured</span>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p><strong>Template:</strong> <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">Custom Landing Page - {new Date(config.createdAt).toLocaleDateString()}</span></p>
                                    <p className="text-xs">
                                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">📝 Edit Template</span>
                                    </p>
                                  </div>
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
                              <p><strong>Enabled:</strong> {config.config.button5SendRebuyEmail ? 'Yes' : 'No'}</p>
                              {config.config.button5SendRebuyEmail && (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-green-600 mr-1">✓</span>
                                    <span>Custom template configured</span>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    <p><strong>Template:</strong> <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">Rebuy Email Template - {new Date(config.createdAt).toLocaleDateString()}</span></p>
                                    <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                    <p className="text-xs">
                                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer underline">📝 Edit Template</span>
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Configuration Summary */}
                        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                          <h5 className="font-semibold text-gray-900 mb-3">Configuration Summary</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Source</p>
                              <p className="font-medium">Global (API)</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Created</p>
                              <p className="font-medium">{new Date(config.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">ID</p>
                              <p className="font-medium text-xs">{config.id}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Description</p>
                              <p className="font-medium">{config.description || 'No description'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                // Load this configuration into the main form
                                updateConfig(config.config)
                                setShowConfigLibrary(false)
                                toast.success('Configuration Loaded', 'Configuration loaded into the form for editing')
                              }}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                              Load Configuration
                            </button>
                            <button
                              onClick={() => {
                                // Export configuration as JSON
                                const configData = JSON.stringify(config, null, 2)
                                const blob = new Blob([configData], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `qr-config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                                toast.success('Configuration Exported', 'Configuration downloaded as JSON file')
                              }}
                              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors font-medium"
                            >
                              Export JSON
                            </button>
                            {/* Assign to Seller Button */}
                            <button
                              onClick={() => {
                                setSelectedConfig(config)
                                fetchAvailableSellers()
                                setShowSellerModal(true)
                              }}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium"
                            >
                              Assign to Seller
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

      {/* Toast Notifications */}
      <ToastNotifications 
        notifications={toast.notifications} 
        onRemove={toast.removeToast} 
      />
    </ProtectedRoute>
  )
}
