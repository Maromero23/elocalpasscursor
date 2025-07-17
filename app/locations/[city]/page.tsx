'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Search, Filter, Star, Phone, Mail, Globe, Map, Heart, Eye } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import GoogleMap from '../../../components/GoogleMap'
import AffiliateModal from '../../../components/AffiliateModal'
import { Affiliate } from '../../../types/affiliate'
import Navigation from '../../../components/Navigation'

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

  const cityId = params.city as string
  const cityInfo = cityMap[cityId as keyof typeof cityMap]

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
      <Navigation />
      <div className="pt-20">
        <div className="w-full">
          {/* Header */}
          <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2">
            <div className="flex items-center space-x-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {cityInfo?.displayName || cityId} {filteredAffiliates.length} {language === 'es' ? 'Negocios encontrados' : 'Businesses found'}
              </h1>
              <div className="flex items-center space-x-4 text-sm">
                {(() => {
                  const restaurants = filteredAffiliates.filter(a => normalizeType(a.type || '') === 'Restaurant').length
                  const stores = filteredAffiliates.filter(a => normalizeType(a.type || '') === 'Store').length
                  const services = filteredAffiliates.filter(a => normalizeType(a.type || '') === 'Service').length
                  return (
                    <>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">{restaurants} {language === 'es' ? 'Restaurantes' : 'Restaurants'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">{stores} {language === 'es' ? 'Tiendas' : 'Stores'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">{services} {language === 'es' ? 'Servicios' : 'Services'}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 mx-4 sm:mx-6 lg:mx-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Ciudad' : 'City'}
                </label>
                <select
                  value={cityId || ''}
                  onChange={e => window.location.href = `/locations/${e.target.value}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(cityMap).map(([slug, info]) => (
                    <option key={slug} value={slug}>{info.displayName}</option>
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
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'es' ? 'Todos los tipos' : 'All types'}</option>
                  {normalizedTypes.map(type => (
                    <option key={type} value={type}>{getDisplayType(type)}</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'es' ? 'Todas las categorías' : 'All categories'}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Calificación mínima' : 'Min. Rating'}
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{language === 'es' ? 'Cualquier calificación' : 'Any rating'}</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.5">3.5+ ⭐</option>
                  <option value="3.0">3.0+ ⭐</option>
                </select>
              </div>

              {/* Recommended Filter */}
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={recommendedFilter}
                    onChange={(e) => setRecommendedFilter(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {language === 'es' ? 'Solo recomendados' : 'Recommended only'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="flex">
              {/* Left Side - Affiliate Grid (3 Column Layout) */}
              <div className="w-[70%] px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-4">
                  {userLocation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {language === 'es' ? 'Tu ubicación' : 'Your location'}
                    </div>
                  )}
                </div>

                {/* Affiliate Grid - 3 Column Layout */}
                <div className="grid grid-cols-3 gap-4 h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredAffiliates.map((affiliate) => (
                    <div 
                      key={affiliate.id} 
                      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                        selectedAffiliate?.id === affiliate.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedAffiliate(affiliate)
                        setModalAffiliate(affiliate)
                        setIsModalOpen(true)
                      }}
                    >
                      <div className="p-4">
                        {/* Logo/Image - Square Format */}
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                          {affiliate.logo ? (
                            <img 
                              src={affiliate.logo} 
                              alt={affiliate.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <MapPin className={`w-8 h-8 text-gray-400 ${affiliate.logo ? 'hidden' : ''}`} />
                        </div>

                        {/* Content - Compact Format */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">{affiliate.name}</h3>
                            {affiliate.recommended && (
                              <span className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded-full ml-1">
                                {language === 'es' ? 'Rec' : 'Rec'}
                              </span>
                            )}
                          </div>

                          {affiliate.rating && (
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 ml-1">{affiliate.rating}</span>
                            </div>
                          )}

                          {affiliate.category && (
                            <p className="text-xs text-gray-600">{affiliate.category}</p>
                          )}

                          {affiliate.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {affiliate.description}
                            </p>
                          )}

                          {affiliate.discount && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-1">
                              <p className="text-xs font-medium text-blue-900">
                                {affiliate.discount}
                              </p>
                            </div>
                          )}

                          {/* Contact Info - Compact */}
                          <div className="space-y-1">
                            {affiliate.workPhone && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                <span className="truncate">{affiliate.workPhone}</span>
                              </div>
                            )}
                            {affiliate.web && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Globe className="w-3 h-3 mr-1" />
                                <a href={affiliate.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                  {language === 'es' ? 'Sitio web' : 'Website'}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons - Compact */}
                          <div className="flex space-x-1 mt-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setModalAffiliate(affiliate)
                                setIsModalOpen(true)
                              }}
                              className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              {language === 'es' ? 'Ver' : 'View'}
                            </button>
                            {affiliate.maps && (
                              <a
                                href={affiliate.maps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-100 text-gray-700 py-1 px-2 rounded text-xs hover:bg-gray-200 transition-colors"
                              >
                                {language === 'es' ? 'Mapa' : 'Map'}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAffiliates.length === 0 && (
                  <div className="text-center py-16">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'es' ? 'No se encontraron negocios' : 'No businesses found'}
                    </h3>
                    <p className="text-gray-600">
                      {language === 'es' 
                        ? 'Intenta ajustar tus filtros de búsqueda'
                        : 'Try adjusting your search filters'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Map (Airbnb Style) */}
              <div className="w-[30%] h-[calc(100vh-200px)]">
                <GoogleMap
                  affiliates={filteredAffiliates}
                  userLocation={userLocation}
                  onAffiliateClick={(affiliate) => {
                    setSelectedAffiliate(affiliate)
                    setModalAffiliate(affiliate)
                    setIsModalOpen(true)
                  }}
                  selectedAffiliate={selectedAffiliate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <AffiliateModal
          affiliate={modalAffiliate}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setModalAffiliate(null)
          }}
        />
      </div>
    </div>
  )
} 