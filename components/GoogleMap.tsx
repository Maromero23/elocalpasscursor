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
  hoveredAffiliate: string | null
}

export default function GoogleMap({ affiliates, userLocation, onAffiliateClick, selectedAffiliate, hoveredAffiliate }: GoogleMapProps) {
  const { language } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([])
  const [userMarker, setUserMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [pulseIntervals, setPulseIntervals] = useState<{ [key: string]: NodeJS.Timeout }>({})

  // Debug user location
  useEffect(() => {
    console.log('🗺️ GoogleMap received userLocation:', userLocation)
    if (userLocation) {
      console.log('📍 User location coordinates:', userLocation.lat, userLocation.lng)
    } else {
      console.log('❌ No user location available')
    }
  }, [userLocation])

  // Function to start pulsing animation for a marker
  const startPulsing = (marker: google.maps.marker.AdvancedMarkerElement, affiliateName: string) => {
    // Clear existing interval for this affiliate
    if (pulseIntervals[affiliateName]) {
      clearInterval(pulseIntervals[affiliateName])
    }
    
    let pulseCount = 0
    const interval = setInterval(() => {
      // Create pulsing effect by changing size
      const size = 32 + (pulseCount % 2 === 0 ? 8 : 0)
      const logoElement = marker.content as HTMLImageElement
      if (logoElement) {
        logoElement.style.width = `${size}px`
        logoElement.style.height = `${size}px`
      }
      pulseCount++
    }, 200) // Pulse every 200ms
    
    setPulseIntervals(prev => ({ ...prev, [affiliateName]: interval }))
  }

  // Function to stop pulsing animation for a marker
  const stopPulsing = (marker: google.maps.marker.AdvancedMarkerElement, affiliateName: string) => {
    if (pulseIntervals[affiliateName]) {
      clearInterval(pulseIntervals[affiliateName])
      setPulseIntervals(prev => {
        const newIntervals = { ...prev }
        delete newIntervals[affiliateName]
        return newIntervals
      })
    }
    
    // Reset to normal size
    const logoElement = marker.content as HTMLImageElement
    if (logoElement) {
      logoElement.style.width = '32px'
      logoElement.style.height = '32px'
    }
  }

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
          console.log('📍 Creating user location marker at:', userLocation)
          
          // Create blue dot for user location using AdvancedMarkerElement
          const userLocationElement = document.createElement('div')
          userLocationElement.style.width = '16px'
          userLocationElement.style.height = '16px'
          userLocationElement.style.borderRadius = '50%'
          userLocationElement.style.backgroundColor = '#4285F4'
          userLocationElement.style.border = '2px solid #FFFFFF'
          userLocationElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
          
          const userMarkerInstance = new google.maps.marker.AdvancedMarkerElement({
            position: userLocation,
            map: mapInstance,
            content: userLocationElement,
            title: 'Your location'
          })
          setUserMarker(userMarkerInstance)
          console.log('✅ User location marker created with AdvancedMarkerElement')
        } else {
          console.log('❌ No user location available')
        }

        // Add affiliate markers
        const affiliateMarkers: google.maps.marker.AdvancedMarkerElement[] = []
        
        affiliates.forEach((affiliate) => {
          if (affiliate.location) {
            const [lat, lng] = affiliate.location.split(',').map(coord => parseFloat(coord.trim()))
            
            if (!isNaN(lat) && !isNaN(lng)) {
              // Create logo element for affiliate marker
              const logoElement = document.createElement('img')
              logoElement.src = '/images/logo.png'
              logoElement.style.width = '32px'
              logoElement.style.height = '32px'
              logoElement.style.objectFit = 'contain'
              
              const marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat, lng },
                map: mapInstance,
                title: affiliate.name,
                content: logoElement
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
            bounds.extend(marker.position!)
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
    markers.forEach(marker => marker.map = null)

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []
    
    affiliates.forEach((affiliate) => {
      if (affiliate.location) {
        const [lat, lng] = affiliate.location.split(',').map(coord => parseFloat(coord.trim()))
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // Create logo element for affiliate marker
          const logoElement = document.createElement('img')
          logoElement.src = '/images/logo.png'
          logoElement.style.width = '32px'
          logoElement.style.height = '32px'
          logoElement.style.objectFit = 'contain'
          
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: affiliate.name,
            content: logoElement
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
            bounds.extend(marker.position!)
          })
          if (userLocation) {
            bounds.extend(userLocation)
          }
          map.fitBounds(bounds)
        }
  }, [affiliates, map, infoWindow, userLocation, onAffiliateClick])

  // Handle pulsing based on hovered and selected affiliates
  useEffect(() => {
    if (!map) return

    // Clear all existing pulse intervals
    Object.values(pulseIntervals).forEach(interval => clearInterval(interval))
    setPulseIntervals({})

    // Determine which affiliate should be pulsing
    const affiliateToPulse = hoveredAffiliate || (selectedAffiliate ? selectedAffiliate.name : null)
    
    if (affiliateToPulse) {
      const markerToPulse = markers.find(marker => 
        marker.title === affiliateToPulse
      )

      if (markerToPulse) {
        // Pan to marker if it's selected
        if (selectedAffiliate && selectedAffiliate.name === affiliateToPulse) {
          map.panTo(markerToPulse.position!)
          map.setZoom(15)
        }
        
        // Start pulsing
        startPulsing(markerToPulse, affiliateToPulse)
      }
    }
  }, [hoveredAffiliate, selectedAffiliate, markers, map])

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
              <img src="/images/logo.png" alt="ELocalPass" className="w-4 h-4 mr-1" />
              <span>{language === 'es' ? 'Negocios afiliados' : 'Affiliate businesses'}</span>
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