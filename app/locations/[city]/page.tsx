'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Search, Filter, Star, Phone, Mail, Globe, Map, Navigation, Heart } from 'lucide-react'
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
  const [showMap, setShowMap] = useState(false)
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
    const matchesType = !typeFilter || affiliate.type === typeFilter
    const matchesCategory = !categoryFilter || affiliate.category === categoryFilter
    const matchesRating = !ratingFilter || (affiliate.rating && affiliate.rating >= parseFloat(ratingFilter))
    const matchesRecommended = !recommendedFilter || affiliate.recommended

    return matchesSearch && matchesType && matchesCategory && matchesRating && matchesRecommended
  })

  const categories = Array.from(new Set(affiliates.map(a => a.category).filter(Boolean)))
  const types = Array.from(new Set(affiliates.map(a => a.type).filter(Boolean)))

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
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {cityInfo.displayName}
                </h1>
                <p className="text-gray-600">
                  {language === 'es' 
                    ? `${affiliates.length} negocios locales con descuentos exclusivos`
                    : `${affiliates.length} local businesses with exclusive discounts`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showMap 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Map className="w-4 h-4 inline mr-2" />
                  {showMap 
                    ? (language === 'es' ? 'Ver lista' : 'View list')
                    : (language === 'es' ? 'Ver mapa' : 'View map')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'es' ? 'Tipo' : 'Type'}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{language === 'es' ? 'Todos los tipos' : 'All types'}</option>
                {types.map((type) => (
                  <option key={type} value={type || ''}>{type}</option>
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
                  <option key={category} value={category || ''}>{category}</option>
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
          <div className="flex gap-8">
            {/* Left Side - Affiliate List */}
            <div className={`${showMap ? 'w-1/2' : 'w-full'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'es' 
                    ? `${filteredAffiliates.length} negocios encontrados`
                    : `${filteredAffiliates.length} businesses found`
                  }
                </h3>
                {userLocation && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Navigation className="w-4 h-4 mr-1" />
                    {language === 'es' ? 'Tu ubicación' : 'Your location'}
                  </div>
                )}
              </div>

              {/* Affiliate List */}
              <div className="space-y-4">
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
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{affiliate.name}</h3>
                            <div className="flex items-center space-x-2">
                              {affiliate.recommended && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  {language === 'es' ? 'Recomendado' : 'Recommended'}
                                </span>
                              )}
                              <button className="text-gray-400 hover:text-red-500 transition-colors">
                                <Heart className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {affiliate.rating && (
                            <div className="flex items-center mb-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">{affiliate.rating}</span>
                            </div>
                          )}

                          {affiliate.category && (
                            <p className="text-sm text-gray-600 mb-2">{affiliate.category}</p>
                          )}

                          {affiliate.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {affiliate.description}
                            </p>
                          )}

                          {affiliate.discount && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-blue-900">
                                {language === 'es' ? 'Descuento:' : 'Discount:'} {affiliate.discount}
                              </p>
                            </div>
                          )}

                          {/* Contact Info */}
                          <div className="space-y-1">
                            {affiliate.workPhone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span>{affiliate.workPhone}</span>
                              </div>
                            )}
                            {affiliate.web && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2" />
                                <a href={affiliate.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {language === 'es' ? 'Visitar sitio web' : 'Visit website'}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Logo/Image */}
                        <div className="ml-4 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {affiliate.logo ? (
                            <img 
                              src={affiliate.logo} 
                              alt={affiliate.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <MapPin className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      </div>

                                           {/* Action Buttons */}
                     <div className="flex space-x-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation()
                           setModalAffiliate(affiliate)
                           setIsModalOpen(true)
                         }}
                         className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                       >
                         {language === 'es' ? 'Ver detalles' : 'View details'}
                       </button>
                       {affiliate.maps && (
                         <a
                           href={affiliate.maps}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center"
                         >
                           <MapPin className="w-4 h-4 mr-1" />
                           {language === 'es' ? 'Mapa' : 'Map'}
                         </a>
                       )}
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

                         {/* Right Side - Map */}
             {showMap && (
               <div className="w-1/2">
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">
                     {language === 'es' ? 'Mapa de ubicaciones' : 'Location Map'}
                   </h3>
                   <div className="h-96 rounded-lg overflow-hidden">
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
               </div>
             )}
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
   )
} 