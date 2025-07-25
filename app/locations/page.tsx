'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { MapPin, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Affiliate {
  id: string
  name: string
  logo?: string
  rating?: number
  discount?: string
  description?: string
  city?: string
  category?: string
  type?: string
  recommended?: boolean
}

export default function ExplorePage() {
  const { language } = useTranslation()
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserCity, setCurrentUserCity] = useState('playa-del-carmen')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  // Available cities
  const cities = [
    { slug: 'bacalar', name: 'Bacalar', image: '/images/bacalar_large.png' },
    { slug: 'cancun', name: 'Cancún', image: '/images/cancun_icon.png' },
    { slug: 'cozumel', name: 'Cozumel', image: '/images/cozumel_icon.png' },
    { slug: 'holbox', name: 'Holbox', image: '/images/holbox_icon.png' },
    { slug: 'isla-mujeres', name: 'Isla Mujeres', image: '/images/isla_mujeres_icon.png' },
    { slug: 'playa-del-carmen', name: 'Playa del Carmen', image: '/images/playa_del_carmen_icon.png' },
    { slug: 'puerto-aventuras', name: 'Puerto Aventuras', image: '/images/puerto_aventuras_icon.png' },
    { slug: 'puerto-morelos', name: 'Puerto Morelos', image: '/images/puerto_morelos_icon.png' },
    { slug: 'tulum', name: 'Tulum', image: '/images/tulum_icon.png' }
  ]

  useEffect(() => {
    fetchAffiliates()
  }, [selectedCity])

  const fetchAffiliates = async () => {
    try {
      // Convert city slug to proper city name for API
      const slugToCityName = {
        'bacalar': 'Bacalar',
        'cancun': 'Cancun',
        'cozumel': 'Cozumel',
        'holbox': 'Holbox',
        'isla-mujeres': 'Isla Mujeres',
        'playa-del-carmen': 'Playa del Carmen',
        'puerto-aventuras': 'Puerto Aventuras',
        'puerto-morelos': 'Puerto Morelos',
        'tulum': 'Tulum'
      }
      
      const cityParam = selectedCity 
        ? (slugToCityName[selectedCity as keyof typeof slugToCityName] || selectedCity)
        : 'all-cities'
      
      const response = await fetch(`/api/locations/affiliates?city=${cityParam}`)
      const data = await response.json()
      setAffiliates(data.affiliates || [])
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getRandomAffiliates = (count: number, filterFn?: (affiliate: Affiliate) => boolean) => {
    let filtered = affiliates
    if (filterFn) {
      filtered = affiliates.filter(filterFn)
    }
    const shuffled = [...filtered].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const goToMap = () => {
    const cityToUse = selectedCity || currentUserCity
    router.push(`/locations/${cityToUse}`)
  }

  const goToCity = (citySlug: string) => {
    setSelectedCity(citySlug)
    setCurrentUserCity(citySlug)
    setLoading(true)
  }

  const HorizontalScrollSection = ({ 
    title, 
    items, 
    isSmall = false 
  }: { 
    title: string
    items: Affiliate[]
    isSmall?: boolean 
  }) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4">{title}</h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 px-4 pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
                isSmall ? 'w-48' : 'w-64'
              }`}
            >
              <div className={`relative bg-gray-100 flex items-center justify-center ${
                isSmall ? 'h-32' : 'h-40'
              }`}>
                {item.logo ? (
                  <img
                    src={convertGoogleDriveUrl(item.logo)}
                    alt={item.name}
                    className={`object-contain rounded-lg ${
                      isSmall ? 'w-24 h-24' : 'w-32 h-32'
                    }`}
                    style={{ borderRadius: '8px' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-gray-400 ${item.logo ? 'hidden' : ''}`}>
                  <MapPin className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'}`} />
                </div>
                <div className="absolute top-2 right-2">
                  <Heart className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`font-medium text-gray-900 line-clamp-2 ${
                    isSmall ? 'text-sm' : 'text-base'
                  }`}>
                    {item.name}
                  </h3>
                  {item.rating && (
                    <div className="flex items-center ml-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {item.rating}
                      </span>
                    </div>
                  )}
                </div>
                {item.city && (
                  <p className="text-xs text-gray-500 mb-1">{item.city}</p>
                )}
                {item.discount && (
                  <div className="text-sm font-semibold text-orange-600">
                    {item.discount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Cities Menu */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-6 px-4 pb-2">
            {/* All Cities Option */}
            <div
              onClick={() => {
                setSelectedCity(null)
                setLoading(true)
              }}
              className="flex-shrink-0 text-center cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 ${
                selectedCity === null 
                  ? 'bg-orange-100 border-orange-500' 
                  : 'bg-gray-100 border-transparent'
              }`}>
                <MapPin className="w-8 h-8 text-gray-600" />
              </div>
              <span className={`text-xs font-medium ${
                selectedCity === null 
                  ? 'text-orange-600' 
                  : 'text-gray-700'
              }`}>
                {language === 'es' ? 'Todas' : 'All'}
              </span>
            </div>
            
            {cities.map((city) => (
              <div
                key={city.slug}
                onClick={() => goToCity(city.slug)}
                className="flex-shrink-0 text-center cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 ${
                  selectedCity === city.slug 
                    ? 'bg-orange-100 border-orange-500' 
                    : 'bg-gray-100 border-transparent'
                }`}>
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className={`text-xs font-medium ${
                  selectedCity === city.slug 
                    ? 'text-orange-600' 
                    : 'text-gray-700'
                }`}>
                  {city.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Go to Map Section */}
      <div className="px-4 mb-8">
        <div
          onClick={goToMap}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer shadow-lg"
        >
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                {language === 'es' ? 'Ir al mapa' : 'Go to map'}
                {selectedCity && (
                  <span className="text-orange-100 font-normal">
                    {' '}- {cities.find(c => c.slug === selectedCity)?.name}
                  </span>
                )}
              </h3>
              <p className="text-orange-100 text-sm">
                {selectedCity 
                  ? (language === 'es' 
                      ? `Buscar ubicaciones en ${cities.find(c => c.slug === selectedCity)?.name}` 
                      : `Search locations in ${cities.find(c => c.slug === selectedCity)?.name}`)
                  : (language === 'es' 
                      ? 'Buscar ubicaciones cerca de ti' 
                      : 'Search locations near you')
                }
              </p>
            </div>
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Horizontal Recommendation Sections */}
      <div className="pb-20">
        {/* Recently Viewed Affiliates (smaller) */}
        <HorizontalScrollSection
          title={selectedCity 
            ? (language === 'es' 
                ? `Vistos recientemente en ${cities.find(c => c.slug === selectedCity)?.name}` 
                : `Recently viewed in ${cities.find(c => c.slug === selectedCity)?.name}`)
            : (language === 'es' ? 'Vistos recientemente' : 'Recently viewed')
          }
          items={getRandomAffiliates(8)}
          isSmall={true}
        />

        {/* Recommended Affiliates */}
        <HorizontalScrollSection
          title={selectedCity 
            ? (language === 'es' 
                ? `Afiliados recomendados en ${cities.find(c => c.slug === selectedCity)?.name}` 
                : `Recommended affiliates in ${cities.find(c => c.slug === selectedCity)?.name}`)
            : (language === 'es' ? 'Afiliados recomendados' : 'Recommended affiliates')
          }
          items={getRandomAffiliates(8, (affiliate) => affiliate.recommended === true)}
        />

        {/* Recommended Restaurants */}
        <HorizontalScrollSection
          title={selectedCity 
            ? (language === 'es' 
                ? `Restaurantes en ${cities.find(c => c.slug === selectedCity)?.name}` 
                : `Restaurants in ${cities.find(c => c.slug === selectedCity)?.name}`)
            : (language === 'es' ? 'Restaurantes recomendados' : 'Recommended restaurants')
          }
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('restaurant') || 
            affiliate.category?.toLowerCase().includes('restaurant'))
          )}
        />

        {/* Recommended Stores */}
        <HorizontalScrollSection
          title={selectedCity 
            ? (language === 'es' 
                ? `Tiendas en ${cities.find(c => c.slug === selectedCity)?.name}` 
                : `Stores in ${cities.find(c => c.slug === selectedCity)?.name}`)
            : (language === 'es' ? 'Tiendas recomendadas' : 'Recommended stores')
          }
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('store') || 
            affiliate.category?.toLowerCase().includes('store') ||
            affiliate.type?.toLowerCase().includes('tienda'))
          )}
        />

        {/* Recommended Services */}
        <HorizontalScrollSection
          title={selectedCity 
            ? (language === 'es' 
                ? `Servicios en ${cities.find(c => c.slug === selectedCity)?.name}` 
                : `Services in ${cities.find(c => c.slug === selectedCity)?.name}`)
            : (language === 'es' ? 'Servicios recomendados' : 'Recommended services')
          }
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('service') || 
            affiliate.category?.toLowerCase().includes('service') ||
            affiliate.type?.toLowerCase().includes('servicio'))
          )}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-4 py-2">
          <button 
            className="flex flex-col items-center py-2 px-3 text-red-600"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span className="text-xs font-medium">Explore</span>
          </button>
          <button className="flex flex-col items-center py-2 px-3 text-gray-600">
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

      {/* Bottom Navigation Space */}
      <div className="h-20"></div>
    </div>
  )
}

// Hide scrollbar utility
const style = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = style
  document.head.appendChild(styleSheet)
} 