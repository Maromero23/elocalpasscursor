"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../components/auth/protected-route"
import Link from "next/link"
import { Building2, Users, MapPin, QrCode, TrendingUp, Eye, Clock } from "lucide-react"

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
      { href: "/admin/scheduled", label: "Scheduled QRs", icon: Clock },
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ]
  }
  return []
}

export default function AdminPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")

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
                <span className="text-xs text-orange-200">1:50 PM</span>
                <span className="text-sm text-orange-100">Welcome, {session?.user?.name}</span>
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
                <div className="bg-white rounded-lg shadow p-6">
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
                          -
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
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
                          -
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
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
                          -
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
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
                          -
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <Link
                  href="/admin/distributors"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
                  href="/admin/qr-config"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
                  href="/admin/analytics"
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
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
