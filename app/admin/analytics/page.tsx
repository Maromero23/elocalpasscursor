"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { 
  Building2, Users, MapPin, QrCode, TrendingUp, DollarSign, 
  Calendar, Eye, Filter, Download, Search, ChevronDown,
  BarChart3, PieChart, LineChart, Users2, Globe, Mail
} from "lucide-react"

interface QRAnalytics {
  id: string
  qrCode: string
  customerName: string
  customerEmail: string
  guests: number
  days: number
  cost: number
  discountAmount: number
  sellerName: string
  sellerEmail: string
  locationName: string
  distributorName: string
  deliveryMethod: string
  language: string
  createdAt: string
  expiresAt: string
  isActive: boolean
}

interface AnalyticsSummary {
  totalQRCodes: number
  totalRevenue: number
  totalCustomers: number
  totalGuests: number
  avgDays: number
  avgCost: number
  activeQRCodes: number
  expiredQRCodes: number
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ]
  }
  return []
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [analytics, setAnalytics] = useState<QRAnalytics[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Filters
  const [dateRange, setDateRange] = useState("30") // days
  const [distributorFilter, setDistributorFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // View options
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showAllQRCodes, setShowAllQRCodes] = useState(false)

  // Scroll synchronization refs
  const topScrollRef = useRef<HTMLDivElement>(null)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const fixedScrollRef = useRef<HTMLDivElement>(null)

  // Scroll synchronization functions
  const syncScrollFromTop = (e: React.UIEvent<HTMLDivElement>) => {
    if (mainScrollRef.current && fixedScrollRef.current) {
      mainScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
      fixedScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const syncScrollFromMain = (e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current && fixedScrollRef.current) {
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
      fixedScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const syncScrollFromFixed = (e: React.UIEvent<HTMLDivElement>) => {
    if (mainScrollRef.current && topScrollRef.current) {
      mainScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dateRange: showAllQRCodes ? "all" : dateRange,
        distributorId: distributorFilter !== "all" ? distributorFilter : "",
        locationId: locationFilter !== "all" ? locationFilter : "",
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/analytics?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch analytics")
      }

      const data = await response.json()
      setAnalytics(data.data || [])
      setSummary(data.summary || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAnalytics()
    }
  }, [session, dateRange, distributorFilter, locationFilter, statusFilter, searchQuery, sortBy, sortOrder, showAllQRCodes])

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Cancun'
    })
  }
  
  const truncateEmail = (email: string, maxLength: number = 25) => {
    if (email.length <= maxLength) return email
    return email.substring(0, maxLength) + '...'
  }

  const handleShowAllQRCodes = () => {
    setShowAllQRCodes(true)
    setDateRange("all")
    setStatusFilter("all")
    setSearchQuery("")
  }

  const getStatusBadge = (qr: QRAnalytics) => {
    const isExpired = new Date(qr.expiresAt) <= new Date()
    if (!qr.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>
    }
    if (isExpired) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
  }

  const exportToCSV = () => {
    const headers = [
      "QR Code", "Customer Name", "Customer Email", "Guests", "Days", "Cost", "Discount",
      "Seller", "Location", "Distributor", "Delivery Method", "Language",
      "Created Date", "Expires Date", "Status"
    ]
    
    const csvData = analytics.map(qr => [
      qr.qrCode,
      qr.customerName,
      qr.customerEmail,
      qr.guests,
      qr.days,
      qr.cost,
      qr.discountAmount > 0 ? qr.discountAmount : 0,
      qr.sellerName,
      qr.locationName,
      qr.distributorName,
      qr.deliveryMethod,
      qr.language,
      formatDate(qr.createdAt),
      formatDate(qr.expiresAt),
      new Date(qr.expiresAt) <= new Date() ? "Expired" : qr.isActive ? "Active" : "Inactive"
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qr-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <style dangerouslySetInnerHTML={{ __html: `
        .table-scroll-container::-webkit-scrollbar {
          height: 12px;
        }
        .table-scroll-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 8px;
          border: 2px solid #f7fafc;
        }
        .table-scroll-container::-webkit-scrollbar-track {
          background-color: #f1f1f1;
          border-radius: 8px;
        }
        .table-scroll-container {
          scrollbar-width: auto !important;
          overflow-x: scroll !important;
        }
      `}} />
      <div className="min-h-screen bg-gray-100 w-full">

        {/* Navigation */}
        <nav className="bg-orange-400 shadow-sm w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === '/admin/analytics'
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? "text-white bg-orange-500"
                            : "text-orange-100 hover:text-white hover:bg-orange-500"
                        }`}
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
                
                {/* QR Generator Navigation for Independent Sellers */}
                {session?.user?.role === "INDEPENDENT_SELLER" && (
                  <Link
                    href="/seller"
                    className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-100 hover:text-white hover:bg-orange-600 transition-colors"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Generator
                  </Link>
                )}
                
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

        {/* Main Content - Full Width */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 w-full">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
                  <p className="text-gray-600">Comprehensive QR code performance and revenue analytics</p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <QrCode className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total QR Codes</dt>
                            <dd className="text-lg font-medium text-gray-900">{summary.totalQRCodes}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DollarSign className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                            <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalRevenue)}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                            <dd className="text-lg font-medium text-gray-900">{summary.totalCustomers}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">Active QR Codes</dt>
                            <dd className="text-lg font-medium text-gray-900">{summary.activeQRCodes}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="365">Last year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="cost">Cost</option>
                      <option value="customerName">Customer Name</option>
                      <option value="qrCode">QR Code</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleShowAllQRCodes}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {showAllQRCodes ? "Show Recent" : "Show All"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search QR codes, customers, or emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Analytics Table - Full Width with Horizontal Scroll */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {showAllQRCodes ? "Complete QR Code History" : "QR Code Analytics"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {showAllQRCodes 
                  ? "Complete historical view of all QR codes ever created in the system"
                  : "Detailed view of all QR code transactions and performance"
                }
              </p>
            </div>

            {/* Top scroll bar */}
            <div 
              ref={topScrollRef}
              className="overflow-x-scroll table-scroll-container" 
              style={{ 
                scrollBehavior: 'auto',
                scrollbarWidth: 'auto',
                msOverflowStyle: 'scrollbar',
                WebkitOverflowScrolling: 'touch',
                height: '20px'
              }}
              onWheel={(e) => {
                if (e.shiftKey) {
                  e.preventDefault()
                  const container = e.currentTarget
                  container.scrollLeft += e.deltaY * 3
                }
              }}
              onScroll={syncScrollFromTop}
            >
              <div style={{ 
                width: '2500px', // Wide enough for all analytics columns + large safety margin
                height: '1px'
              }}></div>
            </div>

            {/* Main table container */}
            <div 
              ref={mainScrollRef}
              className="overflow-x-scroll table-scroll-container" 
              style={{ 
                scrollBehavior: 'auto',
                scrollbarWidth: 'auto',
                msOverflowStyle: 'scrollbar',
                WebkitOverflowScrolling: 'touch'
              }}
              onWheel={(e) => {
                if (e.shiftKey) {
                  e.preventDefault()
                  const container = e.currentTarget
                  container.scrollLeft += e.deltaY * 3
                }
              }}
              onScroll={syncScrollFromMain}
            >
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '2500px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        QR Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.map((qr) => (
                      <tr key={qr.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{qr.qrCode}</div>
                          <div className="text-sm text-gray-500">{qr.deliveryMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{qr.customerName}</div>
                          <div className="text-sm text-gray-500" title={qr.customerEmail}>{truncateEmail(qr.customerEmail)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{qr.guests} guests • {qr.days} days</div>
                          <div className="text-sm text-gray-500">Expires: {formatDate(qr.expiresAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(qr.cost)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {qr.discountAmount > 0 ? `-${formatCurrency(qr.discountAmount)}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{qr.sellerName}</div>
                          <div className="text-sm text-gray-500" title={qr.sellerEmail}>{truncateEmail(qr.sellerEmail)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{qr.locationName}</div>
                          <div className="text-sm text-gray-500">{qr.distributorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(qr.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(qr)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>

            {analytics.length === 0 && (
              <div className="text-center py-12">
                <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {showAllQRCodes ? "No QR codes found" : "No analytics data"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {showAllQRCodes 
                    ? "No QR codes have been created yet in the system."
                    : "No QR codes match your current filters."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Scroll Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-40"
        style={{ height: '12px' }}
      >
        <div
          ref={fixedScrollRef}
          className="w-full h-full overflow-x-auto overflow-y-hidden table-scroll-container"
          style={{
            scrollbarWidth: 'auto',
            msOverflowStyle: 'scrollbar',
          }}
          onScroll={syncScrollFromFixed}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.preventDefault()
              if (fixedScrollRef.current) {
                fixedScrollRef.current.scrollLeft += e.deltaY
              }
            }
          }}
        >
          <div 
            style={{ 
              width: '2500px',
              height: '1px'
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
} 