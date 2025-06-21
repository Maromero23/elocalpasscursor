"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { MapPin, Building2, Users, Search, Filter, QrCode } from "lucide-react"

interface Location {
  id: string
  name: string
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
  distributor: {
    id: string
    name: string
    user: {
      name: string
      email: string
    }
  }
  _count: {
    users: number
  }
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

export default function LocationsPage() {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [distributorFilter, setDistributorFilter] = useState("")

  const navItems = getNavItems(session?.user?.role || "")

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    filterLocations()
  }, [locations, searchTerm, distributorFilter])

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        setError("Failed to fetch locations")
      }
    } catch (error) {
      setError("Error fetching locations")
    } finally {
      setLoading(false)
    }
  }

  const filterLocations = () => {
    let filtered = locations

    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (distributorFilter) {
      filtered = filtered.filter(location =>
        location.distributor.id === distributorFilter
      )
    }

    setFilteredLocations(filtered)
  }

  const uniqueDistributors = Array.from(
    new Set(locations.map(loc => loc.distributor.id))
  ).map(id => locations.find(loc => loc.distributor.id === id)?.distributor).filter(Boolean)

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
                <span className="text-xs text-orange-200">3:10 AM</span>
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
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Location Management</h2>
                <Link
                  href="/admin/locations/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add New Location
                </Link>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search locations, managers, or emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={distributorFilter}
                      onChange={(e) => setDistributorFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Distributors</option>
                      {uniqueDistributors.map((distributor) => (
                        <option key={distributor!.id} value={distributor!.id}>
                          {distributor!.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="grid gap-6">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <MapPin className="w-10 h-10 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {location.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Manager: {location.user.name} ({location.user.email})
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {location.user.role}
                            </span>
                            <span className="text-xs text-gray-500">
                              Under: {location.distributor.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              Created: {new Date(location.user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {location._count.users} Sellers
                          </div>
                          <div className="text-xs text-gray-500">
                            Distributor: {location.distributor.user.name}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/locations/${location.id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/locations/${location.id}/edit`}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredLocations.length === 0 && !loading && (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm || distributorFilter ? "No locations found" : "No locations"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || distributorFilter
                      ? "Try adjusting your search criteria."
                      : "Get started by creating a new location."}
                  </p>
                  {(searchTerm || distributorFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setDistributorFilter("")
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {/* Summary Stats */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">Total Locations</div>
                  <div className="text-2xl font-bold text-blue-900">{locations.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">Total Sellers</div>
                  <div className="text-2xl font-bold text-green-900">
                    {locations.reduce((sum, loc) => sum + loc._count.users, 0)}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">Active Distributors</div>
                  <div className="text-2xl font-bold text-orange-900">{uniqueDistributors.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
