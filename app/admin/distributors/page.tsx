"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../../components/auth/protected-route"
import Link from "next/link"
import { MapPin, Building2, Users, ChevronRight, ChevronDown, Edit2, Save, X, Plus, Settings, Trash2, User, Mail, Phone, QrCode, ArrowUpDown, ArrowUp, ArrowDown, Filter, Eye, EyeOff, Search } from "lucide-react"
import { useToast } from '@/hooks/use-toast'

interface Distributor {
  id: string
  name: string
  isActive: boolean
  user: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }
  _count: {
    locations: number
  }
}

interface DistributorDetails {
  id: string
  name: string
  isActive: boolean
  contactPerson?: string
  email?: string
  telephone?: string
  whatsapp?: string
  notes?: string
  user: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }
  locations: {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    contactPerson: string | null
    email: string | null
    telephone: string | null
    notes: string | null
    user: {
      id: string
      name: string | null
      email: string | null
      isActive: boolean
      createdAt: string
    } | null
    _count: {
      sellers: number
    }
    sellers: {
      id: string
      name: string | null
      email: string | null
      telephone: string | null
      whatsapp: string | null
      notes: string | null
      defaultDiscountType: string | null
      defaultDiscountValue: number | null
      discountCode: string | null
      isActive: boolean
      role: string
      createdAt: string
      sellerConfigs: {
        sendMethod: string
        defaultGuests: number
        defaultDays: number
        fixedPrice: number
      } | null
    }[]
  }[]
  _count: {
    locations: number
  }
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
    ]
  }
  return []
}

export default function DistributorsPage() {
  const { data: session } = useSession()
  const [distributors, setDistributors] = useState<Distributor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedDistributor, setExpandedDistributor] = useState<string | null>(null)
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null)
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [distributorDetails, setDistributorDetails] = useState<{ [key: string]: DistributorDetails }>({})
  const [loadingDetails, setLoadingDetails] = useState<{ [key: string]: boolean }>({})
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc') // Default A to Z
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all') // Default show all
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical') // View mode filter
  const [entityFilter, setEntityFilter] = useState<'all' | 'distributors' | 'locations' | 'sellers'>('all') // Entity filter
  const [searchQuery, setSearchQuery] = useState('') // Search functionality
  
  // Edit mode states
  const [editingDistributor, setEditingDistributor] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [editingSeller, setEditingSeller] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    password: "",
    alternativeEmail: "",
    telephone: "",
    whatsapp: "",
    notes: ""
  })
  const [locationEditFormData, setLocationEditFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    telephone: "",
    whatsapp: "",
    notes: "",
    password: ""
  })
      const [sellerEditFormData, setSellerEditFormData] = useState({
      name: "",
      email: "",
      password: "",
      telephone: "",
      whatsapp: "",
      notes: "",
      defaultDiscountType: "percentage",
      defaultDiscountValue: 0,
      discountCode: "" // Read-only, will be populated from existing data
    })
  const [isUpdating, setIsUpdating] = useState(false)

  // Modal states for adding locations, sellers, and independent sellers
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [showIndependentSellerModal, setShowIndependentSellerModal] = useState(false)
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  
  // Location form data
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    password: "",
    telephone: "",
    whatsapp: "",
    notes: ""
  })
  
  // Seller form data
  const [sellerFormData, setSellerFormData] = useState({
    name: "",
    email: "",
    password: "",
    telephone: "",
    whatsapp: "",
    notes: ""
  })

  // Independent seller form data
  const [independentSellerFormData, setIndependentSellerFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    password: "",
    telephone: "",
    whatsapp: "",
    notes: "",
    address: ""
  })
  
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [isCreatingSeller, setIsCreatingSeller] = useState(false)
  const [isCreatingIndependentSeller, setIsCreatingIndependentSeller] = useState(false)

  // QR Configuration pairing states
  const [showQRPairingModal, setShowQRPairingModal] = useState(false)
  const [selectedSellerForQR, setSelectedSellerForQR] = useState<any>(null)
  const [availableQRConfigs, setAvailableQRConfigs] = useState<Array<{
    id: string
    name: string
    description: string
    config: any
    createdAt: Date
    source?: string
    landingPageConfig?: any
    emailTemplates?: {
      welcomeEmail?: any
      rebuyEmail?: any
    }
  }>>([])
  const [loadingQRConfigs, setLoadingQRConfigs] = useState(false)
  const [expandedQRConfigs, setExpandedQRConfigs] = useState<Set<string>>(new Set())
  const [qrSearchQuery, setQrSearchQuery] = useState('')
  const [qrFilterPricingType, setQrFilterPricingType] = useState('ALL')
  const [qrFilterDeliveryMethod, setQrFilterDeliveryMethod] = useState('ALL')
  const [qrSortBy, setQrSortBy] = useState('DATE_DESC')

  // Toast notifications
  const { success: showSuccess, error: showError } = useToast()

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

  const filteredAndSortedQRConfigs = availableQRConfigs
    .filter(config => {
      // Search query filter (name, description)
      const matchesSearch = qrSearchQuery === '' || 
        config.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
        config.description.toLowerCase().includes(qrSearchQuery.toLowerCase())

      // Pricing type filter
      const matchesPricing = qrFilterPricingType === 'ALL' || 
        config.config.button2PricingType === qrFilterPricingType

      // Delivery method filter
      const matchesDelivery = qrFilterDeliveryMethod === 'ALL' || 
        config.config.button3DeliveryMethod === qrFilterDeliveryMethod

      return matchesSearch && matchesPricing && matchesDelivery
    })
    .sort((a, b) => {
      switch (qrSortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name)
        case 'NAME_DESC':
          return b.name.localeCompare(a.name)
        case 'DATE_ASC':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'DATE_DESC':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const toggleQRConfigExpanded = (configId: string) => {
    const newExpanded = new Set(expandedQRConfigs)
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId)
    } else {
      newExpanded.add(configId)
    }
    setExpandedQRConfigs(newExpanded)
  }

  const navItems = getNavItems(session?.user?.role || "")

  useEffect(() => {
    fetchDistributors()
  }, [])

  // Auto-load distributor details when filtering by locations or sellers
  useEffect(() => {
    if (entityFilter === 'locations' || entityFilter === 'sellers') {
      // Load details for all distributors to access nested data
      distributors.forEach(distributor => {
        if (!distributorDetails[distributor.id] && !loadingDetails[distributor.id]) {
          fetchDistributorDetails(distributor.id)
        }
      })
    }
  }, [entityFilter, distributors])

  const fetchDistributors = async () => {
    try {
      const response = await fetch("/api/admin/distributors", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDistributors(data)
        
        // Fetch details for each distributor to show seller counts immediately
        data.forEach((distributor: Distributor) => {
          fetchDistributorDetails(distributor.id)
        })
      } else {
        setError("Failed to fetch distributors")
      }
    } catch (error) {
      setError("Error fetching distributors")
    } finally {
      setLoading(false)
    }
  }

  const fetchDistributorDetails = async (distributorId: string, forceRefresh: boolean = false) => {
    if (distributorDetails[distributorId] && !forceRefresh) return // Already fetched, unless forcing refresh

    setLoadingDetails(prev => ({ ...prev, [distributorId]: true }))
    try {
      const response = await fetch(`/api/admin/distributors/${distributorId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Fetched distributor details for ${distributorId}:`, data)
        setDistributorDetails(prev => ({ ...prev, [distributorId]: data }))
      } else {
        setError("Failed to fetch distributor details")
      }
    } catch (error) {
      setError("Error fetching distributor details")
    } finally {
      setLoadingDetails(prev => ({ ...prev, [distributorId]: false }))
    }
  }

  const handleDistributorClick = async (distributorId: string) => {
    if (expandedDistributor === distributorId) {
      setExpandedDistributor(null)
      setExpandedLocation(null)
      setSelectedSeller(null)
    } else {
      setExpandedDistributor(distributorId)
      setExpandedLocation(null)
      setSelectedSeller(null)
      if (!distributorDetails[distributorId]) {
        await fetchDistributorDetails(distributorId)
      }
    }
  }

  const handleLocationClick = (locationId: string) => {
    if (expandedLocation === locationId) {
      setExpandedLocation(null)
      setSelectedSeller(null)
    } else {
      setExpandedLocation(locationId)
      setSelectedSeller(null)
    }
  }

  const handleSellerClick = (sellerId: string) => {
    if (selectedSeller === sellerId) {
      setSelectedSeller(null)
    } else {
      setSelectedSeller(sellerId)
    }
  }

  const handleEditClick = (distributor: Distributor, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDistributor(distributor.id)
    
    // Pre-populate form with current distributor data
    const details = distributorDetails[distributor.id]
    setEditFormData({
      name: distributor.name,
      contactPerson: details?.contactPerson || "",
      email: distributor.user.email,
      password: "",  // Always start with empty password
      alternativeEmail: details?.email || "",
      telephone: details?.telephone || "",
      whatsapp: details?.whatsapp || "",
      notes: details?.notes || ""
    })
  }

  const handleCancelEdit = () => {
    setEditingDistributor(null)
    setEditFormData({
      name: "",
      contactPerson: "",
      email: "",
      password: "",
      alternativeEmail: "",
      telephone: "",
      whatsapp: "",
      notes: ""
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDistributor) return

    setIsUpdating(true)
    try {
      const updateData = {
        ...editFormData,
        // Only include password if it's not empty
        ...(editFormData.password ? { password: editFormData.password } : {})
      }

      const response = await fetch(`/api/admin/distributors/${editingDistributor}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // Refresh the distributors list and details
        await fetchDistributors()
        await fetchDistributorDetails(editingDistributor, true)
        setEditingDistributor(null)
        setError("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update distributor")
      }
    } catch (error) {
      setError("Error updating distributor")
    } finally {
      setIsUpdating(false)
    }
  }

  // Location edit handlers
  const handleEditLocationClick = (location: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLocation(location.id)
    
    // Pre-populate form with current location data
    setLocationEditFormData({
      name: location.name,
      contactPerson: location.contactPerson || location.user?.name || "",
      email: location.email || location.user?.email || "",
      telephone: location.telephone || "",
      whatsapp: location.whatsapp || "",
      notes: location.notes || "",
      password: ""
    })
  }

  const handleCancelLocationEdit = () => {
    setEditingLocation(null)
    setLocationEditFormData({
      name: "",
      contactPerson: "",
      email: "",
      telephone: "",
      whatsapp: "",
      notes: "",
      password: ""
    })
  }

  const handleSaveLocationEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLocation) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/locations/${editingLocation}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationEditFormData),
      })

      if (response.ok) {
        // Refresh the distributors list and details
        await fetchDistributors()
        // Refresh the specific distributor details that contains this location
        const distributorId = Object.keys(distributorDetails).find(distId => 
          distributorDetails[distId]?.locations?.some(loc => loc.id === editingLocation)
        )
        if (distributorId) {
          await fetchDistributorDetails(distributorId, true)
        }
        setEditingLocation(null)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update location")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  // Seller edit handlers
  const handleEditSellerClick = (seller: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSeller(seller.id)
    
    // Load QR configurations for detailed display
    fetchQRConfigurations()
    
    // Debug: Log the seller data to see what's available
    console.log("🔍 Editing seller data:", {
      name: seller.name,
      defaultDiscountType: seller.defaultDiscountType,
      defaultDiscountValue: seller.defaultDiscountValue,
      discountCode: seller.discountCode
    })
    
    // Pre-populate form with current seller data
    setSellerEditFormData({
      name: seller.name,
      email: seller.email,
      password: "",
      telephone: seller.telephone || "",
      whatsapp: seller.whatsapp || "",
      notes: seller.notes || "",
      defaultDiscountType: seller.defaultDiscountType || "percentage",
      defaultDiscountValue: seller.defaultDiscountValue || 0,
      discountCode: seller.discountCode || ""
    })
  }

  const handleCancelSellerEdit = () => {
    setEditingSeller(null)
    setSellerEditFormData({
      name: "",
      email: "",
      password: "",
      telephone: "",
      whatsapp: "",
      notes: "",
      defaultDiscountType: "percentage",
      defaultDiscountValue: 0,
      discountCode: ""
    })
  }

  const handleResetDiscount = () => {
    setSellerEditFormData(prev => ({
      ...prev,
      defaultDiscountValue: 0,
      discountCode: ""
    }))
    setError("🔄 Discount reset - you can now set a new discount value and generate a new code")
  }

  const handleGenerateDiscountCode = async () => {
    if (!editingSeller || !sellerEditFormData.defaultDiscountValue || sellerEditFormData.defaultDiscountValue <= 0) {
      setError("Please set a discount value greater than 0 first")
      return
    }

    const isRegenerating = sellerEditFormData.discountCode && sellerEditFormData.discountCode !== "Not set"
    const actionText = isRegenerating ? "Regenerating" : "Generating"

    try {
      const response = await fetch(`/api/admin/sellers/${editingSeller}/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultDiscountType: sellerEditFormData.defaultDiscountType,
          defaultDiscountValue: sellerEditFormData.defaultDiscountValue
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.generatedCode) {
          setSellerEditFormData(prev => ({ ...prev, discountCode: result.generatedCode }))
          if (isRegenerating) {
            setError(`🔄 Regenerated discount code: ${result.generatedCode}`)
          } else {
            setError(`🎲 Generated discount code: ${result.generatedCode}`)
          }
        }
      } else {
        const errorData = await response.json()
        setError(`Failed to generate code: ${errorData.error}`)
      }
    } catch (error) {
      setError("Error generating discount code")
    }
  }

  const handleSaveSellerEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSeller) return

    setIsUpdating(true)
    try {
      // Include the preview discount code if it was generated
      const requestData = {
        name: sellerEditFormData.name,
        email: sellerEditFormData.email,
        password: sellerEditFormData.password,
        telephone: sellerEditFormData.telephone,
        whatsapp: sellerEditFormData.whatsapp,
        notes: sellerEditFormData.notes,
        defaultDiscountType: sellerEditFormData.defaultDiscountType,
        defaultDiscountValue: sellerEditFormData.defaultDiscountValue,
        discountCode: sellerEditFormData.discountCode !== "Not set" ? sellerEditFormData.discountCode : null
      }
      
      const response = await fetch(`/api/admin/sellers/${editingSeller}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show success message
        setError(`✅ Seller updated successfully!`)
        
        // Refresh the distributors list and details
        await fetchDistributors()
        // Refresh the specific distributor details that contains this seller
        const distributorId = Object.keys(distributorDetails).find(distId => 
          distributorDetails[distId]?.locations?.some(loc => 
            loc.sellers.some(seller => seller.id === editingSeller)
          )
        )
        if (distributorId) {
          console.log(`🔄 Refreshing distributor details for: ${distributorId}`)
          await fetchDistributorDetails(distributorId, true)
        }
        setEditingSeller(null)
      } else {
        const errorData = await response.json()
        if (response.status === 409) {
          // Duplicate discount code error
          setError(`❌ ${errorData.error}`)
        } else {
          setError(`Failed to update seller: ${errorData.error}`)
        }
      }
    } catch (error) {
      setError("Error updating seller")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    if (!selectedDistributorId) return

    setIsCreatingLocation(true)
    try {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...locationFormData,
          distributorId: selectedDistributorId
        })
      })

      if (response.ok) {
        // Reset form and close modal
        setLocationFormData({ name: "", contactPerson: "", email: "", password: "", telephone: "", whatsapp: "", notes: "" })
        setShowLocationModal(false)
        setSelectedDistributorId(null)
        
        // Refresh both the distributors list and details
        await fetchDistributors()
        if (expandedDistributor) {
          await fetchDistributorDetails(expandedDistributor, true)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create location")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsCreatingLocation(false)
    }
  }

  const handleCreateSeller = async (e: React.FormEvent) => {
    if (!selectedLocationId) return

    setIsCreatingSeller(true)
    try {
      const response = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellerFormData,
          locationId: selectedLocationId
        })
      })

      if (response.ok) {
        // Reset form and close modal
        setSellerFormData({ name: "", email: "", password: "", telephone: "", whatsapp: "", notes: "" })
        setShowSellerModal(false)
        setSelectedLocationId(null)
        setSelectedDistributorId(null)
        
        // Refresh distributor details and main list
        await fetchDistributors()
        if (expandedDistributor) {
          await fetchDistributorDetails(expandedDistributor, true)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to create seller")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsCreatingSeller(false)
    }
  }

  const handleCreateIndependentSeller = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🔍 CLIENT: Form data before sending:', independentSellerFormData)
    
    const dataToSend = {
      ...independentSellerFormData,
      location: independentSellerFormData.address // Map address to location for API
    }
    
    console.log('🔍 CLIENT: Data being sent to API:', dataToSend)

    setIsCreatingIndependentSeller(true)
    try {
      const response = await fetch("/api/admin/independent-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      })

      console.log('🔍 CLIENT: Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        
        // Reset form and close modal
        setIndependentSellerFormData({
          businessName: "",
          contactPerson: "",
          email: "",
          password: "",
          telephone: "",
          whatsapp: "",
          notes: "",
          address: ""
        })
        setShowIndependentSellerModal(false)
        
        // Show success message
        showSuccess(
          'Independent Seller Created', 
          `${independentSellerFormData.businessName} has been successfully created as an independent seller with dual dashboard access.`
        )
        
        // Refresh the distributors list to show the new "Independent Sellers" distributor
        await fetchDistributors()
      } else {
        const errorData = await response.json()
        console.log('🔍 CLIENT: Error response:', errorData)
        showError('Creation Failed', errorData.error || "Failed to create independent seller")
      }
    } catch (error) {
      showError('Network Error', "Network error occurred while creating independent seller")
    } finally {
      setIsCreatingIndependentSeller(false)
    }
  }

  // Status toggle handlers
  const toggleDistributorStatus = async (distributorId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/admin/distributors/${distributorId}/toggle-status`, {
        method: "PATCH",
      })

      if (response.ok) {
        const result = await response.json()
        
        // Force immediate refresh of all data
        await fetchDistributors()
        
        // Force refresh the specific distributor details (bypass cache)
        await fetchDistributorDetails(distributorId, true)
        
        // Also refresh all other expanded distributors to ensure UI consistency
        const expandedIds = Object.keys(distributorDetails)
        for (const id of expandedIds) {
          if (id !== distributorId) {
            await fetchDistributorDetails(id, true)
          }
        }
      } else {
        const errorData = await response.json()
        setError(`Failed to toggle distributor status: ${errorData.error}`)
      }
    } catch (error) {
      setError("Error toggling distributor status")
    }
  }

  const toggleLocationStatus = async (locationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Find the distributor that contains this location
    const distributorId = Object.keys(distributorDetails).find(distId => 
      distributorDetails[distId]?.locations?.some(loc => loc.id === locationId)
    )
    
    if (distributorId) {
      const distributor = distributors.find(d => d.id === distributorId)
      const location = distributorDetails[distributorId]?.locations?.find(loc => loc.id === locationId)
      
      // 🔒 HIERARCHICAL LOCK: If distributor is inactive, can't activate location
      if (distributor && !distributor.isActive && location && !location.isActive) {
        setError("Cannot activate location: distributor must be active first")
        return
      }
    }
    
    try {
      const response = await fetch(`/api/admin/locations/${locationId}/toggle-status`, {
        method: "PATCH",
      })

      if (response.ok) {
        const result = await response.json()
        
        // Force immediate refresh of all data
        await fetchDistributors()
        
        // Find and refresh the specific distributor details that contains this location
        const distributorId = Object.keys(distributorDetails).find(distId => 
          distributorDetails[distId]?.locations?.some(loc => loc.id === locationId)
        )
        
        if (distributorId) {
          await fetchDistributorDetails(distributorId, true)
        }
        
        // Also refresh all expanded distributors to ensure UI consistency
        const expandedIds = Object.keys(distributorDetails)
        for (const id of expandedIds) {
          if (id !== distributorId) {
            await fetchDistributorDetails(id, true)
          }
        }
      } else {
        const errorData = await response.json()
        setError(`Failed to toggle location status: ${errorData.error}`)
      }
    } catch (error) {
      setError("Error toggling location status")
    }
  }

  const toggleSellerStatus = async (sellerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Find the distributor and location that contains this seller
    let distributorId: string | undefined
    let locationId: string | undefined
    let distributor: any
    let location: any
    let seller: any
    
    for (const distId of Object.keys(distributorDetails)) {
      const distDetails = distributorDetails[distId]
      if (distDetails?.locations) {
        for (const loc of distDetails.locations) {
          const foundSeller = loc.sellers.find(s => s.id === sellerId)
          if (foundSeller) {
            distributorId = distId
            locationId = loc.id
            distributor = distributors.find(d => d.id === distId)
            location = loc
            seller = foundSeller
            break
          }
        }
        if (distributorId) break
      }
    }
    
    if (distributorId && locationId && distributor && location && seller) {
      // 🔒 HIERARCHICAL LOCK: If distributor is inactive, can't activate seller
      if (!distributor.isActive && !seller.isActive) {
        setError("Cannot activate seller: distributor must be active first")
        return
      }
      
      // 🔒 HIERARCHICAL LOCK: If location is inactive, can't activate seller
      if (!location.isActive && !seller.isActive) {
        setError("Cannot activate seller: location must be active first")
        return
      }
    }
    
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/toggle-status`, {
        method: "PATCH",
      })

      if (response.ok) {
        const result = await response.json()
        
        // Force immediate refresh of all data
        await fetchDistributors()
        
        // Find and force refresh the specific distributor details that contains this seller's location
        const distributorId = Object.keys(distributorDetails).find(distId => 
          distributorDetails[distId]?.locations?.some(loc => 
            loc.sellers.some(seller => seller.id === sellerId)
          )
        )
        
        if (distributorId) {
          await fetchDistributorDetails(distributorId, true)
        }
        
        // Also refresh all other expanded distributors to ensure UI consistency
        const expandedIds = Object.keys(distributorDetails)
        for (const id of expandedIds) {
          if (id !== distributorId) {
            await fetchDistributorDetails(id, true)
          }
        }
      } else {
        const errorData = await response.json()
        setError(`Failed to toggle seller status: ${errorData.error}`)
      }
    } catch (error) {
      setError("Error toggling seller status")
    }
  }

  // Sorting functions
  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleStatusFilter = () => {
    if (statusFilter === 'all') {
      setStatusFilter('active')
    } else if (statusFilter === 'active') {
      setStatusFilter('inactive')
    } else {
      setStatusFilter('all')
    }
  }

  // Helper function to check if distributor matches search
  const matchesSearch = (distributor: Distributor, details?: DistributorDetails) => {
    if (searchQuery === '') return true
    const query = searchQuery.toLowerCase()
    
    // Search in distributor fields
        const distributorMatch = (
          distributor.name.toLowerCase().includes(query) ||
          distributor.user.name.toLowerCase().includes(query) ||
          distributor.user.email.toLowerCase().includes(query)
        )
    
    // If we have details, also search in locations and sellers
    if (details) {
      const locationMatch = details.locations.some(location => 
        location.name.toLowerCase().includes(query) ||
        location.contactPerson?.toLowerCase().includes(query) ||
        location.email?.toLowerCase().includes(query) ||
        location.telephone?.toLowerCase().includes(query) ||
        location.notes?.toLowerCase().includes(query)
      )
      
      const sellerMatch = details.locations.some(location =>
        location.sellers.some(seller =>
          seller.name?.toLowerCase().includes(query) ||
          seller.email?.toLowerCase().includes(query) ||
          seller.telephone?.toLowerCase().includes(query) ||
          seller.notes?.toLowerCase().includes(query) ||
          seller.discountCode?.toLowerCase().includes(query)
        )
      )
      
      return distributorMatch || locationMatch || sellerMatch
    }
    
    return distributorMatch
  }

  // Generate flat view data
  const generateFlatViewData = () => {
    const flatData: Array<{
      id: string
      type: 'distributor' | 'location' | 'seller'
      name: string
      parentName?: string
      contactPerson?: string
      email?: string
      telephone?: string
      isActive: boolean
      entityData: any
    }> = []

    sortedDistributors.forEach(distributor => {
      const details = distributorDetails[distributor.id]
      
      // Add distributor if filter allows
      if (entityFilter === 'all' || entityFilter === 'distributors') {
        flatData.push({
          id: distributor.id,
          type: 'distributor',
          name: distributor.name,
          contactPerson: details?.contactPerson || distributor.user.name || '',
          email: details?.email || distributor.user.email || '',
          telephone: details?.telephone || '',
          isActive: distributor.isActive,
          entityData: distributor
        })
      }

      // Add locations if filter allows and we have details
      if (details && (entityFilter === 'all' || entityFilter === 'locations')) {
        details.locations.forEach(location => {
          flatData.push({
            id: `location-${location.id}`,
            type: 'location',
            name: location.name,
            parentName: distributor.name,
            contactPerson: location.contactPerson || '',
            email: location.email || '',
            telephone: location.telephone || '',
            isActive: location.isActive,
            entityData: location
          })
        })
      }

      // Add sellers if filter allows and we have details
      if (details && (entityFilter === 'all' || entityFilter === 'sellers')) {
        details.locations.forEach(location => {
          location.sellers.forEach(seller => {
            flatData.push({
              id: `seller-${seller.id}`,
              type: 'seller',
              name: seller.name || 'Unnamed Seller',
              parentName: `${distributor.name} → ${location.name}`,
              contactPerson: seller.name || '',
              email: seller.email || '',
              telephone: seller.telephone || '',
              isActive: seller.isActive,
              entityData: seller
            })
          })
        })
      }
    })

    // Apply status filter to flat data
    return flatData.filter(item => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'active') return item.isActive
      if (statusFilter === 'inactive') return !item.isActive
      return true
    })
  }

  const sortedDistributors = [...distributors]
    .filter(distributor => {
      // Apply search filter
      const details = distributorDetails[distributor.id]
      return matchesSearch(distributor, details)
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })

  const flatViewData = viewMode === 'flat' ? generateFlatViewData() : []

  // QR Configuration pairing functions
  const fetchQRConfigurations = async () => {
    setLoadingQRConfigs(true)
    try {
      console.log('🔄 DISTRIBUTORS: Loading configurations from database...')
      
      // PRIORITY 1: Load from DATABASE (same as main QR config page)
      const dbResponse = await fetch('/api/admin/saved-configs', {
        credentials: 'include'
      })
      
      if (dbResponse.ok) {
        const dbConfigs = await dbResponse.json()
        console.log('✅ DISTRIBUTORS: Loaded', dbConfigs.length, 'configurations from database')
        console.log('🔍 DISTRIBUTORS: Database configs:', dbConfigs)
        
        // Use database configurations directly - they have the proper structure
        // Ensure createdAt is consistently handled as a string that can be converted to Date
        const processedConfigs = dbConfigs.map((config: any) => ({
          ...config,
          createdAt: config.createdAt || new Date().toISOString() // Ensure createdAt exists
        }))
        setAvailableQRConfigs(processedConfigs)
        
        return // Exit early - database is the source of truth
      } else {
        console.log('⚠️ DISTRIBUTORS: Could not load from database, status:', dbResponse.status)
      }
      
      // FALLBACK: Only use localStorage if database fails
      console.log('📦 DISTRIBUTORS: Falling back to localStorage...')
      const saved = localStorage.getItem('elocalpass-saved-configurations')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const localConfigs = parsed.map((config: any) => ({
            ...config,
            createdAt: new Date(config.createdAt),
            source: 'localStorage'
          }))
          console.log('✅ DISTRIBUTORS: Loaded', localConfigs.length, 'configurations from localStorage')
          
          setAvailableQRConfigs(localConfigs)
        } catch (error) {
          console.error('Error parsing saved configurations:', error)
          setAvailableQRConfigs([])
        }
      } else {
        console.log('❌ DISTRIBUTORS: No configurations found anywhere')
        setAvailableQRConfigs([])
      }
      
    } catch (error) {
      console.error('❌ DISTRIBUTORS: Error loading configurations:', error)
      setAvailableQRConfigs([])
    } finally {
      setLoadingQRConfigs(false)
    }
  }

  const openQRPairingModal = (seller: any) => {
    setSelectedSellerForQR(seller)
    setShowQRPairingModal(true)
    fetchQRConfigurations()
  }

  const handleAssignQRConfig = async (config: any) => {
    if (!selectedSellerForQR) return

    try {
      const requestBody = {
        sellerEmail: selectedSellerForQR.email,
        configId: config.id,
        configName: config.name,
        configData: config.config
      }

      const response = await fetch('/api/admin/assign-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()

        showSuccess('QR Configuration Paired', 'Configuration has been successfully assigned to the seller.')

        // Close modal and refresh data
        setShowQRPairingModal(false)
        setSelectedSellerForQR(null)

        // Refresh distributor data to show updated seller config status
        await fetchDistributors()
        if (expandedDistributor) {
          // Force refresh with forceRefresh: true to update UI immediately
          await fetchDistributorDetails(expandedDistributor, true)
        }
      } else {
        const errorData = await response.json()
        showError('Pairing Failed', errorData.error || errorData.message || 'Unknown error occurred')
      }
    } catch (error) {
      showError('Network Error', 'Failed to connect to server while pairing QR config')
    }
  }

  const handleUnpairQRConfig = async (seller: any) => {
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}/unpair-config`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        showSuccess('QR Configuration Unpaired', 'Configuration has been successfully removed from the seller.')

        // Refresh distributor data to show updated seller config status
        await fetchDistributors()
        if (expandedDistributor) {
          // Force refresh with forceRefresh: true to update UI immediately
          await fetchDistributorDetails(expandedDistributor, true)
        }
      } else {
        const errorData = await response.json()
        showError('Unpair Failed', errorData.error || errorData.message || 'Unknown error occurred')
      }
    } catch (error) {
      showError('Network Error', 'Failed to connect to server while unpairing QR config')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                    const isActive = item.href === '/admin/distributors'
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Distributor Management</h2>
                  <p className="text-gray-600">Manage distributors, locations, and independent sellers</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowIndependentSellerModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span>Add Independent Seller</span>
                  </button>
                  <Link
                    href="/admin/distributors/create"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Add New Distributor
                  </Link>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <button 
                      onClick={handleSort}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-gray-900"
                    >
                      <span className="text-gray-900">Distributor Name</span>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as 'hierarchical' | 'flat')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                    >
                      <option value="hierarchical">Hierarchical View</option>
                      <option value="flat">Flat View</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Show Only</label>
                    <select
                      value={entityFilter}
                      onChange={(e) => setEntityFilter(e.target.value as 'all' | 'distributors' | 'locations' | 'sellers')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-900"
                    >
                      <option value="all">All Entities</option>
                      <option value="distributors">Distributors Only</option>
                      <option value="locations">Locations Only</option>
                      <option value="sellers">Sellers Only</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => fetchDistributors()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search distributors, locations, or sellers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flat View Implementation */}
        {viewMode === 'flat' && (
          <div className="mb-6">
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-md mb-4">
              <div className="flex items-center">
                <div className="text-sm">
                  📊 <strong>Flat View Active</strong> - Showing {entityFilter === 'all' ? 'all entities' : entityFilter} in a single table
                  {searchQuery && <span className="ml-2">| 🔍 Filtered by: "{searchQuery}"</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Distributors Table - Full Width with Horizontal Scroll */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Distributors & Hierarchy
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete view of distributors, locations, and sellers with their relationships
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
                width: '1500px', // Wide enough for all distributor columns
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
              <div style={{ minWidth: '1500px' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                        {viewMode === 'hierarchical' ? (
                          <>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <button 
                                onClick={handleSort}
                                className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                              >
                                <span>Distributor Name</span>
                                {sortOrder === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                              </button>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact Person
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sellers
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Locations
                            </th>
                          </>
                        ) : (
                          <>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <button 
                                onClick={handleSort}
                                className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                              >
                                <span>Entity Name</span>
                                {sortOrder === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                              </button>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parent
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact Person
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                          </>
                        )}
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={handleStatusFilter}
                          className="flex items-center space-x-1 hover:text-gray-700 focus:outline-none"
                        >
                          <span>Status</span>
                          {statusFilter === 'all' ? (
                            <Filter className="h-3 w-3" />
                          ) : statusFilter === 'active' ? (
                            <Eye className="h-3 w-3 text-green-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-red-600" />
                          )}
                          <span className="text-xs ml-1">
                            ({statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'})
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewMode === 'flat' ? (
                      // Flat View Rendering
                      flatViewData.map((item, index) => (
                        <tr 
                          key={item.id}
                          className={`hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                  item.type === 'distributor' ? 'bg-blue-500' :
                                  item.type === 'location' ? 'bg-green-500' : 'bg-purple-500'
                                }`}>
                                  {item.type === 'distributor' ? 'D' : item.type === 'location' ? 'L' : 'S'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.type === 'distributor' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'location' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.parentName || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.contactPerson || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.email || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.telephone || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Hierarchical View Rendering (existing)
                      sortedDistributors.filter(distributor => {
                        // Apply status filter
                        if (statusFilter === 'all') return true
                        if (statusFilter === 'active') return distributor.isActive
                        if (statusFilter === 'inactive') return !distributor.isActive
                        return true
                      }).filter(distributor => {
                        // Apply entity filter - for hierarchical view, always show distributors as containers
                        return true
                      }).map((distributor, index) => (
                      <React.Fragment key={distributor.id}>
                        <tr 
                          key={distributor.id} 
                          className={`hover:bg-gray-50 ${viewMode === 'hierarchical' ? 'cursor-pointer' : ''} ${
                            expandedDistributor === distributor.id 
                              ? 'bg-blue-50' 
                              : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={viewMode === 'hierarchical' ? () => handleDistributorClick(distributor.id) : undefined}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-between w-full">
                              <div className="text-sm font-medium text-gray-900">
                                {distributor.name}
                                {(distributor.user?.role === 'INDEPENDENT_SELLER' || 
                                  (distributorDetails[distributor.id]?.notes && 
                                   distributorDetails[distributor.id]?.notes?.includes('Independent seller:'))) && 
                                  <span className="ml-2 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">(IND)</span>
                                }
                              </div>
                              <div className="text-sm text-gray-500">ID: {distributor.id.slice(-8)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {distributorDetails[distributor.id]?.contactPerson || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{distributor.user.email}</div>
                            <div className="text-sm text-gray-500">
                              {distributorDetails[distributor.id]?.email && 
                                `Alt: ${distributorDetails[distributor.id]?.email}`
                              }
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {distributorDetails[distributor.id]?.locations?.reduce((total, location) => total + (location.sellers?.length || 0), 0) || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {distributorDetails[distributor.id]?._count?.locations}
                              </span>
                              {viewMode === 'hierarchical' && (
                                <div className="text-blue-600 hover:text-blue-800">
                                  {expandedDistributor === distributor.id ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <button 
                              onClick={(e) => toggleDistributorStatus(distributor.id, e)}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${distributor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              <div className={`w-1.5 h-1.5 ${distributor.isActive ? 'bg-green-600' : 'bg-red-600'} rounded-full mr-1.5`}></div>
                              {distributor.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => handleEditClick(distributor, e)}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => toggleDistributorStatus(distributor.id, e)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <span className="sr-only">Toggle Status</span>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Edit Row */}
                        {editingDistributor === distributor.id && (
                          <tr>
                            <td colSpan={8} className="px-0 py-0">
                              <div className="bg-blue-50 border-l-4 border-blue-400">
                                <form onSubmit={handleSaveEdit} className="p-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-md font-semibold text-gray-900">Edit Distributor</h4>
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Distributor Name *
                                      </label>
                                      <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person
                                      </label>
                                      <input
                                        type="text"
                                        value={editFormData.contactPerson}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Primary Email *
                                      </label>
                                      <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alternative Email
                                      </label>
                                      <input
                                        type="email"
                                        value={editFormData.alternativeEmail}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, alternativeEmail: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telephone
                                      </label>
                                      <input
                                        type="tel"
                                        value={editFormData.telephone}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Phone number"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        WhatsApp
                                      </label>
                                      <input
                                        type="tel"
                                        value={editFormData.whatsapp}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="If same as telephone leave blank"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password (optional)
                                      </label>
                                      <input
                                        type="password"
                                        value={editFormData.password}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="New password"
                                      />
                                    </div>

                                    <div className="md:col-span-3">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                      </label>
                                      <textarea
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Additional notes..."
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                      type="button"
                                      onClick={handleCancelEdit}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isUpdating}
                                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                    >
                                      {isUpdating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Save className="w-4 h-4" />
                                          <span>Save</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Locations Dropdown */}
                        {viewMode === 'hierarchical' && expandedDistributor === distributor.id && (
                          <tr>
                            <td colSpan={8} className="bg-blue-50 border-t">
                              <div className="px-4 py-3">
                                {loadingDetails[distributor.id] ? (
                                  <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Loading locations...</p>
                                  </div>
                                ) : distributorDetails[distributor.id] ? (
                                  <>
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                        <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                                        Locations ({distributorDetails[distributor.id]?._count?.locations || 0})
                                      </h4>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDistributorId(distributor.id);
                                          setShowLocationModal(true);
                                        }}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Location
                                      </button>
                                    </div>
                                    
                                    {distributorDetails[distributor.id].locations && distributorDetails[distributor.id].locations.length > 0 ? (
                                      <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-orange-100">
                                            <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location Name</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telephone</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Sellers
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200">
                                            {distributorDetails[distributor.id].locations.map((location) => (
                                              <React.Fragment key={location.id}>
                                                <tr 
                                                  className="hover:bg-orange-50 cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLocationClick(location.id);
                                                  }}
                                                >
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                      <div className="text-sm font-medium text-gray-900">{location.name}</div>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {location.contactPerson || location.user?.name || '—'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {location.email || location.user?.email || '—'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {location.telephone || '—'}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                      <span className="text-sm font-medium text-gray-900">
                                                        {location._count.sellers} seller{location._count.sellers !== 1 ? 's' : ''}
                                                      </span>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleLocationClick(location.id);
                                                        }}
                                                        className="text-orange-600 hover:text-orange-800 p-1"
                                                        title="View Sellers"
                                                      >
                                                        {expandedLocation === location.id ? (
                                                          <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                          <ChevronRight className="h-4 w-4" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <button 
                                                      onClick={(e) => toggleLocationStatus(location.id, e)}
                                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${location.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                    >
                                                      <div className={`w-1.5 h-1.5 ${location.isActive ? 'bg-green-600' : 'bg-red-600'} rounded-full mr-1.5`}></div>
                                                      {location.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                      <button
                                                        onClick={(e) => handleEditLocationClick(location, e)}
                                                        className="text-orange-600 hover:text-orange-800 p-1"
                                                        title="Edit Location"
                                                      >
                                                        <Edit2 className="w-4 h-4" />
                                                      </button>
                                                      <button
                                                        onClick={(e) => toggleLocationStatus(location.id, e)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                      >
                                                        <span className="sr-only">Toggle Status</span>
                                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>

                                                {/* Location Edit Form */}
                                                {editingLocation === location.id && (
                                                  <tr>
                                                    <td colSpan={7} className="px-0 py-0">
                                                      <div className="bg-orange-50 border-l-4 border-orange-400">
                                                        <form onSubmit={handleSaveLocationEdit} className="p-6">
                                                          <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-md font-semibold text-gray-900">Edit Location</h4>
                                                            <button
                                                              type="button"
                                                              onClick={handleCancelLocationEdit}
                                                              className="text-gray-400 hover:text-gray-600"
                                                            >
                                                              <X className="w-5 h-5" />
                                                            </button>
                                                          </div>
                                                          
                                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Location Name *
                                                              </label>
                                                              <input
                                                                type="text"
                                                                value={locationEditFormData.name}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                                required
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Contact Person
                                                              </label>
                                                              <input
                                                                type="text"
                                                                value={locationEditFormData.contactPerson}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Email
                                                              </label>
                                                              <input
                                                                type="email"
                                                                value={locationEditFormData.email}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Password
                                                              </label>
                                                              <input
                                                                type="password"
                                                                value={locationEditFormData.password}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, password: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                                placeholder="New password"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Telephone
                                                              </label>
                                                              <input
                                                                type="tel"
                                                                value={locationEditFormData.telephone}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                              />
                                                            </div>

                                                            <div>
                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                WhatsApp
                                                              </label>
                                                              <input
                                                                type="tel"
                                                                value={locationEditFormData.whatsapp}
                                                                onChange={(e) => setLocationEditFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                                placeholder="If same as telephone leave blank"
                                                              />
                                                            </div>
                                                          </div>

                                                          <div className="mt-4">
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                              Notes
                                                            </label>
                                                            <textarea
                                                              value={locationEditFormData.notes}
                                                              onChange={(e) => setLocationEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                              rows={3}
                                                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                                              placeholder="Additional notes..."
                                                            />
                                                          </div>

                                                          <div className="flex justify-end space-x-3 mt-6">
                                                            <button
                                                              type="button"
                                                              onClick={handleCancelLocationEdit}
                                                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                                            >
                                                              Cancel
                                                            </button>
                                                            <button
                                                              type="submit"
                                                              disabled={isUpdating}
                                                              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
                                                            >
                                                              {isUpdating ? 'Updating...' : 'Update Location'}
                                                            </button>
                                                          </div>
                                                        </form>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}

                                                {/* Sellers Dropdown */}
                                                {expandedLocation === location.id && (
                                                  <tr>
                                                    <td colSpan={7} className="bg-orange-50 border-t">
                                                      <div className="px-4 py-3">
                                                        <div className="flex items-center justify-between mb-3">
                                                          <h5 className="text-sm font-semibold text-gray-900 flex items-center">
                                                            <Users className="w-4 h-4 text-green-600 mr-2" />
                                                            Sellers ({location.sellers.length})
                                                          </h5>
                                                          <button
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setSelectedLocationId(location.id);
                                                              setShowSellerModal(true);
                                                            }}
                                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                                          >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Add Seller
                                                          </button>
                                                        </div>
                                                        
                                                        {location.sellers.length > 0 ? (
                                                          <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                              <thead className="bg-green-100">
                                                                <tr>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seller Name</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telephone</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Config</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                                </tr>
                                                              </thead>
                                                              <tbody className="divide-y divide-gray-200">
                                                                {location.sellers.map((seller) => (
                                                                  <React.Fragment key={seller.id}>
                                                                    <tr className="hover:bg-green-50">
                                                                      <td className="px-4 py-3 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                          <div className="text-sm font-medium text-gray-900">{seller.name || 'Unnamed Seller'}</div>
                                                                        </div>
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {seller.name}
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {seller.email}
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                        {(seller as any).telephone || '—'}
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                          seller.sellerConfigs 
                                                                            ? 'bg-green-100 text-green-800' 
                                                                            : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                          {seller.sellerConfigs ? 'Paired' : 'Unpaired'}
                                                                        </span>
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap">
                                                                        <button 
                                                                          onClick={(e) => toggleSellerStatus(seller.id, e)}
                                                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                                        >
                                                                          <div className={`w-1.5 h-1.5 ${seller.isActive ? 'bg-green-600' : 'bg-red-600'} rounded-full mr-1.5`}></div>
                                                                          {seller.isActive ? 'Active' : 'Inactive'}
                                                                        </button>
                                                                      </td>
                                                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                        <div className="flex items-center justify-end space-x-2">
                                                                          <button
                                                                            onClick={(e) => handleEditSellerClick(seller, e)}
                                                                            className="text-blue-600 hover:text-blue-800 p-1"
                                                                            title="Edit Seller"
                                                                          >
                                                                            <Edit2 className="w-4 h-4" />
                                                                          </button>
                                                                          <button
                                                                            onClick={(e) => {
                                                                              e.stopPropagation();
                                                                              console.log('Configure seller:', seller.id);
                                                                            }}
                                                                            className="text-green-600 hover:text-green-800 p-1"
                                                                            title="Configure Seller"
                                                                          >
                                                                            <Settings className="w-4 h-4" />
                                                                          </button>
                                                                        </div>
                                                                      </td>
                                                                    </tr>
                                                                    {editingSeller === seller.id && (
                                                                      <tr>
                                                                        <td colSpan={7} className="px-4 py-3 bg-green-50 border-l-4 border-green-400">
                                                                          <form onSubmit={handleSaveSellerEdit} className="space-y-4">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                              <h3 className="text-lg font-semibold text-gray-900">Edit Seller</h3>
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleCancelSellerEdit}
                                                                                className="text-gray-400 hover:text-gray-600"
                                                                              >
                                                                                <X className="w-5 h-5" />
                                                                              </button>
                                                                            </div>
                                                                            
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                              <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  Seller Name *
                                                                                </label>
                                                                                <input
                                                                                  type="text"
                                                                                  value={sellerEditFormData.name}
                                                                                  onChange={(e) => setSellerEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                  required
                                                                                />
                                                                              </div>

                                                                              <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  Email *
                                                                                </label>
                                                                                <input
                                                                                  type="email"
                                                                                  value={sellerEditFormData.email}
                                                                                  onChange={(e) => setSellerEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                  required
                                                                                />
                                                                              </div>

                                                                              <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  Telephone
                                                                                </label>
                                                                                <input
                                                                                  type="tel"
                                                                                  value={sellerEditFormData.telephone}
                                                                                  onChange={(e) => setSellerEditFormData(prev => ({ ...prev, telephone: e.target.value }))}
                                                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                />
                                                                              </div>

                                                                              <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  WhatsApp
                                                                                </label>
                                                                                <input
                                                                                  type="tel"
                                                                                  value={sellerEditFormData.whatsapp}
                                                                                  onChange={(e) => setSellerEditFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                  placeholder="If same as telephone leave blank"
                                                                                />
                                                                              </div>

                                                                              <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  Password
                                                                                </label>
                                                                                <input
                                                                                  type="password"
                                                                                  value={sellerEditFormData.password}
                                                                                  onChange={(e) => setSellerEditFormData(prev => ({ ...prev, password: e.target.value }))}
                                                                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                  placeholder="New password"
                                                                                />
                                                                              </div>
                                                                            </div>

                                                                            <div className="mt-4">
                                                                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                Notes
                                                                              </label>
                                                                              <textarea
                                                                                value={sellerEditFormData.notes}
                                                                                onChange={(e) => setSellerEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                                                rows={3}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                                                                placeholder="Additional notes..."
                                                                              />
                                                                            </div>

                                                                            {/* Discount Configuration */}
                                                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                                              <h4 className="text-sm font-medium text-blue-900 mb-3">Default Rebuy Discount</h4>
                                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                <div>
                                                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                    Discount Type
                                                                                  </label>
                                                                                  <select
                                                                                    value={sellerEditFormData.defaultDiscountType}
                                                                                    onChange={(e) => setSellerEditFormData(prev => ({ ...prev, defaultDiscountType: e.target.value }))}
                                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                                  >
                                                                                    <option value="percentage">Percentage (%)</option>
                                                                                    <option value="fixed">Fixed Amount ($)</option>
                                                                                  </select>
                                                                                </div>
                                                                                <div>
                                                                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                    Discount Value
                                                                                  </label>
                                                                                  <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max={sellerEditFormData.defaultDiscountType === 'percentage' ? 100 : undefined}
                                                                                    step={sellerEditFormData.defaultDiscountType === 'percentage' ? 1 : 0.01}
                                                                                    value={sellerEditFormData.defaultDiscountValue || ""}
                                                                                    onChange={(e) => {
                                                                                      const value = e.target.value
                                                                                      const numValue = value === "" ? 0 : parseFloat(value)
                                                                                      setSellerEditFormData(prev => ({ ...prev, defaultDiscountValue: numValue }))
                                                                                    }}
                                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                                    placeholder={sellerEditFormData.defaultDiscountType === 'percentage' ? '10' : '5.00'}
                                                                                  />
                                                                                                                                                                      </div>
                                                                              </div>
                                                                              
                                                                              {/* Discount Code Field */}
                                                                              <div className="mt-4">
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                                  Discount Code (5 digits)
                                                                                </label>
                                                                                                                                                                      <div className="flex items-center gap-2">
                                                                                    <input
                                                                                      type="text"
                                                                                      value={sellerEditFormData.discountCode || "Not set"}
                                                                                      readOnly
                                                                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-center text-gray-600"
                                                                                      placeholder="Will be auto-generated"
                                                                                    />
                                                                                    {sellerEditFormData.discountCode && sellerEditFormData.discountCode !== "Not set" ? (
                                                                                      <button
                                                                                        type="button"
                                                                                        onClick={handleGenerateDiscountCode}
                                                                                        disabled={!sellerEditFormData.defaultDiscountValue || sellerEditFormData.defaultDiscountValue <= 0}
                                                                                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors"
                                                                                        title="Generate a new discount code (replaces existing)"
                                                                                      >
                                                                                        🔄 Regenerate
                                                                                      </button>
                                                                                    ) : (
                                                                                      <button
                                                                                        type="button"
                                                                                        onClick={handleGenerateDiscountCode}
                                                                                        disabled={!sellerEditFormData.defaultDiscountValue || sellerEditFormData.defaultDiscountValue <= 0}
                                                                                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs rounded-md transition-colors"
                                                                                        title="Generate a new discount code"
                                                                                      >
                                                                                        🎲 Generate
                                                                                      </button>
                                                                                    )}
                                                                                  </div>
                                                                                                                                                                      <p className="text-xs text-gray-500 mt-1">
                                                                                    Customers can enter this code to get the discount above. 
                                                                                    <span className="font-medium text-blue-600"> Code is auto-generated and can be regenerated if needed.</span>
                                                                                  </p>
                                                                                  {!sellerEditFormData.discountCode && sellerEditFormData.defaultDiscountValue > 0 && (
                                                                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                                                                      <span className="font-medium">🎲 Auto-generation enabled:</span> A unique 5-digit code will be automatically created when you save.
                                                                                    </div>
                                                                                  )}
                                                                                  {sellerEditFormData.discountCode && (
                                                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                                                                      <span className="font-medium">✅ Code active:</span> {sellerEditFormData.discountCode} - Customers can use this code anytime.
                                                                                    </div>
                                                                                  )}
                                                                              </div>
                                                                              
                                                                              <p className="text-xs text-blue-600 mt-2">
                                                                                This discount will be applied to rebuy emails when customers purchase again from this seller.
                                                                                {sellerEditFormData.defaultDiscountValue > 0 && (
                                                                                  <span className="font-medium">
                                                                                    {' '}Preview: {sellerEditFormData.defaultDiscountValue}
                                                                                    {sellerEditFormData.defaultDiscountType === 'percentage' ? '% off' : '$ off'}
                                                                                    {sellerEditFormData.discountCode && ` (Code: ${sellerEditFormData.discountCode})`}
                                                                                  </span>
                                                                                )}
                                                                              </p>
                                                                              
                                                                              {/* Reset Button */}
                                                                              {(sellerEditFormData.defaultDiscountValue > 0 || sellerEditFormData.discountCode) && (
                                                                                <div className="mt-3 pt-3 border-t border-blue-200">
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={handleResetDiscount}
                                                                                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors"
                                                                                    title="Reset discount and code to start fresh"
                                                                                  >
                                                                                    🔄 Reset Discount
                                                                                  </button>
                                                                                </div>
                                                                              )}
                                                                            </div>

                                                                            <div className="pt-4 border-t">
                                                                              <div className="text-sm font-medium text-gray-700 mb-3">QR Configuration Management</div>
                                                                              
                                                                              {seller.sellerConfigs && (
                                                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs">
                                                                                  {/* Load QR configs when opening edit form and try to match by seller config data */}
                                                                                  {(() => {
                                                                                    let matchingConfig = null
                                                                                    
                                                                                    if ((seller as any).configurationId) {
                                                                                      // Use stored configuration ID for exact match
                                                                                      matchingConfig = availableQRConfigs.find(config => config.id === (seller as any).configurationId)
                                                                                    }
                                                                                    
                                                                                    if (!matchingConfig) {
                                                                                      // Fallback to content comparison for legacy data
                                                                                      matchingConfig = availableQRConfigs.find(config => {
                                                                                        const matches = config.config && 
                                                                                                (seller as any).sellerConfigs && 
                                                                                                config.config.button1GuestsDefault === ((seller as any).sellerConfigs as any).button1GuestsDefault &&
                                                                                                config.config.button1DaysDefault === ((seller as any).sellerConfigs as any).button1DaysDefault &&
                                                                                                config.config.button2FixedPrice === ((seller as any).sellerConfigs as any).button2FixedPrice
                                                                                        return matches
                                                                                      })
                                                                                    }
                                                                                    
                                                                                    if (matchingConfig) {
                                                                                      // Display full 5-button configuration
                                                                                      return (
                                                                                        <div className="grid grid-cols-3 gap-2">
                                                                                          {/* Button 1: Guest & Day Limits */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-1">1</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Guest & Day Limits</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              <div>Guests: {!matchingConfig.config.button1GuestsLocked ? `1-${matchingConfig.config.button1GuestsRangeMax} Open` : `${matchingConfig.config.button1GuestsDefault} Fixed`}</div>
                                                                                              <div>Days: {!matchingConfig.config.button1DaysLocked ? `1-${matchingConfig.config.button1DaysRangeMax} Open` : `${matchingConfig.config.button1DaysDefault} Fixed`}</div>
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Button 2: Pricing */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-1">2</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Pricing</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              {matchingConfig.config.button2PricingType === 'FIXED' ? (
                                                                                                <div>
                                                                                                  <div>Price: ${matchingConfig.config.button2FixedPrice}{matchingConfig.config.button2IncludeTax ? ` + ${matchingConfig.config.button2TaxPercentage}% tax` : ' (no tax)'}</div>
                                                                                                </div>
                                                                                              ) : matchingConfig.config.button2PricingType === 'VARIABLE' ? (
                                                                                                <div>
                                                                                                  <div>Base: ${matchingConfig.config.button2VariableBasePrice}</div>
                                                                                                  <div>+${matchingConfig.config.button2VariableGuestIncrease}/guest, +${matchingConfig.config.button2VariableDayIncrease}/day</div>
                                                                                                  {matchingConfig.config.button2VariableCommission > 0 && <div>+${matchingConfig.config.button2VariableCommission}% commission</div>}
                                                                                                  {matchingConfig.config.button2IncludeTax ? <div>+${matchingConfig.config.button2TaxPercentage}% tax</div> : <div>(no tax)</div>}
                                                                                                </div>
                                                                                              ) : (
                                                                                                <div>Free</div>
                                                                                              )}
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Button 3: QR Delivery */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs mr-1">3</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">QR Delivery</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              <div>Method: {
                                                                                                matchingConfig.config.button3DeliveryMethod === 'DIRECT' ? 'Direct Download' :
                                                                                                matchingConfig.config.button3DeliveryMethod === 'URLS' ? 'Landing Pages' :
                                                                                                'Both Options'
                                                                                              }</div>
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Button 4: Welcome Email */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs mr-1">4</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Welcome Email</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              <div>{matchingConfig.config.button4LandingPageRequired ? 'Customized' : 'Default'}</div>
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Button 5: Rebuy Email */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center text-xs mr-1">5</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Rebuy Email</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              {matchingConfig.config.button5SendRebuyEmail ? (
                                                                                                (() => {
                                                                                                  // Check if this configuration has a custom rebuy email template
                                                                                                  const hasCustomRebuyTemplate = matchingConfig.emailTemplates?.rebuyEmail;
                                                                                                  return hasCustomRebuyTemplate ? 'Customized' : 'Default';
                                                                                                })()
                                                                                                ) : 'No'}
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Button 6: Future QR */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs mr-1">6</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Future QR</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              <div>{matchingConfig.config.button6AllowFutureQR ? 'Enabled' : 'Disabled'}</div>
                                                                                            </div>
                                                                                          </div>
                                                                                          
                                                                                          {/* Status & Actions */}
                                                                                          <div className="space-y-1">
                                                                                            <div className="flex items-center">
                                                                                              <div className="w-3 h-3 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs mr-1">✓</div>
                                                                                              <span className="font-semibold text-gray-800 text-xs">Status</span>
                                                                                            </div>
                                                                                            <div className="text-gray-600 ml-4 text-xs">
                                                                                              <div className="text-green-600">PAIRED: {matchingConfig.name.toUpperCase()}</div>
                                                                                              <button 
                                                                                                onClick={() => window.open(`/admin/qr-config?openLibrary=true&configId=${matchingConfig.id}`, '_blank')}
                                                                                                className="text-blue-600 hover:underline"
                                                                                              >
                                                                                                View Full Config →
                                                                                              </button>
                                                                                            </div>
                                                                                          </div>
                                                                                        </div>
                                                                                      )
                                                                                    } else {
                                                                                      // Fallback to basic info if no matching config found
                                                                                      return (
                                                                                        <div className="text-center text-gray-600 text-xs">
                                                                                          <div className="text-green-600 mb-2">✓ QR Configuration Paired</div>
                                                                                          <div>Basic Config: {(seller as any).sellerConfigs?.defaultGuests} guests, {(seller as any).sellerConfigs?.defaultDays} days, ${(seller as any).sellerConfigs?.fixedPrice}</div>
                                                                                          <button 
                                                                                            onClick={() => window.open('/admin/qr-config', '_blank')}
                                                                                            className="text-blue-600 hover:underline mt-1 block"
                                                                                          >
                                                                                            View Full Configuration →
                                                                                          </button>
                                                                                        </div>
                                                                                      )
                                                                                    }
                                                                                  })()}
                                                                                </div>
                                                                              )}
                                                                              
                                                                              <div className="flex space-x-2">
                                                                                {!seller.sellerConfigs ? (
                                                                                  <>
                                                                                    <button
                                                                                      type="button"
                                                                                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                                                                      onClick={() => openQRPairingModal(seller)}
                                                                                    >
                                                                                      Pair QR Config
                                                                                    </button>
                                                                                    <button
                                                                                      type="button"
                                                                                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                                                                      onClick={() => {
                                                                                        // Navigate to QR Config page to create new config
                                                                                        window.open('/admin/qr-config', '_blank')
                                                                                      }}
                                                                                    >
                                                                                      Create QR Config
                                                                                    </button>
                                                                                  </>
                                                                                ) : (
                                                                                  <button
                                                                                    type="button"
                                                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                                                                                    onClick={() => handleUnpairQRConfig(seller)}
                                                                                  >
                                                                                    Unpair QR Config
                                                                                  </button>
                                                                                )}
                                                                              </div>
                                                                            </div>

                                                                            <div className="flex justify-end space-x-3 mt-6">
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleCancelSellerEdit}
                                                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                              >
                                                                                Cancel
                                                                              </button>
                                                                              <button
                                                                                type="submit"
                                                                                disabled={isUpdating}
                                                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                                                                              >
                                                                                {isUpdating ? 'Saving...' : 'Save Changes'}
                                                                              </button>
                                                                            </div>
                                                                          </form>
                                                                        </td>
                                                                      </tr>
                                                                    )}
                                                                  </React.Fragment>
                                                                ))}
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                        ) : (
                                                          <div className="text-center py-4 text-gray-500 text-sm">
                                                            No sellers found for this location.
                                                          </div>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-500 text-sm">
                                        No locations found for this distributor.
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-red-500 text-sm">Failed to load details</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {distributors.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No distributors</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new distributor.
            </p>
          </div>
        )}

        {/* Fixed bottom scroll bar - always visible */}
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

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <form onSubmit={handleCreateLocation}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Location</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name *
                      </label>
                      <input
                        type="text"
                        value={locationFormData.name}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="Enter location name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={locationFormData.contactPerson}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Contact person name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={locationFormData.email}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="location@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={locationFormData.password}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        placeholder="Password for location account"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telephone
                      </label>
                      <input
                        type="tel"
                        value={locationFormData.telephone}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={locationFormData.whatsapp}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="If same as telephone leave blank"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={locationFormData.notes}
                        onChange={(e) => setLocationFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isCreatingLocation}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Location'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocationModal(false)
                      setSelectedDistributorId(null)
                      setLocationFormData({ name: "", contactPerson: "", email: "", password: "", telephone: "", whatsapp: "", notes: "" })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Seller Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
              <form onSubmit={handleCreateSeller}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Seller</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Basic Information Section */}
                    <div>
                      <div className="text-md font-semibold text-gray-800 mb-3">👤 Basic Information</div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seller Name *
                          </label>
                          <input
                            type="text"
                            value={sellerFormData.name}
                            onChange={(e) => setSellerFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={sellerFormData.email}
                            onChange={(e) => setSellerFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            value={sellerFormData.password}
                            onChange={(e) => setSellerFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Information Section */}
                    <div>
                      <div className="text-md font-semibold text-gray-800 mb-3">📞 Contact Information</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telephone
                          </label>
                          <input
                            type="tel"
                            value={sellerFormData.telephone}
                            onChange={(e) => setSellerFormData(prev => ({ ...prev, telephone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp
                          </label>
                          <input
                            type="tel"
                            value={sellerFormData.whatsapp}
                            onChange={(e) => setSellerFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="If same as telephone leave blank"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={sellerFormData.notes}
                        onChange={(e) => setSellerEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isCreatingSeller}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSeller ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Seller'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerModal(false)
                      setSelectedLocationId(null)
                      setSelectedDistributorId(null)
                      setSellerFormData({ name: "", email: "", password: "", telephone: "", whatsapp: "", notes: "" })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Configuration Pairing Modal */}
      {showQRPairingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl mx-4 h-[95vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pair QR Configuration with {selectedSellerForQR?.name}
                </h3>
                <button
                  onClick={() => {
                    setShowQRPairingModal(false)
                    setSelectedSellerForQR(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search and Filter Controls */}
              {availableQRConfigs.length > 0 && (
                <div className="mb-6 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search configurations by name or description..."
                      value={qrSearchQuery}
                      onChange={(e) => setQrSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pricing Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
                      <select
                        value={qrFilterPricingType}
                        onChange={(e) => setQrFilterPricingType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ALL">All Types</option>
                        <option value="FIXED">Fixed Price</option>
                        <option value="VARIABLE">Variable Price</option>
                        <option value="FREE">Free</option>
                      </select>
                    </div>

                    {/* Delivery Method Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                      <select
                        value={qrFilterDeliveryMethod}
                        onChange={(e) => setQrFilterDeliveryMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ALL">All Methods</option>
                        <option value="DIRECT">Direct Download</option>
                        <option value="URLS">Landing Pages</option>
                        <option value="BOTH">Both Options</option>
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={qrSortBy}
                        onChange={(e) => setQrSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DATE_DESC">Newest First</option>
                        <option value="DATE_ASC">Oldest First</option>
                        <option value="NAME_ASC">Name A-Z</option>
                        <option value="NAME_DESC">Name Z-A</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Info and Clear All */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {qrSearchQuery && (
                        <span className="mr-2">
                          Search: "<span className="font-medium">{qrSearchQuery}</span>"
                        </span>
                      )}
                      Showing {filteredAndSortedQRConfigs.length} of {availableQRConfigs.length} configurations
                    </div>
                    <button
                      onClick={() => {
                        setQrSearchQuery('')
                        setQrFilterPricingType('ALL')
                        setQrFilterDeliveryMethod('ALL')
                        setQrSortBy('DATE_DESC')
                      }}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {loadingQRConfigs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading configurations...</span>
                </div>
              ) : filteredAndSortedQRConfigs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {availableQRConfigs.length === 0 ? (
                    <>
                      <p className="text-gray-500 mb-4">No QR configurations available</p>
                      <p className="text-sm text-gray-400">Create a QR configuration first to pair with sellers.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 mb-4">No matching configurations found</p>
                      <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters to find more configurations.</p>
                      <button
                        onClick={() => {
                          setQrSearchQuery('')
                          setQrFilterPricingType('ALL')
                          setQrFilterDeliveryMethod('ALL')
                          setQrSortBy('DATE_DESC')
                        }}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Clear Filters
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedQRConfigs.map((config) => (
                    <div key={config.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                      {/* Compact Header */}
                      <div 
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          expandedQRConfigs.has(config.id) ? 'bg-blue-50 border-b border-blue-200' : ''
                        }`}
                        onClick={() => toggleQRConfigExpanded(config.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900 text-lg">{config.name}</h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                config.source === 'api' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {config.source === 'api' ? 'Global' : 'Saved'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAssignQRConfig(config)
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Pair
                              </button>
                              <svg 
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  expandedQRConfigs.has(config.id) ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(config.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedQRConfigs.has(config.id) && (
                        <div className="p-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* 1. Guest & Day Limits */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  1
                                </div>
                                <h5 className="font-semibold text-gray-900">Guest & Day Limits</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Guests:</strong> {!config.config.button1GuestsLocked ? `1-${config.config.button1GuestsRangeMax} Open` : `${config.config.button1GuestsDefault} Fixed`}</p>
                                <p><strong>Days:</strong> {!config.config.button1DaysLocked ? `1-${config.config.button1DaysRangeMax} Open` : `${config.config.button1DaysDefault} Fixed`}</p>
                              </div>
                            </div>

                            {/* 2. Pricing */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  2
                                </div>
                                <h5 className="font-semibold text-gray-900">Pricing</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Type:</strong> {config.config.button2PricingType === 'FIXED' ? 'Fixed' : config.config.button2PricingType === 'VARIABLE' ? 'Variable' : 'Free'}</p>
                                {config.config.button2PricingType === 'FIXED' && config.config.button2FixedPrice && (
                                  <>
                                    {config.config.button2IncludeTax ? (
                                      <>
                                        <p><strong>Price:</strong> ${config.config.button2FixedPrice} + ${(config.config.button2FixedPrice * (config.config.button2TaxPercentage / 100)).toFixed(2)} ({config.config.button2TaxPercentage}% tax)</p>
                                        <p><strong>Total:</strong> ${(config.config.button2FixedPrice * (1 + config.config.button2TaxPercentage / 100)).toFixed(2)}</p>
                                      </>
                                    ) : (
                                      <p><strong>Price:</strong> ${config.config.button2FixedPrice}</p>
                                    )}
                                  </>
                                )}
                                {config.config.button2PricingType === 'VARIABLE' && (
                                  <>
                                    <p><strong>Base Price:</strong> ${config.config.button2VariableBasePrice}</p>
                                    <p><strong>Per Guest:</strong> +${config.config.button2VariableGuestIncrease}</p>
                                    <p><strong>Per Day:</strong> +${config.config.button2VariableDayIncrease}</p>
                                    <p><strong>Commission:</strong> {config.config.button2VariableCommission}%</p>
                                    {config.config.button2IncludeTax && (
                                      <p><strong>Tax:</strong> +{config.config.button2TaxPercentage}% (added to final amount)</p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 3. QR Delivery */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  3
                                </div>
                                <h5 className="font-semibold text-gray-900">QR Delivery</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Method:</strong> {
                                  config.config.button3DeliveryMethod === 'DIRECT' ? 'Direct Download' :
                                  config.config.button3DeliveryMethod === 'URLS' ? 'Landing Pages' :
                                  config.config.button3DeliveryMethod === 'BOTH' ? 'Both Options' : 'Button Trigger'
                                }</p>
                                <p><strong>Available delivery options configured</strong></p>
                                {/* Show landing page info for URLS or BOTH delivery methods */}
                                {config.landingPageConfig && config.config.button3DeliveryMethod !== 'DIRECT' && (
                                  <div className="mt-2 space-y-1">
                                    <p><strong>Landing Page:</strong> 
                                      <a 
                                        href={config.landingPageConfig.landingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                      >
                                        {config.landingPageConfig.landingUrl}
                                      </a>
                                    </p>
                                    <p><strong>Template:</strong> 
                                      <button 
                                        onClick={() => {
                                          // First, restore this configuration's landing page data to localStorage
                                          if (config.landingPageConfig) {
                                            localStorage.setItem('elocalpass-landing-config', JSON.stringify(config.landingPageConfig))
                                          }
                                          // Then navigate to create page in EDIT mode to load the template
                                          window.open('/admin/qr-config/create?mode=edit', '_blank')
                                        }}
                                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                      >
                                        Edit
                                      </button>
                                    </p>
                                    <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {/* Show direct delivery info when DIRECT method is selected */}
                                {config.config.button3DeliveryMethod === 'DIRECT' && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm text-gray-600">
                                      <em>Direct delivery: Sellers input customer details and send ELocalPass directly from their dashboard.</em>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 4. Welcome Email */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  4
                                </div>
                                <h5 className="font-semibold text-gray-900">Welcome Email</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Enabled:</strong> {config.config.button4LandingPageRequired ? 'Customized' : 'Default'}</p>
                                {config.config.button4LandingPageRequired && (
                                  <>
                                    <div className="flex items-center">
                                      <span className="text-green-600 mr-1">✓</span>
                                      <span>{config.emailTemplates?.welcomeEmail ? 'Custom template configured' : 'Default template'}</span>
                                    </div>
                                    {config.emailTemplates?.welcomeEmail && (
                                      <div className="mt-2 space-y-1">
                                        <p><strong>Template:</strong> 
                                          <button 
                                            onClick={() => {
                                              // First, restore this configuration's template data to localStorage
                                              if (config.emailTemplates?.welcomeEmail) {
                                                localStorage.setItem('elocalpass-welcome-email-config', JSON.stringify(config.emailTemplates.welcomeEmail))
                                              }
                                              // Then navigate to email-config page in EDIT mode to load the template
                                              window.open('/admin/qr-config/email-config?mode=edit', '_blank')
                                            }}
                                            className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                          >
                                            Welcome Email Template - {new Date(config.createdAt).toLocaleDateString()}
                                          </button>
                                        </p>
                                        <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 5. Rebuy Email */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  5
                                </div>
                                <h5 className="font-semibold text-gray-900">Rebuy Email</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Enabled:</strong> {config.config.button5SendRebuyEmail ? (
                                  (() => {
                                    // Check if this configuration has a custom rebuy email template
                                    const hasCustomRebuyTemplate = config.emailTemplates?.rebuyEmail;
                                    return hasCustomRebuyTemplate ? 'Customized' : 'Default';
                                  })()
                                  ) : 'No'}
                                </p>
                                {config.config.button5SendRebuyEmail && config.emailTemplates?.rebuyEmail && (
                                  <>
                                    <div className="flex items-center">
                                      <span className="text-green-600 mr-1">✓</span>
                                      <span>Custom template configured</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <p><strong>Template:</strong> 
                                        <button 
                                          onClick={() => {
                                            // First, restore this configuration's rebuy template data to localStorage
                                            if (config.emailTemplates?.rebuyEmail) {
                                              localStorage.setItem('elocalpass-rebuy-email-config', JSON.stringify(config.emailTemplates.rebuyEmail))
                                            }
                                            // Then navigate to rebuy-config page in EDIT mode to load the template
                                            window.open('/admin/qr-config/rebuy-config?mode=edit', '_blank')
                                          }}
                                          className="text-blue-600 hover:text-blue-800 cursor-pointer underline ml-1"
                                        >
                                          Rebuy Email Template - {new Date(config.createdAt).toLocaleDateString()}
                                        </button>
                                      </p>
                                      <p><strong>Created:</strong> {new Date(config.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 6. Future QR */}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <div className="flex items-center mb-3">
                                <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                  6
                                </div>
                                <h5 className="font-semibold text-gray-900">Future QR</h5>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><strong>Enabled:</strong> {config.config.button6AllowFutureQR ? "Yes" : "No"}</p>
                                <p><strong>Description:</strong> {config.config.button6AllowFutureQR 
                                  ? "Customers can access future QR codes for upcoming bookings"
                                  : "Future QR code access is disabled for this configuration"
                                }</p>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowQRPairingModal(false)
                    setSelectedSellerForQR(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Independent Seller Modal */}
      {showIndependentSellerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateIndependentSeller}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center mb-4">
                    <User className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add Independent Seller</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={independentSellerFormData.businessName}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="e.g., John's Coffee Shop"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={independentSellerFormData.contactPerson}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="Owner/Manager name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={independentSellerFormData.email}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="Login email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={independentSellerFormData.password}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                        placeholder="Login password"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telephone
                        </label>
                        <input
                          type="tel"
                          value={independentSellerFormData.telephone}
                          onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, telephone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={independentSellerFormData.whatsapp}
                          onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="If different from phone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Address
                      </label>
                      <input
                        type="text"
                        value={independentSellerFormData.address}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Business location address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={independentSellerFormData.notes}
                        onChange={(e) => setIndependentSellerFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Additional business information..."
                      />
                    </div>



                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            Independent Seller Benefits
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Appears as regular distributor in the main table</li>
                              <li>Full hierarchy: Distributor → Location → Seller</li>
                              <li>Dual dashboard access (Analytics + QR Generator)</li>
                              <li>Complete business management in one account</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isCreatingIndependentSeller}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingIndependentSeller ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Independent Seller'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowIndependentSellerModal(false)
                      setIndependentSellerFormData({
                        businessName: "",
                        contactPerson: "",
                        email: "",
                        password: "",
                        telephone: "",
                        whatsapp: "",
                        notes: "",
                        address: ""
                      })
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
