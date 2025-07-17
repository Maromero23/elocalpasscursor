'use client'

import Navigation from '../../components/Navigation'
import { MapPin } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

export default function LocationsPage() {
  const { language } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh]">
        <MapPin className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'es' ? 'Ubicaciones' : 'Locations'}
        </h1>
        <p className="text-gray-600 text-lg mb-4 max-w-xl text-center">
          {language === 'es'
            ? 'Selecciona una ciudad desde el menú de navegación arriba para ver los negocios afiliados.'
            : 'Select a city from the navigation menu above to view affiliate businesses.'}
        </p>
      </div>
    </div>
  )
} 