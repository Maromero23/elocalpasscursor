'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MapPin } from 'lucide-react'
import { Affiliate } from '../types/affiliate'
import { useTranslation } from '../contexts/LanguageContext'

interface GoogleMapProps {
  affiliates: Affiliate[]
  userLocation: { lat: number; lng: number } | null
  onAffiliateClick: (affiliate: Affiliate) => void
  selectedAffiliate: Affiliate | null
}

export default function GoogleMap({ affiliates, userLocation, onAffiliateClick, selectedAffiliate }: GoogleMapProps) {
  const { language } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        console.warn('Google Maps API key not configured. Map will not load.')
        return
      }

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places']
      })

      try {
        const google = await loader.load()
        
        if (!mapRef.current) return

        // Default center (Playa del Carmen)
        const defaultCenter = { lat: 20.6296, lng: -87.0739 }
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: userLocation || defaultCenter,
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        setMap(mapInstance)

        // Create info window
        const infoWindowInstance = new google.maps.InfoWindow()
        setInfoWindow(infoWindowInstance)

        // Add user location marker if available
        if (userLocation) {
          const userMarkerInstance = new google.maps.Marker({
            position: userLocation,
            map: mapInstance,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            },
            title: 'Your location'
          })
          setUserMarker(userMarkerInstance)
        }

        // Add affiliate markers
        const affiliateMarkers: google.maps.Marker[] = []
        
        affiliates.forEach((affiliate) => {
          if (affiliate.location) {
            const [lat, lng] = affiliate.location.split(',').map(coord => parseFloat(coord.trim()))
            
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = new google.maps.Marker({
                position: { lat, lng },
                map: mapInstance,
                title: affiliate.name,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: affiliate.recommended ? '#34A853' : '#FF6B35',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2
                }
              })

              // Create info window content
              const content = `
                <div style="padding: 8px; max-width: 200px;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${affiliate.name}</h3>
                  ${affiliate.category ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${affiliate.category}</p>` : ''}
                  ${affiliate.discount ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #34A853; font-weight: bold;">Discount: ${affiliate.discount}</p>` : ''}
                  ${affiliate.rating ? `<p style="margin: 0; font-size: 12px;">⭐ ${affiliate.rating}</p>` : ''}
                </div>
              `

              marker.addListener('click', () => {
                infoWindowInstance.setContent(content)
                infoWindowInstance.open(mapInstance, marker)
                onAffiliateClick(affiliate)
              })

              affiliateMarkers.push(marker)
            }
          }
        })

        setMarkers(affiliateMarkers)

        // Fit bounds to show all markers
        if (affiliateMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds()
          affiliateMarkers.forEach(marker => {
            bounds.extend(marker.getPosition()!)
          })
          if (userLocation) {
            bounds.extend(userLocation)
          }
          mapInstance.fitBounds(bounds)
        }

      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [])

  // Update markers when affiliates change
  useEffect(() => {
    if (!map || !infoWindow) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))

    const newMarkers: google.maps.Marker[] = []
    
    affiliates.forEach((affiliate) => {
      if (affiliate.location) {
        const [lat, lng] = affiliate.location.split(',').map(coord => parseFloat(coord.trim()))
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: affiliate.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: affiliate.recommended ? '#34A853' : '#FF6B35',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          })

          const content = `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${affiliate.name}</h3>
              ${affiliate.category ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${affiliate.category}</p>` : ''}
              ${affiliate.discount ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #34A853; font-weight: bold;">Discount: ${affiliate.discount}</p>` : ''}
              ${affiliate.rating ? `<p style="margin: 0; font-size: 12px;">⭐ ${affiliate.rating}</p>` : ''}
            </div>
          `

          marker.addListener('click', () => {
            infoWindow.setContent(content)
            infoWindow.open(map, marker)
            onAffiliateClick(affiliate)
          })

          newMarkers.push(marker)
        }
      }
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!)
      })
      if (userLocation) {
        bounds.extend(userLocation)
      }
      map.fitBounds(bounds)
    }
  }, [affiliates, map, infoWindow, userLocation, onAffiliateClick])

  // Highlight selected affiliate
  useEffect(() => {
    if (!map || !selectedAffiliate) return

    const selectedMarker = markers.find(marker => 
      marker.getTitle() === selectedAffiliate.name
    )

    if (selectedMarker) {
      map.panTo(selectedMarker.getPosition()!)
      map.setZoom(15)
    }
  }, [selectedAffiliate, markers, map])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'es' ? 'Mapa interactivo' : 'Interactive Map'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {language === 'es' 
              ? 'Visualiza la ubicación de todos los negocios afiliados'
              : 'View the location of all affiliate businesses'
            }
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>{language === 'es' ? 'Recomendados' : 'Recommended'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
              <span>{language === 'es' ? 'Otros' : 'Others'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
} 