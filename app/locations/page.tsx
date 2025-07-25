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
  }, [])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch('/api/locations/affiliates?city=all-cities')
      const data = await response.json()
      setAffiliates(data.affiliates || [])
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertGoogleDriveUrl = (url: string) => {
    if (!url) return ''
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    return match ? `https://drive.google.com/uc?id=${match[1]}` : url
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
    router.push(`/locations/${currentUserCity}`)
  }

  const goToCity = (citySlug: string) => {
    setCurrentUserCity(citySlug)
    router.push(`/locations/${citySlug}`)
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
                  />
                ) : (
                  <MapPin className={`text-gray-400 ${isSmall ? 'w-8 h-8' : 'w-10 h-10'}`} />
                )}
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-12 pb-4">
        <div className="px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-full max-w-md relative">
              <input
                type="text"
                placeholder={language === 'es' ? 'Comienza tu búsqueda' : 'Start your search'}
                className="w-full px-4 py-3 bg-gray-100 rounded-full text-center text-gray-700 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cities Horizontal Menu */}
      <div className="py-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-6 px-4 pb-2">
            {cities.map((city) => (
              <div
                key={city.slug}
                onClick={() => goToCity(city.slug)}
                className="flex-shrink-0 text-center cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-700 font-medium">{city.name}</span>
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
              </h3>
              <p className="text-orange-100 text-sm">
                {language === 'es' 
                  ? 'Buscar ubicaciones cerca de ti' 
                  : 'Search locations near you'}
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
          title={language === 'es' ? 'Vistos recientemente' : 'Recently viewed'}
          items={getRandomAffiliates(8)}
          isSmall={true}
        />

        {/* Recommended Affiliates */}
        <HorizontalScrollSection
          title={language === 'es' ? 'Afiliados recomendados' : 'Recommended affiliates'}
          items={getRandomAffiliates(8, (affiliate) => affiliate.recommended === true)}
        />

        {/* Recommended Restaurants */}
        <HorizontalScrollSection
          title={language === 'es' ? 'Restaurantes recomendados' : 'Recommended restaurants'}
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('restaurant') || 
            affiliate.category?.toLowerCase().includes('restaurant'))
          )}
        />

        {/* Recommended Stores */}
        <HorizontalScrollSection
          title={language === 'es' ? 'Tiendas recomendadas' : 'Recommended stores'}
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('store') || 
            affiliate.category?.toLowerCase().includes('store') ||
            affiliate.type?.toLowerCase().includes('tienda'))
          )}
        />

        {/* Recommended Services */}
        <HorizontalScrollSection
          title={language === 'es' ? 'Servicios recomendados' : 'Recommended services'}
          items={getRandomAffiliates(8, (affiliate) => 
            Boolean(affiliate.type?.toLowerCase().includes('service') || 
            affiliate.category?.toLowerCase().includes('service') ||
            affiliate.type?.toLowerCase().includes('servicio'))
          )}
        />
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