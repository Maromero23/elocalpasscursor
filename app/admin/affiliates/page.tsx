"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Building2, Plus, Search, Upload, Download, Edit, Trash2, Eye, Users, TrendingUp, FileSpreadsheet, RefreshCw, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react"
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
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'active', 'inactive', 'all'
  const [categoryFilter, setCategoryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [selectedAffiliates, setSelectedAffiliates] = useState<string[]>([])
  const [editingField, setEditingField] = useState<{affiliateId: string, field: string} | null>(null)
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
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

  // Default column widths
  const defaultColumnWidths = {
    select: 40,
    affiliateNum: 48,
    status: 64,
    name: 96,
    firstName: 80,
    lastName: 80,
    email: 96,
    workPhone: 80,
    whatsApp: 80,
    address: 96,
    web: 80,
    description: 96,
    city: 64,
    maps: 80,
    location: 80,
    discount: 64,
    logo: 64,
    facebook: 80,
    instagram: 80,
    category: 80,
    subCategory: 80,
    service: 64,
    type: 64,
    sticker: 64,
    rating: 64,
    recommended: 64,
    termsConditions: 64,
    visits: 64,
    actions: 80
  }

  // Column widths state for manual resizing with localStorage persistence
  const [columnWidths, setColumnWidths] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('affiliateColumnWidths')
      if (saved) {
        try {
          return { ...defaultColumnWidths, ...JSON.parse(saved) }
        } catch (e) {
          console.warn('Failed to parse saved column widths:', e)
        }
      }
    }
    return defaultColumnWidths
  })

  // Save column widths to localStorage whenever they change
  const updateColumnWidth = (field: keyof typeof columnWidths, width: number) => {
    const newWidths = { ...columnWidths, [field]: width }
    setColumnWidths(newWidths)
    if (typeof window !== 'undefined') {
      localStorage.setItem('affiliateColumnWidths', JSON.stringify(newWidths))
    }
  }

  // Load affiliates
  useEffect(() => {
    loadAffiliates()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, cityFilter, typeFilter, ratingFilter])

  const loadAffiliates = async () => {
    setSearching(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(cityFilter && { city: cityFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(ratingFilter && { rating: ratingFilter })
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
    if (selectedAffiliates.length === 0) {
      error('No Selection', 'Please select affiliates to delete')
      return
    }
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedAffiliates.length} selected affiliates? This action cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/affiliates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedAffiliates })
      })

      const result = await response.json()

      if (result.success) {
        success('Bulk Delete Complete', `Successfully deleted ${result.deleted} affiliates`)
        setSelectedAffiliates([])
        loadAffiliates()
      } else {
        error('Bulk Delete Failed', result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Bulk delete error:', err)
      error('Bulk Delete Failed', 'Unable to delete selected affiliates')
    }
  }

  const handleClearAllData = async () => {
    try {
      // Get all affiliate IDs
      const allIds = affiliates.map(a => a.id)
      
      if (allIds.length === 0) {
        error('No Data', 'No affiliates to delete')
        return
      }

      const response = await fetch('/api/admin/affiliates/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds })
      })

      const result = await response.json()

      if (result.success) {
        success('All Data Cleared', `Successfully deleted ${result.deleted} affiliates and their visit records`)
        setSelectedAffiliates([])
        loadAffiliates()
      } else {
        error('Clear All Failed', result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Clear all error:', err)
      error('Clear All Failed', 'Unable to clear all affiliate data')
    }
  }

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedAffiliates.length === affiliates.length) {
      setSelectedAffiliates([])
    } else {
      setSelectedAffiliates(affiliates.map(a => a.id))
    }
  }

  const handleSelectAffiliate = (id: string) => {
    if (selectedAffiliates.includes(id)) {
      setSelectedAffiliates(selectedAffiliates.filter(aid => aid !== id))
    } else {
      setSelectedAffiliates([...selectedAffiliates, id])
    }
  }

  // Inline editing
  const handleFieldEdit = async (affiliateId: string, field: string, value: any) => {
    try {
      const affiliate = affiliates.find(a => a.id === affiliateId)
      if (!affiliate) return

      const updatedData = { ...affiliate, [field]: value }
      
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      const result = await response.json()
      if (result.success) {
        setAffiliates(affiliates.map(a => 
          a.id === affiliateId ? { ...a, [field]: value } : a
        ))
        setEditingField(null)
        success('Updated', `${field} updated successfully`)
      } else {
        error('Update Failed', result.error)
      }
    } catch (err) {
      error('Update Failed', 'Unable to update affiliate')
    }
  }

  // Inline editing component
  const EditableField = ({ affiliate, field, value, type = 'text' }: {
    affiliate: Affiliate
    field: string 
    value: any
    type?: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'textarea'
  }) => {
    const isEditing = editingField?.affiliateId === affiliate.id && editingField?.field === field
    
    if (isEditing) {
      if (type === 'boolean') {
        return (
          <select
            defaultValue={value ? 'yes' : 'no'}
            onBlur={(e) => {
              const newValue = (e.target as HTMLSelectElement).value === 'yes'
              handleFieldEdit(affiliate.id, field, newValue)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newValue = (e.target as HTMLSelectElement).value === 'yes'
                handleFieldEdit(affiliate.id, field, newValue)
              } else if (e.key === 'Escape') {
                setEditingField(null)
              }
            }}
            autoFocus
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        )
      } else if (type === 'textarea') {
        return (
          <textarea
            defaultValue={value || ''}
            onBlur={(e) => handleFieldEdit(affiliate.id, field, (e.target as HTMLTextAreaElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                                 handleFieldEdit(affiliate.id, field, (e.target as HTMLTextAreaElement).value)
              } else if (e.key === 'Escape') {
                setEditingField(null)
              }
            }}
            autoFocus
            rows={2}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        )
      } else {
        return (
          <input
            type={type === 'number' ? 'number' : 'text'}
            defaultValue={value || ''}
                         onBlur={(e) => {
               const newValue = type === 'number' ? parseFloat((e.target as HTMLInputElement).value) || null : (e.target as HTMLInputElement).value
               handleFieldEdit(affiliate.id, field, newValue)
             }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newValue = type === 'number' ? parseFloat((e.target as HTMLInputElement).value) || null : (e.target as HTMLInputElement).value
                handleFieldEdit(affiliate.id, field, newValue)
              } else if (e.key === 'Escape') {
                setEditingField(null)
              }
            }}
            autoFocus
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )
      }
    }

    // Display mode
    const displayValue = () => {
      if (value === null || value === undefined || value === '') {
        return <span className="text-gray-400">-</span>
      }

             switch (type) {
         case 'email':
           return <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>
         case 'url':
           if (!value) return <span className="text-gray-400">-</span>
           
           let displayText = value.length > 30 ? value.substring(0, 30) + '...' : value
           if (field === 'maps') displayText = 'Maps'
           if (field === 'facebook') displayText = 'Facebook'
           if (field === 'instagram') displayText = 'Instagram'
           
           return (
             <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
               {displayText}
             </a>
           )
         case 'boolean':
           if (field === 'isActive') {
             return (
               <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                 value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
               }`}>
                 {value ? 'Active' : 'Inactive'}
               </span>
             )
           }
           return value ? (
             <span className="text-green-600">✓ Yes</span>
           ) : (
             <span className="text-gray-400">No</span>
           )
         case 'number':
           if (field === 'rating' && value) {
             return <span className="text-yellow-600">★ {value}</span>
           }
           return value || <span className="text-gray-400">-</span>
         default:
           if (field === 'whatsApp' && value) {
             return (
               <a href={`https://wa.me/${value}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                 {value}
               </a>
             )
           }
           return value || <span className="text-gray-400">-</span>
       }
    }

         return (
       <div
         onClick={() => setEditingField({ affiliateId: affiliate.id, field })}
         className={`cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs relative group text-gray-900`}
         title={String(value || '')}
         style={{ 
           minHeight: '20px',
           height: '20px',
           overflow: 'hidden',
           textOverflow: 'ellipsis',
           whiteSpace: 'nowrap',
           display: 'flex',
           alignItems: 'center',
           color: '#111827', // Ensure black text
           width: '100%', // Force full width of container
           maxWidth: '100%' // Prevent expansion beyond container
         }}
       >
         <span className="truncate text-gray-900" style={{ maxWidth: '100%' }}>{displayValue()}</span>
         {/* Large Vertical tooltip on hover - expands up/down, not horizontally */}
         {value && String(value).length > 10 && (
           <div 
             className="absolute left-1/2 transform -translate-x-1/2 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-2xl p-4 text-sm z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
             style={{
               top: '-15px', // Position above the cell
               transform: 'translateX(-50%) translateY(-100%)', // Center horizontally, position above
               minWidth: '300px',
               maxWidth: '600px',
               width: 'max-content',
               wordWrap: 'break-word',
               whiteSpace: 'pre-wrap',
               lineHeight: '1.5',
               maxHeight: '300px',
               overflowY: 'auto'
             }}
           >
             <div className="text-gray-900 font-medium leading-relaxed">
               {String(value)}
             </div>
             {/* Arrow pointing down to the cell */}
             <div 
               className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-yellow-400"
               style={{ top: '100%' }}
             />
           </div>
         )}
       </div>
     )
   }

  // Sortable column header component
  const SortableHeader = ({ field, children, className = "" }: { 
    field: string
    children: React.ReactNode
    className?: string 
  }) => {
    const isSorted = sortField === field
    const isAsc = sortDirection === 'asc'
    
    return (
      <th 
        className={`px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center space-x-1">
          <span className="truncate">{children}</span>
          <div className="flex flex-col flex-shrink-0">
            <ChevronUp className={`w-2 h-2 ${isSorted && isAsc ? 'text-blue-600' : 'text-gray-300'}`} />
            <ChevronDown className={`w-2 h-2 -mt-0.5 ${isSorted && !isAsc ? 'text-blue-600' : 'text-gray-300'}`} />
          </div>
        </div>
      </th>
    )
  }

  // Resizable Header Component with manual column width adjustment
  const ResizableHeader = ({ field, children, sortable = false }: { 
    field: keyof typeof columnWidths
    children: React.ReactNode
    sortable?: boolean
  }) => {
    const [isResizing, setIsResizing] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startWidth, setStartWidth] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setStartX(e.clientX)
      setStartWidth(columnWidths[field])
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - startX
      const newWidth = Math.max(30, startWidth + diff) // Minimum width of 30px
      updateColumnWidth(field, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    // Add global mouse event listeners when resizing
    useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isResizing, startX, startWidth])

    const isActive = sortable && sortField === field
    
    return (
      <th 
        className={`px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
        style={{ width: `${columnWidths[field]}px`, maxWidth: `${columnWidths[field]}px` }}
        onClick={sortable ? () => handleSort(field as string) : undefined}
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1">
            <span className="truncate">{children}</span>
            {isActive && sortable && (
              <div className="flex flex-col flex-shrink-0">
                <ChevronUp className={`w-2 h-2 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                <ChevronDown className={`w-2 h-2 -mt-0.5 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
              </div>
            )}
          </div>
        </div>
        {/* Resize Handle - More Visible */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 bg-gray-300 border-r border-gray-400"
          onMouseDown={handleMouseDown}
          title="Drag to resize column"
          style={{
            background: isResizing ? '#3b82f6' : 'linear-gradient(to right, #e5e7eb, #9ca3af)',
            opacity: 0.8
          }}
        />
      </th>
    )
  }

  const handleDuplicateAffiliate = async (affiliate: Affiliate) => {
    try {
      const duplicateData = {
        name: `${affiliate.name} (Copy)`,
        email: `copy_${Date.now()}_${affiliate.email}`,
        affiliateNum: null,
        isActive: affiliate.isActive,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        workPhone: affiliate.workPhone,
        whatsApp: affiliate.whatsApp,
        address: affiliate.address,
        web: affiliate.web,
        description: affiliate.description,
        city: affiliate.city,
        maps: affiliate.maps,
        location: affiliate.location,
        discount: affiliate.discount,
        logo: affiliate.logo,
        facebook: affiliate.facebook,
        instagram: affiliate.instagram,
        category: affiliate.category,
        subCategory: affiliate.subCategory,
        service: affiliate.service,
        type: affiliate.type,
        sticker: affiliate.sticker,
        rating: affiliate.rating,
        recommended: affiliate.recommended,
        termsConditions: affiliate.termsConditions
      }

      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })

      const result = await response.json()
      if (result.success) {
        success('Duplicated', 'Affiliate duplicated successfully')
        loadAffiliates()
      } else {
        error('Duplication Failed', result.error)
      }
    } catch (err) {
      error('Duplication Failed', 'Unable to duplicate affiliate')
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

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Apply client-side sorting to server-paginated data
  let filteredAffiliates = [...affiliates]
  
  // Apply sorting
  if (sortField) {
    filteredAffiliates.sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]
      
      // Handle different field types
      if (sortField === 'affiliateNum') {
        aVal = parseInt(aVal) || 0
        bVal = parseInt(bVal) || 0
      } else if (sortField === 'rating') {
        aVal = aVal || 0
        bVal = bVal || 0
      } else if (typeof aVal === 'string') {
        aVal = aVal?.toLowerCase() || ''
        bVal = bVal?.toLowerCase() || ''
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
             return 0
     })
   }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <style dangerouslySetInnerHTML={{__html: `
        .table-scroll-container::-webkit-scrollbar {
          -webkit-appearance: none !important;
          height: 16px !important;
          display: block !important;
        }
        .table-scroll-container::-webkit-scrollbar-thumb {
          border-radius: 8px;
          border: 2px solid white;
          background-color: rgba(0, 0, 0, .5);
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
                        handleClearAllData()
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by city..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <input
                type="text"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                placeholder="Filter by type..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setCategoryFilter('')
                  setCityFilter('')
                  setTypeFilter('')
                  setRatingFilter('')
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center w-full justify-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
          
          {selectedAffiliates.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-red-800 font-medium">
                {selectedAffiliates.length} affiliate(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Affiliates ({pagination.totalCount})
            </h3>
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when changing items per page
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalCount} total)
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
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

              
              <div 
                className="overflow-x-scroll table-scroll-container" 
                style={{ 
                  maxHeight: '70vh',
                  scrollBehavior: 'auto', // Remove smooth for more predictable scrolling
                  scrollbarWidth: 'auto', // Firefox - force scrollbar to always show
                  msOverflowStyle: 'scrollbar', // IE - force scrollbar to always show
                  WebkitOverflowScrolling: 'touch' // iOS - smoother scrolling
                }}

                onWheel={(e) => {
                  if (e.shiftKey) {
                    e.preventDefault()
                    const container = e.currentTarget
                    container.scrollLeft += e.deltaY * 3 // Even more sensitive scrolling
                  }
                }}
              >
                <table className="min-w-full divide-y divide-gray-100" style={{ 
                  minWidth: `${(Object.values(columnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0)}px`, 
                  fontSize: '11px',
                  tableLayout: 'fixed',
                  width: `${(Object.values(columnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0)}px`
                }}>
                  <thead className="bg-gray-50 sticky top-0 z-20">
                    <tr>
                      <ResizableHeader field="select">
                        <input
                          type="checkbox"
                          checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                          onChange={handleSelectAll}
                          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </ResizableHeader>
                      <ResizableHeader field="affiliateNum" sortable>
                        #
                      </ResizableHeader>
                      <ResizableHeader field="status">
                        Status
                      </ResizableHeader>
                      <ResizableHeader field="name" sortable>
                        Business Name
                      </ResizableHeader>
                      <ResizableHeader field="firstName">
                        First Name
                      </ResizableHeader>
                      <ResizableHeader field="lastName">
                        Last Name
                      </ResizableHeader>
                      <ResizableHeader field="email">
                        Email
                      </ResizableHeader>
                      <ResizableHeader field="workPhone">
                        Work Phone
                      </ResizableHeader>
                      <ResizableHeader field="whatsApp">
                        WhatsApp
                      </ResizableHeader>
                      <ResizableHeader field="address">
                        Address
                      </ResizableHeader>
                      <ResizableHeader field="web">
                        Website
                      </ResizableHeader>
                      <ResizableHeader field="description">
                        Description
                      </ResizableHeader>
                      <ResizableHeader field="city" sortable>
                        City
                      </ResizableHeader>
                      <ResizableHeader field="maps">
                        Maps URL
                      </ResizableHeader>
                      <ResizableHeader field="location">
                        Location
                      </ResizableHeader>
                      <ResizableHeader field="discount">
                        Discount
                      </ResizableHeader>
                      <ResizableHeader field="logo">
                        Logo
                      </ResizableHeader>
                      <ResizableHeader field="facebook">
                        Facebook
                      </ResizableHeader>
                      <ResizableHeader field="instagram">
                        Instagram
                      </ResizableHeader>
                      <ResizableHeader field="category">
                        Category
                      </ResizableHeader>
                      <ResizableHeader field="subCategory">
                        Sub-Category
                      </ResizableHeader>
                      <ResizableHeader field="service">
                        Service
                      </ResizableHeader>
                      <ResizableHeader field="type" sortable>
                        Type
                      </ResizableHeader>
                      <ResizableHeader field="sticker">
                        Sticker
                      </ResizableHeader>
                      <ResizableHeader field="rating" sortable>
                        Rating
                      </ResizableHeader>
                      <ResizableHeader field="recommended">
                        Recommend
                      </ResizableHeader>
                      <ResizableHeader field="termsConditions">
                        T & C
                      </ResizableHeader>
                      <ResizableHeader field="visits">
                        Visits
                      </ResizableHeader>
                      <ResizableHeader field="actions">
                        Actions
                      </ResizableHeader>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-50" style={{ height: '28px', color: '#111827' }}>
                        <td className="px-1 py-0.5 whitespace-nowrap text-xs text-gray-900 sticky left-0 bg-white z-10" style={{ width: `${columnWidths.select}px`, maxWidth: `${columnWidths.select}px`, overflow: 'hidden' }}>
                          <input
                            type="checkbox"
                            checked={selectedAffiliates.includes(affiliate.id)}
                            onChange={() => handleSelectAffiliate(affiliate.id)}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-1 py-0.5 whitespace-nowrap text-xs text-gray-900 text-center font-medium" style={{ width: `${columnWidths.affiliateNum}px`, maxWidth: `${columnWidths.affiliateNum}px`, overflow: 'hidden', color: '#111827' }}>
                          #{affiliate.affiliateNum || affiliate.id.slice(-3)}
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.status}px`, maxWidth: `${columnWidths.status}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="isActive" value={affiliate.isActive} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.name}px`, maxWidth: `${columnWidths.name}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="name" value={affiliate.name} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.firstName}px`, maxWidth: `${columnWidths.firstName}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="firstName" value={affiliate.firstName} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.lastName}px`, maxWidth: `${columnWidths.lastName}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="lastName" value={affiliate.lastName} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.email}px`, maxWidth: `${columnWidths.email}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="email" value={affiliate.email} type="email" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.workPhone}px`, maxWidth: `${columnWidths.workPhone}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="workPhone" value={affiliate.workPhone} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.whatsApp}px`, maxWidth: `${columnWidths.whatsApp}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="whatsApp" value={affiliate.whatsApp} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.address}px`, maxWidth: `${columnWidths.address}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="address" value={affiliate.address} type="textarea" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.web}px`, maxWidth: `${columnWidths.web}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="web" value={affiliate.web} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.description}px`, maxWidth: `${columnWidths.description}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="description" value={affiliate.description} type="textarea" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.city}px`, maxWidth: `${columnWidths.city}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="city" value={affiliate.city} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.maps}px`, maxWidth: `${columnWidths.maps}px`, overflow: 'hidden' }}>
                          <div className="flex items-center space-x-1">
                            {affiliate.maps && (
                              <a href={affiliate.maps} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex-shrink-0" title="Open in Maps">
                                📍
                              </a>
                            )}
                            <div className="flex-1 min-w-0">
                              <EditableField affiliate={affiliate} field="maps" value={affiliate.maps} type="url" />
                            </div>
                          </div>
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.location}px`, maxWidth: `${columnWidths.location}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="location" value={affiliate.location} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.discount}px`, maxWidth: `${columnWidths.discount}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="discount" value={affiliate.discount} />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.logo}px`, maxWidth: `${columnWidths.logo}px`, overflow: 'hidden' }}>
                          {affiliate.logo && (
                            <img src={affiliate.logo} alt="Logo" className="w-4 h-4 object-cover rounded mx-auto" title={affiliate.logo} />
                          )}
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.facebook}px`, maxWidth: `${columnWidths.facebook}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="facebook" value={affiliate.facebook} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.instagram}px`, maxWidth: `${columnWidths.instagram}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="instagram" value={affiliate.instagram} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.category}px`, maxWidth: `${columnWidths.category}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="category" value={affiliate.category} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.subCategory}px`, maxWidth: `${columnWidths.subCategory}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="subCategory" value={affiliate.subCategory} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.service}px`, maxWidth: `${columnWidths.service}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="service" value={affiliate.service} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.type}px`, maxWidth: `${columnWidths.type}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="type" value={affiliate.type} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${columnWidths.sticker}px`, maxWidth: `${columnWidths.sticker}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="sticker" value={affiliate.sticker} />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.rating}px`, maxWidth: `${columnWidths.rating}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="rating" value={affiliate.rating} type="number" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.recommended}px`, maxWidth: `${columnWidths.recommended}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="recommended" value={affiliate.recommended} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.termsConditions}px`, maxWidth: `${columnWidths.termsConditions}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="termsConditions" value={!!affiliate.termsConditions} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.visits}px`, maxWidth: `${columnWidths.visits}px`, overflow: 'hidden' }}>
                          <div className="text-xs font-medium text-gray-900" style={{ color: '#111827' }}>{affiliate.totalVisits}</div>
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${columnWidths.actions}px`, maxWidth: `${columnWidths.actions}px`, overflow: 'hidden' }}>
                          <div className="flex items-center justify-center space-x-0.5">
                            <button
                              onClick={() => setEditingAffiliate(affiliate)}
                              className="text-blue-600 hover:text-blue-900 p-0.5"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDuplicateAffiliate(affiliate)}
                              className="text-green-600 hover:text-green-900 p-0.5"
                              title="Copy"
                            >
                              <Users className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAffiliate(affiliate.id, affiliate.name)}
                              className="text-red-600 hover:text-red-900 p-0.5"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              
              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6" style={{ marginBottom: '80px' }}>
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

      {/* Edit Affiliate Modal */}
      {editingAffiliate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white" style={{ maxWidth: '1400px' }}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Affiliate: {editingAffiliate.name}
                </h3>
                <button
                  onClick={() => setEditingAffiliate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto p-2">
                {/* Basic Information */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={editingAffiliate.name}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, name: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingAffiliate.firstName || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, firstName: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingAffiliate.lastName || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, lastName: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editingAffiliate.email}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, email: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work Phone</label>
                  <input
                    type="text"
                    value={editingAffiliate.workPhone || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, workPhone: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editingAffiliate.whatsApp || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, whatsApp: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={editingAffiliate.address || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, address: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editingAffiliate.web || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, web: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingAffiliate.description || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, description: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingAffiliate.city || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, city: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Maps URL</label>
                  <input
                    type="url"
                    value={editingAffiliate.maps || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, maps: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingAffiliate.location || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, location: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                  <input
                    type="text"
                    value={editingAffiliate.discount || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, discount: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={editingAffiliate.logo || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, logo: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={editingAffiliate.facebook || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, facebook: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={editingAffiliate.instagram || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, instagram: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingAffiliate.category || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, category: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sub-Category</label>
                  <input
                    type="text"
                    value={editingAffiliate.subCategory || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, subCategory: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service</label>
                  <input
                    type="text"
                    value={editingAffiliate.service || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, service: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={editingAffiliate.type || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, type: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sticker</label>
                  <input
                    type="text"
                    value={editingAffiliate.sticker || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, sticker: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={editingAffiliate.rating || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, rating: parseFloat(e.target.value) || null})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAffiliate.isActive}
                      onChange={(e) => setEditingAffiliate({...editingAffiliate, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-xs font-medium text-gray-700">Active</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAffiliate.recommended}
                      onChange={(e) => setEditingAffiliate({...editingAffiliate, recommended: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-xs font-medium text-gray-700">Recommended</span>
                  </label>
                </div>
                
                                 <div>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={!!editingAffiliate.termsConditions}
                       onChange={(e) => setEditingAffiliate({...editingAffiliate, termsConditions: e.target.checked ? 'yes' : null})}
                       className="mr-2"
                     />
                     <span className="text-xs font-medium text-gray-700">Terms & Conditions</span>
                   </label>
                 </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4 pt-3 border-t">
                <button
                  onClick={() => setEditingAffiliate(null)}
                  className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/admin/affiliates/${editingAffiliate.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editingAffiliate)
                      })
                      
                      const result = await response.json()
                      if (result.success) {
                        success('Updated', 'Affiliate updated successfully')
                        setEditingAffiliate(null)
                        loadAffiliates()
                      } else {
                        error('Update Failed', result.error)
                      }
                    } catch (err) {
                      error('Update Failed', 'Unable to update affiliate')
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
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