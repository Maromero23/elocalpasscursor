"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  Eye, 
  RefreshCw, 
  Filter, 
  AlertCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Building2,
  Users,
  MapPin,
  QrCode,
  TrendingUp,
  DollarSign
} from "lucide-react"

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

interface ScheduledQR {
  id: string
  clientName: string
  clientEmail: string
  guests: number
  days: number
  amount: number
  discountAmount: number
  scheduledFor: string
  isProcessed: boolean
  processedAt?: string
  createdQRCodeId?: string
  deliveryMethod: string
  createdAt: string
  status: 'pending' | 'overdue'
  statusColor: string
  timeFromNow: number
  timeFromNowText: string
  seller: {
    id: string
    name: string
    email: string
    locationName?: string
    distributorName?: string
  }
}

interface ApiResponse {
  success: boolean
  data: ScheduledQR[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  summary: {
    pending: number
    overdue: number
    total: number
  }
}

export default function ScheduledQRsAdminPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [scheduledQRs, setScheduledQRs] = useState<ScheduledQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [summary, setSummary] = useState({ pending: 0, overdue: 0, total: 0 })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Scroll synchronization refs (same as distributors page)
  const topScrollRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const fixedScrollRef = useRef<HTMLDivElement>(null)

  // Scroll synchronization functions (same as distributors page)
  const syncScrollFromTop = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = scrollLeft
    if (fixedScrollRef.current) fixedScrollRef.current.scrollLeft = scrollLeft
  }

  const syncScrollFromTable = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    if (topScrollRef.current) topScrollRef.current.scrollLeft = scrollLeft
    if (fixedScrollRef.current) fixedScrollRef.current.scrollLeft = scrollLeft
  }

  const syncScrollFromFixed = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft
    if (topScrollRef.current) topScrollRef.current.scrollLeft = scrollLeft
    if (tableScrollRef.current) tableScrollRef.current.scrollLeft = scrollLeft
  }

  const fetchScheduledQRs = async (page = 1, status = 'all') => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/scheduled-qrs?page=${page}&status=${status}`)
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setScheduledQRs(data.data)
        setPagination(data.pagination)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching scheduled QRs:', error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchScheduledQRs(currentPage, statusFilter)
  }, [currentPage, statusFilter])

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleStatusFilter = () => {
    setStatusFilter(prev => {
      if (prev === 'all') return 'pending'
      if (prev === 'pending') return 'overdue'
      return 'all'
    })
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchScheduledQRs(currentPage, statusFilter)
  }

  const handleRetryOverdue = async () => {
    if (summary.overdue === 0) return
    
    try {
      const response = await fetch('/api/scheduled-qr/retry-overdue', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Retry overdue result:', result)
        // Refresh the data
        fetchScheduledQRs(currentPage, statusFilter)
      }
    } catch (error) {
      console.error('Error retrying overdue QRs:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation - Same as distributors page */}
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

        {/* Main Content - Full Width - Same structure as distributors page */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 w-full">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduled QR Codes</h2>
                  <p className="text-gray-600">Manage and monitor scheduled QR code deliveries</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span>Refresh</span>
                  </button>
                  {summary.overdue > 0 && (
                    <button
                      onClick={handleRetryOverdue}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Retry Overdue ({summary.overdue})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.overdue}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters - Same structure as distributors page */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <button 
                      onClick={handleSort}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-gray-900"
                    >
                      <span className="text-gray-900">Scheduled Date</span>
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                    <button 
                      onClick={handleStatusFilter}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-gray-900"
                    >
                      <span className="text-gray-900">
                        {statusFilter === 'all' ? 'All Status' : statusFilter === 'pending' ? 'Pending Only' : 'Overdue Only'}
                      </span>
                      {statusFilter === 'all' ? (
                        <Filter className="h-4 w-4 text-gray-600" />
                      ) : statusFilter === 'pending' ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
                    <select
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                    >
                      <option value="table">Table View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Show Only</label>
                    <select
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                    >
                      <option value="all">All Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search scheduled QRs..."
                      disabled
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Top scroll bar - Same as distributors page */}
              <div className="mb-4">
                <div
                  ref={topScrollRef}
                  className="overflow-x-auto overflow-y-hidden"
                  style={{
                    scrollbarWidth: 'auto',
                    msOverflowStyle: 'scrollbar',
                  }}
                  onScroll={syncScrollFromTop}
                >
                  <div style={{ width: '1500px', height: '1px' }} />
                </div>
              </div>

              {/* Main table container - Same structure as distributors page */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div
                  ref={tableScrollRef}
                  className="overflow-x-auto"
                  onScroll={syncScrollFromTable}
                >
                  <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1500px' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheduled For
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Until
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Loading scheduled QRs...
                          </td>
                        </tr>
                      ) : scheduledQRs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            No scheduled QRs found
                          </td>
                        </tr>
                      ) : (
                        scheduledQRs.map((qr) => (
                          <tr key={qr.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{qr.clientName}</div>
                              <div className="text-sm text-gray-500">{qr.clientEmail}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {qr.guests} guests, {qr.days} days
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(qr.amount)}</div>
                              {qr.discountAmount > 0 && (
                                <div className="text-sm text-green-600">-{formatCurrency(qr.discountAmount)} discount</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{qr.seller.name}</div>
                              <div className="text-sm text-gray-500">{qr.seller.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(qr.scheduledFor)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                qr.status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {qr.status === 'pending' ? 'Pending' : 'Overdue'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {qr.timeFromNowText}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(qr.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom table scroll bar - Same as distributors page */}
                <div className="border-t border-gray-200">
                  <div
                    className="overflow-x-auto overflow-y-hidden"
                    style={{
                      scrollbarWidth: 'auto',
                      msOverflowStyle: 'scrollbar',
                    }}
                    onScroll={syncScrollFromTable}
                  >
                    <div style={{ width: '1500px', height: '1px' }} />
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed bottom scroll bar - Same as distributors page */}
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
                width: '1500px', // Same width as table
                height: '1px'
              }}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 