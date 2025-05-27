"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState, useEffect } from "react"

interface QRConfig {
  // Button 1 fields
  button1GuestsLocked: boolean
  button1GuestsDefault: number
  button1GuestsRangeMax: number
  button1DaysLocked: boolean
  button1DaysDefault: number
  button1DaysRangeMax: number
  // Button 2 fields
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
}

export default function SellerDashboard() {
  const { data: session } = useSession()
  const [config, setConfig] = useState<QRConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Form state
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedGuests, setSelectedGuests] = useState(2)
  const [selectedDays, setSelectedDays] = useState(3)
  const [language, setLanguage] = useState('en')
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'DIRECT' | 'URLS'>('DIRECT')
  
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
        }
        if (data.button1DaysLocked) {
          setSelectedDays(data.button1DaysDefault)
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate real-time price
  const calculatePrice = () => {
    if (!config) return 0
    
    let price = 0
    
    if (config.button2PricingType === 'FIXED') {
      price = config.button2FixedPrice
    } else if (config.button2PricingType === 'VARIABLE') {
      price = config.button2VariableBasePrice +
              (selectedGuests * config.button2VariableGuestIncrease) +
              (selectedDays * config.button2VariableDayIncrease)
      
      // Add commission
      price += price * (config.button2VariableCommission / 100)
    }
    // FREE pricing returns 0
    
    // Add tax if enabled
    if (config.button2IncludeTax) {
      price += price * (config.button2TaxPercentage / 100)
    }
    
    return price.toFixed(2)
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
    if (!clientName || !clientEmail) {
      alert('Please fill in client name and email')
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
          price: calculatePrice(),
          deliveryMethod: config?.button3DeliveryMethod === 'BOTH' ? selectedDeliveryMethod : config?.button3DeliveryMethod
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ ELocalPass generated and sent to ${clientEmail}!`)
        // Reset form
        setClientName('')
        setClientEmail('')
      } else {
        alert('❌ Error generating QR code')
      }
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('❌ Error generating QR code')
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
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Seller Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session?.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                  🎫 Generate ELocalPass
                </h3>
                
                {!config ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">❌ No configuration assigned to your account.</p>
                    <p className="text-sm text-gray-500 mt-2">Please contact admin to assign a QR package.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Step 1: Client Information */}
                    <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">
                        📋 Step 1: Client Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full focus:ring-blue-500 focus:border-blue-500 block shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter client's full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Email *
                          </label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full focus:ring-blue-500 focus:border-blue-500 block shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2"
                            placeholder="client@email.com"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Step 2: Pass Configuration */}
                    <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400">
                      <h4 className="text-lg font-semibold text-green-900 mb-4">
                        ⚙️ Step 2: Pass Configuration
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Guests
                          </label>
                          {config.button1GuestsLocked ? (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="text-sm text-gray-900">{config.button1GuestsDefault} guests (fixed by admin)</span>
                            </div>
                          ) : (
                            <select
                              value={selectedGuests}
                              onChange={(e) => setSelectedGuests(Number(e.target.value))}
                              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                              {getGuestOptions().map(num => (
                                <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Validity Days
                          </label>
                          {config.button1DaysLocked ? (
                            <div className="p-3 bg-gray-50 rounded-md border">
                              <span className="text-sm text-gray-900">{config.button1DaysDefault} days (fixed by admin)</span>
                            </div>
                          ) : (
                            <select
                              value={selectedDays}
                              onChange={(e) => setSelectedDays(Number(e.target.value))}
                              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                              {getDayOptions().map(num => (
                                <option key={num} value={num}>{num} day{num > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Step 3: Language & Delivery */}
                    <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-400">
                      <h4 className="text-lg font-semibold text-purple-900 mb-4">
                        🌐 Step 3: Language & Delivery
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Language
                          </label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          >
                            <option value="en">🇺🇸 English</option>
                            <option value="es">🇲🇽 Español</option>
                          </select>
                        </div>
                        
                        {/* Delivery Method */}
                        {config?.button3DeliveryMethod === 'BOTH' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Method
                            </label>
                            <select
                              value={selectedDeliveryMethod}
                              onChange={(e) => setSelectedDeliveryMethod(e.target.value as 'DIRECT' | 'URLS')}
                              className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            >
                              <option value="DIRECT">📱 Direct to Client</option>
                              <option value="URLS">🔗 Via URLs</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Step 4: Generate & Send */}
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-gray-400">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        🚀 Step 4: Generate & Send
                      </h4>
                      <button
                        onClick={handleGenerateQR}
                        disabled={generating || !clientName || !clientEmail}
                        className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Generating & Sending ELocalPass...
                          </>
                        ) : (
                          '🎫 Generate & Send ELocalPass'
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
