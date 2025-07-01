"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Building2, Plus, Search, Upload, Download, Edit, Trash2, Eye, Users, TrendingUp, FileSpreadsheet, RefreshCw, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"

interface Affiliate {
  id: string
  affiliateNum: string | null
  isActive: boolean
  name: string
  firstName: string | null
  lastName: string | null
  email: string
  workPhone: string | null
  whatsApp: string | null
  address: string | null
  web: string | null
  description: string | null
  city: string | null
  maps: string | null
  location: string | null
  discount: string | null
  logo: string | null
  facebook: string | null
  instagram: string | null
  category: string | null
  subCategory: string | null
  service: string | null
  type: string | null
  sticker: string | null
  rating: number | null
  recommended: boolean
  termsConditions: string | null
  totalVisits: number
  lastVisitAt: string | null
  createdAt: string
  updatedAt: string
}

interface AffiliateResponse {
  success: boolean
  data: Affiliate[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  summary: {
    total: number
    active: number
    totalVisits: number
  }
}

export default function AdminAffiliates() {
  const { data: session, status } = useSession()
  const { notifications, removeToast, success, error } = useToast()
  
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'active', 'inactive', 'all'
  const [categoryFilter, setCategoryFilter] = useState('')
  
  // Summary data
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    totalVisits: 0
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)

  // Check admin authentication
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="w-8 h-8 animate-spin" />
    </div>
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">Access denied. Admin privileges required.</p>
    </div>
  }

  // Load affiliates
  useEffect(() => {
    loadAffiliates()
  }, [currentPage, searchTerm, statusFilter, categoryFilter])

  const loadAffiliates = async () => {
    setSearching(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter })
      })

      const response = await fetch(`/api/admin/affiliates?${params}`)
      const data: AffiliateResponse = await response.json()

      if (data.success) {
        setAffiliates(data.data)
        setPagination(data.pagination)
        setSummary(data.summary)
      } else {
        error('Failed to load affiliates')
      }
    } catch (err) {
      console.error('Load error:', err)
      error('Failed to load affiliates')
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      error('Please paste CSV data')
      return
    }

    setImporting(true)
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'import-csv',
          csvData: csvData.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        success('Import Complete!', `${result.imported} affiliates imported, ${result.errors} errors`)
        setCsvData('')
        setShowImportModal(false)
        loadAffiliates()
      } else {
        error('Import Failed', result.message || 'Unknown error')
      }
    } catch (err) {
      console.error('Import error:', err)
      error('Import Failed', 'Unable to process CSV data')
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteAffiliate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all visit records.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        success('Affiliate Deleted', result.message)
        loadAffiliates()
      } else {
        error('Delete Failed', result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Delete error:', err)
      error('Delete Failed', 'Unable to delete affiliate')
    }
  }

  const exportCSV = () => {
    const headers = [
      'Affiliate #', 'Active', 'Name', 'FirstName', 'LastName', 'Email', 'WorkPhone', 'WhatsApp',
      'Address', 'Web', 'Description', 'City', 'Maps', 'Location', 'Discount', 'Logo',
      'Facebook', 'Instagram', 'Category', 'Sub-Category', 'Service', 'Type', 'Sticker',
      'Rating', 'Recommended', 'Terms&Cond', 'Total Visits', 'Last Visit'
    ]
    
    const csvContent = [
      headers.join(','),
      ...affiliates.map(a => [
        a.affiliateNum || '',
        a.isActive ? 'true' : 'false',
        `"${a.name}"`,
        a.firstName || '',
        a.lastName || '',
        a.email,
        a.workPhone || '',
        a.whatsApp || '',
        `"${a.address || ''}"`,
        a.web || '',
        `"${a.description || ''}"`,
        a.city || '',
        a.maps || '',
        a.location || '',
        `"${a.discount || ''}"`,
        a.logo || '',
        a.facebook || '',
        a.instagram || '',
        a.category || '',
        a.subCategory || '',
        a.service || '',
        a.type || '',
        a.sticker || '',
        a.rating || '',
        a.recommended ? 'true' : 'false',
        `"${a.termsConditions || ''}"`,
        a.totalVisits,
        a.lastVisitAt ? new Date(a.lastVisitAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `affiliates-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredAffiliates = affiliates.filter(affiliate =>
    affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (affiliate.city && affiliate.city.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
                <p className="text-sm text-gray-600">Manage businesses offering ELocalPass discounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center px-4 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Affiliate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Affiliates</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.total}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.active}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Visits</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.totalVisits}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, email, city..."
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder="Category filter..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadAffiliates}
                disabled={searching}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center w-full justify-center"
              >
                {searching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Affiliates ({filteredAffiliates.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Loading affiliates...</p>
            </div>
          ) : filteredAffiliates.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No affiliates found</p>
              <p className="text-sm text-gray-400">Try adjusting your search criteria or import some affiliates</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {affiliate.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {affiliate.category && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    {affiliate.category}
                                  </span>
                                )}
                                #{affiliate.affiliateNum}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{affiliate.email}</div>
                          <div className="text-sm text-gray-500">{affiliate.city}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{affiliate.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {affiliate.discount || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {affiliate.totalVisits}
                          </div>
                          <div className="text-sm text-gray-500">
                            {affiliate.lastVisitAt ? 
                              new Date(affiliate.lastVisitAt).toLocaleDateString() : 
                              'Never'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            affiliate.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {affiliate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditingAffiliate(affiliate)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAffiliate(affiliate.id, affiliate.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                      {' '}({pagination.totalCount} total)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={!pagination.hasPreviousPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Import Affiliates from CSV
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected CSV Format:
                  </label>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                    Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,Terms&Cond
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste CSV Data:
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="Paste your CSV data here..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportCSV}
                    disabled={importing || !csvData.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastNotifications notifications={notifications} onRemove={removeToast} />
    </div>
  )
} 