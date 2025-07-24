'use client'

import { X, Phone, Mail, Globe, MapPin, Star, Heart } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { Affiliate } from '../types/affiliate'

interface AffiliateModalProps {
  affiliate: Affiliate | null
  isOpen: boolean
  onClose: () => void
}

export default function AffiliateModal({ affiliate, isOpen, onClose }: AffiliateModalProps) {
  const { t, language } = useTranslation()

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

  if (!isOpen || !affiliate) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{affiliate.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Logo/Image */}
          {affiliate.logo && (
            <div className="mb-4">
              <img
                src={convertGoogleDriveUrl(affiliate.logo)}
                alt={affiliate.name}
                className="w-full h-48 object-cover rounded-xl"
                style={{ 
                  borderRadius: '12px',
                  minHeight: '192px',
                  maxHeight: '192px'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Rating and Recommended Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {affiliate.rating && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{affiliate.rating}</span>
                </div>
              )}
            </div>
            {affiliate.recommended && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {language === 'es' ? 'Recomendado' : 'Recommended'}
              </span>
            )}
          </div>

          {/* Category and Type */}
          <div className="mb-4">
            {affiliate.type && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{language === 'es' ? 'Tipo:' : 'Type:'}</span> {affiliate.type}
              </p>
            )}
            {affiliate.category && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">{language === 'es' ? 'Categoría:' : 'Category:'}</span> {affiliate.category}
              </p>
            )}
          </div>

          {/* Description */}
          {affiliate.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-700">{affiliate.description}</p>
            </div>
          )}

          {/* Discount */}
          {affiliate.discount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-900">
                {language === 'es' ? 'Descuento:' : 'Discount:'} {affiliate.discount}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3 mb-6">
            {affiliate.workPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{affiliate.workPhone}</span>
              </div>
            )}
            {affiliate.whatsApp && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>WhatsApp: {affiliate.whatsApp}</span>
              </div>
            )}
            {affiliate.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <a href={`mailto:${affiliate.email}`} className="text-blue-600 hover:underline">
                  {affiliate.email}
                </a>
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
            {affiliate.address && (
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{affiliate.address}</span>
              </div>
            )}
          </div>

          {/* Social Media */}
          {(affiliate.facebook || affiliate.instagram) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {language === 'es' ? 'Redes sociales' : 'Social Media'}
              </h3>
              <div className="flex space-x-3">
                {affiliate.facebook && (
                  <a
                    href={affiliate.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Facebook
                  </a>
                )}
                {affiliate.instagram && (
                  <a
                    href={affiliate.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800 transition-colors"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {affiliate.maps && (
              <a
                href={affiliate.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Ver en mapa' : 'View on map'}
              </a>
            )}
            <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Guardar' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 