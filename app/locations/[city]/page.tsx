'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Search, Filter, Star, Phone, Mail, Globe, Map, Heart, Eye, ArrowLeft } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import GoogleMap from '../../../components/GoogleMap'
import AffiliateModal from '../../../components/AffiliateModal'
import { Affiliate } from '../../../types/affiliate'
import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'

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
  // Add state for bottom sheet open/height
  const [sheetOpen, setSheetOpen] = useState(true)
  const [sheetPosition, setSheetPosition] = useState(0.6) // Track current position (0.25, 0.6, or 0.95)
  const [showBottomNav, setShowBottomNav] = useState(true)

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

  // Monitor bottom sheet position and hide/show bottom navigation
  useEffect(() => {
    const checkSheetPosition = () => {
      const sheetElement = document.querySelector('[data-rsbs-overlay]')
      if (sheetElement) {
        const transform = window.getComputedStyle(sheetElement).transform
        const matrix = new DOMMatrix(transform)
        const translateY = matrix.m42
        const windowHeight = window.innerHeight
        
        // Bottom navigation height is approximately 80px (py-2 + icons + text)
        const bottomNavHeight = 80
        const bottomNavTop = windowHeight - bottomNavHeight
        
        // Hide bottom nav when sheet reaches the bottom nav's position
        // Show it again when sheet moves above the bottom nav
        const isSheetAtBottomNav = translateY <= bottomNavTop
        setShowBottomNav(!isSheetAtBottomNav)
      }
    }

    // Check position periodically
    const interval = setInterval(checkSheetPosition, 100)
    return () => clearInterval(interval)
  }, [])

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
      {/* Map always in the background */}
      <div className="fixed inset-0 z-0">
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

      {/* Draggable Bottom Sheet for Mobile */}
      <div className="block md:hidden fixed inset-x-0 bottom-0 z-40">
        <BottomSheet
          open={sheetOpen}
          onDismiss={() => setSheetOpen(false)}
          snapPoints={({ maxHeight }) => [maxHeight * 0.25, maxHeight * 0.6, maxHeight * 0.95]}
          defaultSnap={({ maxHeight }) => maxHeight * 0.6}

          header={
            <div className="flex flex-col items-center py-2">
              <div className="w-10 h-1.5 bg-gray-300 rounded-full mb-2" />
              <div className="text-base font-semibold text-gray-900">
                {filteredAffiliates.length} {language === 'es' ? 'Afiliados' : 'Affiliates'}
              </div>
            </div>
          }
        >
          <div className="px-2 pb-16">
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
                    setModalAffiliate(affiliate)
                    setIsModalOpen(true)
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
            {/* Pagination (if needed) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4 mb-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                >
                  {language === 'es' ? 'Anterior' : 'Previous'}
                </button>
                <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                >
                  {language === 'es' ? 'Siguiente' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </BottomSheet>
      </div>

      {/* Desktop/Tablet Layout (unchanged) */}
      <div className="hidden md:flex flex-col lg:flex-row h-screen bg-gray-50 pb-20 md:pb-0 lg:pb-0">
        {/* Left Side - Affiliate Grid (Responsive Layout) */}
        <div className="w-full lg:w-[65%] pl-4 sm:pl-6 lg:pl-8 order-2 lg:order-1 bg-gray-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            {userLocation && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {language === 'es' ? 'Tu ubicación' : 'Your location'}:
                <span className="ml-1 font-medium">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRecommendedFilter(!recommendedFilter)}
                className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                  recommendedFilter
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                <Heart className="w-4 h-4 mr-1" />
                {language === 'es' ? 'Recomendados' : 'Recommended'}
              </button>
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

      {/* Mobile Bottom Navigation Bar - Airbnb Style */}
      <div className={`block md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-all duration-300 ${
        showBottomNav ? 'opacity-100 pointer-events-auto z-50' : 'opacity-0 pointer-events-none z-10'
      }`}>
        <div className="flex items-center justify-around px-4 py-2">
          {/* Explore/Filter Button */}
          <button className="flex flex-col items-center py-2 px-3 text-red-600">
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span className="text-xs font-medium">Explore</span>
          </button>

          {/* Filters Button */}
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="flex flex-col items-center py-2 px-3 text-gray-600"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"/>
            </svg>
            <span className="text-xs font-medium">Filters</span>
          </button>

          {/* Map View Button */}
          <button className="flex flex-col items-center py-2 px-3 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            <span className="text-xs font-medium">Map</span>
          </button>

          {/* Saved/Wishlist Button */}
          <button className="flex flex-col items-center py-2 px-3 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span className="text-xs font-medium">Saved</span>
          </button>

          {/* Profile Button */}
          <button className="flex flex-col items-center py-2 px-3 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
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