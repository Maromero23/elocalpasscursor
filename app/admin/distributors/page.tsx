"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { MapPin, Building2, Users, ChevronRight, ChevronDown } from "lucide-react"

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
    users: {
      id: string
      name: string
      email: string
      role: string
    }[]
    _count: {
      users: number
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

              <div className="grid gap-6">
                {distributors.map((distributor) => {
                  const isExpanded = expandedDistributor === distributor.id
                  const details = distributorDetails[distributor.id]
                  const isLoadingDetails = loadingDetails[distributor.id]

                  return (
                    <div
                      key={distributor.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Distributor Header - Clickable */}
                      <div
                        onClick={() => handleDistributorClick(distributor.id)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <Building2 className="w-10 h-10 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {distributor.name}
                              </h3>
                              <p className="text-sm text-gray-600">{distributor.user.email}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {distributor.user.role}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Created: {new Date(distributor.user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {distributor._count.locations} Locations
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {isLoadingDetails ? (
                            <div className="p-6 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading details...</p>
                            </div>
                          ) : details ? (
                            <div className="p-6">
                              <h4 className="text-md font-semibold text-gray-900 mb-4">
                                Locations & Sellers
                              </h4>
                              {details.locations.length > 0 ? (
                                <div className="space-y-4">
                                  {details.locations.map((location) => (
                                    <div
                                      key={location.id}
                                      className="bg-white rounded-md p-4 border border-gray-200"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <MapPin className="w-5 h-5 text-orange-600" />
                                          <span className="font-medium text-gray-900">
                                            {location.name}
                                          </span>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          {location._count.users} Sellers
                                        </span>
                                      </div>
                                      {location.users.length > 0 && (
                                        <div className="ml-7">
                                          <div className="text-sm text-gray-600">
                                            <strong>Sellers:</strong>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 mt-2">
                                            {location.users.map((seller) => (
                                              <div
                                                key={seller.id}
                                                className="text-sm text-gray-700 bg-gray-100 rounded px-2 py-1"
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
                                <p className="text-sm text-gray-500 italic">
                                  No locations assigned to this distributor yet.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-6 text-center text-sm text-gray-500">
                              Failed to load details
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
    </ProtectedRoute>
  )
}
