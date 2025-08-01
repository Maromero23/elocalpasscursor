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
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null)
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
  const startPulsing = (marker: google.maps.Marker, affiliateName: string) => {
    // Clear existing interval for this affiliate
    if (pulseIntervals[affiliateName]) {
      clearInterval(pulseIntervals[affiliateName])
    }
    
    let pulseCount = 0
    const interval = setInterval(() => {
      // Create pulsing effect by changing size
      const size = 32 + (pulseCount % 2 === 0 ? 8 : 0)
      marker.setIcon({
        url: '/images/logo.png',
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size/2, size/2)
      })
      pulseCount++
    }, 200) // Pulse every 200ms
    
    setPulseIntervals(prev => ({ ...prev, [affiliateName]: interval }))
  }

  // Function to stop pulsing animation for a marker
  const stopPulsing = (marker: google.maps.Marker, affiliateName: string) => {
    if (pulseIntervals[affiliateName]) {
      clearInterval(pulseIntervals[affiliateName])
      setPulseIntervals(prev => {
        const newIntervals = { ...prev }
        delete newIntervals[affiliateName]
        return newIntervals
      })
    }
    
    // Reset to normal size
    marker.setIcon({
      url: '/images/logo.png',
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    })
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
          
          // Use a simple circle marker for better compatibility
          const userMarkerInstance = new google.maps.Marker({
            position: userLocation,
            map: mapInstance,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3
            },
            title: 'Your location',
            zIndex: 1000 // Ensure it's on top
          })
          setUserMarker(userMarkerInstance)
          console.log('✅ User location marker created with circle symbol')
        } else {
          console.log('❌ No user location available')
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
                  url: '/images/logo.png',
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16)
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
                url: '/images/logo.png',
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
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
  }, [affiliates, map, infoWindow, onAffiliateClick])

  // Handle user location updates
  useEffect(() => {
    if (!map || !userLocation) return

    console.log('🔄 Updating user location marker:', userLocation)
    
    // Remove existing user marker
    if (userMarker) {
      userMarker.setMap(null)
    }
    
    // Create new user marker
    const newUserMarker = new google.maps.Marker({
      position: userLocation,
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      title: 'Your location',
      zIndex: 1000
    })
    
    setUserMarker(newUserMarker)
    console.log('✅ User location marker updated')
    
  }, [userLocation, map])

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
        marker.getTitle() === affiliateToPulse
      )

      if (markerToPulse) {
        // Pan to marker if it's selected
        if (selectedAffiliate && selectedAffiliate.name === affiliateToPulse) {
          map.panTo(markerToPulse.getPosition()!)
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