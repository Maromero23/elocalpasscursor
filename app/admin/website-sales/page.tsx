'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { ProtectedRoute } from '../../../components/auth/protected-route'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  MapPin, 
  QrCode, 
  TrendingUp, 
  Eye, 
  Clock, 
  DollarSign,
  CalendarIcon, 
  UserIcon, 
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
  SearchIcon,
  DownloadIcon,
  ArrowUp,
  ArrowDown,
  Filter,
  EyeOff
} from 'lucide-react'

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

interface WebsiteSale {
  id: string
  qrCode: string
  customerName: string
  customerEmail: string
  amount: number
  guests: number
  days: number
  expiresAt: string
  createdAt: string
  isActive: boolean
  deliveryType: 'immediate' | 'scheduled'
  scheduledFor?: string
  isProcessed?: boolean
  locationDisplay?: string
  seller: {
    id: string
    name: string
    email: string
    location?: {
      name: string
      distributor?: {
        name: string
      }
    }
  }
}

interface SalesSummary {
  totalSales: number
  totalRevenue: number
  immediateDeliveries: number
  scheduledDeliveries: number
  activeQRCodes: number
  expiredQRCodes: number
}

export default function WebsiteSalesPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  const [sales, setSales] = useState<WebsiteSale[]>([])
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalRevenue: 0,
    immediateDeliveries: 0,
    scheduledDeliveries: 0,
    activeQRCodes: 0,
    expiredQRCodes: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sellers, setSellers] = useState<Array<{id: string, name: string}>>([])
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

  const fetchSales = async () => {
    console.log('🔄 Fetching sales...')
    setLoading(true)
    
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        search: searchTerm,
        status: statusFilter,
        seller: sellerFilter,
        delivery: deliveryFilter
      })
      
      const apiUrl = `/api/admin/website-sales?${queryParams}`
      console.log('📡 API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('📊 Response status:', response.status)
      
      const data = await response.json()
      console.log('✅ API Response:', data)
      
      if (data.success) {
        setSales(data.sales || [])
        setSummary(data.summary || {
          totalSales: 0,
          totalRevenue: 0,
          immediateDeliveries: 0,
          scheduledDeliveries: 0,
          activeQRCodes: 0,
          expiredQRCodes: 0
        })
        setTotalPages(data.totalPages || 1)
        setSellers(data.sellers || [])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [currentPage, searchTerm, statusFilter, sellerFilter, deliveryFilter])

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleStatusFilter = () => {
    setStatusFilter(prev => {
      if (prev === 'all') return 'active'
      if (prev === 'active') return 'inactive'
      return 'all'
    })
    setCurrentPage(1)
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

  const exportSales = async () => {
    try {
      const response = await fetch('/api/admin/website-sales?export=true')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `website-sales-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting sales:', error)
    }
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Website Sales</h2>
                  <p className="text-gray-600">Track all PayPal purchases from the website with detailed seller information</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={exportSales}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <span>Export CSV</span>
                  </button>
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
                      <span className="text-gray-900">Date Created</span>
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
                        {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active Only' : 'Inactive Only'}
                      </span>
                      {statusFilter === 'all' ? (
                        <Filter className="h-4 w-4 text-gray-600" />
                      ) : statusFilter === 'active' ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Filter</label>
                    <select
                      value={sellerFilter}
                      onChange={(e) => { setSellerFilter(e.target.value); setCurrentPage(1) }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                    >
                      <option value="all">All Sellers</option>
                      {sellers.map(seller => (
                        <option key={seller.id} value={seller.id}>{seller.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
                    <select
                      value={deliveryFilter}
                      onChange={(e) => { setDeliveryFilter(e.target.value); setCurrentPage(1) }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                    >
                      <option value="all">All Types</option>
                      <option value="immediate">Immediate</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search sales..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
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
                          QR Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            Loading sales data...
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.qrCode}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                              <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(sale.amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {sale.guests} guests, {sale.days} days
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{sale.seller.name}</div>
                              <div className="text-sm text-gray-500">{sale.seller.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{sale.locationDisplay || 'Unknown'}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                sale.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {sale.isActive ? 'Active' : 'Expired'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sale.createdAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(sale.expiresAt)}
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
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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