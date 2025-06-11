"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState, useEffect } from "react"

interface QRConfig {
  // Configuration info
  configName: string
  configDescription?: string
  // Button 1 fields
  button1GuestsLocked: boolean
  button1GuestsDefault: number
  button1GuestsRangeMax: number
  button1DaysLocked: boolean
  button1DaysDefault: number
  button1DaysRangeMax: number
  // Button 2 fields (for backend pricing calculation only)
  button2PricingType: string
  button2FixedPrice: number
  button2VariableBasePrice: number
  button2VariableGuestIncrease: number
  button2VariableDayIncrease: number
  button2VariableCommission: number
  button2IncludeTax: boolean
  button2TaxPercentage: number
  // Button 3 fields
  button3DeliveryMethod: 'DIRECT' | 'URLS' | 'BOTH'
  // Landing page URLs from configuration
  landingPageUrls?: Array<{
    id: string
    name: string
    url: string
    description?: string
  }>
}

export default function SellerDashboard() {
  const { data: session } = useSession()
  const [config, setConfig] = useState<QRConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Form state
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [selectedGuests, setSelectedGuests] = useState(2)
  const [selectedDays, setSelectedDays] = useState(3)
  const [language, setLanguage] = useState('en')
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'DIRECT' | 'URLS'>('DIRECT')
  const [selectedLandingPage, setSelectedLandingPage] = useState<string | null>(null)
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<string>('DIRECT')
  
  // Load seller configuration
  useEffect(() => {
    fetchConfig()
  }, [])
  
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/seller/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        // Set initial form values based on config
        if (data.button1GuestsLocked) {
          setSelectedGuests(data.button1GuestsDefault)
        } else {
          // For open ranges, set to default value as starting point
          setSelectedGuests(data.button1GuestsDefault)
        }
        if (data.button1DaysLocked) {
          setSelectedDays(data.button1DaysDefault)
        } else {
          // For open ranges, set to default value as starting point  
          setSelectedDays(data.button1DaysDefault)
        }
        if (data.landingPageUrls && data.landingPageUrls.length > 0) {
          setSelectedLandingPage(data.landingPageUrls[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Generate guest options based on config
  const getGuestOptions = () => {
    if (!config || config.button1GuestsLocked) return []
    
    const options = []
    for (let i = 1; i <= config.button1GuestsRangeMax; i++) {
      options.push(i)
    }
    return options
  }
  
  // Generate day options based on config
  const getDayOptions = () => {
    if (!config || config.button1DaysLocked) return []
    
    const options = []
    for (let i = 1; i <= config.button1DaysRangeMax; i++) {
      options.push(i)
    }
    return options
  }
  
  // Handle QR generation
  const handleGenerateQR = async () => {
    if (!clientName || !clientEmail || !confirmEmail || clientEmail !== confirmEmail) {
      alert('Please fill in client name and email, and ensure emails match')
      return
    }
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/seller/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          guests: selectedGuests,
          days: selectedDays,
          language,
          deliveryMethod: config?.button3DeliveryMethod === 'BOTH' ? selectedDeliveryOption : config?.button3DeliveryMethod,
          landingPageId: selectedLandingPage
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`ELocalPass generated and sent to ${clientEmail}!`)
        // Reset form
        setClientName('')
        setClientEmail('')
        setConfirmEmail('')
      } else {
        alert('Error generating QR code')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('Error generating QR code')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["SELLER"]}>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Loading your configuration...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["SELLER"]}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-orange-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white">
                  Seller Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-orange-100">
                  Welcome, {session?.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* QR Generation Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                
                {!config ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">No configuration assigned to your account.</p>
                    <p className="text-sm text-gray-500 mt-2">Please contact admin to assign a QR package.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Configuration Name */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900">
                        CONFIGURATION NAME: "{config.configName}"
                      </h4>
                    </div>
                    
                    {/* Step 1: Client Information */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Step 1: Client Information
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full focus:ring-blue-500 focus:border-blue-500 block shadow-sm text-sm border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter client's full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Client Email *
                          </label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full focus:ring-blue-500 focus:border-blue-500 block shadow-sm text-sm border-gray-300 rounded-md px-3 py-2"
                            placeholder="client@email.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Email *
                          </label>
                          <input
                            type="email"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            className={`w-full focus:ring-blue-500 focus:border-blue-500 block shadow-sm text-sm border-gray-300 rounded-md px-3 py-2 ${
                              confirmEmail && clientEmail !== confirmEmail ? 'border-red-500 bg-red-50' : ''
                            }`}
                            placeholder="Confirm email address"
                          />
                          {confirmEmail && clientEmail !== confirmEmail && (
                            <p className="text-red-600 text-xs mt-1">Emails don't match</p>
                          )}
                          {confirmEmail && clientEmail === confirmEmail && confirmEmail.length > 0 && (
                            <p className="text-green-600 text-xs mt-1">Emails confirmed</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Step 2: Guest & Day Limits */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Step 2: Guest & Day Limits
                      </h4>
                      <div className="space-y-3">
                        {/* Guests - Inline */}
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                            Guests:
                          </label>
                          {config.button1GuestsLocked ? (
                            <div className="ml-3 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 min-w-0 flex-shrink-0">
                              {config.button1GuestsDefault} Fixed
                            </div>
                          ) : (
                            <div className="ml-3 flex items-center space-x-2">
                              <select
                                value={selectedGuests}
                                onChange={(e) => setSelectedGuests(Number(e.target.value))}
                                className="w-20 py-2 px-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {getGuestOptions().map(num => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                              <span className="text-xs text-gray-600">(1-{config.button1GuestsRangeMax} Open)</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Days - Inline */}
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                            Days:
                          </label>
                          {config.button1DaysLocked ? (
                            <div className="ml-3 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 min-w-0 flex-shrink-0">
                              {config.button1DaysDefault} Fixed
                            </div>
                          ) : (
                            <div className="ml-3 flex items-center space-x-2">
                              <select
                                value={selectedDays}
                                onChange={(e) => setSelectedDays(Number(e.target.value))}
                                className="w-20 py-2 px-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {getDayOptions().map(num => (
                                  <option key={num} value={num}>{num}</option>
                                ))}
                              </select>
                              <span className="text-xs text-gray-600">(1-{config.button1DaysRangeMax} Open)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Step 3: QR Delivery */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Step 3: QR Delivery {config.button3DeliveryMethod}
                      </h4>
                      <div className="space-y-3">
                        {config.button3DeliveryMethod === 'DIRECT' && (
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                              Method:
                            </label>
                            <div className="ml-3 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 min-w-0 flex-shrink-0">
                              Direct Email Fixed
                            </div>
                          </div>
                        )}
                        
                        {config.button3DeliveryMethod === 'URLS' && config.landingPageUrls && config.landingPageUrls.length > 0 && (
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                              Landing Page:
                            </label>
                            <select
                              value={selectedLandingPage || ''}
                              onChange={(e) => setSelectedLandingPage(e.target.value)}
                              className="ml-3 flex-1 max-w-xs py-2 px-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {config.landingPageUrls.map(lp => (
                                <option key={lp.id} value={lp.id}>{lp.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {config.button3DeliveryMethod === 'BOTH' && (
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                              Send via:
                            </label>
                            <select
                              value={selectedDeliveryOption}
                              onChange={(e) => setSelectedDeliveryOption(e.target.value)}
                              className="ml-3 flex-1 max-w-xs py-2 px-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="DIRECT">Direct Email</option>
                              {config.landingPageUrls && config.landingPageUrls.map(lp => (
                                <option key={lp.id} value={lp.id}>{lp.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Step 3B: Customer Communication Language */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Step 3B: Customer Communication Language
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                            Customer emails will be sent in:
                          </label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="ml-3 w-32 py-2 px-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Configuration Summary */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Client Name:</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {clientName || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Client Email:</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {clientEmail || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Pass:</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {selectedGuests} guest{selectedGuests > 1 ? 's' : ''} × {selectedDays} day{selectedDays > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Delivery Method:</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {config?.button3DeliveryMethod === 'DIRECT' ? 'Direct Email' : 
                             config?.button3DeliveryMethod === 'URLS' ? 
                               (config?.landingPageUrls?.find(lp => lp.id === selectedLandingPage)?.name || 'Landing Page') : 
                             selectedDeliveryOption === 'DIRECT' ? 'Direct Email' : 
                             config?.landingPageUrls?.find(lp => lp.id === selectedDeliveryOption)?.name || 'Landing Page'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Language:</span>
                          <span className="font-medium text-gray-900 text-sm">
                            {language === 'en' ? 'English' : 'Español'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Step 5: Generate & Send */}
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                      <h4 className="text-lg font-semibold text-blue-900 mb-2">
                        Step 5: Generate & Send
                      </h4>
                      <button
                        onClick={handleGenerateQR}
                        disabled={generating || !clientName || !clientEmail || !confirmEmail || clientEmail !== confirmEmail}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="text-sm">Generating...</span>
                          </>
                        ) : (
                          'Generate & Send ELocalPass'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
