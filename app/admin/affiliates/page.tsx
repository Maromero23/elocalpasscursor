"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import Link from "next/link"
import { Building2, Plus, Search, Upload, Download, Edit, Trash2, Eye, Users, TrendingUp, FileSpreadsheet, RefreshCw, CheckCircle, XCircle, Filter, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowLeft, ArrowRight, Settings, MessageSquare, MapPin, QrCode, Clock } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useFieldAnnotations } from "@/hooks/use-field-annotations"
import { FieldAnnotationMenu } from "@/components/field-annotation-menu"

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
      { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    ]
  }
  return []
}

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
  const navItems = getNavItems(session?.user?.role || "")
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
  const [showWidthInputs, setShowWidthInputs] = useState(false)
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

  // Password protection for delete operations
  const [deletePasswordModal, setDeletePasswordModal] = useState<{
    isOpen: boolean
    type: 'single' | 'bulk' | 'clearAll'
    affiliateId?: string
    affiliateName?: string
    password: string
  }>({
    isOpen: false,
    type: 'single',
    password: ''
  })

  // Super admin password (in production, this should be environment variable)
  const SUPER_ADMIN_PASSWORD = "ELP2024@SuperAdmin!"

  // Add Affiliate form state
  const [newAffiliate, setNewAffiliate] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    workPhone: '',
    whatsApp: '',
    address: '',
    web: '',
    description: '',
    city: '',
    maps: '',
    location: '',
    discount: '',
    logo: '',
    facebook: '',
    instagram: '',
    category: '',
    subCategory: '',
    service: '',
    type: '',
    sticker: '',
    rating: null as number | null,
    recommended: false,
    termsConditions: '',
    isActive: true
  })

  // Default column widths - much more compact
  const defaultColumnWidths = {
    select: 20,              // Checkbox - very compact
    affiliateNum: 35,        // "No." - smaller
    status: 50,              // "STATUS" - smaller
    name: 100,               // "BUSINESS NAME" - more compact
    firstName: 70,           // "FIRST NAME" - smaller
    lastName: 70,            // "LAST NAME" - smaller
    email: 80,               // "EMAIL" - smaller
    workPhone: 75,           // "WORK PHONE" - smaller
    whatsApp: 65,            // "WHATSAPP" - smaller
    address: 60,             // "ADDRESS" - smaller
    web: 35,                 // "WEB" - smaller
    description: 80,         // "DESCRIPTION" - smaller
    city: 40,                // "CITY" - smaller
    maps: 40,                // "MAPS" - smaller
    location: 60,            // "LOCATION" - smaller
    discount: 60,            // "DISCOUNT" - smaller
    logo: 40,                // "LOGO" - smaller
    facebook: 60,            // "FACEBOOK" - smaller
    instagram: 70,           // "INSTAGRAM" - smaller
    category: 60,            // "CATEGORY" - smaller
    subCategory: 90,         // "SUB CATEGORY" - smaller
    service: 60,             // "SERVICE" - smaller
    type: 40,                // "TYPE" - smaller
    sticker: 50,             // "STICKER" - smaller
    rating: 45,              // "RATING" - smaller
    recommended: 75,         // "RECOMMENDED" - smaller
    termsConditions: 35,     // "T&C" - smaller
    visits: 45,              // "VISITS" - smaller
    actions: 50              // "ACTIONS" - very compact
  }

  // Column widths are now managed by the useUserPreferences hook
  const actualColumnWidths = Object.keys(columnWidths).length > 0 ? columnWidths : defaultColumnWidths

  // Simple column width function - NO restrictions whatsoever
  const getColumnWidth = (field: string) => {
    const width = (actualColumnWidths as any)[field] || (defaultColumnWidths as any)[field]
    // No minimum constraints - user has full control
    return Math.max(1, width) // Only 1px to prevent complete disappearing
  }

  // Reset column widths to defaults
  const resetColumnWidths = async () => {
    try {
      // Reset all columns to their default widths using both methods
      for (const [field, width] of Object.entries(defaultColumnWidths)) {
        await updateColumnWidth(field, width) // For persistence
        updateGridColumnWidth(field, width) // For immediate CSS update
      }
      
      success('Column Widths Reset', 'All columns have been reset to compact sizes')
    } catch (err) {
      console.error('Error resetting column widths:', err)
      error('Reset Failed', 'Unable to reset column widths')
    }
  }

  // Load affiliates
  useEffect(() => {
    loadAffiliates()
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, cityFilter, typeFilter, ratingFilter, sortField, sortDirection])

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
        ...(ratingFilter && { rating: ratingFilter }),
        ...(sortField && { sortField: sortField }),
        ...(sortField && { sortDirection: sortDirection })
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
    setDeletePasswordModal({
      isOpen: true,
      type: 'single',
      affiliateId: id,
      affiliateName: name,
      password: ''
    })
  }

  const handleBulkDelete = async () => {
    if (selectedAffiliates.length === 0) {
      error('No Selection', 'Please select affiliates to delete')
      return
    }
    
    setDeletePasswordModal({
      isOpen: true,
      type: 'bulk',
      password: ''
    })
  }

  const handleClearAllData = async () => {
    // This function is just a placeholder - the actual execution is handled by executeClearAllData
    // after password verification
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
    type?: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'textarea' | 'select'
  }) => {
    const isEditing = editingField?.affiliateId === affiliate.id && editingField?.field === field
    const annotation = getAnnotation(affiliate.id, field)
    const fieldHasComment = hasComment(affiliate.id, field)
    
    // Check if field is empty (null, undefined, empty string, or just whitespace)
    const isEmpty = value === null || value === undefined || value === '' || 
                   (typeof value === 'string' && value.trim() === '')
    
    // Get background color - prioritize existing annotations, then apply orange for empty fields
    const backgroundColor = (() => {
      const annotationColor = getFieldBackgroundColor(affiliate.id, field)
      if (annotationColor) {
        return annotationColor // Use existing annotation color
      }
      if (isEmpty && field !== 'isActive' && field !== 'affiliateNum') {
        return '#fed7aa' // Orange "Review Needed" color for empty fields
      }
      return 'transparent'
    })()
    
    // Check if content is truncated
    const isContentTruncated = () => {
      if (!value) return false
      return String(value).length > 20
    }

    // Check if this is a long field that should use modal editing
    const shouldUseModal = (field: string, value: any) => {
      const modalFields = ['name', 'maps', 'facebook', 'instagram', 'web', 'description', 'address', 'discount', 'location', 'category', 'subCategory', 'service']
      return modalFields.includes(field) // Always open modal for these fields, regardless of content length
    }

    const shouldShowTooltip = isContentTruncated() && value && String(value).length > 0

    // Get dropdown options for select fields
    const getSelectOptions = (fieldName: string) => {
      switch (fieldName) {
        case 'type':
          return [
            { value: '', label: 'Select type...' },
            { value: 'Restaurants', label: 'Restaurants' },
            { value: 'Stores', label: 'Stores' },
            { value: 'Services', label: 'Services' }
          ]
        case 'city':
          return [
            { value: '', label: 'Select city...' },
            { value: 'Bacalar', label: 'Bacalar' },
            { value: 'Cancun', label: 'Cancun' },
            { value: 'Cozumel', label: 'Cozumel' },
            { value: 'Holbox', label: 'Holbox' },
            { value: 'Isla Mujeres', label: 'Isla Mujeres' },
            { value: 'Playa del Carmen', label: 'Playa del Carmen' },
            { value: 'Puerto Aventuras', label: 'Puerto Aventuras' },
            { value: 'Puerto Morelos', label: 'Puerto Morelos' },
            { value: 'Tulum', label: 'Tulum' }
          ]
        default:
          return []
      }
    }

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
        case 'select':
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
      } else if (type === 'select') {
        const options = getSelectOptions(field)
        return (
          <select
            defaultValue={value || ''}
            onBlur={(e) => {
              const newValue = (e.target as HTMLSelectElement).value
              handleFieldEdit(affiliate.id, field, newValue, value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newValue = (e.target as HTMLSelectElement).value
                handleFieldEdit(affiliate.id, field, newValue, value)
              } else if (e.key === 'Escape') {
                setEditingField(null)
              }
            }}
            autoFocus
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
        className={`cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs relative group text-gray-900 w-full h-full flex items-center justify-between`}
        style={{ 
          backgroundColor: backgroundColor || 'transparent',
          minHeight: '20px',
          overflow: 'visible',
          position: 'relative'
        }}
        title={shouldShowTooltip ? String(value || '') : undefined}
      >
        <span className="truncate text-gray-900 flex-1" style={{ maxWidth: fieldHasComment ? 'calc(100% - 25px)' : '100%' }}>
          {displayValue()}
        </span>
        
        {/* Comment icon - only show if field has comment */}
        {fieldHasComment && (
          <div 
            className="ml-1 flex-shrink-0 relative"
            title={`Comment: ${annotation?.comment || ''}`}
          >
            <MessageSquare className="w-3 h-3 text-blue-500" />
          </div>
        )}
        
        {/* Enhanced tooltip on hover - shows even when there are comments */}
        {shouldShowTooltip && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none max-w-xs whitespace-nowrap"
               style={{
                 top: '-30px',
                 transform: 'translateX(-50%)',
                 zIndex: 1000
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
          <div 
            className="relative bg-white border-4 border-blue-400 rounded-lg shadow-2xl flex flex-col"
            style={(() => {
              // Adaptive sizing based on field type and content
              const isTextAreaField = ['description', 'address', 'discount', 'service'].includes(editModal.field)
              const isUrlField = ['web', 'maps', 'facebook', 'instagram'].includes(editModal.field)
              const contentLength = String(editModal.value || '').length
              
              if (isTextAreaField) {
                // Large modal for multi-line content
                return { width: '600px', height: '500px', minWidth: '500px', minHeight: '400px' }
              } else if (isUrlField || contentLength > 50) {
                // Medium modal for URLs and longer content
                return { width: '500px', height: '300px', minWidth: '400px', minHeight: '250px' }
              } else {
                // Small modal for simple fields
                return { width: '400px', height: '250px', minWidth: '350px', minHeight: '200px' }
              }
            })()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-blue-50">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editModal.fieldName}
              </h3>
              <button
                onClick={() => setEditModal({...editModal, isOpen: false})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {editModal.fieldName}
                </label>
                <div className="flex-1 mb-6">
                  {editModal.field === 'description' || editModal.field === 'address' || editModal.field === 'discount' || editModal.field === 'service' ? (
                    <textarea
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                      autoFocus
                    />
                  ) : editModal.field === 'web' || editModal.field === 'maps' || editModal.field === 'facebook' || editModal.field === 'instagram' ? (
                    // URL fields use textarea for better visibility of long URLs
                    <textarea
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm font-mono"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()} URL...`}
                      autoFocus
                      style={{ minHeight: '80px' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                      autoFocus
                    />
                  )}
                </div>
                
                {/* Show character count for long fields */}
                {(editModal.field === 'description' || editModal.field === 'address' || editModal.field === 'discount' || editModal.field === 'service') && (
                  <div className="text-xs text-gray-500 mb-3">
                    {String(editModal.value || '').length} characters
                  </div>
                )}
                
                {/* Buttons */}
                <div className="flex justify-end space-x-3 flex-shrink-0">
                  <button
                    onClick={() => setEditModal({...editModal, isOpen: false})}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Visual resize indicator showing modal size */}
            <div
              className="absolute bottom-1 right-1 w-4 h-4 opacity-30"
              title={(() => {
                const isTextAreaField = ['description', 'address', 'discount', 'service'].includes(editModal.field)
                const isUrlField = ['web', 'maps', 'facebook', 'instagram'].includes(editModal.field)
                return isTextAreaField ? 'Large modal' : isUrlField ? 'Medium modal' : 'Compact modal'
              })()}
            >
              <div className="text-gray-400 text-xs">⤡</div>
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
      const diff = e.clientX - startPos.x
      const deltaY = e.clientY - startPos.y
      setSize({
        width: Math.max(250, startSize.width + diff),
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

  // NEW: CSS Grid approach with custom properties
  const updateGridColumnWidth = (field: string, width: number) => {
    const root = document.documentElement
    const finalWidth = Math.max(1, width) // Only 1px minimum
    root.style.setProperty(`--col-${field}`, `${finalWidth}px`)
    
    // Also save to preferences for persistence
    updateColumnWidth(field, finalWidth)
  }

  const getGridColumnWidth = (field: string) => {
    const root = document.documentElement
    const cssValue = root.style.getPropertyValue(`--col-${field}`)
    if (cssValue) {
      return parseInt(cssValue.replace('px', ''))
    }
    return (defaultColumnWidths as any)[field] || 50
  }

  // Initialize CSS custom properties on component mount
  useEffect(() => {
    const root = document.documentElement
    Object.entries(actualColumnWidths).forEach(([field, width]) => {
      root.style.setProperty(`--col-${field}`, `${width}px`)
    })
  }, [actualColumnWidths])

  // NEW: Grid resize handler
  const GridResizeHandle = ({ field }: { field: string }) => {
    const [isResizing, setIsResizing] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startWidth, setStartWidth] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setStartX(e.clientX)
      setStartWidth(getGridColumnWidth(field))
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - startX
      const newWidth = Math.max(1, startWidth + diff)
      updateGridColumnWidth(field, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Auto-size based on content
      let autoWidth = 50
      if (field === 'select') autoWidth = 20
      else if (field === 'actions') autoWidth = 70
      else if (field === 'email' || field === 'name') autoWidth = 150
      else if (field === 'description' || field === 'address') autoWidth = 200
      else if (field === 'affiliateNum' || field === 'rating') autoWidth = 40
      
      updateGridColumnWidth(field, autoWidth)
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
    }, [isResizing, startX, startWidth])

    return (
      <div
        className="grid-resize-handle"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Drag to resize | Double-click to auto-size"
      />
    )
  }

  // Resizable Header Component with much easier resizing
  const ResizableHeader = ({ field, children, sortable = false }: { 
    field: keyof typeof actualColumnWidths
    children: React.ReactNode
    sortable?: boolean
  }) => {
    const [isResizing, setIsResizing] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startWidth, setStartWidth] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setStartX(e.clientX)
      setStartWidth(getColumnWidth(field))
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = e.clientX - startX
      let newWidth = Math.max(1, startWidth + diff) // Only 1px minimum to prevent disappearing
      
      console.log(`📏 Resizing column ${field}: ${startWidth}px → ${newWidth}px (diff: ${diff}px)`)
      updateColumnWidth(field, newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
      console.log(`✅ Finished resizing column ${field} to ${getColumnWidth(field)}px`)
    }

    // Double-click to auto-size column
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Auto-size based on content - use reasonable defaults
      let autoWidth = 50
      if (field === 'select') autoWidth = 20
      else if (field === 'actions') autoWidth = 70
      else if (field === 'email' || field === 'name') autoWidth = 150
      else if (field === 'description' || field === 'address') autoWidth = 200
      else if (field === 'affiliateNum' || field === 'rating') autoWidth = 40
      
      updateColumnWidth(field, autoWidth)
      console.log(`🔄 Auto-sized column ${field} to ${autoWidth}px`)
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
    }, [isResizing, startX, startWidth])

    const isActive = sortable && sortField === field
    
    return (
      <th 
        className={`px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider relative ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''} group border-r border-gray-300`}
        style={{ width: `${getColumnWidth(field)}px` }}
        onClick={sortable ? () => handleSort(field as string) : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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
        
        {/* Much larger, easier resize area - entire right border */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize transition-all duration-200 ${
            isHovering || isResizing 
              ? 'bg-blue-500 opacity-80' 
              : 'bg-gray-400 opacity-0 hover:opacity-60'
          }`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Drag to resize | Double-click to auto-size"
          style={{ zIndex: 300 }}
        />
        
        {/* Width display on hover */}
        {isHovering && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 text-xs rounded z-50">
            {getColumnWidth(field)}px
          </div>
        )}
        
        {/* Width input field when enabled */}
        {showWidthInputs && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <input
              type="number"
              value={getColumnWidth(field)}
              onChange={(e) => {
                const newWidth = Math.max(1, parseInt(e.target.value) || 1) // Only 1px minimum
                updateColumnWidth(field, newWidth)
              }}
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center bg-white"
              min="1"
              step="1"
              title={`Set exact width for ${field} column`}
            />
          </div>
        )}
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
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Password verification functions
  const verifyPasswordAndExecute = async (password: string, type: 'single' | 'bulk' | 'clearAll', affiliateId?: string, affiliateName?: string) => {
    if (password !== SUPER_ADMIN_PASSWORD) {
      error('Incorrect Password', 'Invalid super admin password')
      return
    }

    setDeletePasswordModal({ isOpen: false, type: 'single', password: '' })

    try {
      if (type === 'single' && affiliateId && affiliateName) {
        await executeDeleteAffiliate(affiliateId, affiliateName)
      } else if (type === 'bulk') {
        await executeBulkDelete()
      } else if (type === 'clearAll') {
        await executeClearAllData()
      }
    } catch (err) {
      console.error('Delete operation failed:', err)
      error('Delete Failed', 'Operation failed after password verification')
    }
  }

  const executeDeleteAffiliate = async (id: string, name: string) => {
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

  const executeBulkDelete = async () => {
    if (selectedAffiliates.length === 0) {
      error('No Selection', 'Please select affiliates to delete')
      return
    }

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

  const executeClearAllData = async () => {
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

  // Add new affiliate function
  const handleAddAffiliate = async () => {
    try {
      // Validate required fields
      if (!newAffiliate.name.trim()) {
        error('Validation Error', 'Business name is required')
        return
      }
      if (!newAffiliate.email.trim()) {
        error('Validation Error', 'Email is required')
        return
      }

      // Prepare the data for submission
      const affiliateData = {
        ...newAffiliate,
        rating: newAffiliate.rating ? parseFloat(newAffiliate.rating) : null,
        recommended: newAffiliate.recommended,
        isActive: newAffiliate.isActive
      }

      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(affiliateData)
      })

      const result = await response.json()

      if (result.success) {
        success('Affiliate Added', 'New affiliate has been successfully added')
        setShowAddModal(false)
        // Reset form
        setNewAffiliate({
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          workPhone: '',
          whatsApp: '',
          address: '',
          web: '',
          description: '',
          city: '',
          maps: '',
          location: '',
          discount: '',
          logo: '',
          facebook: '',
          instagram: '',
          category: '',
          subCategory: '',
          service: '',
          type: '',
          sticker: null,
          rating: null,
          recommended: false,
          termsConditions: null,
          isActive: true
        })
        loadAffiliates()
      } else {
        error('Add Failed', result.error || 'Unable to add affiliate')
      }
    } catch (err) {
      console.error('Add affiliate error:', err)
      error('Add Failed', 'Unable to add affiliate')
    }
  }

  // Server handles sorting, so we just use the data as-is
  let filteredAffiliates = [...affiliates]

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
        
        /* NEW: CSS Grid approach with custom properties */
        .affiliate-grid {
          display: grid;
          grid-template-columns: 
            var(--col-select, 20px) 
            var(--col-affiliateNum, 35px) 
            var(--col-status, 50px) 
            var(--col-name, 100px) 
            var(--col-firstName, 70px) 
            var(--col-lastName, 70px) 
            var(--col-email, 80px) 
            var(--col-workPhone, 75px) 
            var(--col-whatsApp, 65px) 
            var(--col-address, 60px) 
            var(--col-web, 35px) 
            var(--col-description, 80px) 
            var(--col-city, 40px) 
            var(--col-maps, 40px) 
            var(--col-location, 60px) 
            var(--col-discount, 60px) 
            var(--col-logo, 40px) 
            var(--col-facebook, 60px) 
            var(--col-instagram, 70px) 
            var(--col-category, 60px) 
            var(--col-subCategory, 90px) 
            var(--col-service, 60px) 
            var(--col-type, 40px) 
            var(--col-sticker, 50px) 
            var(--col-rating, 45px) 
            var(--col-recommended, 75px) 
            var(--col-termsConditions, 35px) 
            var(--col-visits, 45px) 
            var(--col-actions, 50px);
          border: 1px solid #d1d5db;
        }
        
        .affiliate-grid-header,
        .affiliate-grid-row {
          display: contents;
        }
        
        .affiliate-grid-cell {
          background-color: white;
          padding: 4px 8px;
          border-bottom: 1px solid #e5e7eb;
          overflow: visible; /* Changed from hidden to visible for tooltips */
          font-size: 12px;
          display: flex;
          align-items: center;
          min-height: 28px;
          position: relative; /* Important for tooltips */
        }
        
        /* Grid cells need group behavior for tooltips */
        .affiliate-grid-cell:hover {
          background-color: #f3f4f6;
          z-index: 10; /* Ensure hovered cells are above others */
        }
        
        /* Ensure tooltip container doesn't get clipped */
        .affiliate-grid-cell.group {
          position: relative;
        }
        
        /* Make sure tooltips appear above everything */
        .affiliate-grid-cell .group-hover\\:opacity-100 {
          z-index: 1000;
        }
        
        .affiliate-grid-header-cell {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          position: relative;
          justify-content: center;
          text-align: center;
          border-bottom: 2px solid #d1d5db;
        }
        
        .grid-resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: transparent;
          cursor: col-resize;
          z-index: 10;
        }
        
        .grid-resize-handle:hover {
          background: #3b82f6;
          opacity: 0.8;
        }
        
        .grid-resize-handle:active {
          background: #ef4444;
          opacity: 1;
        }

      `}} />
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-orange-400 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
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

      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
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
                    setDeletePasswordModal({
                      isOpen: true,
                      type: 'clearAll',
                      password: ''
                    })
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

      <div className="px-4 sm:px-6 lg:px-8 py-6">
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
                  width: `${(Object.values(actualColumnWidths) as number[]).reduce((sum: number, width: number) => sum + width, 0) + 
                         (Object.keys(actualColumnWidths).length * 12) + // Extra padding per column 
                         5000}px`, // Extra large safety margin to ensure ALL columns are reachable
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
                <div className="affiliate-grid">
                  {/* Header Row */}
                  <div className="affiliate-grid-header">
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      <input
                        type="checkbox"
                        checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                        onChange={handleSelectAll}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <GridResizeHandle field="select" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell" onClick={() => handleSort('affiliateNum')}>
                      No.
                      {sortField === 'affiliateNum' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <GridResizeHandle field="affiliateNum" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Status
                      <GridResizeHandle field="status" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell" onClick={() => handleSort('name')}>
                      Business Name
                      {sortField === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <GridResizeHandle field="name" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      First Name
                      <GridResizeHandle field="firstName" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Last Name
                      <GridResizeHandle field="lastName" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Email
                      <GridResizeHandle field="email" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Work Phone
                      <GridResizeHandle field="workPhone" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      WhatsApp
                      <GridResizeHandle field="whatsApp" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Address
                      <GridResizeHandle field="address" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Website
                      <GridResizeHandle field="web" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Description
                      <GridResizeHandle field="description" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell" onClick={() => handleSort('city')}>
                      City
                      {sortField === 'city' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <GridResizeHandle field="city" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Maps URL
                      <GridResizeHandle field="maps" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Location
                      <GridResizeHandle field="location" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Discount
                      <GridResizeHandle field="discount" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Logo
                      <GridResizeHandle field="logo" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Facebook
                      <GridResizeHandle field="facebook" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Instagram
                      <GridResizeHandle field="instagram" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Category
                      <GridResizeHandle field="category" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Sub-Category
                      <GridResizeHandle field="subCategory" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Service
                      <GridResizeHandle field="service" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell" onClick={() => handleSort('type')}>
                      Type
                      {sortField === 'type' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <GridResizeHandle field="type" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Sticker
                      <GridResizeHandle field="sticker" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell" onClick={() => handleSort('rating')}>
                      Rating
                      {sortField === 'rating' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      <GridResizeHandle field="rating" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Recommend
                      <GridResizeHandle field="recommended" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      T & C
                      <GridResizeHandle field="termsConditions" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Visits
                      <GridResizeHandle field="visits" />
                    </div>
                    <div className="affiliate-grid-cell affiliate-grid-header-cell">
                      Actions
                      <GridResizeHandle field="actions" />
                    </div>
                  </div>

                  {/* Data Rows */}
                  {filteredAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="affiliate-grid-row">
                      <div className="affiliate-grid-cell group">
                        <input
                          type="checkbox"
                          checked={selectedAffiliates.includes(affiliate.id)}
                          onChange={() => handleSelectAffiliate(affiliate.id)}
                          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="affiliateNum" value={affiliate.affiliateNum} type="text" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="isActive" value={affiliate.isActive} type="boolean" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="name" value={affiliate.name} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="firstName" value={affiliate.firstName} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="lastName" value={affiliate.lastName} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="email" value={affiliate.email} type="email" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="workPhone" value={affiliate.workPhone} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="whatsApp" value={affiliate.whatsApp} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="address" value={affiliate.address} type="textarea" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="web" value={affiliate.web} type="url" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="description" value={affiliate.description} type="textarea" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="city" value={affiliate.city} type="select" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <div className="flex items-center space-x-1 w-full">
                          {affiliate.maps && (
                            <a href={affiliate.maps} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex-shrink-0" title="Open in Maps">
                              📍
                            </a>
                          )}
                          <div className="flex-1 min-w-0">
                            <EditableField affiliate={affiliate} field="maps" value={affiliate.maps} type="url" />
                          </div>
                        </div>
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="location" value={affiliate.location} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="discount" value={affiliate.discount} />
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
                        <LogoImage affiliate={affiliate} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="facebook" value={affiliate.facebook} type="url" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="instagram" value={affiliate.instagram} type="url" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="category" value={affiliate.category} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="subCategory" value={affiliate.subCategory} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="service" value={affiliate.service} />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="type" value={affiliate.type} type="select" />
                      </div>
                      <div className="affiliate-grid-cell group">
                        <EditableField affiliate={affiliate} field="sticker" value={!!affiliate.sticker} type="boolean" />
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
                        <EditableField affiliate={affiliate} field="rating" value={affiliate.rating} type="number" />
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
                        <EditableField affiliate={affiliate} field="recommended" value={affiliate.recommended} type="boolean" />
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
                        <EditableField affiliate={affiliate} field="termsConditions" value={affiliate.termsConditions === 'true' || affiliate.termsConditions === 'yes' || affiliate.termsConditions === 'YES' || affiliate.termsConditions === 'TRUE'} type="boolean" />
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
                        <div className="text-xs font-medium text-gray-900">{affiliate.totalVisits}</div>
                      </div>
                      <div className="affiliate-grid-cell justify-center group">
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
                      </div>
                    </div>
                  ))}
                </div>
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
                  <select
                    value={editingAffiliate.city || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, city: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select city...</option>
                    <option value="Bacalar">Bacalar</option>
                    <option value="Cancun">Cancun</option>
                    <option value="Cozumel">Cozumel</option>
                    <option value="Holbox">Holbox</option>
                    <option value="Isla Mujeres">Isla Mujeres</option>
                    <option value="Playa del Carmen">Playa del Carmen</option>
                    <option value="Puerto Aventuras">Puerto Aventuras</option>
                    <option value="Puerto Morelos">Puerto Morelos</option>
                    <option value="Tulum">Tulum</option>
                  </select>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                  
                  {/* File Upload Option */}
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">Upload Logo File:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('affiliateId', editingAffiliate.id)
                        formData.append('affiliateName', editingAffiliate.name)
                        
                        try {
                          const response = await fetch('/api/admin/affiliates/upload-logo', {
                            method: 'POST',
                            body: formData
                          })
                          
                          const result = await response.json()
                          if (result.success) {
                            setEditingAffiliate({...editingAffiliate, logo: result.url})
                            success('Logo uploaded successfully!')
                          } else {
                            error('Upload failed', result.error)
                          }
                        } catch (err) {
                          error('Upload failed', 'Unable to upload logo file')
                        }
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP • Max 5MB</p>
                  </div>
                  
                  {/* OR Separator */}
                  <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-1 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                  
                  {/* URL Input Option */}
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600 mb-1">Logo URL:</label>
                    <input
                      type="url"
                      value={editingAffiliate.logo || ''}
                      onChange={(e) => setEditingAffiliate({...editingAffiliate, logo: e.target.value})}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Logo Preview */}
                  {editingAffiliate.logo && (
                    <div className="text-center">
                      <img 
                        src={editingAffiliate.logo} 
                        alt="Logo preview" 
                        className="w-12 h-12 object-cover rounded border border-gray-300 mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
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
                  <select
                    value={editingAffiliate.type || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, type: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    <option value="Restaurants">Restaurants</option>
                    <option value="Stores">Stores</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sticker</label>
                  <select
                    value={editingAffiliate.sticker || ''}
                    onChange={(e) => setEditingAffiliate({...editingAffiliate, sticker: e.target.value})}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
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
        style={{ height: '12px' }}
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
                      (Object.keys(actualColumnWidths).length * 12) + // Extra padding per column 
                      5000}px`, // Extra large safety margin to ensure ALL columns are reachable
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

                {/* Method Selection Guide */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Choose Your Method:</h4>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div>• <strong>🚀 Upload File:</strong> Best for new logos - fast, reliable, professional hosting</div>
                    <div>• <strong>🔗 Use URL:</strong> Best for existing Google Drive links or external URLs</div>
                  </div>
                </div>

                {/* Method 1: File Upload (Recommended) */}
                <div className="mb-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <h5 className="text-sm font-medium text-green-900 mb-2 flex items-center">
                    🚀 Method 1: Upload File (Recommended)
                    <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">BEST</span>
                  </h5>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('affiliateId', logoModal.affiliate!.id)
                      formData.append('affiliateName', logoModal.affiliate!.name)
                      
                      try {
                        const response = await fetch('/api/admin/affiliates/upload-logo', {
                          method: 'POST',
                          body: formData
                        })
                        
                        const result = await response.json()
                        if (result.success) {
                          // Update the affiliate record immediately
                          await handleLogoEdit(logoModal.affiliate!, result.url)
                          success('Logo uploaded and saved successfully!')
                        } else {
                          error('Upload failed', result.error)
                        }
                      } catch (err) {
                        error('Upload failed', 'Unable to upload logo file')
                      }
                    }}
                    className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                  <div className="flex items-center mt-2 text-xs text-green-700">
                    <div className="flex-1">
                      ✅ JPG, PNG, GIF, WebP • Max 5MB
                    </div>
                    <div className="text-green-600 font-medium">
                      Auto-saves immediately!
                    </div>
                  </div>
                </div>

                {/* OR Separator */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500 font-medium">OR</span>
                  </div>
                </div>

                {/* Method 2: URL Input */}
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">
                    🔗 Method 2: Use Logo URL
                  </h5>
                  <input
                    type="url"
                    defaultValue={logoModal.affiliate.logo || ''}
                    placeholder="https://example.com/logo.png or Google Drive link"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 bg-white"
                    id="logoUrlInput"
                  />
                  
                  {/* Google Drive Helper */}
                  <div className="bg-blue-100 border border-blue-300 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-xs font-medium text-blue-900">📁 Google Drive Library</h6>
                      {logoModal.affiliate.city && (
                        <a 
                          href="https://drive.google.com/drive/folders/1qEtSGz0wnpsPvX3CZBhieIvwP3L3XZuW" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          📁 Browse {logoModal.affiliate.city} →
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-blue-800">
                      <strong>Quick steps:</strong> Browse folder → Right-click image → "Get link" → Make public → Copy & paste above
                    </div>
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
          <div 
            className="relative bg-white border-4 border-blue-400 rounded-lg shadow-2xl flex flex-col"
            style={(() => {
              // Adaptive sizing based on field type and content
              const isTextAreaField = ['description', 'address', 'discount', 'service'].includes(editModal.field)
              const isUrlField = ['web', 'maps', 'facebook', 'instagram'].includes(editModal.field)
              const contentLength = String(editModal.value || '').length
              
              if (isTextAreaField) {
                // Large modal for multi-line content
                return { width: '600px', height: '500px', minWidth: '500px', minHeight: '400px' }
              } else if (isUrlField || contentLength > 50) {
                // Medium modal for URLs and longer content
                return { width: '500px', height: '300px', minWidth: '400px', minHeight: '250px' }
              } else {
                // Small modal for simple fields
                return { width: '400px', height: '250px', minWidth: '350px', minHeight: '200px' }
              }
            })()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-blue-50">
              <h3 className="text-lg font-medium text-gray-900">
                Edit {editModal.fieldName}
              </h3>
              <button
                onClick={() => setEditModal({...editModal, isOpen: false})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {editModal.fieldName}
                </label>
                <div className="flex-1 mb-6">
                  {editModal.field === 'description' || editModal.field === 'address' || editModal.field === 'discount' || editModal.field === 'service' ? (
                    <textarea
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                      autoFocus
                    />
                  ) : editModal.field === 'web' || editModal.field === 'maps' || editModal.field === 'facebook' || editModal.field === 'instagram' ? (
                    // URL fields use textarea for better visibility of long URLs
                    <textarea
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm font-mono"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()} URL...`}
                      autoFocus
                      style={{ minHeight: '80px' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={editModal.value}
                      onChange={(e) => setEditModal({...editModal, value: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={`Enter ${editModal.fieldName.toLowerCase()}...`}
                      autoFocus
                    />
                  )}
                </div>
                
                {/* Show character count for long fields */}
                {(editModal.field === 'description' || editModal.field === 'address' || editModal.field === 'discount' || editModal.field === 'service') && (
                  <div className="text-xs text-gray-500 mb-3">
                    {String(editModal.value || '').length} characters
                  </div>
                )}
                
                {/* Buttons */}
                <div className="flex justify-end space-x-3 flex-shrink-0">
                  <button
                    onClick={() => setEditModal({...editModal, isOpen: false})}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Visual resize indicator showing modal size */}
            <div
              className="absolute bottom-1 right-1 w-4 h-4 opacity-30"
              title={(() => {
                const isTextAreaField = ['description', 'address', 'discount', 'service'].includes(editModal.field)
                const isUrlField = ['web', 'maps', 'facebook', 'instagram'].includes(editModal.field)
                return isTextAreaField ? 'Large modal' : isUrlField ? 'Medium modal' : 'Compact modal'
              })()}
            >
              <div className="text-gray-400 text-xs">⤡</div>
            </div>
          </div>
        </div>
      )}

      {/* Password Protection Modal */}
      {deletePasswordModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white border-4 border-red-400 rounded-lg shadow-2xl w-96 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                🔒 Super Admin Access Required
              </h3>
              <button
                onClick={() => setDeletePasswordModal({...deletePasswordModal, isOpen: false})}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Warning Message */}
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {deletePasswordModal.type === 'single' && deletePasswordModal.affiliateName && (
                  <>⚠️ You are about to permanently delete "<strong>{deletePasswordModal.affiliateName}</strong>" and all associated data.</>
                )}
                {deletePasswordModal.type === 'bulk' && selectedAffiliates.length > 0 && (
                  <>⚠️ You are about to permanently delete <strong>{selectedAffiliates.length} selected affiliates</strong> and all associated data.</>
                )}
                {deletePasswordModal.type === 'clearAll' && (
                  <>⚠️ You are about to permanently delete <strong>ALL {summary.total} affiliates</strong> and all associated data.</>
                )}
              </p>
              <p className="text-xs text-red-600 mt-2">
                This action cannot be undone. Please enter the super admin password to confirm.
              </p>
            </div>
            
            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Super Admin Password
              </label>
              <input
                type="password"
                value={deletePasswordModal.password}
                onChange={(e) => setDeletePasswordModal({...deletePasswordModal, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter super admin password..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyPasswordAndExecute(
                      deletePasswordModal.password, 
                      deletePasswordModal.type, 
                      deletePasswordModal.affiliateId, 
                      deletePasswordModal.affiliateName
                    )
                  }
                }}
              />
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletePasswordModal({...deletePasswordModal, isOpen: false})}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  verifyPasswordAndExecute(
                    deletePasswordModal.password, 
                    deletePasswordModal.type, 
                    deletePasswordModal.affiliateId, 
                    deletePasswordModal.affiliateName
                  )
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Affiliate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white border-4 border-blue-400 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 bg-blue-50">
              <h3 className="text-lg font-medium text-gray-900">
                ➕ Add New Affiliate
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Business Name - Required */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate({...newAffiliate, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter business name..."
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={newAffiliate.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setNewAffiliate({...newAffiliate, isActive: e.target.value === 'active'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={newAffiliate.firstName}
                    onChange={(e) => setNewAffiliate({...newAffiliate, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name..."
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={newAffiliate.lastName}
                    onChange={(e) => setNewAffiliate({...newAffiliate, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name..."
                  />
                </div>

                {/* Email - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newAffiliate.email}
                    onChange={(e) => setNewAffiliate({...newAffiliate, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address..."
                    required
                  />
                </div>

                {/* Work Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Phone</label>
                  <input
                    type="tel"
                    value={newAffiliate.workPhone}
                    onChange={(e) => setNewAffiliate({...newAffiliate, workPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter work phone..."
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                  <input
                    type="tel"
                    value={newAffiliate.whatsApp}
                    onChange={(e) => setNewAffiliate({...newAffiliate, whatsApp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter WhatsApp number..."
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={newAffiliate.web}
                    onChange={(e) => setNewAffiliate({...newAffiliate, web: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter website URL..."
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={newAffiliate.city}
                    onChange={(e) => setNewAffiliate({...newAffiliate, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select city...</option>
                    <option value="Bacalar">Bacalar</option>
                    <option value="Cancun">Cancun</option>
                    <option value="Cozumel">Cozumel</option>
                    <option value="Holbox">Holbox</option>
                    <option value="Isla Mujeres">Isla Mujeres</option>
                    <option value="Playa del Carmen">Playa del Carmen</option>
                    <option value="Puerto Aventuras">Puerto Aventuras</option>
                    <option value="Puerto Morelos">Puerto Morelos</option>
                    <option value="Tulum">Tulum</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={newAffiliate.category}
                    onChange={(e) => setNewAffiliate({...newAffiliate, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter category..."
                  />
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                  <input
                    type="text"
                    value={newAffiliate.subCategory}
                    onChange={(e) => setNewAffiliate({...newAffiliate, subCategory: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter sub category..."
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newAffiliate.type}
                    onChange={(e) => setNewAffiliate({...newAffiliate, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type...</option>
                    <option value="Restaurants">Restaurants</option>
                    <option value="Stores">Stores</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={newAffiliate.rating || ''}
                    onChange={(e) => setNewAffiliate({...newAffiliate, rating: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter rating (1-5)..."
                  />
                </div>

                {/* Recommended */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommended</label>
                  <select
                    value={newAffiliate.recommended ? 'true' : 'false'}
                    onChange={(e) => setNewAffiliate({...newAffiliate, recommended: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newAffiliate.location}
                    onChange={(e) => setNewAffiliate({...newAffiliate, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter location..."
                  />
                </div>

                {/* Sticker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sticker</label>
                  <select
                    value={newAffiliate.sticker || ''}
                    onChange={(e) => setNewAffiliate({...newAffiliate, sticker: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                  <select
                    value={newAffiliate.termsConditions || ''}
                    onChange={(e) => setNewAffiliate({...newAffiliate, termsConditions: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                {/* Address - Full width */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={newAffiliate.address}
                    onChange={(e) => setNewAffiliate({...newAffiliate, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Enter full address..."
                  />
                </div>

                {/* Description - Full width */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newAffiliate.description}
                    onChange={(e) => setNewAffiliate({...newAffiliate, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter business description..."
                  />
                </div>

                {/* Discount - Full width */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                  <textarea
                    value={newAffiliate.discount}
                    onChange={(e) => setNewAffiliate({...newAffiliate, discount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Enter discount information..."
                  />
                </div>

                {/* Service - Full width */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                  <textarea
                    value={newAffiliate.service}
                    onChange={(e) => setNewAffiliate({...newAffiliate, service: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="2"
                    placeholder="Enter services offered..."
                  />
                </div>

                {/* Social Media and Additional Info */}
                <div className="lg:col-span-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">Social Media & Additional Info</h4>
                  
                  {/* Facebook - Full width */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <input
                      type="url"
                      value={newAffiliate.facebook}
                      onChange={(e) => setNewAffiliate({...newAffiliate, facebook: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Facebook URL..."
                    />
                  </div>
                  
                  {/* Instagram - Full width */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="url"
                      value={newAffiliate.instagram}
                      onChange={(e) => setNewAffiliate({...newAffiliate, instagram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Instagram URL..."
                    />
                  </div>
                  
                  {/* Google Maps - Full width */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps</label>
                    <input
                      type="url"
                      value={newAffiliate.maps}
                      onChange={(e) => setNewAffiliate({...newAffiliate, maps: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Google Maps URL..."
                    />
                  </div>
                  
                  {/* Logo - Full width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    
                    {/* File Upload Option */}
                    <div className="mb-3">
                      <label className="block text-xs text-gray-600 mb-1">Upload Logo File:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          if (!newAffiliate.name) {
                            error('Please enter a business name first')
                            e.target.value = ''
                            return
                          }
                          
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('affiliateId', 'new')
                          formData.append('affiliateName', newAffiliate.name)
                          
                          try {
                            const response = await fetch('/api/admin/affiliates/upload-logo', {
                              method: 'POST',
                              body: formData
                            })
                            
                            const result = await response.json()
                            if (result.success) {
                              setNewAffiliate({...newAffiliate, logo: result.url})
                              success('Logo uploaded successfully!')
                            } else {
                              error('Upload failed', result.error)
                            }
                          } catch (err) {
                            error('Upload failed', 'Unable to upload logo file')
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, or WebP • Max 5MB</p>
                    </div>
                    
                    {/* OR Separator */}
                    <div className="relative mb-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>
                    
                    {/* URL Input Option */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Logo URL:</label>
                      <input
                        type="url"
                        value={newAffiliate.logo}
                        onChange={(e) => setNewAffiliate({...newAffiliate, logo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter logo URL..."
                      />
                    </div>
                    
                    {/* Logo Preview */}
                    {newAffiliate.logo && (
                      <div className="mt-2 text-center">
                        <img 
                          src={newAffiliate.logo} 
                          alt="Logo preview" 
                          className="w-16 h-16 object-cover rounded border border-gray-300 mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAffiliate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Add Affiliate
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  )
} 