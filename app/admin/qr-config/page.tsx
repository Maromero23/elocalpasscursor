'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { ProtectedRoute } from '../../../components/auth/protected-route'
import Link from 'next/link'
import { Building2, Users, MapPin, QrCode } from 'lucide-react'

interface Seller {
  id: string
  name: string
  email: string
  role: string
}

interface QRConfig {
  id: string
  sellerId: string
  sendMethod: string
  landingPageRequired: boolean
  allowCustomGuestsDays: boolean
  defaultGuests: number
  defaultDays: number
  pricingType: string
  fixedPrice?: number
  sendRebuyEmail: boolean
}

interface SellerWithConfig extends Seller {
  qrConfig?: QRConfig
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
  const { data: session, status } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [sellers, setSellers] = useState<SellerWithConfig[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [editingConfig, setEditingConfig] = useState<QRConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    sendMethod: 'URL',
    landingPageRequired: true,
    allowCustomGuestsDays: false,
    defaultGuests: 2,
    defaultDays: 3,
    pricingType: 'FIXED',
    fixedPrice: 0,
    sendRebuyEmail: false
  })

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchSellers()
    }
  }, [session])

  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/login')
    return null
  }

  const fetchSellers = async () => {
    try {
      const response = await fetch('/api/admin/qr-config/sellers')
      
      if (response.ok) {
        const data = await response.json()
        setSellers(data)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
      }
    } catch (error) {
      console.error('Error fetching sellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = (seller: Seller) => {
    setSelectedSeller(seller)
    setEditingConfig(null)
    setFormData({
      sendMethod: 'URL',
      landingPageRequired: true,
      allowCustomGuestsDays: false,
      defaultGuests: 2,
      defaultDays: 3,
      pricingType: 'FIXED',
      fixedPrice: 0,
      sendRebuyEmail: false
    })
    setShowModal(true)
  }

  const openEditModal = (seller: SellerWithConfig) => {
    if (!seller.qrConfig) return
    
    setSelectedSeller(seller)
    setEditingConfig(seller.qrConfig)
    setFormData({
      sendMethod: seller.qrConfig.sendMethod,
      landingPageRequired: seller.qrConfig.landingPageRequired,
      allowCustomGuestsDays: seller.qrConfig.allowCustomGuestsDays,
      defaultGuests: seller.qrConfig.defaultGuests,
      defaultDays: seller.qrConfig.defaultDays,
      pricingType: seller.qrConfig.pricingType,
      fixedPrice: seller.qrConfig.fixedPrice || 0,
      sendRebuyEmail: seller.qrConfig.sendRebuyEmail
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedSeller(null)
    setEditingConfig(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSeller) return
    
    try {
      const url = editingConfig 
        ? `/api/admin/qr-config/${editingConfig.id}`
        : '/api/admin/qr-config'
      
      const method = editingConfig ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedSeller.id,
          ...formData
        })
      })

      if (response.ok) {
        await fetchSellers()
        closeModal()
      } else {
        const error = await response.json()
        alert(error.error || 'An error occurred')
      }
    } catch (error) {
      alert('Network error occurred')
    }
  }

  const deleteConfig = async (seller: SellerWithConfig) => {
    if (!seller.qrConfig) return
    if (!confirm(`Are you sure you want to delete the configuration for "${seller.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/qr-config/${seller.qrConfig.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSellers()
      }
    } catch (error) {
      alert('Error deleting configuration')
    }
  }

  // Separate sellers into assigned and unassigned
  const assignedSellers = sellers.filter(seller => seller.qrConfig)
  const unassignedSellers = sellers.filter(seller => !seller.qrConfig)

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
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-orange-100 hover:text-white hover:bg-orange-500"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-orange-100">Welcome, {session?.user?.name}</span>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="min-h-screen bg-gray-50 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Seller QR Configurations</h1>
                      <p className="mt-2 text-gray-600">Create and manage QR configurations for each seller</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{assignedSellers.length}</span> configured • 
                      <span className="font-medium text-orange-600 ml-1">{unassignedSellers.length}</span> pending
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Unassigned Sellers */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                      <h2 className="text-lg font-medium text-orange-900">
                        🔶 Unassigned Sellers ({unassignedSellers.length})
                      </h2>
                      <p className="text-sm text-orange-700">Sellers without QR configurations</p>
                    </div>
                    
                    {loading ? (
                      <div className="p-6 text-center">Loading sellers...</div>
                    ) : unassignedSellers.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        All sellers have been configured! 🎉
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {unassignedSellers.map((seller) => (
                          <div key={seller.id} className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{seller.name}</h3>
                                <p className="text-sm text-gray-500">{seller.email}</p>
                              </div>
                              <button
                                onClick={() => openCreateModal(seller)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                              >
                                Create Configuration
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Sellers */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                      <h2 className="text-lg font-medium text-green-900">
                        ✅ Configured Sellers ({assignedSellers.length})
                      </h2>
                      <p className="text-sm text-green-700">Sellers with active QR configurations</p>
                    </div>
                    
                    {assignedSellers.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No sellers configured yet. Start by creating configurations for unassigned sellers.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {assignedSellers.map((seller) => (
                          <div key={seller.id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{seller.name}</h3>
                                <p className="text-sm text-gray-500">{seller.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(seller)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteConfig(seller)}
                                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-sm rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            {/* Configuration Preview */}
                            {seller.qrConfig && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="font-medium text-gray-700">Send Method</p>
                                  <p className="text-gray-900">{seller.qrConfig.sendMethod}</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="font-medium text-gray-700">Landing Page</p>
                                  <p className="text-gray-900">{seller.qrConfig.landingPageRequired ? 'Required' : 'Not Required'}</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="font-medium text-gray-700">Custom G/D</p>
                                  <p className="text-gray-900">{seller.qrConfig.allowCustomGuestsDays ? 'Allowed' : `${seller.qrConfig.defaultGuests}G/${seller.qrConfig.defaultDays}D`}</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded">
                                  <p className="font-medium text-gray-700">Pricing</p>
                                  <p className="text-gray-900">{seller.qrConfig.pricingType === 'FIXED' ? `$${seller.qrConfig.fixedPrice}` : seller.qrConfig.pricingType}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal */}
                {showModal && selectedSeller && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
                            </h3>
                            <p className="text-sm text-gray-500">For: {selectedSeller.name}</p>
                          </div>
                          <button
                            onClick={closeModal}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Button 1: Send Method */}
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                            <h4 className="font-medium text-blue-900 mb-3">🔘 Button 1: Send Method</h4>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="sendMethod"
                                  value="URL"
                                  checked={formData.sendMethod === 'URL'}
                                  onChange={(e) => setFormData({ ...formData, sendMethod: e.target.value })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">URL (Generates a unique landing page link for the guest)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="sendMethod"
                                  value="APP"
                                  checked={formData.sendMethod === 'APP'}
                                  onChange={(e) => setFormData({ ...formData, sendMethod: e.target.value })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">APP (One-click trigger inside the app)</span>
                              </label>
                            </div>
                          </div>

                          {/* Button 2: Landing Page Required */}
                          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                            <h4 className="font-medium text-green-900 mb-3">🔘 Button 2: Landing Page Required?</h4>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="landingPageRequired"
                                  value="true"
                                  checked={formData.landingPageRequired === true}
                                  onChange={() => setFormData({ ...formData, landingPageRequired: true })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Yes (a custom landing page is generated per QR)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="landingPageRequired"
                                  value="false"
                                  checked={formData.landingPageRequired === false}
                                  onChange={() => setFormData({ ...formData, landingPageRequired: false })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">No (QR is sent directly without a landing page)</span>
                              </label>
                            </div>
                          </div>

                          {/* Button 3: Allow Custom Guests/Days */}
                          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                            <h4 className="font-medium text-purple-900 mb-3">🔘 Button 3: Allow Custom Guests/Days?</h4>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="allowCustomGuestsDays"
                                  value="true"
                                  checked={formData.allowCustomGuestsDays === true}
                                  onChange={() => setFormData({ ...formData, allowCustomGuestsDays: true })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Yes (Seller can choose number of guests and days)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="allowCustomGuestsDays"
                                  value="false"
                                  checked={formData.allowCustomGuestsDays === false}
                                  onChange={() => setFormData({ ...formData, allowCustomGuestsDays: false })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">No (Admin provides default values)</span>
                              </label>
                            </div>
                            
                            {!formData.allowCustomGuestsDays && (
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Guests</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={formData.defaultGuests || ''}
                                    onChange={(e) => setFormData({ ...formData, defaultGuests: parseInt(e.target.value) || 2 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Days</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={formData.defaultDays || ''}
                                    onChange={(e) => setFormData({ ...formData, defaultDays: parseInt(e.target.value) || 3 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Button 4: Pricing Type */}
                          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                            <h4 className="font-medium text-yellow-900 mb-3">🔘 Button 4: Pricing Type</h4>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="pricingType"
                                  value="FIXED"
                                  checked={formData.pricingType === 'FIXED'}
                                  onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Fixed price (set by Admin)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="pricingType"
                                  value="VARIABLE"
                                  checked={formData.pricingType === 'VARIABLE'}
                                  onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Variable price (calculated using number of guests × days)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="pricingType"
                                  value="FREE"
                                  checked={formData.pricingType === 'FREE'}
                                  onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Free</span>
                              </label>
                            </div>
                            
                            {formData.pricingType === 'FIXED' && (
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Price ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.fixedPrice || ''}
                                  onChange={(e) => setFormData({ ...formData, fixedPrice: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                />
                              </div>
                            )}
                          </div>

                          {/* Button 5: Send Rebuy Email */}
                          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                            <h4 className="font-medium text-red-900 mb-3">🔘 Button 5: Send Rebuy Email?</h4>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="sendRebuyEmail"
                                  value="true"
                                  checked={formData.sendRebuyEmail === true}
                                  onChange={() => setFormData({ ...formData, sendRebuyEmail: true })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">Yes (System will automatically send a follow-up email 12 hours before QR expires)</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="sendRebuyEmail"
                                  value="false"
                                  checked={formData.sendRebuyEmail === false}
                                  onChange={() => setFormData({ ...formData, sendRebuyEmail: false })}
                                  className="mr-2"
                                />
                                <span className="text-gray-900">No</span>
                              </label>
                            </div>
                            {formData.sendRebuyEmail && (
                              <p className="mt-2 text-sm text-gray-600">
                                The email includes a special discount for buying an Elocalpass online, personalized with the Seller's info
                              </p>
                            )}
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex justify-end gap-3 pt-6">
                            <button
                              type="button"
                              onClick={closeModal}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                            >
                              {editingConfig ? 'Update Configuration' : 'Create Configuration'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
