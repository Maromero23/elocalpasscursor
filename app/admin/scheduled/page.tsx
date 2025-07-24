"use client"

import { useSession } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, User, Calendar, Eye, RefreshCw, Filter, AlertCircle, XCircle } from "lucide-react"

interface ScheduledQR {
  id: string
  clientName: string
  clientEmail: string
  guests: number
  days: number
  amount: number
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
  const [scheduledQRs, setScheduledQRs] = useState<ScheduledQR[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [summary, setSummary] = useState({ pending: 0, overdue: 0, total: 0 })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

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

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    fetchScheduledQRs(currentPage, statusFilter)
  }

  const handleRetryOverdue = async () => {
    if (summary.overdue === 0) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/scheduled-qr/retry-overdue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Retried ${result.retried} overdue QRs, ${result.failed} failed`)
        // Refresh the data to show updated status
        fetchScheduledQRs(currentPage, statusFilter)
      } else {
        console.error('❌ Failed to retry overdue QRs:', result.error)
      }
    } catch (error) {
      console.error('❌ Error retrying overdue QRs:', error)
    }
    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string, statusColor: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[statusColor as keyof typeof colors] || colors.gray}`}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeFromNow = (timeFromNow: number, timeFromNowText: string) => {
    if (timeFromNow < 0) {
      return <span className="text-red-600 font-medium">{timeFromNowText}</span>
    } else if (timeFromNow < 60) {
      return <span className="text-orange-600 font-medium">{timeFromNowText}</span>
    } else {
      return <span className="text-blue-600">{timeFromNowText}</span>
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
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Admin
                </Link>
                <div className="h-6 border-l border-gray-300"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-blue-600" />
                    Scheduled QRs
                  </h1>
                  <p className="text-sm text-gray-600">Monitor and manage scheduled QR code creation</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleRetryOverdue}
                  disabled={isLoading || summary.overdue === 0}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Retry Overdue ({summary.overdue})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>



            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <div className="flex space-x-2">
                  {[
                    { value: 'all', label: 'All', count: summary.total },
                    { value: 'pending', label: 'Pending', count: summary.pending },
                    { value: 'overdue', label: 'Overdue', count: summary.overdue }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => handleStatusFilterChange(filter.value)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        statusFilter === filter.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled QRs Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Scheduled QR Codes ({pagination.totalCount})
              </h3>
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, pagination.totalCount)} of {pagination.totalCount} results
              </p>
            </div>

            {isLoading ? (
              <div className="px-6 py-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Loading scheduled QRs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled For
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created QR
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduledQRs.map((qr) => (
                      <tr key={qr.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(qr.status, qr.statusColor)}
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeFromNow(qr.timeFromNow, qr.timeFromNowText)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{qr.clientName}</div>
                          <div className="text-sm text-gray-500">{qr.clientEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {qr.guests} guests • {qr.days} days
                          </div>
                          <div className="text-sm text-gray-500">{qr.deliveryMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(qr.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDateTime(qr.scheduledFor)}</div>
                          {qr.processedAt && (
                            <div className="text-xs text-gray-500">
                              Processed: {formatDateTime(qr.processedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{qr.seller.name}</div>
                          <div className="text-sm text-gray-500">{qr.seller.email}</div>
                          {qr.seller.locationName && (
                            <div className="text-xs text-gray-400">{qr.seller.locationName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {qr.createdQRCodeId ? (
                            <div className="text-sm font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
                              {qr.createdQRCodeId}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not created yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 