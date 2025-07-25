"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../components/auth/protected-route"
import Link from "next/link"
import { Building2, Users, MapPin, QrCode, TrendingUp, Eye, Clock, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"

interface DashboardStats {
  totalDistributors: number
  activeLocations: number
  qrCodesIssued: number
  monthlyRevenue: number
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/affiliates", label: "Affiliates", icon: Building2 },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
      { href: "/admin/scheduled", label: "Scheduled QRs", icon: Clock },
      { href: "/admin/website-sales", label: "Website Sales", icon: DollarSign },
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ]
  }
  return []
}

export default function AdminPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [stats, setStats] = useState<DashboardStats>({
    totalDistributors: 0,
    activeLocations: 0,
    qrCodesIssued: 0,
    monthlyRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">System Overview</h2>
                <p className="text-gray-600">Manage your ELocalPass distribution network</p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 aspect-square flex flex-col justify-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Distributors
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.totalDistributors.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 aspect-square flex flex-col justify-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MapPin className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Locations
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.activeLocations.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 aspect-square flex flex-col justify-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <QrCode className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          QR Codes Issued
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : stats.qrCodesIssued.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 aspect-square flex flex-col justify-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Monthly Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {loading ? '-' : formatCurrency(stats.monthlyRevenue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Link
                  href="/admin/distributors"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Distributors</h3>
                  <p className="text-sm text-gray-600">
                    Create, edit, and monitor distributor accounts and their performance
                  </p>
                </Link>

                <Link
                  href="/admin/locations"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-gray-200 transition-colors">
                    <MapPin className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Management</h3>
                  <p className="text-sm text-gray-600">
                    Oversee all locations and their assigned managers and sellers
                  </p>
                </Link>

                <Link
                  href="/admin/sellers"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4 group-hover:bg-orange-200 transition-colors">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Sellers</h3>
                  <p className="text-sm text-gray-600">
                    Create seller accounts and configure their QR code settings
                  </p>
                </Link>

                <Link
                  href="/admin/affiliates"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4 group-hover:bg-indigo-200 transition-colors">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Affiliates</h3>
                  <p className="text-sm text-gray-600">
                    Import and manage 500+ businesses that accept ELocalPass discounts
                  </p>
                </Link>

                <Link
                  href="/admin/qr-config"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                    <QrCode className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Configuration</h3>
                  <p className="text-sm text-gray-600">
                    Configure QR code templates and settings for the entire system
                  </p>
                </Link>

                <Link
                  href="/admin/scheduled"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Scheduled QRs</h3>
                  <p className="text-sm text-gray-600">
                    Monitor upcoming QR code creation and precision timing system
                  </p>
                </Link>

                <Link
                  href="/admin/website-sales"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Website Sales</h3>
                  <p className="text-sm text-gray-600">
                    Track all website sales with seller attribution and delivery scheduling
                  </p>
                </Link>

                <Link
                  href="/admin/analytics"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group aspect-square flex flex-col justify-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                  <p className="text-sm text-gray-600">
                    View detailed reports and analytics across the entire network
                  </p>
                </Link>
              </div>

              {/* Recent Activity Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Activity feed will show recent actions across the system</p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-400 italic">No recent activity to display</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
