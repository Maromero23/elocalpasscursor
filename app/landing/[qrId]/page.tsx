'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LandingPageTemplate } from '../../../components/landing-page-template'

interface QRData {
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

interface TemplateData {
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

interface PricingData {
  amount: number
  currency: string
  description: string
}

export default function LandingPage() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qrId) {
      fetchLandingPageData()
    }
  }, [qrId])

  const fetchLandingPageData = async () => {
    try {
      const response = await fetch(`/api/landing-page/${qrId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load landing page data')
      }
      
      const data = await response.json()
      
      setQrData(data.qrData)
      setTemplate(data.template)
      setPricing(data.pricing)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your eLocalPass...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!qrData || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="bg-yellow-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-xl">?</span>
            </div>
            <h1 className="text-xl font-bold text-yellow-900 mb-2">Not Found</h1>
            <p className="text-yellow-700">This QR code is not valid or has expired.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LandingPageTemplate 
      qrData={qrData}
      template={template}
      pricing={pricing}
    />
  )
}
