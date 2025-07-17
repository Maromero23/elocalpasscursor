'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
    'services': 'Service'
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

  const cityId = params.city as string
  const cityInfo = cityMap[cityId as keyof typeof cityMap]

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
      fetchAffiliates()
      getUserLocation()
    }
  }, [cityInfo])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch(`/api/locations/affiliates?city=${cityInfo.name}`)
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.affiliates || [])
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Error getting location:', error)
        }
      )
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

  const categories = Array.from(new Set(affiliates.map(a => a.category).filter((cat): cat is string => Boolean(cat))))
  
  // Create normalized types for the dropdown
  const normalizedTypes = Array.from(new Set(
    affiliates
      .map(a => a.type)
      .filter((type): type is string => Boolean(type))
      .map(type => normalizeType(type))
  )).sort()

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
    <div className="min-h-screen bg-gray-50">
      {/* Compact Top Bar with Home and Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center">
          {/* Back Arrow with Home Text */}
          <a 
            href="/" 
            className="absolute left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Home</span>
          </a>

          {/* Centered Filter Menu */}
          <div className="flex items-center space-x-2">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32 sm:w-40"
              />
            </div>

            {/* City Filter */}
            <select
              value={cityId || ''}
              onChange={e => window.location.href = `/locations/${e.target.value}`}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {Object.entries(cityMap).map(([slug, info]) => (
                <option key={slug} value={slug}>{info.displayName}</option>
              ))}
            </select>

            {/* Type Filter - Restored Original Options */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">{language === 'es' ? 'Todos los tipos' : 'All types'}</option>
              {normalizedTypes.map(type => (
                <option key={type} value={type}>{getDisplayType(type)}</option>
              ))}
            </select>

            {/* Category Filter - Restored Original Options with Alphabetical Order */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
              {categories.sort().map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Rating Filter - Restored Original Options */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">{language === 'es' ? 'Cualquier calificación' : 'Any rating'}</option>
              <option value="4.5">4.5+ ⭐</option>
              <option value="4.0">4.0+ ⭐</option>
              <option value="3.5">3.5+ ⭐</option>
              <option value="3.0">3.0+ ⭐</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content - Shifted Up */}
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        {/* Left Side - Affiliate Grid (Responsive Layout) */}
        <div className="w-full lg:w-[70%] pl-4 sm:pl-6 lg:pl-8 order-2 lg:order-1 bg-gray-50">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAffiliates.map((affiliate) => (
                  <div
                    key={affiliate.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
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
                          className="w-40 h-40 object-contain"
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

                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{affiliate.address}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {affiliate.workPhone && (
                            <Phone className="w-4 h-4 text-gray-400" />
                          )}
                          {affiliate.email && (
                            <Mail className="w-4 h-4 text-gray-400" />
                          )}
                          {affiliate.web && (
                            <Globe className="w-4 h-4 text-gray-400" />
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
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {language === 'es' ? 'Anterior' : 'Previous'}
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {language === 'es' ? 'Siguiente' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

                         {/* Right Side - Map */}
        <div className="w-full lg:w-[30%] order-1 lg:order-2 h-[50vh] lg:h-full">
          <GoogleMap
            affiliates={filteredAffiliates}
            userLocation={userLocation}
            selectedAffiliate={selectedAffiliate}
            onAffiliateClick={(affiliate) => {
              setSelectedAffiliate(affiliate)
              setModalAffiliate(affiliate)
              setIsModalOpen(true)
            }}
          />
        </div>
      </div>

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