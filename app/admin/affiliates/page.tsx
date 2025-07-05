"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Building2, Plus, Search, Upload, Download, Edit, Trash2, Eye, Users, TrendingUp, FileSpreadsheet, RefreshCw, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useFieldAnnotations } from "@/hooks/use-field-annotations"
import { FieldAnnotationMenu } from "@/components/field-annotation-menu"

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
  const { columnWidths, updateColumnWidth, loading: preferencesLoading } = useUserPreferences()
  const { 
    loadAnnotations, 
    saveAnnotation, 
    removeAnnotation, 
    getAnnotation, 
    getFieldBackgroundColor, 
    hasComment 
  } = useFieldAnnotations()
  
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
  
  // Field annotation context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    affiliateId: string
    fieldName: string
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    affiliateId: '',
    fieldName: ''
  })

  // Refs for synchronizing scroll bars
  const topScrollRef = useRef<HTMLDivElement>(null)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const fixedScrollRef = useRef<HTMLDivElement>(null)

  // Synchronize scroll positions
  const syncScrollFromTop = (e: any) => {
    const scrollLeft = e.target.scrollLeft
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = scrollLeft
    }
    if (fixedScrollRef.current) {
      fixedScrollRef.current.scrollLeft = scrollLeft
    }
  }

  const syncScrollFromMain = (e: any) => {
    const scrollLeft = e.target.scrollLeft
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = scrollLeft
    }
    if (fixedScrollRef.current) {
      fixedScrollRef.current.scrollLeft = scrollLeft
    }
  }

  const syncScrollFromFixed = (e: any) => {
    const scrollLeft = e.target.scrollLeft
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = scrollLeft
    }
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollLeft = scrollLeft
    }
  }
  
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
  const [logoModal, setLogoModal] = useState<{isOpen: boolean, affiliate: Affiliate | null}>({isOpen: false, affiliate: null})
  const [csvPreview, setCsvPreview] = useState<any>(null)
  const [previewing, setPreviewing] = useState(false)
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    affiliateId: string
    field: string
    value: string
    fieldName: string
  }>({
    isOpen: false,
    affiliateId: '',
    field: '',
    value: '',
    fieldName: ''
  })

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

  // Column widths are now managed by the useUserPreferences hook
  const actualColumnWidths = Object.keys(columnWidths).length > 0 ? columnWidths : defaultColumnWidths

  // Load affiliates
  useEffect(() => {
    loadAffiliates()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, cityFilter, typeFilter, ratingFilter])

  // Load annotations when affiliates change
  useEffect(() => {
    if (affiliates.length > 0) {
      const affiliateIds = affiliates.map(a => a.id)
      loadAnnotations(affiliateIds)
    }
  }, [affiliates])

  // Close context menu when clicking elsewhere (but not in annotation menu)
  useEffect(() => {
    if (contextMenu.isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        // Don't close if clicking inside the annotation menu
        if (target.closest('.fixed.z-50')) {
          return
        }
        closeContextMenu()
      }
      
      // Delay adding the listener to avoid immediate closure
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 200) // Longer delay than annotation menu
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [contextMenu.isOpen])

  const loadAffiliates = async () => {
    setSearching(true)
    try {
      console.log('🔍 Frontend: Session status:', { 
        hasSession: !!session, 
        userEmail: session?.user?.email, 
        userRole: session?.user?.role 
      })

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
      console.log('🔍 Frontend: API Response status:', response.status)
      
      const data: AffiliateResponse = await response.json()
      console.log('🔍 Frontend: API Response data:', data)

      if (data.success) {
        setAffiliates(data.data)
        setPagination(data.pagination)
        setSummary(data.summary)
      } else {
        console.error('❌ Frontend: API returned error:', data)
        error('Failed to load affiliates', (data as any).error || 'Unknown error')
      }
    } catch (err) {
      console.error('❌ Frontend: Load error:', err)
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
  const handleFieldEdit = async (affiliateId: string, field: string, value: any, originalValue: any) => {
    try {
      const affiliate = affiliates.find(a => a.id === affiliateId)
      if (!affiliate) return

      // Compare values - only proceed if there's actually a change
      if (value === originalValue) {
        setEditingField(null)
        return // No change, just close editing mode without notification
      }

      // Convert boolean to string for fields that are stored as strings in the database
      let finalValue = value
      if (field === 'sticker' || field === 'termsConditions') {
        finalValue = value ? 'yes' : null // Convert boolean to string/null
      }

      const updatedData = { ...affiliate, [field]: finalValue }
      
      const response = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      const result = await response.json()
      if (result.success) {
        // For frontend state, use the converted value for string fields
        const stateValue = (field === 'sticker' || field === 'termsConditions') ? finalValue : value
        setAffiliates(affiliates.map(a => 
          a.id === affiliateId ? { ...a, [field]: stateValue } : a
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

  // Context menu handlers
  const handleRightClick = (e: React.MouseEvent, affiliateId: string, fieldName: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't allow annotations on status field
    if (fieldName === 'isActive') {
      return
    }
    
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      affiliateId,
      fieldName
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  // Inline editing component
  const LogoImage = ({ affiliate }: { affiliate: Affiliate }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)

    const handleImageError = () => {
      setImageError(true)
      setImageLoading(false)
    }

    const handleImageLoad = () => {
      setImageError(false)
      setImageLoading(false)
    }

    const handleLogoClick = () => {
      setLogoModal({isOpen: true, affiliate})
    }

    // Check if the logo value is actually a URL vs a text description
    const isActualUrl = (url: string) => {
      if (!url) return false
      
      // Check if it's a URL (starts with http/https or has common image extensions)
      const isUrl = url.startsWith('http://') || url.startsWith('https://') || 
                   url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
                   url.includes('.gif') || url.includes('.svg') || url.includes('.webp')
      
      // Check if it's a text description (common Spanish phrases)
      const isTextDescription = /^(sin logo|no logo|muy grande|apostrofe|cerrado|no disponible|pendiente|falta|error)/i.test(url.trim())
      
      return isUrl && !isTextDescription
    }

    // Convert Google Drive URL to direct image URL for display
    const getDisplayUrl = (url: string) => {
      if (!url || !isActualUrl(url)) return url
      return convertGoogleDriveUrl(url)
    }

    // Show placeholder if no logo, text description, or image error
    if (!affiliate.logo || !isActualUrl(affiliate.logo) || imageError) {
      return (
        <div 
          className="w-6 h-6 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-300 mx-auto"
          onClick={handleLogoClick}
          title={affiliate.logo && !isActualUrl(affiliate.logo) ? 
            `Text description: "${affiliate.logo}". Click to add proper URL.` : 
            "Click to add/edit logo URL"}
        >
          <span className="text-gray-500 text-xs">📷</span>
        </div>
      )
    }

    return (
      <div className="relative w-6 h-6 mx-auto">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 rounded animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-xs">⏳</span>
          </div>
        )}
        <img 
          src={getDisplayUrl(affiliate.logo)} 
          alt={`${affiliate.name} logo`}
          className="w-6 h-6 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-300"
          onError={handleImageError}
          onLoad={handleImageLoad}
          onClick={handleLogoClick}
          title="Click to edit logo URL"
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
      </div>
    )
  }

  const EditableField = ({ affiliate, field, value, type = 'text' }: {
    affiliate: Affiliate
    field: string 
    value: any
    type?: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'textarea'
  }) => {
    const isEditing = editingField?.affiliateId === affiliate.id && editingField?.field === field
    const annotation = getAnnotation(affiliate.id, field)
    const backgroundColor = getFieldBackgroundColor(affiliate.id, field)
    const fieldHasComment = hasComment(affiliate.id, field)
    
    // Check if content is truncated
    const isContentTruncated = () => {
      if (!value) return false
      return String(value).length > 20
    }

    // Check if this is a long field that should use modal editing
    const shouldUseModal = (field: string, value: any) => {
      const longFields = ['maps', 'facebook', 'instagram', 'web', 'description', 'address', 'discount']
      return longFields.includes(field) && value && String(value).length > 30
    }

    const shouldShowTooltip = isContentTruncated() && value && String(value).length > 0

    // Display value function
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
          if (field === 'affiliateNum') {
            return `#${value || affiliate.id.slice(-3)}`
          }
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

    // Handle editing mode
    if (isEditing) {
      if (type === 'boolean') {
        return (
          <select
            defaultValue={value ? 'yes' : 'no'}
            onBlur={(e) => {
              const newValue = (e.target as HTMLSelectElement).value === 'yes'
              handleFieldEdit(affiliate.id, field, newValue, value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newValue = (e.target as HTMLSelectElement).value === 'yes'
                handleFieldEdit(affiliate.id, field, newValue, value)
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
      } else {
        return (
          <input
            type={type === 'number' ? 'number' : 'text'}
            defaultValue={value || ''}
            min={field === 'rating' ? '1' : undefined}
            max={field === 'rating' ? '5' : undefined}
            step={field === 'rating' ? '1' : undefined}
            onBlur={(e) => {
              let newValue = type === 'number' ? parseFloat((e.target as HTMLInputElement).value) || null : (e.target as HTMLInputElement).value
              if (field === 'rating' && newValue !== null && typeof newValue === 'number') {
                newValue = Math.round(Math.min(5, Math.max(1, newValue)))
              }
              handleFieldEdit(affiliate.id, field, newValue, value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                let newValue = type === 'number' ? parseFloat((e.target as HTMLInputElement).value) || null : (e.target as HTMLInputElement).value
                if (field === 'rating' && newValue !== null && typeof newValue === 'number') {
                  newValue = Math.round(Math.min(5, Math.max(1, newValue)))
                }
                handleFieldEdit(affiliate.id, field, newValue, value)
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

    return (
      <div
        onClick={(e) => {
          e.stopPropagation()
          // For boolean fields, toggle the value directly instead of entering edit mode
          if (type === 'boolean') {
            const newValue = !value
            handleFieldEdit(affiliate.id, field, newValue, value)
          } else if (shouldUseModal(field, value)) {
            // Open modal for long fields
            setEditModal({
              isOpen: true,
              affiliateId: affiliate.id,
              field: field,
              value: String(value || ''),
              fieldName: field.charAt(0).toUpperCase() + field.slice(1)
            })
          } else {
            setEditingField({ affiliateId: affiliate.id, field })
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleRightClick(e, affiliate.id, field)
        }}
        className={`cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs relative group text-gray-900`}
        style={{ 
          minHeight: '20px',
          height: '20px',
          overflow: 'visible',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#111827',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: backgroundColor || 'transparent'
        }}
      >
        <span className="truncate text-gray-900 flex-1" style={{ maxWidth: fieldHasComment ? 'calc(100% - 25px)' : '100%' }}>
          {displayValue()}
        </span>
        
        {/* Comment icon - only show if field has comment */}
        {fieldHasComment && (
          <div 
            className="ml-1 flex-shrink-0 relative"
            title={`Comment: ${annotation?.comment || ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleRightClick(e, affiliate.id, field)
            }}
          >
            <span className="text-blue-600 text-xs cursor-pointer hover:text-blue-800">💬</span>
          </div>
        )}
        
        {/* Simple tooltip on hover - shows even when there are comments */}
        {shouldShowTooltip && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none max-w-xs"
               style={{
                 top: affiliate.id === filteredAffiliates[0]?.id ? '25px' : '-25px',
                 transform: affiliate.id === filteredAffiliates[0]?.id ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)'
               }}>
            {value || ''}
          </div>
        )}
      </div>
    )
  }

  // ... existing code ...

      {/* Edit Field Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white border-4 border-blue-400 rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editModal.fieldName}
              </h3>
              <button
                onClick={() => setEditModal({...editModal, isOpen: false})}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editModal.fieldName}
                </label>
                {editModal.field === 'description' || editModal.field === 'address' ? (
                  <textarea
                    value={editModal.value}
                    onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type={editModal.field === 'web' || editModal.field === 'maps' || editModal.field === 'facebook' || editModal.field === 'instagram' ? 'url' : 'text'}
                    value={editModal.value}
                    onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                  />
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditModal({...editModal, isOpen: false})}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const affiliate = affiliates.find(a => a.id === editModal.affiliateId)
                    if (affiliate) {
                      const originalValue = (affiliate as any)[editModal.field]
                      handleFieldEdit(editModal.affiliateId, editModal.field, editModal.value, originalValue)
                    }
                    setEditModal({...editModal, isOpen: false})
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
// ... existing code ...

  // Resizable Textarea Component for editing
  const ResizableTextarea = ({ 
    defaultValue, 
    onBlur, 
    onEnter, 
    onEscape 
  }: { 
    defaultValue: string
    onBlur: (value: string) => void
    onEnter: (value: string) => void
    onEscape: () => void
  }) => {
    const [size, setSize] = useState({ width: 300, height: 120 })
    const [isResizing, setIsResizing] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0 })
    const [startSize, setStartSize] = useState({ width: 0, height: 0 })
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setStartPos({ x: e.clientX, y: e.clientY })
      setStartSize({ width: size.width, height: size.height })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const deltaX = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y
      setSize({
        width: Math.max(250, startSize.width + deltaX),
        height: Math.max(80, startSize.height + deltaY)
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isResizing, startPos, startSize])

    return (
      <div 
        className="fixed bg-white border-4 border-blue-400 rounded-lg shadow-2xl"
        style={{ 
          width: `${size.width}px`, 
          height: `${size.height}px`,
          minWidth: '250px',
          minHeight: '80px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000
        }}
      >
        <textarea
          ref={textareaRef}
          defaultValue={defaultValue}
          onBlur={(e) => onBlur(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              onEnter(e.currentTarget.value)
            } else if (e.key === 'Escape') {
              onEscape()
            }
          }}
          autoFocus
          className="w-full h-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none"
          style={{ 
            paddingRight: '25px', // Space for resize handle
            paddingBottom: '25px'
          }}
        />
        
        {/* Resize handle in bottom-right corner */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-blue-500 hover:bg-blue-600 border-2 border-blue-700 shadow-lg rounded-tl-lg z-10"
          onMouseDown={handleMouseDown}
          title="🔄 Drag corner to resize text area"
        >
          {/* Resize icon */}
          <div className="absolute bottom-0.5 right-0.5 text-white text-xs leading-none font-bold">
            ⤡
          </div>
        </div>
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
    field: keyof typeof actualColumnWidths
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
      setStartWidth(actualColumnWidths[field])
      // Add visual feedback
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - startX
      const newWidth = Math.max(30, startWidth + diff) // Minimum width of 30px
      updateColumnWidth(field, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Reset visual feedback
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
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
        className={`px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''} group`}
        style={{ width: `${actualColumnWidths[field]}px`, maxWidth: `${actualColumnWidths[field]}px` }}
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
        {/* Resize Handle - Smaller and Better Positioned */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-gray-400 border-r border-gray-600 group-hover:bg-blue-300 transition-colors duration-200"
          onMouseDown={handleMouseDown}
          title="Drag to resize column"
          style={{
            background: isResizing ? '#3b82f6' : '#9ca3af',
            opacity: isResizing ? 1 : 0.6,
            zIndex: 10,
            transform: 'translateX(-1px)' // Move it slightly left to not cover text
          }}
        />
        {/* Invisible larger hit area for easier grabbing */}
        <div
          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize opacity-0"
          onMouseDown={handleMouseDown}
          title="Drag to resize column"
          style={{
            zIndex: 9,
            transform: 'translateX(-1px)'
          }}
        />
      </th>
    )
  }

  // Utility function to convert Google Drive URLs to direct image URLs
  const convertGoogleDriveUrl = (url: string): string => {
    if (!url) return url
    
    // If it's not a Google Drive URL, return as-is
    if (!url.includes('drive.google.com')) {
      return url
    }
    
    // If it's a search URL or folder URL, it's not a file URL
    if (url.includes('/search?') || url.includes('/drive/folders/') || url.includes('/drive/search?')) {
      console.warn('❌ Cannot convert Google Drive search/folder URL to direct image URL:', url)
      return url // Return original URL, will be handled as invalid by isActualUrl check
    }
    
    // Check if it's already a thumbnail URL (preferred format)
    if (url.includes('drive.google.com/thumbnail?')) {
      return url
    }
    
    // Check if it's already a direct Google Drive URL
    if (url.includes('drive.google.com/uc?')) {
      // Extract file ID and convert to thumbnail format
      const fileIdMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/)
      if (fileIdMatch) {
        const fileId = fileIdMatch[1]
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`
        console.log('🔄 Converting Google Drive URL to thumbnail format:', { original: url, converted: thumbnailUrl })
        return thumbnailUrl
      }
    }
    
    // Convert sharing URL to thumbnail URL (PREFERRED FORMAT - WORKS FOR EMBEDDING!)
    let fileId = ''
    
    // Try to extract file ID from different URL formats
    const patterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,  // /d/ID format
      /[?&]id=([a-zA-Z0-9-_]+)/, // ?id=ID format
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        fileId = match[1]
        break
      }
    }
    
    if (fileId) {
      // Use thumbnail format instead of standard format (thumbnail format works for embedding!)
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`
      console.log('🔄 Converting Google Drive URL to thumbnail format:', { original: url, converted: thumbnailUrl })
      return thumbnailUrl
    } else {
      console.warn('❌ Could not extract file ID from Google Drive URL:', url)
      return url // Return original URL, will be handled as invalid by isActualUrl check
    }
  }

  const handleBulkFixLogos = async () => {
    try {
      const response = await fetch('/api/admin/affiliates/bulk-fix-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      if (result.success) {
        success('Logos Fixed', `Fixed ${result.fixed} logo URLs successfully`)
        loadAffiliates()
      } else {
        error('Fix Failed', result.error)
      }
    } catch (err) {
      error('Fix Failed', 'Unable to fix logo URLs')
    }
  }

  const handleLogoEdit = async (affiliate: Affiliate, newLogoUrl: string) => {
    try {
      // Convert Google Drive URL to direct image URL
      const convertedUrl = convertGoogleDriveUrl(newLogoUrl)
      
      const response = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...affiliate, logo: convertedUrl })
      })
      
      const result = await response.json()
      if (result.success) {
        success('Logo Updated', 'Logo URL updated successfully')
        setLogoModal({isOpen: false, affiliate: null})
        loadAffiliates()
      } else {
        error('Update Failed', result.error)
      }
    } catch (err) {
      error('Update Failed', 'Unable to update logo URL')
    }
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
              <button
                onClick={handleBulkFixLogos}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                title="Convert all Google Drive sharing URLs to direct image URLs"
              >
                🔧 Fix All Logo URLs
              </button>
              <button
                onClick={() => {
                  // Test the conversion with the 3D Museum URL
                  const testUrl = 'https://drive.google.com/file/d/1AAbbY0fNYbCZ_RkFxxZIS'
                  const converted = convertGoogleDriveUrl(testUrl)
                  console.log('🧪 Test conversion:', { original: testUrl, converted })
                  
                  // Test if the converted URL works by trying to load it
                  const testImg = new Image()
                  testImg.onload = () => {
                    success('Test Success', `Converted URL works! ${converted}`)
                  }
                  testImg.onerror = () => {
                    error('Test Failed', `Converted URL doesn't work: ${converted}`)
                  }
                  testImg.src = converted
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                title="Test URL conversion with 3D Museum example"
              >
                🧪 Test Single URL
              </button>
              <button
                onClick={async () => {
                  const workingUrls: Array<{name: string, original: string, converted: string, status: string}> = []
                  const brokenUrls: Array<{name: string, original: string, converted: string, status: string}> = []
                  let tested = 0
                  
                  console.log('🔍 Testing all logo URLs...')
                  
                  for (const affiliate of affiliates) {
                    if (affiliate.logo && affiliate.logo.includes('drive.google.com')) {
                      const converted = convertGoogleDriveUrl(affiliate.logo)
                      tested++
                      
                      // Test URL by trying to load it
                      try {
                        const testImg = new Image()
                        await new Promise((resolve, reject) => {
                          testImg.onload = () => {
                            workingUrls.push({
                              name: affiliate.name,
                              original: affiliate.logo!,
                              converted,
                              status: 'working'
                            })
                            resolve(true)
                          }
                          testImg.onerror = () => {
                            brokenUrls.push({
                              name: affiliate.name,
                              original: affiliate.logo!,
                              converted,
                              status: 'broken'
                            })
                            reject(false)
                          }
                          testImg.src = converted
                        })
                      } catch (e) {
                        brokenUrls.push({
                          name: affiliate.name,
                          original: affiliate.logo!,
                          converted,
                          status: 'broken'
                        })
                      }
                    }
                  }
                  
                  console.log(`📊 URL Test Results:`)
                  console.log(`✅ Working: ${workingUrls.length}`)
                  console.log(`❌ Broken: ${brokenUrls.length}`)
                  console.log(`📋 Total tested: ${tested}`)
                  
                  console.log('✅ Working URLs:', workingUrls)
                  console.log('❌ Broken URLs:', brokenUrls)
                  
                  if (brokenUrls.length > 0) {
                    error('Some URLs Broken', `${brokenUrls.length} of ${tested} URLs don't work. Check console for details.`)
                  } else {
                    success('All URLs Working!', `All ${tested} logo URLs work correctly!`)
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
                title="Test all logo URLs to see which ones work and which don't"
              >
                🔍 Test All URLs
              </button>
              
              <button
                onClick={() => {
                  const instructions = `
🔍 GOOGLE DRIVE LOGO TROUBLESHOOTING

📋 The main issue is that Google Drive blocks direct hotlinking to images, even when properly formatted.

🛠️ SOLUTIONS (in order of recommendation):

1. 🎯 USE PROPER IMAGE HOSTING (RECOMMENDED):
   • Imgur - Free, allows hotlinking
   • Cloudinary - Professional image hosting  
   • GitHub - Store images in repository
   • Your own server - Full control

2. 🔧 FIX GOOGLE DRIVE PERMISSIONS:
   • Open each file in Google Drive
   • Right-click → Share
   • Change "Restricted" to "Anyone with the link can view"
   • Copy the link and paste it in logo field
   • System will auto-convert to direct URL

3. ⚠️ GOOGLE DRIVE LIMITATIONS:
   • Google Drive has anti-hotlinking security
   • URLs may work in browser but fail in web apps
   • Not recommended for production websites

🔍 CURRENT STATUS:
   • ${affiliates.filter(a => a.logo && a.logo.includes('drive.google.com')).length} Google Drive URLs found
   • All are likely blocked due to Google's security policies
   • Consider migrating to a proper image hosting service

📝 NEXT STEPS:
   • Click logo cells to edit individual URLs
   • Use the Google Drive folder links for easy access
   • Consider bulk migration to proper image hosting
                  `
                  console.log(instructions)
                  
                  // Also test a few different Google Drive URL formats
                  const testFileId = "1AAbbY0fNYbC7_RkFxxZISwj2hJ95V2vV"
                  const formats = [
                    { name: "Current Format", url: `https://drive.google.com/uc?export=view&id=${testFileId}` },
                    { name: "Thumbnail Format", url: `https://drive.google.com/thumbnail?id=${testFileId}` },
                    { name: "Drive Direct", url: `https://drive.google.com/uc?id=${testFileId}` }
                  ]
                  
                  console.log('🧪 Testing different Google Drive URL formats:')
                  formats.forEach(format => {
                    console.log(`  ${format.name}: ${format.url}`)
                  })
                  
                  alert(instructions)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                title="Show detailed troubleshooting instructions for Google Drive logos"
              >
                📋 Logo Help
              </button>
              
              <button
                onClick={() => {
                  const testUrl = "https://drive.google.com/uc?export=view&id=1AAbbY0fNYbC7_RkFxxZISwj2hJ95V2vV"
                  
                  console.log('🧪 GOOGLE DRIVE EMBEDDING TEST')
                  console.log('==================================')
                  console.log(`Testing URL: ${testUrl}`)
                  console.log('')
                  
                  // Test 1: Direct window open (should work)
                  console.log('🔍 Test 1: Opening URL in new window (should work)')
                  window.open(testUrl, '_blank')
                  
                  // Test 2: Fetch API (will show CORS errors)
                  console.log('🔍 Test 2: Fetch API request (will show CORS errors)')
                  fetch(testUrl, { mode: 'no-cors' })
                    .then(response => {
                      console.log('✅ Fetch response:', response.status, response.statusText)
                    })
                    .catch(error => {
                      console.log('❌ Fetch error:', error.message)
                    })
                  
                  // Test 3: Image loading (will fail silently)
                  console.log('🔍 Test 3: Image loading test (will fail silently)')
                  const testImg = new Image()
                  testImg.crossOrigin = 'anonymous'
                  testImg.onload = () => {
                    console.log('✅ Image loaded successfully! This is unexpected.')
                  }
                  testImg.onerror = (error) => {
                    console.log('❌ Image loading failed (expected due to CORS/CSP)')
                    console.log('   Error:', error)
                  }
                  testImg.src = testUrl
                  
                  // Test 4: Create a temporary image in the page
                  console.log('🔍 Test 4: Creating temporary image element in page')
                  const tempImg = document.createElement('img')
                  tempImg.src = testUrl
                  tempImg.style.cssText = 'position:fixed;top:10px;right:10px;width:100px;height:100px;border:2px solid red;z-index:9999;'
                  tempImg.onload = () => {
                    console.log('✅ Temporary image loaded in page!')
                    setTimeout(() => tempImg.remove(), 5000)
                  }
                  tempImg.onerror = () => {
                    console.log('❌ Temporary image failed to load in page')
                    tempImg.remove()
                  }
                  document.body.appendChild(tempImg)
                  
                  console.log('')
                  console.log('📋 EXPLANATION:')
                  console.log('• Test 1 works: Direct browser access bypasses embedding restrictions')
                  console.log('• Test 2 fails: CORS prevents cross-origin requests')
                  console.log('• Test 3 fails: Image embedding blocked by browser security')
                  console.log('• Test 4 fails: Same as Test 3 but visible in page')
                  console.log('')
                  console.log('🎯 CONCLUSION: Google Drive URLs work directly but fail when embedded in web apps')
                  
                  alert('🧪 Google Drive Embedding Test Started!\n\nCheck the console for detailed results. A new window will open with the image (this should work), but embedding tests will fail.')
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                title="Test the difference between direct access and embedded loading"
              >
                🧪 Test Embedding
              </button>
              
              <button
                onClick={() => {
                  const fileId = "1AAbbY0fNYbC7_RkFxxZISwj2hJ95V2vV"
                  const originalUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
                  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200`
                  
                  console.log('🔬 TESTING ALTERNATIVE GOOGLE DRIVE FORMAT')
                  console.log('============================================')
                  console.log('Original format:', originalUrl)
                  console.log('Thumbnail format:', thumbnailUrl)
                  console.log('')
                  
                  // Test thumbnail format
                  const testImg = new Image()
                  testImg.onload = () => {
                    console.log('🎉 SUCCESS! Thumbnail format works for embedding!')
                    
                    // Show success message
                    const successDiv = document.createElement('div')
                    successDiv.innerHTML = `
                      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                                  background:green;color:white;padding:20px;border-radius:10px;
                                  z-index:10000;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
                        <h3>🎉 THUMBNAIL FORMAT WORKS!</h3>
                        <img src="${thumbnailUrl}" style="max-width:100px;border:2px solid white;margin:10px;">
                        <p>Use thumbnail format: ${thumbnailUrl}</p>
                        <button onclick="this.parentElement.parentElement.remove()" 
                                style="background:white;color:green;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                          Close
                        </button>
                      </div>
                    `
                    document.body.appendChild(successDiv)
                  }
                  testImg.onerror = () => {
                    console.log('❌ Thumbnail format also fails')
                    alert('❌ Thumbnail format also failed. Google Drive embedding is completely blocked.\n\nRecommendation: Use proper image hosting like Imgur or Cloudinary.')
                  }
                  testImg.src = thumbnailUrl
                  
                  // Also test in a temporary img element
                  const tempImg = document.createElement('img')
                  tempImg.src = thumbnailUrl
                  tempImg.style.cssText = 'position:fixed;top:10px;left:10px;width:100px;height:100px;border:2px solid blue;z-index:9999;'
                  tempImg.onload = () => {
                    console.log('✅ Thumbnail image visible in page!')
                  }
                  tempImg.onerror = () => {
                    console.log('❌ Thumbnail image failed in page')
                    tempImg.remove()
                  }
                  document.body.appendChild(tempImg)
                  setTimeout(() => tempImg.remove(), 10000)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                title="Test Google Drive thumbnail format which sometimes works better"
              >
                🔬 Test Thumbnail Format
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

              {/* Top scroll bar - EXACTLY the same as bottom */}
              <div 
                ref={topScrollRef}
                className="overflow-x-scroll table-scroll-container" 
                style={{ 
                  scrollBehavior: 'auto', // Remove smooth for more predictable scrolling
                  scrollbarWidth: 'auto', // Firefox - force scrollbar to always show
                  msOverflowStyle: 'scrollbar', // IE - force scrollbar to always show
                  WebkitOverflowScrolling: 'touch', // iOS - smoother scrolling
                  height: '20px' // Just enough to show the scroll bar
                }}

                onWheel={(e) => {
                  if (e.shiftKey) {
                    e.preventDefault()
                    const container = e.currentTarget
                    container.scrollLeft += e.deltaY * 3 // Even more sensitive scrolling
                  }
                }}
                onScroll={syncScrollFromTop}
              >
                <div style={{ 
                  width: `${(Object.values(actualColumnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0)}px`,
                  height: '1px' // Invisible content to create scroll area
                }}></div>
              </div>

              {/* Main table container */}
              <div 
                ref={mainScrollRef}
                className="overflow-x-scroll table-scroll-container" 
                style={{ 
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
                onScroll={syncScrollFromMain}
              >
                <table className="min-w-full divide-y divide-gray-400" style={{ 
                  minWidth: `${(Object.values(actualColumnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0)}px`, 
                  fontSize: '11px',
                  tableLayout: 'fixed',
                  width: `${(Object.values(actualColumnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0)}px`
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
                  <tbody className="bg-white divide-y divide-gray-400">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-50" style={{ height: '28px', color: '#111827' }}>
                        <td className="px-1 py-0.5 whitespace-nowrap text-xs text-gray-900 sticky left-0 bg-white z-10" style={{ width: `${actualColumnWidths.select}px`, maxWidth: `${actualColumnWidths.select}px`, overflow: 'hidden' }}>
                          <input
                            type="checkbox"
                            checked={selectedAffiliates.includes(affiliate.id)}
                            onChange={() => handleSelectAffiliate(affiliate.id)}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-1 py-0.5 whitespace-nowrap text-xs text-gray-900 text-center font-medium" style={{ width: `${actualColumnWidths.affiliateNum}px`, maxWidth: `${actualColumnWidths.affiliateNum}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="affiliateNum" value={affiliate.affiliateNum} type="text" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.status}px`, maxWidth: `${actualColumnWidths.status}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="isActive" value={affiliate.isActive} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.name}px`, maxWidth: `${actualColumnWidths.name}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="name" value={affiliate.name} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.firstName}px`, maxWidth: `${actualColumnWidths.firstName}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="firstName" value={affiliate.firstName} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.lastName}px`, maxWidth: `${actualColumnWidths.lastName}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="lastName" value={affiliate.lastName} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.email}px`, maxWidth: `${actualColumnWidths.email}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="email" value={affiliate.email} type="email" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.workPhone}px`, maxWidth: `${actualColumnWidths.workPhone}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="workPhone" value={affiliate.workPhone} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.whatsApp}px`, maxWidth: `${actualColumnWidths.whatsApp}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="whatsApp" value={affiliate.whatsApp} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.address}px`, maxWidth: `${actualColumnWidths.address}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="address" value={affiliate.address} type="textarea" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.web}px`, maxWidth: `${actualColumnWidths.web}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="web" value={affiliate.web} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.description}px`, maxWidth: `${actualColumnWidths.description}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="description" value={affiliate.description} type="textarea" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.city}px`, maxWidth: `${actualColumnWidths.city}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="city" value={affiliate.city} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.maps}px`, maxWidth: `${actualColumnWidths.maps}px`, overflow: 'visible' }}>
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
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.location}px`, maxWidth: `${actualColumnWidths.location}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="location" value={affiliate.location} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.discount}px`, maxWidth: `${actualColumnWidths.discount}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="discount" value={affiliate.discount} />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.logo}px`, maxWidth: `${actualColumnWidths.logo}px`, overflow: 'visible' }}>
                          <LogoImage affiliate={affiliate} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.facebook}px`, maxWidth: `${actualColumnWidths.facebook}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="facebook" value={affiliate.facebook} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.instagram}px`, maxWidth: `${actualColumnWidths.instagram}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="instagram" value={affiliate.instagram} type="url" />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.category}px`, maxWidth: `${actualColumnWidths.category}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="category" value={affiliate.category} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.subCategory}px`, maxWidth: `${actualColumnWidths.subCategory}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="subCategory" value={affiliate.subCategory} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.service}px`, maxWidth: `${actualColumnWidths.service}px`, overflow: 'visible' }}>
                          <EditableField affiliate={affiliate} field="service" value={affiliate.service} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.type}px`, maxWidth: `${actualColumnWidths.type}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="type" value={affiliate.type} />
                        </td>
                        <td className="px-1 py-0.5" style={{ width: `${actualColumnWidths.sticker}px`, maxWidth: `${actualColumnWidths.sticker}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="sticker" value={!!affiliate.sticker} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.rating}px`, maxWidth: `${actualColumnWidths.rating}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="rating" value={affiliate.rating} type="number" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.recommended}px`, maxWidth: `${actualColumnWidths.recommended}px`, overflow: 'hidden' }}>
                          <EditableField affiliate={affiliate} field="recommended" value={affiliate.recommended} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.termsConditions}px`, maxWidth: `${actualColumnWidths.termsConditions}px`, overflow: 'hidden' }}>
                                                        <EditableField affiliate={affiliate} field="termsConditions" value={affiliate.termsConditions === 'true' || affiliate.termsConditions === 'yes' || affiliate.termsConditions === 'YES' || affiliate.termsConditions === 'TRUE'} type="boolean" />
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.visits}px`, maxWidth: `${actualColumnWidths.visits}px`, overflow: 'hidden' }}>
                          <div className="text-xs font-medium text-gray-900" style={{ color: '#111827' }}>{affiliate.totalVisits}</div>
                        </td>
                        <td className="px-1 py-0.5 text-center" style={{ width: `${actualColumnWidths.actions}px`, maxWidth: `${actualColumnWidths.actions}px`, overflow: 'hidden' }}>
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
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6" style={{ marginBottom: '20px' }}>
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
                                <td className="px-2 py-1 text-gray-900">{row.rowNumber}</td>
                                <td className="px-2 py-1 font-medium text-gray-900">{row.values[2] || '-'}</td>
                                <td className="px-2 py-1 text-gray-900">{row.values[5] || '-'}</td>
                                <td className="px-2 py-1 text-gray-900">{row.values[11] || '-'}</td>
                                <td className="px-2 py-1 text-gray-900">{row.values[14] || '-'}</td>
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
                    step="1"
                    value={editingAffiliate.rating || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, rating: Math.round(Math.min(5, Math.max(1, parseFloat(e.target.value) || 1)))})}
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
      
      {/* Fixed Bottom Scroll Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-40"
        style={{ height: '20px' }}
      >
        <div
          ref={fixedScrollRef}
          className="w-full h-full overflow-x-auto overflow-y-hidden table-scroll-container"
          style={{
            scrollbarWidth: 'auto', // Firefox - force scrollbar to always show
            msOverflowStyle: 'scrollbar', // IE - force scrollbar to always show
          }}
          onScroll={syncScrollFromFixed}
          onWheel={(e) => {
            // Allow horizontal scrolling with mouse wheel
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
               width: `${Object.values(actualColumnWidths).reduce((sum, width) => sum + width, 0) + 
                      (Object.keys(actualColumnWidths).length * 8) + // 8px padding per column (px-1 = 4px each side)
                      (Object.keys(actualColumnWidths).length * 4) + // 4px for resize handles per column
                      100}px`, // Much larger safety margin
               height: '1px'
             }}
           />
        </div>
      </div>
      
      {/* Logo Edit Modal */}
      {logoModal.isOpen && logoModal.affiliate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-2/3 lg:w-1/2 xl:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Logo for {logoModal.affiliate.name}
                </h3>
                <button
                  onClick={() => setLogoModal({isOpen: false, affiliate: null})}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Current Logo Preview */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Logo:
                  </label>
                  <div className="flex justify-center">
                                        {logoModal.affiliate.logo ? (
                      <div className="relative">
                        <img 
                          src={convertGoogleDriveUrl(logoModal.affiliate.logo)} 
                          alt="Current logo"
                          className="w-24 h-24 object-cover rounded border border-gray-300"
                          onError={(e) => {
                             e.currentTarget.style.display = 'none'
                             const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                             if (nextElement) nextElement.style.display = 'block'
                           }}
                        />
                        <div className="w-24 h-24 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center hidden">
                          <span className="text-gray-500 text-sm">❌ Broken</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL:
                  </label>
                  <input
                    type="url"
                    defaultValue={logoModal.affiliate.logo || ''}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    id="logoUrlInput"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste the direct URL to the image file. Google Drive links will be converted automatically.
                  </p>
                </div>

                {/* Smart Google Drive Integration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📗 Google Drive Logo Library:</h4>
                  
                  {/* Location-based folder suggestions */}
                  {logoModal.affiliate.city && (
                    <div className="mb-3">
                      <p className="text-xs text-blue-800 mb-2">
                        <strong>Suggested folder for {logoModal.affiliate.city}:</strong>
                      </p>
                      {(() => {
                        const city = logoModal.affiliate.city.toLowerCase()
                        let folderLink = ''
                        let folderName = ''
                        
                        if (city.includes('playa del carmen') || city.includes('playa')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Playa del Carmen'
                        } else if (city.includes('tulum')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Tulum'
                        } else if (city.includes('cancun') || city.includes('cancún')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Cancún Logos Afiliados'
                        } else if (city.includes('cozumel')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Cozumel'
                        } else if (city.includes('bacalar')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Bacalar'
                        } else if (city.includes('isla mujeres')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Isla Mujeres Logos Afiliados'
                        } else if (city.includes('puerto morelos')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Puerto Morelos Logos Afiliados'
                        } else if (city.includes('puerto aventuras')) {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Puerto Aventuras Logos Afiliados'
                        } else {
                          folderLink = 'https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW'
                          folderName = 'Browse All Folders'
                        }
                        
                        return (
                          <a 
                            href={folderLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            📁 Open {folderName} →
                          </a>
                        )
                      })()}
                    </div>
                  )}
                  
                  {/* General instructions */}
                  <ol className="text-xs text-blue-800 space-y-1">
                    <li>1. Click the blue folder button above to browse logos</li>
                    <li>2. Right-click the image → "Get link"</li>
                    <li>3. Change permissions to "Anyone with the link can view"</li>
                    <li>4. Copy the link and paste it above</li>
                    <li>5. We'll automatically convert it to a direct image URL</li>
                  </ol>
                  
                  {/* Quick access to main folder */}
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <a 
                      href="https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW?usp=sharing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:text-blue-900 underline"
                    >
                      🗂️ Browse all logo folders →
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    onClick={() => setLogoModal({isOpen: false, affiliate: null})}
                    className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const input = document.getElementById('logoUrlInput') as HTMLInputElement
                      let logoUrl = input.value.trim()
                      
                      // Convert Google Drive links to direct image URLs
                      if (logoUrl.includes('drive.google.com')) {
                        const fileIdMatch = logoUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
                        if (fileIdMatch) {
                          logoUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`
                        }
                      }
                      
                      handleLogoEdit(logoModal.affiliate!, logoUrl)
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Update Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastNotifications notifications={notifications} onRemove={removeToast} />
      
      {/* Field Annotation Context Menu */}
      <FieldAnnotationMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        currentAnnotation={getAnnotation(contextMenu.affiliateId, contextMenu.fieldName)}
        onSave={async (color, comment) => {
          const result = await saveAnnotation(contextMenu.affiliateId, contextMenu.fieldName, color, comment)
          if (result) {
            success('Annotation Saved', 'Field annotation updated successfully')
          } else {
            error('Save Failed', 'Unable to save annotation')
          }
          return result
        }}
        onRemove={async () => {
          const result = await removeAnnotation(contextMenu.affiliateId, contextMenu.fieldName)
          if (result) {
            success('Annotation Removed', 'Field annotation removed successfully')
          } else {
            error('Remove Failed', 'Unable to remove annotation')
          }
          return result
        }}
      />

      {/* Edit Field Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white border-4 border-blue-400 rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editModal.fieldName}
              </h3>
              <button
                onClick={() => setEditModal({...editModal, isOpen: false})}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editModal.fieldName}
                </label>
                {editModal.field === 'description' || editModal.field === 'address' ? (
                  <textarea
                    value={editModal.value}
                    onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type={editModal.field === 'web' || editModal.field === 'maps' || editModal.field === 'facebook' || editModal.field === 'instagram' ? 'url' : 'text'}
                    value={editModal.value}
                    onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                  />
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditModal({...editModal, isOpen: false})}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const affiliate = affiliates.find(a => a.id === editModal.affiliateId)
                    if (affiliate) {
                      const originalValue = (affiliate as any)[editModal.field]
                      handleFieldEdit(editModal.affiliateId, editModal.field, editModal.value, originalValue)
                    }
                    setEditModal({...editModal, isOpen: false})
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  )
} 