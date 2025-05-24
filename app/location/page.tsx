'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Seller {
  id: string
  name: string
  email: string
  qrCodes: QRCode[]
  sellerConfigs: QRConfig[]
}

interface QRCode {
  id: string
  status: 'active' | 'inactive' | 'expired'
  expiresAt: Date | null
  guestLimit: number | null
  scansCount: number
  createdAt: Date
  isRepeatable: boolean
  cost: number
}

interface QRConfig {
  id: string
  sendMethod: string
  landingPageRequired: boolean
  allowCustomGuests: boolean
  pricingType: string
  sendRebuyEmail: boolean
}

interface QRScan {
  id: string
  scannedAt: Date
}

interface LocationData {
  id: string
  name: string
  sellers: Seller[]
}

export default function LocationDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "LOCATION") {
      router.push("/auth/login")
      return
    }

    fetchLocationData()
  }, [session, status, router])

  const fetchLocationData = async () => {
    try {
      const response = await fetch('/api/location/dashboard')
      if (response.ok) {
        const data = await response.json()
        setLocationData(data)
      } else {
        console.error('Failed to fetch location data')
      }
    } catch (error) {
      console.error('Error fetching location data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalQRCodes = () => {
    if (!locationData) return 0
    return locationData.sellers.reduce((total, seller) => total + seller.qrCodes.length, 0)
  }

  const getActiveQRCodes = () => {
    if (!locationData) return 0
    return locationData.sellers.reduce((total, seller) => 
      total + seller.qrCodes.filter(qr => qr.status === 'active').length, 0
    )
  }

  const getTotalCost = () => {
    if (!locationData) return 0
    return locationData.sellers.reduce((total, seller) => 
      total + seller.qrCodes.reduce((costTotal, qr) => costTotal + (qr.cost || 0), 0), 0
    )
  }

  // Filter sellers based on search and filters
  const filteredSellers = locationData?.sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesDate = true
    if (startDate || endDate) {
      const startFilterDate = startDate ? new Date(startDate) : null
      const endFilterDate = endDate ? new Date(endDate) : null
      matchesDate = seller.qrCodes.some(qr => {
        const qrDate = new Date(qr.createdAt)
        return (!startFilterDate || qrDate >= startFilterDate) && (!endFilterDate || qrDate <= endFilterDate)
      })
    }

    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = seller.qrCodes.some(qr => qr.status === 'active')
    } else if (statusFilter === 'inactive') {
      matchesStatus = seller.qrCodes.some(qr => qr.status === 'inactive')
    } else if (statusFilter === 'configured') {
      matchesStatus = seller.sellerConfigs.length > 0
    } else if (statusFilter === 'unconfigured') {
      matchesStatus = seller.sellerConfigs.length === 0
    }

    return matchesSearch && matchesDate && matchesStatus
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Location Dashboard</h1>
                  <p className="text-sm text-gray-600">Manage your location's sellers and QR codes</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-[#22529c] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-[#22529c] to-[#2c8ec9] rounded-full opacity-75"></div>
              </div>
            </div>
          </div>
        ) : !locationData ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Location Data</h3>
              <p className="text-gray-600">Unable to load location information.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Total Sellers */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Total Sellers
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {locationData.sellers.length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 0118 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total QR Codes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Total QR Codes
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {getTotalQRCodes()}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active QR Codes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Active QR Codes
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {getActiveQRCodes()}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Total Cost
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ${getTotalCost().toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  </div>
                  {(searchTerm || startDate || endDate || statusFilter) && (
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full border border-blue-400">
                        {filteredSellers.length} of {locationData.sellers.length} sellers
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Search by Seller */}
                  <div className="space-y-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search Sellers</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="search"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Date Range</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="startDate" className="block text-xs text-gray-400 mb-1">From</label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-xs text-gray-400 mb-1">To</label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="block w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0h2a2 2 0 002 2v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 002-2zm0-8h2a2 2 0 002 2v2a2 2 0 00-2 2H5a2 2 0 00-2-2V9a2 2 0 002-2zm0 0h2a2 2 0 002 2v2a2 2 0 00-2 2H5a2 2 0 00-2-2V9a2 2 0 002-2z" />
                      </svg>
                      <span>Filter by Status</span>
                    </label>
                    <select
                      id="status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="">All Sellers</option>
                      <option value="active">Has Active QR Codes</option>
                      <option value="inactive">Has Inactive QR Codes</option>
                      <option value="configured">Configured</option>
                      <option value="unconfigured">Not Configured</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || startDate || endDate || statusFilter) && (
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setStartDate('')
                          setEndDate('')
                          setStatusFilter('')
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200 border border-gray-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Clear All Filters</span>
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{filteredSellers.length}</span> of <span className="font-medium text-gray-900">{locationData.sellers.length}</span> sellers shown
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sellers Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sellers Performance</h3>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full border border-gray-200">
                    Read-only view of your sellers' QR statistics
                  </span>
                </div>
              </div>

              <div className="p-6">
                {filteredSellers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 00-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchTerm || startDate || endDate || statusFilter ? 'No sellers match your filters' : 'No Sellers'}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        {searchTerm || startDate || endDate || statusFilter 
                          ? 'Try adjusting your search criteria or filters to see more results.'
                          : 'No sellers are assigned to this location yet. Contact your administrator to add sellers.'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Seller
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            QR Codes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Configuration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSellers.map((seller) => {
                          const activeQRs = seller.qrCodes.filter(qr => qr.status === 'active').length
                          const hasConfig = seller.sellerConfigs.length > 0
                          const totalCost = seller.qrCodes.reduce((total, qr) => total + (qr.cost || 0), 0)

                          return (
                            <tr key={seller.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {(seller.name || seller.email).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {seller.name || 'Unnamed Seller'}
                                    </div>
                                    <div className="text-sm text-gray-600">{seller.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {seller.qrCodes.length}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  activeQRs > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {activeQRs}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${totalCost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  hasConfig ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {hasConfig ? 'Configured' : 'Not Configured'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
