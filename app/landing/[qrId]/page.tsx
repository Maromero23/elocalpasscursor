'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LandingPageTemplate } from '../../../components/landing-page-template'

interface QRConfigData {
  id: string
  businessName: string
  logoUrl?: string
  headerText: string
  descriptionText: string
  ctaButtonText: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // QR Configuration Rules from Button 1
  allowCustomGuests: boolean
  defaultGuests: number
  maxGuests: number
  allowCustomDays: boolean
  defaultDays: number
  maxDays: number
}

export default function LandingPage() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [configData, setConfigData] = useState<QRConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qrId) {
      fetchQRConfigData()
    }
  }, [qrId])

  const fetchQRConfigData = async () => {
    try {
      // TODO: This will fetch the QR configuration based on the qrId
      // For now, using mock data that matches your screenshot
      const response = await fetch(`/api/qr-config/${qrId}`)
      
      if (!response.ok) {
        // If API doesn't exist yet, use mock data
        setConfigData({
          id: qrId,
          businessName: 'Club Viva',
          logoUrl: undefined,
          headerText: 'THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.',
          descriptionText: 'TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.',
          ctaButtonText: 'Get your eLocalPass now!',
          primaryColor: '#2563eb', // Blue
          secondaryColor: '#f97316', // Orange  
          backgroundColor: '#fef3f2',
          allowCustomGuests: true,
          defaultGuests: 2,
          maxGuests: 6,
          allowCustomDays: true,
          defaultDays: 7,
          maxDays: 30
        })
      } else {
        const data = await response.json()
        setConfigData(data)
      }
    } catch (err) {
      console.log('Using mock data - API not implemented yet')
      // Use mock data if API fails
      setConfigData({
        id: qrId,
        businessName: 'Club Viva',
        logoUrl: undefined,
        headerText: 'THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.',
        descriptionText: 'TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.',
        ctaButtonText: 'Get your eLocalPass now!',
        primaryColor: '#2563eb', // Blue
        secondaryColor: '#f97316', // Orange  
        backgroundColor: '#fef3f2',
        allowCustomGuests: true,
        defaultGuests: 2,
        maxGuests: 6,
        allowCustomDays: true,
        defaultDays: 7,
        maxDays: 30
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your eLocalPass registration...</p>
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

  if (!configData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <div className="bg-yellow-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-xl">?</span>
            </div>
            <h1 className="text-xl font-bold text-yellow-900 mb-2">Not Found</h1>
            <p className="text-yellow-700">This QR configuration is not valid or has expired.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LandingPageTemplate 
      qrConfigId={configData.id}
      businessName={configData.businessName}
      logoUrl={configData.logoUrl}
      headerText={configData.headerText}
      descriptionText={configData.descriptionText}
      ctaButtonText={configData.ctaButtonText}
      primaryColor={configData.primaryColor}
      secondaryColor={configData.secondaryColor}
      backgroundColor={configData.backgroundColor}
      allowCustomGuests={configData.allowCustomGuests}
      defaultGuests={configData.defaultGuests}
      maxGuests={configData.maxGuests}
      allowCustomDays={configData.allowCustomDays}
      defaultDays={configData.defaultDays}
      maxDays={configData.maxDays}
    />
  )
}
