'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { LandingPageTemplate } from '../../../../components/landing-page-template'

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

export default function CustomLandingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const qrId = params.qrId as string
  const urlId = searchParams.get('urlId')  // Get URL ID from query params
  
  const [configData, setConfigData] = useState<QRConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qrId) {
      fetchQRConfigData()
    }
  }, [qrId, urlId])  // Re-fetch when urlId changes

  const fetchQRConfigData = async () => {
    try {
      // Load saved configurations from localStorage - CUSTOM LANDING PAGE VERSION
      const savedConfigsData = localStorage.getItem('elocalpass-saved-configurations')
      console.log('🔍 Custom Landing Page Route - qrId:', qrId)
      console.log('🔍 Raw saved configs data:', savedConfigsData)
      
      if (savedConfigsData) {
        const savedConfigs = JSON.parse(savedConfigsData)
        console.log('🔍 Parsed saved configs:', savedConfigs)
        
        const foundConfig = savedConfigs.find((config: any) => config.id === qrId)
        console.log('🔍 Found config for qrId:', foundConfig)
        console.log('🔍 URL ID from query:', urlId)
        console.log('🔍 Config templates structure:', foundConfig?.templates)
        console.log('🔍 Landing page template:', foundConfig?.templates?.landingPage)
        console.log('🔍 URL custom content:', foundConfig?.templates?.landingPage?.urlCustomContent)
        console.log('🔍 Specific URL content:', urlId ? foundConfig?.templates?.landingPage?.urlCustomContent?.[urlId] : 'No URL ID provided')
        
        // Check for URL-specific custom content first
        let customContent = null
        if (foundConfig && urlId && foundConfig.templates?.landingPage?.urlCustomContent?.[urlId]) {
          customContent = foundConfig.templates.landingPage.urlCustomContent[urlId]
          console.log('🔍 Using URL-specific custom content for URL:', urlId)
        } else if (foundConfig && foundConfig.templates?.landingPage?.customContent) {
          customContent = foundConfig.templates.landingPage.customContent
          console.log('🔍 Using fallback config-level custom content')
        }
        
        if (foundConfig && customContent) {
          console.log('🔍 Custom landing page content found:', customContent)
          console.log('🔍 businessName:', customContent.businessName)
          console.log('🔍 headerText:', customContent.headerText) 
          console.log('🔍 descriptionText:', customContent.descriptionText)
          
          setConfigData({
            id: qrId,
            businessName: customContent.businessName || 'Elocalpass Business',
            logoUrl: customContent.logoUrl,
            headerText: customContent.headerText || 'Welcome to Our Business',
            descriptionText: customContent.descriptionText || 'Experience our amazing services',
            ctaButtonText: customContent.ctaButtonText || 'Get Started',
            primaryColor: customContent.primaryColor || '#3b82f6',
            secondaryColor: customContent.secondaryColor || '#6366f1',
            backgroundColor: customContent.backgroundColor || '#f8fafc',
            
            // Configuration rules from parent config
            allowCustomGuests: foundConfig.config?.allowCustomGuests ?? true,
            defaultGuests: foundConfig.config?.defaultGuests ?? 2,
            maxGuests: foundConfig.config?.maxGuests ?? 10,
            allowCustomDays: foundConfig.config?.allowCustomDays ?? true,
            defaultDays: foundConfig.config?.defaultDays ?? 3,
            maxDays: foundConfig.config?.maxDays ?? 10
          })
          
          setLoading(false)
          return
        } else {
          console.log('❌ No custom content found!')
          console.log('🔍 foundConfig:', foundConfig)
          console.log('🔍 templates:', foundConfig?.templates)
          console.log('🔍 landingPage:', foundConfig?.templates?.landingPage)
          console.log('🔍 customContent:', foundConfig?.templates?.landingPage?.customContent)
        }
      }
      
      // Fallback to API if no saved config found
      console.log('📡 Falling back to API call for qrId:', qrId)
      const response = await fetch(`/api/qr-config/${qrId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch QR configuration')
      }
      
      const data = await response.json()
      setConfigData(data)
      
    } catch (err) {
      console.error('Error loading QR config:', err)
      
      // Fallback to default configuration
      setConfigData({
        id: qrId,
        businessName: 'Elocalpass Business',
        headerText: 'Welcome to Our Business',
        descriptionText: 'Experience our amazing services with exclusive local pass benefits',
        ctaButtonText: 'Get Started',
        primaryColor: '#3b82f6',
        secondaryColor: '#6366f1',
        backgroundColor: '#f8fafc',
        allowCustomGuests: true,
        defaultGuests: 2,
        maxGuests: 10,
        allowCustomDays: true,
        defaultDays: 3,
        maxDays: 10
      })
      
      setError('Using default configuration')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your custom experience...</p>
        </div>
      </div>
    )
  }

  if (!configData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Configuration</h1>
          <p className="mt-2 text-gray-600">Could not load QR configuration for ID: {qrId}</p>
        </div>
      </div>
    )
  }

  return (
    <LandingPageTemplate
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
      qrConfigId={qrId}
    />
  )
}
