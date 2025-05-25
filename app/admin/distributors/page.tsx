"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { MapPin, Building2, Users, ChevronRight, ChevronDown, Edit2, Save, X, Plus } from "lucide-react"

interface Distributor {
  id: string
  name: string
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
  _count: {
    locations: number
  }
}

interface DistributorDetails {
  id: string
  name: string
  contactPerson?: string
  email?: string
  telephone?: string
  notes?: string
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
  locations: {
    id: string
    name: string
    sellers: {
      id: string
      name: string
      email: string
      role: string
    }[]
    _count: {
      sellers: number
    }
  }[]
  _count: {
    locations: number
  }
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/qr-config", label: "QR Config", icon: Building2 },
    ]
  }
  return []
}

export default function DistributorsPage() {
  const { data: session } = useSession()
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedDistributor, setExpandedDistributor] = useState<string | null>(null)
  const [distributorDetails, setDistributorDetails] = useState<{ [key: string]: DistributorDetails }>({})
  const [loadingDetails, setLoadingDetails] = useState<{ [key: string]: boolean }>({})
  
  // Edit mode states
  const [editingDistributor, setEditingDistributor] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    password: "",
    alternativeEmail: "",
    telephone: "",
    notes: ""
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Modal states for adding locations and sellers
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  
  // Location form data
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    password: "",
    telephone: "",
    notes: ""
  })
  
  // Seller form data
  const [sellerFormData, setSellerFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [isCreatingSeller, setIsCreatingSeller] = useState(false)

  const navItems = getNavItems(session?.user?.role || "")

  useEffect(() => {
    fetchDistributors()
  }, [])

  const fetchDistributors = async () => {
    try {
      const response = await fetch("/api/admin/distributors")
      if (response.ok) {
        const data = await response.json()
        setDistributors(data)
      } else {
        setError("Failed to fetch distributors")
      }
    } catch (error) {
      setError("Error fetching distributors")
    } finally {
      setLoading(false)
    }
  }

  const fetchDistributorDetails = async (distributorId: string) => {
    if (distributorDetails[distributorId]) return // Already fetched

    setLoadingDetails(prev => ({ ...prev, [distributorId]: true }))
    try {
      const response = await fetch(`/api/admin/distributors/${distributorId}`)
      if (response.ok) {
        const data = await response.json()
        setDistributorDetails(prev => ({ ...prev, [distributorId]: data }))
      }
    } catch (error) {
      console.error("Error fetching distributor details:", error)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [distributorId]: false }))
    }
  }

  const handleDistributorClick = (distributorId: string) => {
    if (expandedDistributor === distributorId) {
      setExpandedDistributor(null)
    } else {
      setExpandedDistributor(distributorId)
      fetchDistributorDetails(distributorId)
    }
  }

  const handleEditClick = (distributor: Distributor, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDistributor(distributor.id)
    
    // Pre-populate form with current distributor data
    const details = distributorDetails[distributor.id]
    setEditFormData({
      name: distributor.name,
      contactPerson: details?.contactPerson || "",
      email: distributor.user.email,
      password: "",  // Always start with empty password
      alternativeEmail: details?.email || "",
      telephone: details?.telephone || "",
      notes: details?.notes || ""
    })
  }

  const handleCancelEdit = () => {
    setEditingDistributor(null)
    setEditFormData({
      name: "",
      contactPerson: "",
      email: "",
      password: "",
      alternativeEmail: "",
      telephone: "",
      notes: ""
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDistributor) return

    setIsUpdating(true)
    try {
      const updateData = {
        ...editFormData,
        // Only include password if it's not empty
        ...(editFormData.password ? { password: editFormData.password } : {})
      }

      const response = await fetch(`/api/admin/distributors/${editingDistributor}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Refresh the distributors list and details
        await fetchDistributors()
        await fetchDistributorDetails(editingDistributor)
        setEditingDistributor(null)
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update distributor")
      }
    } catch (error) {
      setError("Error updating distributor")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDistributorId) return

    setIsCreatingLocation(true)
    try {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...locationFormData,
          distributorId: selectedDistributorId
        })
      })

      if (response.ok) {
        // Reset form and close modal
        setLocationFormData({ name: "", contactPerson: "", email: "", password: "", telephone: "", notes: "" })
        setShowLocationModal(false)
        setSelectedDistributorId(null)
        
        // Refresh both the distributors list and details
        await fetchDistributors()
        if (expandedDistributor) {
          await fetchDistributorDetails(expandedDistributor)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create location")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsCreatingLocation(false)
    }
  }

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocationId) return

    setIsCreatingSeller(true)
    try {
      const response = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellerFormData,
          locationId: selectedLocationId
        })
      })

      if (response.ok) {
        // Reset form and close modal
        setSellerFormData({ name: "", email: "", password: "" })
        setShowSellerModal(false)
        setSelectedLocationId(null)
        setSelectedDistributorId(null)
        
        // Refresh distributor details and main list
        await fetchDistributors()
        if (expandedDistributor) {
          await fetchDistributorDetails(expandedDistributor)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create seller")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsCreatingSeller(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Welcome, {session?.user?.name}</span>
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
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Distributor Management</h2>
                <Link
                  href="/admin/distributors/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add New Distributor
                </Link>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Distributors Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Distributors</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distributor Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telephone
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Locations
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {distributors.map((distributor, index) => (
                        <React.Fragment key={distributor.id}>
                          <tr 
                            key={distributor.id} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                            onClick={() => handleDistributorClick(distributor.id)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{distributor.name}</div>
                                  <div className="text-sm text-gray-500">ID: {distributor.id.slice(-8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {distributorDetails[distributor.id]?.contactPerson || '—'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{distributor.user.email}</div>
                              <div className="text-sm text-gray-500">
                                {distributorDetails[distributor.id]?.email && 
                                  `Alt: ${distributorDetails[distributor.id]?.email}`
                                }
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {distributorDetails[distributor.id]?.telephone || '—'}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {distributor._count.locations} location{distributor._count.locations !== 1 ? 's' : ''}
                                </span>
                                <div className="text-blue-600 hover:text-blue-800">
                                  {expandedDistributor === distributor.id ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleEditClick(distributor, e)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <span className="sr-only">More options</span>
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline Edit Row */}
                          {editingDistributor === distributor.id && (
                            <tr>
                              <td colSpan={8} className="px-0 py-0">
                                <div className="bg-blue-50 border-l-4 border-blue-400">
                                  <form onSubmit={handleSaveEdit} className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-md font-semibold text-gray-900">Edit Distributor</h4>
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Distributor Name *
                                        </label>
                                        <input
                                          type="text"
                                          value={editFormData.name}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Contact Person
                                        </label>
                                        <input
                                          type="text"
                                          value={editFormData.contactPerson}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Primary Email *
                                        </label>
                                        <input
                                          type="email"
                                          value={editFormData.email}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Alternative Email
                                        </label>
                                        <input
                                          type="email"
                                          value={editFormData.alternativeEmail}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, alternativeEmail: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Telephone
                                        </label>
                                        <input
                                          type="tel"
                                          value={editFormData.telephone}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                          placeholder="Phone number"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Password (optional)
                                        </label>
                                        <input
                                          type="password"
                                          value={editFormData.password}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                          placeholder="New password"
                                        />
                                      </div>

                                      <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Notes
                                        </label>
                                        <textarea
                                          value={editFormData.notes}
                                          onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                          rows={2}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                          placeholder="Additional notes..."
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-4">
                                      <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                      >
                                        {isUpdating ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Saving...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Save className="w-4 h-4" />
                                            <span>Save</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Expanded Details Row */}
                          {expandedDistributor === distributor.id && editingDistributor !== distributor.id && (
                            <tr>
                              <td colSpan={8} className="px-0 py-0">
                                <div className="bg-gray-50 border-l-4 border-gray-300">
                                  {loadingDetails[distributor.id] ? (
                                    <div className="p-6 text-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                      <p className="text-sm text-gray-500 mt-2">Loading details...</p>
                                    </div>
                                  ) : distributorDetails[distributor.id] ? (
                                    <div className="p-6">
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-md font-semibold text-gray-900">
                                          Locations & Sellers
                                        </h4>
                                        <button
                                          onClick={() => {
                                            setSelectedDistributorId(distributor.id);
                                            setShowLocationModal(true);
                                          }}
                                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Add Location
                                        </button>
                                      </div>
                                      {distributorDetails[distributor.id].locations.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {distributorDetails[distributor.id].locations.map((location) => (
                                            <div key={location.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center">
                                                  <MapPin className="w-4 h-4 text-orange-600 mr-2" />
                                                  <span className="font-medium text-gray-900 text-sm">
                                                    {location.name}
                                                  </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    {location._count.sellers} Sellers
                                                  </span>
                                                  <button
                                                    onClick={() => {
                                                      setSelectedLocationId(location.id);
                                                      setSelectedDistributorId(distributor.id);
                                                      setShowSellerModal(true);
                                                    }}
                                                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                  >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Seller
                                                  </button>
                                                </div>
                                              </div>
                                              {location.sellers.length > 0 && (
                                                <div className="mt-2">
                                                  <div className="text-xs text-gray-600 mb-1">Sellers:</div>
                                                  <div className="space-y-1">
                                                    {location.sellers.map((seller) => (
                                                      <div
                                                        key={seller.id}
                                                        className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1"
                                                      >
                                                        {seller.name} ({seller.email})
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-gray-500 text-sm">No locations found for this distributor.</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-6 text-center">
                                      <p className="text-red-500 text-sm">Failed to load details</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {distributors.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No distributors</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new distributor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateLocation}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-orange-600 mr-3" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Location</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        value={locationFormData.name}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="Enter location name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={locationFormData.contactPerson}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Contact person name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={locationFormData.email}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="location@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telephone
                      </label>
                      <input
                        type="tel"
                        value={locationFormData.telephone}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={locationFormData.password}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="Password for location account"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={locationFormData.notes}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isCreatingLocation}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Location'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationModal(false)
                      setSelectedDistributorId(null)
                      setLocationFormData({ name: "", contactPerson: "", email: "", password: "", telephone: "", notes: "" })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Seller Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateSeller}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Seller</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seller Name *
                      </label>
                      <input
                        type="text"
                        value={sellerFormData.name}
                        onChange={(e) => setSellerFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="Enter seller name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={sellerFormData.email}
                        onChange={(e) => setSellerFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="seller@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={sellerFormData.password}
                        onChange={(e) => setSellerFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="Password for seller account"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isCreatingSeller}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSeller ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Seller'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerModal(false)
                      setSelectedLocationId(null)
                      setSelectedDistributorId(null)
                      setSellerFormData({ name: "", email: "", password: "" })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
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
