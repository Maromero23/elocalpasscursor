"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
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
  const { data: session } = useSession()
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
  const [csvPreview, setCsvPreview] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      error('Please select a valid CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setCsvData(content)
        setCsvPreview(null) // Reset preview when new file is loaded
        success('File Loaded!', `${file.name} loaded successfully. Click Preview to check the data.`)
      }
    }
    reader.onerror = () => {
      error('File Error', 'Failed to read the CSV file')
    }
    reader.readAsText(file)
  }

  const handlePreviewCSV = async () => {
    if (!csvData.trim()) {
      error('Please upload a CSV file or paste CSV data first')
      return
    }

    setPreviewing(true)
    try {
      const response = await fetch('/api/admin/affiliates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvData.trim() })
      })

      const result = await response.json()

      if (result.success) {
        setCsvPreview(result.preview)
        success('Preview Generated!', `Found ${result.preview.totalRows} rows to process`)
      } else {
        error('Preview Failed', result.error || 'Unable to preview CSV')
      }
    } catch (err) {
      console.error('Preview error:', err)
      error('Preview Failed', 'Unable to generate preview')
    } finally {
      setPreviewing(false)
    }
  }

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      error('Please upload a CSV file or paste CSV data')
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
        setCsvPreview(null)
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

  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/bulk-delete', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        success('All Data Cleared', `Deleted ${result.deleted} affiliates and their visit records`)
        loadAffiliates()
      } else {
        error('Bulk Delete Failed', result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Bulk delete error:', err)
      error('Bulk Delete Failed', 'Unable to clear all affiliate data')
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
    <ProtectedRoute allowedRoles={["ADMIN"]}>
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
              {summary.total > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`⚠️ WARNING: This will delete ALL ${summary.total} affiliates and their visit records. This cannot be undone. Are you absolutely sure?`)) {
                      if (confirm(`🚨 FINAL CONFIRMATION: Delete ${summary.total} affiliates permanently?`)) {
                        handleBulkDelete()
                      }
                    }
                  }}
                  className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </button>
              )}
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
                <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '2000px' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Phone
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        WhatsApp
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facebook
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instagram
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sub-Category
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommended
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visits
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {affiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-white z-10">
                          #{affiliate.affiliateNum || affiliate.id.slice(-3)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            affiliate.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {affiliate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {affiliate.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.firstName || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.lastName || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                          <a href={`mailto:${affiliate.email}`} className="hover:underline">
                            {affiliate.email}
                          </a>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.workPhone || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600">
                          {affiliate.whatsApp ? (
                            <a href={`https://wa.me/${affiliate.whatsApp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {affiliate.whatsApp}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {affiliate.address || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                          {affiliate.web ? (
                            <a href={affiliate.web} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {affiliate.web.length > 30 ? affiliate.web.substring(0, 30) + '...' : affiliate.web}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">
                          {affiliate.description || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.city || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.location || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                          {affiliate.discount || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                          {affiliate.facebook ? (
                            <a href={affiliate.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Facebook
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                          {affiliate.instagram ? (
                            <a href={affiliate.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              Instagram
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {affiliate.category}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.subCategory || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.service || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.type || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.rating ? (
                            <span className="text-yellow-600">★ {affiliate.rating}</span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {affiliate.recommended ? (
                            <span className="text-green-600">✓ Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm font-medium">{affiliate.totalVisits}</div>
                          <div className="text-xs text-gray-500">
                            {affiliate.lastVisitAt ? 
                              new Date(affiliate.lastVisitAt).toLocaleDateString() : 
                              'Never'
                            }
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setEditingAffiliate(affiliate)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAffiliate(affiliate.id, affiliate.name)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
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
                  <div className="bg-gray-50 p-3 rounded border text-xs font-mono text-gray-800 overflow-x-auto">
                    <div className="whitespace-nowrap">
                      Affiliate #,Active,Name,FirstName,LastName,Email,WorkPhone,WhatsApp,Address,Web,Descripcion,City,Maps,Location,Discount,Logo,Facebook,Instagram,Category,Sub-Categoria,Service,Type,Sticker,Rating,Recommended,Terms&Cond
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option 1: Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select a .csv file from your computer</p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option 2: Paste CSV Data
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => {
                      setCsvData(e.target.value)
                      setCsvPreview(null) // Reset preview when data changes
                    }}
                    placeholder="Paste your CSV data here..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Preview Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handlePreviewCSV}
                    disabled={previewing || !csvData.trim()}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center"
                  >
                    {previewing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Data
                      </>
                    )}
                  </button>
                </div>

                {/* CSV Preview */}
                {csvPreview && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
                      
                      {/* Header Check */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          {csvPreview.headerMatch ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            Headers: {csvPreview.headers.length} found (expected {csvPreview.expectedHeaders.length})
                          </span>
                        </div>
                        {!csvPreview.headerMatch && (
                          <div className="text-xs text-red-600 ml-7">
                            Column count mismatch may cause import issues
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{csvPreview.totalRows}</div>
                          <div className="text-gray-500">Total Rows</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{csvPreview.estimatedValid}</div>
                          <div className="text-gray-500">Valid Rows</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{csvPreview.estimatedInvalid}</div>
                          <div className="text-gray-500">Invalid Rows</div>
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">Row</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">Name</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">Email</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">City</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">Discount</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {csvPreview.previewRows.map((row: any, idx: number) => (
                              <tr key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                                <td className="px-2 py-1">{row.rowNumber}</td>
                                <td className="px-2 py-1 font-medium">{row.values[2] || '-'}</td>
                                <td className="px-2 py-1">{row.values[5] || '-'}</td>
                                <td className="px-2 py-1">{row.values[11] || '-'}</td>
                                <td className="px-2 py-1">{row.values[14] || '-'}</td>
                                <td className="px-2 py-1">
                                  {row.isValid ? (
                                    <span className="text-green-600">✓ Valid</span>
                                  ) : (
                                    <span className="text-red-600">✗ Issues</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {csvPreview.previewRows.some((row: any) => !row.isValid) && (
                        <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                          <h5 className="font-medium text-red-800 mb-2">Issues Found:</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {csvPreview.previewRows
                              .filter((row: any) => !row.isValid)
                              .map((row: any, idx: number) => (
                                <li key={idx}>
                                  Row {row.rowNumber}: {row.issues.join(', ')}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setCsvData('')
                      setCsvPreview(null)
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportCSV}
                    disabled={importing || !csvData.trim() || !csvPreview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    title={!csvPreview ? 'Please preview your data first' : ''}
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import {csvPreview ? `(${csvPreview.estimatedValid} valid rows)` : ''}
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
    </ProtectedRoute>
  )
} 