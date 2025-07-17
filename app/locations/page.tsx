'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Search, Filter, Star, Phone, Mail, Globe, Map } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

interface Affiliate {
  id: string
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
  rating: number | null
  recommended: boolean
  totalVisits: number
  isActive: boolean
}

const cities = [
  { id: 'bacalar', name: 'Bacalar', displayName: 'Bacalar' },
  { id: 'cancun', name: 'Cancun', displayName: 'Cancún' },
  { id: 'cozumel', name: 'Cozumel', displayName: 'Cozumel' },
  { id: 'holbox', name: 'Holbox', displayName: 'Holbox' },
  { id: 'isla-mujeres', name: 'Isla Mujeres', displayName: 'Isla Mujeres' },
  { id: 'playa-del-carmen', name: 'Playa del Carmen', displayName: 'Playa del Carmen' },
  { id: 'puerto-aventuras', name: 'Puerto Aventuras', displayName: 'Puerto Aventuras' },
  { id: 'puerto-morelos', name: 'Puerto Morelos', displayName: 'Puerto Morelos' },
  { id: 'tulum', name: 'Tulum', displayName: 'Tulum' }
]

export default function LocationsPage() {
  const { t, language } = useTranslation()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [recommendedFilter, setRecommendedFilter] = useState(false)

  useEffect(() => {
    fetchAffiliates()
  }, [])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch('/api/locations/affiliates')
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

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesCity = !selectedCity || affiliate.city?.toLowerCase().includes(selectedCity.toLowerCase())
    const matchesSearch = !searchTerm || 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || affiliate.category === categoryFilter
    const matchesRating = !ratingFilter || (affiliate.rating && affiliate.rating >= parseFloat(ratingFilter))
    const matchesRecommended = !recommendedFilter || affiliate.recommended

    return matchesCity && matchesSearch && matchesCategory && matchesRating && matchesRecommended
  })

  const categories = Array.from(new Set(affiliates.map(a => a.category).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {language === 'es' ? 'Ubicaciones' : 'Locations'}
            </h1>
            <p className="text-gray-600">
              {language === 'es' 
                ? 'Descubre negocios locales con descuentos exclusivos usando tu eLocalPass'
                : 'Discover local businesses with exclusive discounts using your eLocalPass'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Navigation */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'es' ? 'Selecciona una ciudad:' : 'Select a city:'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/locations/${city.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">{city.displayName}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {affiliates.filter(a => {
                    const affiliateCity = a.city?.toLowerCase() || ''
                    const cityName = city.name.toLowerCase()
                    return affiliateCity.includes(cityName) || 
                           (cityName === 'cancun' && affiliateCity.includes('cancún')) ||
                           (cityName === 'playa del carmen' && affiliateCity.includes('playa del carmen')) ||
                           (cityName === 'isla mujeres' && affiliateCity.includes('isla mujeres')) ||
                           (cityName === 'puerto morelos' && affiliateCity.includes('puerto morelos')) ||
                           (cityName === 'tulum' && affiliateCity.includes('tulum'))
                  }).length} 
                  {language === 'es' ? ' negocios' : ' businesses'}
                </p>
              </Link>
            ))}
          </div>
        </div>

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
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'es' 
                  ? `${filteredAffiliates.length} negocios encontrados`
                  : `${filteredAffiliates.length} businesses found`
                }
              </h3>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Map className="w-4 h-4 inline mr-2" />
                  {language === 'es' ? 'Ver mapa' : 'View map'}
                </button>
              </div>
            </div>

            {/* Affiliate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAffiliates.map((affiliate) => (
                <div key={affiliate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Logo/Image */}
                  <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    {affiliate.logo ? (
                      <img 
                        src={affiliate.logo} 
                        alt={affiliate.name}
                        className="h-full w-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <MapPin className="w-12 h-12 mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{affiliate.name}</h3>
                      {affiliate.recommended && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {language === 'es' ? 'Recomendado' : 'Recommended'}
                        </span>
                      )}
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
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {affiliate.description}
                      </p>
                    )}

                    {affiliate.discount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-900">
                          {language === 'es' ? 'Descuento:' : 'Discount:'} {affiliate.discount}
                        </p>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2">
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

                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
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
        )}
      </div>
    </div>
  )
} 