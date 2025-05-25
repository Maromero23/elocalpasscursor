'use client'

import React, { useState } from 'react'
import { Calendar, Users, MapPin, Clock, CreditCard, Mail, Phone, Check } from 'lucide-react'

interface LandingPageTemplateProps {
  // QR Code Data
  qrData: {
    id: string
    sellerName: string
    locationName: string
    distributorName: string
    daysValid: number
    guestsAllowed: number
    expiresAt: string
    issuedAt: string
    clientName?: string
  }
  
  // Customization Data
  template: {
    id: string
    logoUrl?: string
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    headerText: string
    descriptionText: string
    ctaButtonText: string
    showPayPal: boolean
    showContactForm: boolean
    customCSS?: string
  }
  
  // Pricing Info
  pricing?: {
    amount: number
    currency: string
    description: string
  }
}

export function LandingPageTemplate({ qrData, template, pricing }: LandingPageTemplateProps) {
  const [formData, setFormData] = useState({
    clientName: qrData.clientName || '',
    email: '',
    phone: '',
    guests: qrData.guestsAllowed,
    specialRequests: ''
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/landing-page/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeId: qrData.id,
          formData
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
    
    setIsLoading(false)
  }

  const daysRemaining = Math.ceil((new Date(qrData.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Confirmado!</h1>
              <p className="text-gray-600 mb-6">
                Tu solicitud ha sido enviada exitosamente. Recibirás una confirmación por email con todos los detalles de tu eLocalPass.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Detalles de tu Pass:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Válido por:</span> {qrData.daysValid} días</p>
                  <p><span className="font-medium">Huéspedes:</span> {formData.guests} personas</p>
                  <p><span className="font-medium">Expira:</span> {new Date(qrData.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: template.backgroundColor,
        background: `linear-gradient(135deg, ${template.backgroundColor} 0%, ${template.secondaryColor}20 100%)`
      }}
    >
      {/* Custom CSS */}
      {template.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: template.customCSS }} />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {template.logoUrl ? (
                <img src={template.logoUrl} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: template.primaryColor }}
                >
                  eL
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: template.primaryColor }}>
                  eLocalPass
                </h1>
                <p className="text-sm text-gray-500">{qrData.locationName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Distribuidor</p>
              <p className="font-medium text-gray-900">{qrData.distributorName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {template.headerText}
                </h2>
                <p className="text-gray-600 mb-6">
                  {template.descriptionText}
                </p>

                {/* Pass Details */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Validez</p>
                      <p className="text-sm text-gray-600">{qrData.daysValid} días • {daysRemaining} días restantes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Huéspedes</p>
                      <p className="text-sm text-gray-600">Hasta {qrData.guestsAllowed} personas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">Ubicación</p>
                      <p className="text-sm text-gray-600">{qrData.locationName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Expira</p>
                      <p className="text-sm text-gray-600">{new Date(qrData.expiresAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                {pricing && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">Precio</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                          ${pricing.amount} {pricing.currency}
                        </p>
                        <p className="text-sm text-gray-600">{pricing.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Confirma tu Pass</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+52 123 456 7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Huéspedes
                  </label>
                  <select
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: qrData.guestsAllowed }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>

                {template.showContactForm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Solicitudes Especiales
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="¿Alguna solicitud especial?"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors"
                  style={{ backgroundColor: template.primaryColor }}
                >
                  {isLoading ? 'Procesando...' : template.ctaButtonText}
                </button>

                {/* PayPal Integration */}
                {template.showPayPal && pricing && (
                  <div className="mt-4 pt-4 border-t">
                    <div id="paypal-button-container" className="w-full">
                      {/* PayPal buttons would be rendered here */}
                      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                        PayPal Payment Integration
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Powered by <span style={{ color: template.primaryColor }} className="font-medium">eLocalPass</span>
            </p>
            <p className="text-xs mt-1">
              Pass ID: {qrData.id} • Vendido por: {qrData.sellerName}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
