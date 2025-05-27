'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Building2, Users, MapPin, QrCode, Settings, Eye, Plus, Edit3, Palette } from 'lucide-react'
import { ProtectedRoute } from '../../../components/auth/protected-route'
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
    }
    
    await updateConfig(defaultConfig)
    setConfiguredButtons(new Set())
    setSaveStatus('🔄 Reset to defaults - Auto-saved successfully')
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
                  <p className="mt-2 text-gray-600">Configure the 5-button QR generation system for all sellers</p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Auto-save status indicator */}
                  {saveStatus && (
                    <div className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                      saveStatus.includes('✅') 
                        ? 'bg-green-100 text-green-800' 
                        : saveStatus.includes('❌')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAutoSaving && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>}
                      {saveStatus}
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
              <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm">
                {[
                  { num: 1, title: "Personalized?" },
                  { num: 2, title: "Pricing Type" },
                  { num: 3, title: "Send Method" },
                  { num: 4, title: "Welcome Email" },
                  { num: 5, title: "Rebuy Email?" }
                ].map((button) => (
                  <button
                    key={button.num}
                    onClick={() => setActiveButton(button.num)}
                    className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                      activeButton === button.num 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {button.title}
                  </button>
                ))}
              </div>

              {/* Progress Tracker */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration Progress</h3>
                <div className="grid grid-cols-5 gap-2">
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
                  ].map((button) => (
                    <div
                      key={button.num}
                      className={`p-2 rounded text-xs text-center transition-colors ${
                        isButtonConfigured(button.num) 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{button.title}</div>
                      <div className="text-xs mt-1 leading-tight">{button.value}</div>
                      {isButtonConfigured(button.num) ? (
                        <div className="text-green-600 text-xs mt-1">✓ Auto-saved</div>
                      ) : (
                        <div className="text-gray-500 text-xs mt-1">Need to configure</div>
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
                          <h3 className="text-lg font-semibold text-blue-900">Number of Guests</h3>
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
                          <h3 className="text-lg font-semibold text-green-900">Number of Days</h3>
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
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
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
                      <p className="text-gray-600 mb-3">
                        QR codes are sent directly to guests via email
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
                      <p className="text-gray-600 mb-3">
                        QR codes are sent as unique landing page links
                      </p>
                      <div className="space-y-2 text-sm text-gray-600">
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
                        onClick={() => router.push('/admin/landing-templates')}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Configure Landing Page Templates →
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
                        onClick={() => router.push('/admin/landing-templates')}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                      >
                        Configure Landing Page Templates →
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
                  </div>

                  {globalConfig.button4LandingPageRequired && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Custom Template Features</h4>
                      <div className="space-y-2 text-sm text-purple-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Seller-specific branding (logos, colors)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Custom promotional banners and messages</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Special offers and discount codes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Personalized content for that distributor's market</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Language-specific customizations (EN/ES)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">✓</span>
                          <span>Enhanced FREE pass highlighting</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push('/admin/email-templates')}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                      >
                        Configure Custom Templates →
                      </button>
                    </div>
                  )}

                  {!globalConfig.button4LandingPageRequired && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Default Template</h4>
                      <p className="text-sm text-gray-700">
                        Standard ELocalPass welcome email template will be used. This includes basic QR code information, 
                        validity details, and standard branding. All dynamic variables like client name, guest count, 
                        and expiry date are automatically included.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Button 5: Send Rebuy Email */}
              {activeButton === 5 && (
                <div className="space-y-6">
                  <div className="border-l-4 border-red-500 pl-4">
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
                        className="mt-1 h-4 w-4 text-red-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Yes</span>
                        <p className="text-sm text-gray-600">System will automatically send a follow-up email 12 hours before QR expires</p>
                      </div>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={globalConfig.button5SendRebuyEmail === false}
                        onChange={() => {
                          updateConfig({ button5SendRebuyEmail: false })
                          setConfiguredButtons((prev) => new Set(prev).add(5))
                        }}
                        className="mt-1 h-4 w-4 text-red-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">No</span>
                        <p className="text-sm text-gray-600">No follow-up emails will be sent</p>
                      </div>
                    </label>
                  </div>

                  {globalConfig.button5SendRebuyEmail && (
                    <div className="mt-6 p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Rebuy Email System</h4>
                      <p className="text-sm text-red-800">
                        When enabled, the system will automatically send a follow-up email 12 hours before each QR code expires, 
                        encouraging guests to purchase a new QR code for continued access.
                      </p>
                      <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                        Configure Email Templates →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Assign Configuration to Sellers */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                📋 Assign Configuration to Sellers
              </h3>
              <p className="text-blue-700 mb-4">
                Apply the current configuration to existing sellers so they can generate QR codes.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/assign-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          sellerEmail: 'seller@elocalpass.com'
                        })
                      })
                      
                      if (response.ok) {
                        alert('✅ Configuration assigned to seller successfully!')
                      } else {
                        const error = await response.json()
                        alert(`❌ Error: ${error.error}`)
                      }
                    } catch (error) {
                      alert(`❌ Error assigning configuration`)
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  🎯 Assign to Test Seller (seller@elocalpass.com)
                </button>
                
                <p className="text-xs text-blue-600">
                  Note: This assigns the current Button 1-3 configuration to the test seller account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
