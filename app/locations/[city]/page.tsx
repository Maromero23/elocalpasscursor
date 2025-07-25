'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Search, Filter, Star, Phone, Mail, Globe, Map, Heart, Eye, ArrowLeft } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import GoogleMap from '../../../components/GoogleMap'
import AffiliateModal from '../../../components/AffiliateModal'
import { Affiliate } from '../../../types/affiliate'


const cityMap = {
  'bacalar': { name: 'Bacalar', displayName: 'Bacalar' },
  'cancun': { name: 'Cancun', displayName: 'Cancún' },
  'cozumel': { name: 'Cozumel', displayName: 'Cozumel' },
  'holbox': { name: 'Holbox', displayName: 'Holbox' },
  'isla-mujeres': { name: 'Isla Mujeres', displayName: 'Isla Mujeres' },
  'playa-del-carmen': { name: 'Playa del Carmen', displayName: 'Playa del Carmen' },
  'puerto-aventuras': { name: 'Puerto Aventuras', displayName: 'Puerto Aventuras' },
  'puerto-morelos': { name: 'Puerto Morelos', displayName: 'Puerto Morelos' },
  'tulum': { name: 'Tulum', displayName: 'Tulum' }
}

// Function to normalize type names for grouping
const normalizeType = (type: string): string => {
  const normalized = type.toLowerCase().trim()
  // Remove plural 's' and normalize common variations
  if (normalized.endsWith('s')) {
    const singular = normalized.slice(0, -1)
    // Handle common cases
    if (singular === 'store' || singular === 'restaurant' || singular === 'service') {
      return singular.charAt(0).toUpperCase() + singular.slice(1)
    }
  }
  return type
}

// Function to get display type from normalized type
const getDisplayType = (normalizedType: string): string => {
  const typeMap: { [key: string]: string } = {
    'store': 'Store',
    'stores': 'Store',
    'restaurant': 'Restaurant', 
    'restaurants': 'Restaurant',
    'service': 'Service',
    'services': 'Service',
    'uncategorized': 'Uncategorized'
  }
  return typeMap[normalizedType.toLowerCase()] || normalizedType
}

export default function CityPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useTranslation()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [recommendedFilter, setRecommendedFilter] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [modalAffiliate, setModalAffiliate] = useState<Affiliate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const affiliatesPerPage = 12
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hoveredAffiliate, setHoveredAffiliate] = useState<string | null>(null)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  
  // Drag sheet state
  const [sheetPosition, setSheetPosition] = useState(40) // Percentage from bottom (40vh = 40%)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startPosition, setStartPosition] = useState(0)
  
  // Smooth page transition state
  const [showAffiliateDetail, setShowAffiliateDetail] = useState(false)
  const [detailAffiliate, setDetailAffiliate] = useState<Affiliate | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwipingDown, setIsSwipingDown] = useState(false)


  const cityId = params.city as string
  const cityInfo = cityId === 'all-cities' ? { name: 'all-cities', displayName: 'All Cities' } : cityMap[cityId as keyof typeof cityMap]

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

  useEffect(() => {
    if (cityInfo) {
      setLoading(true)
      setAffiliates([]) // Clear previous data immediately
      setCurrentPage(1) // Reset pagination
      
      // Use a timeout to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        fetchAffiliates()
        fetchStats()
        getUserLocation()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [cityId]) // Use cityId instead of cityInfo for more stable dependency

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = cityInfo.name === 'all-cities' 
        ? '/api/locations/affiliates'
        : `/api/locations/affiliates?city=${cityInfo.name}`
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.affiliates || [])
        setRetryCount(0) // Reset retry count on success
      } else {
        console.error('❌ LOCATIONS: Error fetching affiliates:', response.status, response.statusText)
        setError(`Failed to load affiliates (${response.status})`)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ LOCATIONS: Request timeout')
        setError('Request timeout - please try again')
      } else {
        console.error('❌ LOCATIONS: Error fetching affiliates:', error)
        setError('Failed to load affiliates - please try again')
      }
      
      // Auto-retry logic (max 3 retries)
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchAffiliates()
        }, 2000) // Wait 2 seconds before retry
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAffiliates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/locations/affiliates')
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.affiliates || [])
      }
    } catch (error) {
      console.error('Error fetching all affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/locations/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      console.log('🔍 Requesting user location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          console.log('✅ User location obtained:', location)
          setUserLocation(location)
        },
        (error) => {
          console.log('❌ Error getting location:', error)
        }
      )
    } else {
      console.log('❌ Geolocation not supported')
    }
  }

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = !searchTerm || 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use normalized type for filtering
    const affiliateNormalizedType = affiliate.type ? normalizeType(affiliate.type) : ''
    const filterNormalizedType = typeFilter ? normalizeType(typeFilter) : ''
    const matchesType = !typeFilter || affiliateNormalizedType === filterNormalizedType
    
    const matchesCategory = !categoryFilter || affiliate.category === categoryFilter
    const matchesRating = !ratingFilter || (affiliate.rating && affiliate.rating >= parseFloat(ratingFilter))
    const matchesRecommended = !recommendedFilter || affiliate.recommended

    return matchesSearch && matchesType && matchesCategory && matchesRating && matchesRecommended
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredAffiliates.length / affiliatesPerPage)
  const startIndex = (currentPage - 1) * affiliatesPerPage
  const endIndex = startIndex + affiliatesPerPage
  const currentAffiliates = filteredAffiliates.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, categoryFilter, ratingFilter, recommendedFilter])

  // Prevent body scroll when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging])

  // Drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent pull-to-refresh
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setStartPosition(sheetPosition)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    e.preventDefault() // Prevent scroll/pull-to-refresh
    e.stopPropagation() // Stop event bubbling
    
    const currentY = e.touches[0].clientY
    const deltaY = startY - currentY // Inverted: up = positive, down = negative
    const deltaPercent = (deltaY / window.innerHeight) * 100
    
    let newPosition = startPosition + deltaPercent
    
    // Constrain between 5% (almost bottom) and 85% (almost top)
    newPosition = Math.max(5, Math.min(85, newPosition))
    
    setSheetPosition(newPosition)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent any default behavior
    setIsDragging(false)
    
    // Snap to nearest position
    if (sheetPosition < 20) {
      setSheetPosition(5) // Collapsed (hide bottom menu)
    } else if (sheetPosition < 60) {
      setSheetPosition(40) // Default middle position
    } else {
      setSheetPosition(85) // Expanded
    }
  }





  const categories = Array.from(new Set(
    affiliates
      .map(a => a.category)
      .filter((cat): cat is string => Boolean(cat))
      .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase())
  )).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  
  // Create normalized types for the dropdown
  const normalizedTypes = Array.from(new Set(
    affiliates
      .map(a => a.type)
      .filter((type): type is string => Boolean(type))
      .map(type => normalizeType(type))
  )).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  if (!cityInfo) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'es' ? 'Ciudad no encontrada' : 'City not found'}
          </h1>
          <p className="text-gray-600">
            {language === 'es' 
              ? 'La ciudad que buscas no existe en nuestro sistema.'
              : 'The city you are looking for does not exist in our system.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Map background for mobile only */}
      <div className="fixed inset-0 z-0 block md:hidden">
        <GoogleMap
          affiliates={filteredAffiliates}
          userLocation={userLocation}
          selectedAffiliate={selectedAffiliate}
          hoveredAffiliate={hoveredAffiliate}
          onAffiliateClick={(affiliate) => {
            setSelectedAffiliate(affiliate)
            setModalAffiliate(affiliate)
            setIsModalOpen(true)
          }}
        />
      </div>

      {/* Affiliate Detail View - Full Screen */}
      {showAffiliateDetail && detailAffiliate && (
        <div 
          className="fixed inset-0 bg-white z-50 block md:hidden"
          style={{
            transform: `translateY(${swipeOffset}px)`,
            transition: isSwipingDown ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <div 
            className="h-full overflow-y-auto"
            onTouchStart={(e) => {
              if (window.scrollY === 0) {
                const touch = e.touches[0]
                setStartY(touch.clientY)
                setIsSwipingDown(true)
                // Prevent pull-to-refresh
                document.body.style.overscrollBehavior = 'none'
                document.body.style.touchAction = 'none'
              }
            }}
            onTouchMove={(e) => {
              if (!isSwipingDown || window.scrollY > 0) return
              
              e.preventDefault()
              e.stopPropagation()
              
              const touch = e.touches[0]
              const deltaY = touch.clientY - startY
              
              // Only allow downward swipes
              if (deltaY > 0) {
                // Apply resistance to the swipe (slower movement)
                const resistance = Math.min(deltaY * 0.5, 150)
                setSwipeOffset(resistance)
              }
            }}
            onTouchEnd={(e) => {
              if (!isSwipingDown) return
              
              e.preventDefault()
              e.stopPropagation()
              
              // Reset body styles
              document.body.style.overscrollBehavior = 'auto'
              document.body.style.touchAction = 'auto'
              
              // If swiped down enough, close the detail view
              if (swipeOffset > 100) {
                setIsTransitioning(true)
                setShowAffiliateDetail(false)
                setTimeout(() => {
                  setDetailAffiliate(null)
                  setIsTransitioning(false)
                  setSwipeOffset(0)
                  setIsSwipingDown(false)
                }, 300)
              } else {
                // Snap back to original position
                setSwipeOffset(0)
                setIsSwipingDown(false)
              }
            }}
          >
            {/* Header with back functionality */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => {
                    setIsTransitioning(true)
                    setShowAffiliateDetail(false)
                    setTimeout(() => {
                      setDetailAffiliate(null)
                      setIsTransitioning(false)
                      setSwipeOffset(0)
                      setIsSwipingDown(false)
                    }, 300)
                  }}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 truncate mx-4">
                  {detailAffiliate.name}
                </h1>
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
              
              {/* Swipe indicator */}
              {isSwipingDown && swipeOffset > 20 && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs">
                  {swipeOffset > 100 ? 'Release to close' : 'Swipe down to close'}
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="pb-20">
              {/* Hero Image */}
              <div className="relative h-64 bg-gray-100 flex items-center justify-center">
                {detailAffiliate.logo ? (
                  <img
                    src={convertGoogleDriveUrl(detailAffiliate.logo)}
                    alt={detailAffiliate.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <MapPin className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Title and Rating */}
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex-1">
                    {detailAffiliate.name}
                  </h2>
                  {detailAffiliate.rating && (
                    <div className="flex items-center ml-4 bg-gray-100 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium text-gray-700">
                        {detailAffiliate.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category and Type */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {detailAffiliate.type && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {detailAffiliate.type}
                    </span>
                  )}
                  {detailAffiliate.category && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {detailAffiliate.category}
                    </span>
                  )}
                  {detailAffiliate.recommended && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {language === 'es' ? 'Recomendado' : 'Recommended'}
                    </span>
                  )}
                </div>

                {/* Discount */}
                {detailAffiliate.discount && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">%</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-900">
                          {language === 'es' ? 'Oferta Especial' : 'Special Offer'}
                        </h3>
                        <p className="text-orange-800 font-medium">
                          {detailAffiliate.discount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {detailAffiliate.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {language === 'es' ? 'Descripción' : 'Description'}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {detailAffiliate.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {language === 'es' ? 'Información de Contacto' : 'Contact Information'}
                  </h3>
                  
                  {detailAffiliate.address && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-gray-700">{detailAffiliate.address}</p>
                        {detailAffiliate.city && (
                          <p className="text-gray-500 text-sm">{detailAffiliate.city}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {detailAffiliate.workPhone && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={`tel:${detailAffiliate.workPhone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {detailAffiliate.workPhone}
                      </a>
                    </div>
                  )}

                  {detailAffiliate.whatsApp && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={`https://wa.me/${detailAffiliate.whatsApp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                      >
                        WhatsApp: {detailAffiliate.whatsApp}
                      </a>
                    </div>
                  )}

                  {detailAffiliate.web && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={detailAffiliate.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate"
                      >
                        {detailAffiliate.web}
                      </a>
                    </div>
                  )}

                  {detailAffiliate.facebook && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={detailAffiliate.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Facebook
                      </a>
                    </div>
                  )}

                  {detailAffiliate.instagram && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={detailAffiliate.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800"
                      >
                        Instagram
                      </a>
                    </div>
                  )}

                  {detailAffiliate.maps && (
                    <div className="flex items-center">
                      <Map className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={detailAffiliate.maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {language === 'es' ? 'Ver en Google Maps' : 'View on Google Maps'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Airbnb-Style Layout */}
      <div className={`block md:hidden transition-opacity duration-300 ${showAffiliateDetail ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Fixed Bottom Navigation */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-opacity duration-300 ${
          sheetPosition <= 10 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="flex items-center justify-around px-4 py-2">
            <button 
              onClick={() => router.push('/locations')}
              className="flex flex-col items-center py-2 px-3 text-red-600"
            >
              <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <span className="text-xs font-medium">Explore</span>
            </button>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="flex flex-col items-center py-2 px-3 text-gray-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span className="text-xs font-medium">Wishlists</span>
            </button>
            <button className="flex flex-col items-center py-2 px-3 text-gray-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span className="text-xs font-medium">Search</span>
            </button>
            <button className="flex flex-col items-center py-2 px-3 text-gray-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <span className="text-xs font-medium">Messages</span>
            </button>
            <button className="flex flex-col items-center py-2 px-3 text-gray-600">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>

        {/* Draggable Affiliate Sheet */}
        <div 
          className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-40 transition-transform duration-300 select-none flex flex-col" 
          style={{ 
            height: '90vh', 
            transform: `translateY(${90 - sheetPosition}vh)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Drag Handle */}
          <div 
            className="flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <div className="w-12 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
          
          {/* Sheet Header */}
          <div className="px-4 pb-2 text-center">
            <div className="text-lg font-semibold text-gray-900">
              {filteredAffiliates.length} {language === 'es' ? 'Afiliados' : 'Affiliates'}
            </div>
          </div>

          {/* Content based on position */}
          <div className="flex-1 overflow-hidden">
            {sheetPosition >= 70 ? (
              // Expanded view - Full scrollable list
              <div className="h-full overflow-y-auto px-4 pb-24">
                <div className="grid grid-cols-1 gap-4">
                  {currentAffiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all cursor-pointer ${
                        selectedAffiliate?.id === affiliate.id
                          ? 'border-orange-500 shadow-lg'
                          : 'border-gray-200 hover:border-orange-400 hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedAffiliate(affiliate)
                        setDetailAffiliate(affiliate)
                        setIsTransitioning(true)
                        setTimeout(() => {
                          setShowAffiliateDetail(true)
                          setIsTransitioning(false)
                        }, 300)
                      }}
                    >
                      <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                        {affiliate.logo ? (
                          <img
                            src={convertGoogleDriveUrl(affiliate.logo)}
                            alt={affiliate.name}
                            className="w-32 h-32 object-contain rounded-xl"
                            style={{ borderRadius: '12px', minWidth: '128px', minHeight: '128px', maxWidth: '128px', maxHeight: '128px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${affiliate.logo ? 'hidden' : ''}`}>
                          <MapPin className="w-10 h-10" />
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {affiliate.name}
                          </h3>
                          <div className="flex items-center ml-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">
                              {affiliate.rating || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {affiliate.description && (
                          <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {affiliate.description}
                          </div>
                        )}
                        {affiliate.discount && (
                          <div className="mb-2">
                            <div className="text-base font-bold text-orange-600">
                              {affiliate.discount}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination for expanded view */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-4 mb-6 bg-white py-3 rounded-lg border border-gray-100">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      {language === 'es' ? 'Anterior' : 'Previous'}
                    </button>
                    <span className="text-sm text-gray-600 font-medium px-2">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      {language === 'es' ? 'Siguiente' : 'Next'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Default/Collapsed view - Single preview card
              <div className="px-4">
                {currentAffiliates.length > 0 && (
                  <div 
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedAffiliate(currentAffiliates[0])
                      setDetailAffiliate(currentAffiliates[0])
                      setIsTransitioning(true)
                      setTimeout(() => {
                        setShowAffiliateDetail(true)
                        setIsTransitioning(false)
                      }, 300)
                    }}
                  >
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      {currentAffiliates[0].logo ? (
                        <img
                          src={convertGoogleDriveUrl(currentAffiliates[0].logo)}
                          alt={currentAffiliates[0].name}
                          className="w-40 h-40 object-contain rounded-xl"
                          style={{ borderRadius: '12px', minWidth: '160px', minHeight: '160px', maxWidth: '160px', maxHeight: '160px' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${currentAffiliates[0].logo ? 'hidden' : ''}`}>
                        <MapPin className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-base">
                          {currentAffiliates[0].name}
                        </h3>
                        <div className="flex items-center ml-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {currentAffiliates[0].rating || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {currentAffiliates[0].description && (
                        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {currentAffiliates[0].description}
                        </div>
                      )}
                      {currentAffiliates[0].discount && (
                        <div className="text-lg font-bold text-orange-600">
                          {currentAffiliates[0].discount}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Layout (unchanged) */}
      <div className="hidden md:flex flex-col lg:flex-row h-screen bg-gray-50 pb-20 md:pb-0 lg:pb-0">
        {/* Left Side - Affiliate Grid (Responsive Layout) */}
        <div className="w-full lg:w-[65%] pl-4 sm:pl-6 lg:pl-8 order-2 lg:order-1 bg-gray-50 overflow-y-auto">
          {/* Header with location info */}
          <div className="flex justify-between items-center mb-4 pt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {cityInfo.displayName}
            </h1>
            {userLocation && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {language === 'es' ? 'Tu ubicación' : 'Your location'}:
                <span className="ml-1 font-medium">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Filter Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Buscar' : 'Search'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'es' ? 'Buscar negocios...' : 'Search businesses...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Tipo' : 'Type'}
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">{language === 'es' ? 'Todos los tipos' : 'All types'}</option>
                    {normalizedTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Categoría' : 'Category'}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
                    {categories.map((category: string) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Calificación mínima' : 'Minimum rating'}
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">{language === 'es' ? 'Cualquier calificación' : 'Any rating'}</option>
                    <option value="4">4+ ⭐</option>
                    <option value="3">3+ ⭐</option>
                    <option value="2">2+ ⭐</option>
                  </select>
                </div>

                {/* Recommended Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Filtros especiales' : 'Special filters'}
                  </label>
                  <button
                    onClick={() => setRecommendedFilter(!recommendedFilter)}
                    className={`w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      recommendedFilter
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {language === 'es' ? 'Recomendados' : 'Recommended'}
                  </button>
                </div>
              </div>

              {/* Results count and clear filters */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {language === 'es' 
                    ? `${filteredAffiliates.length} resultados encontrados`
                    : `${filteredAffiliates.length} results found`
                  }
                </div>
                {(searchTerm || typeFilter || categoryFilter || ratingFilter || recommendedFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setTypeFilter('')
                      setCategoryFilter('')
                      setRatingFilter('')
                      setRecommendedFilter(false)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {language === 'es' ? 'Cargando afiliados...' : 'Loading affiliates...'}
                </p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {language === 'es' ? `Reintento ${retryCount}/3` : `Retry ${retryCount}/3`}
                  </p>
                )}
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-2">
                  {language === 'es' ? 'Error al cargar' : 'Loading Error'}
                </p>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    setRetryCount(0)
                    fetchAffiliates()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {language === 'es' ? 'Reintentar' : 'Retry'}
                </button>
              </div>
            </div>
          ) : (
            <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAffiliates.map((affiliate) => (
                  <div
                    key={affiliate.id}
                    className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all cursor-pointer ${
                      selectedAffiliate?.id === affiliate.id
                        ? 'border-orange-500 shadow-lg'
                        : 'border-gray-200 hover:border-orange-400 hover:shadow-md'
                    }`}
                    onMouseEnter={() => setHoveredAffiliate(affiliate.name)}
                    onMouseLeave={() => setHoveredAffiliate(null)}
                    onClick={() => {
                      setSelectedAffiliate(affiliate)
                      setModalAffiliate(affiliate)
                      setIsModalOpen(true)
                    }}
                  >
                    {/* Square Logo Container */}
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      {affiliate.logo ? (
                        <img
                          src={convertGoogleDriveUrl(affiliate.logo)}
                          alt={affiliate.name}
                          className="w-40 h-40 object-contain rounded-xl"
                          style={{ 
                            borderRadius: '12px',
                            minWidth: '160px',
                            minHeight: '160px',
                            maxWidth: '160px',
                            maxHeight: '160px'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${affiliate.logo ? 'hidden' : ''}`}>
                        <MapPin className="w-12 h-12" />
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                          {affiliate.name}
                        </h3>
                        <div className="flex items-center ml-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {affiliate.rating || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {affiliate.description && (
                        <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {affiliate.description}
                        </div>
                      )}

                      {/* Discount - Most Important */}
                      {affiliate.discount && (
                        <div className="mb-3">
                          <div className="text-lg font-bold text-orange-600">
                            {affiliate.discount}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {affiliate.web && (
                            <a 
                              href={affiliate.web} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          {affiliate.facebook && (
                            <a 
                              href={affiliate.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </a>
                          )}
                          {affiliate.instagram && (
                            <a 
                              href={affiliate.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.928-.875-1.418-2.026-1.418-3.244s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {affiliate.totalVisits || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8 mb-4">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                  >
                    {language === 'es' ? 'Anterior' : 'Previous'}
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = []
                      const maxVisiblePages = 5
                      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                      
                      // Add first page if not in range
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            1
                          </button>
                        )
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                          )
                        }
                      }
                      
                      // Add visible pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              currentPage === i
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                      
                      // Add last page if not in range
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                          )
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                            {totalPages}
                          </button>
                        )
                      }
                      
                      return pages
                    })()}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                  >
                    {language === 'es' ? 'Siguiente' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

                         {/* Right Side - Map */}
        <div className="w-full lg:w-[35%] order-1 lg:order-2 h-[50vh] md:h-[50vh] lg:h-screen" style={{ minHeight: '50vh' }}>
          <GoogleMap
            affiliates={filteredAffiliates}
            userLocation={userLocation}
            selectedAffiliate={selectedAffiliate}
            hoveredAffiliate={hoveredAffiliate}
            onAffiliateClick={(affiliate) => {
              setSelectedAffiliate(affiliate)
              setModalAffiliate(affiliate)
              setIsModalOpen(true)
            }}
          />
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 block md:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'es' ? 'Filtros' : 'Filters'}
              </h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Ciudad' : 'City'}
                </label>
                <select
                  value={cityId || ''}
                  onChange={e => {
                    if (loading) return
                    if (e.target.value === 'all-cities') {
                      window.history.pushState({}, '', '/locations/all-cities')
                      window.location.reload()
                    } else {
                      window.location.href = `/locations/${e.target.value}`
                    }
                  }}
                  disabled={loading}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50"
                >
                  <option value="all-cities">
                    {language === 'es' ? 'Todas las ciudades' : 'All cities'} 
                    {stats?.totalStats ? ` (${stats.totalStats.total})` : ''}
                  </option>
                  {Object.entries(cityMap).map(([slug, info]) => (
                    <option key={slug} value={slug}>
                      {info.displayName}
                      {stats?.cityStats?.[slug] ? ` (${stats.cityStats[slug].total})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Tipo' : 'Type'}
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{language === 'es' ? 'Todos los tipos' : 'All types'}</option>
                  {normalizedTypes.map(type => {
                    const displayType = getDisplayType(type)
                    const currentCityStats = cityId === 'all-cities' 
                      ? stats?.totalStats 
                      : stats?.cityStats?.[cityId]
                    const typeCount = currentCityStats?.types?.[type.toLowerCase()] || 0
                    return (
                      <option key={type} value={type}>
                        {displayType} ({typeCount})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Categoría' : 'Category'}
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
                  {categories.sort().map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Calificación' : 'Rating'}
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">{language === 'es' ? 'Cualquier calificación' : 'Any rating'}</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.5">3.5+ ⭐</option>
                  <option value="3.0">3.0+ ⭐</option>
                </select>
              </div>

              {/* Recommended Filter */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={recommendedFilter}
                    onChange={(e) => setRecommendedFilter(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {language === 'es' ? 'Solo recomendados' : 'Recommended only'}
                  </span>
                </label>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {language === 'es' ? 'Aplicar filtros' : 'Apply filters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAffiliate && (
        <AffiliateModal
          affiliate={modalAffiliate}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setModalAffiliate(null)
          }}
        />
      )}
    </div>
  )
} 