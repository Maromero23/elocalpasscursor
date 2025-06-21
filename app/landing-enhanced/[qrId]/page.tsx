'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EnhancedLandingPageTemplate } from '../../../components/enhanced-landing-page-template'

// Remove problematic server directives that cause render errors

interface QRConfigData {
  id: string
  businessName: string
  logoUrl?: string
  
  // Main Header Text with Typography
  headerText: string
  headerTextColor?: string
  headerFontFamily?: string
  headerFontSize?: string
  
  // Description Text with Typography
  descriptionText: string
  descriptionTextColor?: string
  descriptionFontFamily?: string
  descriptionFontSize?: string
  
  // CTA Button Text with Typography
  ctaButtonText: string
  ctaButtonTextColor?: string
  ctaButtonFontFamily?: string
  ctaButtonFontSize?: string
  
  // Form Title Text with Typography
  formTitleText?: string
  formTitleTextColor?: string
  formTitleFontFamily?: string
  formTitleFontSize?: string
  
  // Form Instructions Text with Typography
  formInstructionsText?: string
  formInstructionsTextColor?: string
  formInstructionsFontFamily?: string
  formInstructionsFontSize?: string
  
  // Footer Disclaimer Text with Typography
  footerDisclaimerText?: string
  footerDisclaimerTextColor?: string
  footerDisclaimerFontFamily?: string
  footerDisclaimerFontSize?: string
  
  // Brand Colors
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // Individual Box Colors
  guestSelectionBoxColor?: string
  daySelectionBoxColor?: string
  footerDisclaimerBoxColor?: string
  
  // QR Configuration Rules from Button 1
  allowCustomGuests: boolean
  defaultGuests: number
  maxGuests: number
  allowCustomDays: boolean
  defaultDays: number
  maxDays: number
}

export default function EnhancedLandingPage() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [configData, setConfigData] = useState<QRConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add simple cache-busting log
  useEffect(() => {
    console.log('🔄 Enhanced Landing - Page loaded with force-dynamic and revalidate=0')
  }, [])

  // Get urlId from URL parameters immediately (synchronously)
  const [urlId, setUrlId] = useState<string | null>(() => {
    // Initialize urlId immediately on component mount
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const urlIdParam = searchParams.get('urlId')
      console.log('🔍 Enhanced Landing - URL ID from query (IMMEDIATE):', urlIdParam)
      return urlIdParam
    }
    return null
  })

  useEffect(() => {
    if (qrId) {
      console.log('🔄 Enhanced Landing - Fetching data with qrId:', qrId, 'urlId:', urlId)
      try {
        fetchQRConfigData()
      } catch (error) {
        console.error('🚨 Enhanced Landing - Critical error in useEffect:', error)
        setError('Critical error loading page')
        setLoading(false)
      }
    }
  }, [qrId]) // Remove urlId dependency to prevent double-fetch

  const fetchQRConfigData = async () => {
    try {
      console.log('🔍 Enhanced Landing Page - Fetching QR config for ID:', qrId)
      console.log('🔍 Enhanced Landing Page - URL ID:', urlId)
      
      // First try to load from database
      try {
        // Add cache-busting timestamp to prevent stale data
        const timestamp = Date.now()
        const cacheBreaker = `t=${timestamp}&cb=${Math.random()}`
        console.log('🔄 Enhanced Landing - Fetching with cache breaker:', cacheBreaker)
        const dbResponse = await fetch(`/api/landing-page/config/${qrId}?${cacheBreaker}`, {
          cache: 'no-store', // Force fresh data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (dbResponse.ok) {
          const dbConfig = await dbResponse.json()
          console.log('✅ Enhanced Landing - Loaded config from database:', dbConfig)
          console.log('🔍 Enhanced Landing - landingPageConfig structure:', dbConfig.landingPageConfig)
          console.log('🔍 Enhanced Landing - temporaryUrls array:', dbConfig.landingPageConfig?.temporaryUrls)
          
          // Check for URL-specific customizations first
          let landingConfig = dbConfig.landingPageConfig
          
          if (urlId) {
            console.log('🔍 Enhanced Landing - Looking for URL-specific content for urlId:', urlId)
            console.log('🔍 Enhanced Landing - urlId type:', typeof urlId)
            console.log('🔍 Enhanced Landing - urlId length:', urlId.length)
            
            // Check for URL-specific customizations in temporaryUrls array (NEW CORRECT STRUCTURE)
            if (dbConfig.landingPageConfig?.temporaryUrls) {
              console.log('🔍 Enhanced Landing - Available URL IDs in temporaryUrls:', 
                dbConfig.landingPageConfig.temporaryUrls.map((url: any) => url.id))
              const urlEntry = dbConfig.landingPageConfig.temporaryUrls.find((url: any) => url.id === urlId)
              if (urlEntry?.customizations) {
                landingConfig = urlEntry.customizations
                console.log('✅ Enhanced Landing - Using URL-specific customizations from temporaryUrls for URL:', urlId)
                console.log('✅ Enhanced Landing - Customizations loaded:', urlEntry.customizations)
              } else {
                console.log('⚠️ Enhanced Landing - No customizations found in temporaryUrls for URL:', urlId)
              }
            }
            
            // Fallback: Check legacy structures if new structure doesn't have data
            if (!landingConfig || landingConfig === dbConfig.landingPageConfig) {
              if (dbConfig.landingPageConfig?.templates?.landingPage?.urlCustomContent?.[urlId]) {
                landingConfig = dbConfig.landingPageConfig.templates.landingPage.urlCustomContent[urlId]
                console.log('✅ Enhanced Landing - Using URL-specific content from legacy templates structure for URL:', urlId)
              }
              else if (dbConfig.templates?.landingPage?.urlCustomContent?.[urlId]) {
                landingConfig = dbConfig.templates.landingPage.urlCustomContent[urlId]
                console.log('✅ Enhanced Landing - Using URL-specific content from legacy structure for URL:', urlId)
              }
              else {
                console.log('⚠️ Enhanced Landing - No URL-specific content found for URL:', urlId, '- using general config')
              }
            }
          }
          
          // Use landingPageConfig from database (either general or URL-specific)
          if (landingConfig) {
            console.log('✅ Enhanced Landing - Using landing page config:', landingConfig)
            
            setConfigData({
              id: qrId,
              businessName: landingConfig.businessName || 'Elocalpass Business',
              logoUrl: landingConfig.logoUrl,
              
              // Header Text with Typography
              headerText: landingConfig.headerText || 'Welcome to Our Business',
              headerTextColor: landingConfig.headerTextColor,
              headerFontFamily: landingConfig.headerFontFamily,
              headerFontSize: landingConfig.headerFontSize,
              
              // Description Text with Typography
              descriptionText: landingConfig.descriptionText || 'Experience our amazing services',
              descriptionTextColor: landingConfig.descriptionTextColor,
              descriptionFontFamily: landingConfig.descriptionFontFamily,
              descriptionFontSize: landingConfig.descriptionFontSize,
              
              // CTA Button Text with Typography
              ctaButtonText: landingConfig.ctaButtonText || 'Get Started',
              ctaButtonTextColor: landingConfig.ctaButtonTextColor,
              ctaButtonFontFamily: landingConfig.ctaButtonFontFamily,
              ctaButtonFontSize: landingConfig.ctaButtonFontSize,
              
              // Form Title Text with Typography
              formTitleText: landingConfig.formTitleText,
              formTitleTextColor: landingConfig.formTitleTextColor,
              formTitleFontFamily: landingConfig.formTitleFontFamily,
              formTitleFontSize: landingConfig.formTitleFontSize,
              
              // Form Instructions Text with Typography
              formInstructionsText: landingConfig.formInstructionsText,
              formInstructionsTextColor: landingConfig.formInstructionsTextColor,
              formInstructionsFontFamily: landingConfig.formInstructionsFontFamily,
              formInstructionsFontSize: landingConfig.formInstructionsFontSize,
              
              // Footer Disclaimer Text with Typography
              footerDisclaimerText: landingConfig.footerDisclaimerText,
              footerDisclaimerTextColor: landingConfig.footerDisclaimerTextColor,
              footerDisclaimerFontFamily: landingConfig.footerDisclaimerFontFamily,
              footerDisclaimerFontSize: landingConfig.footerDisclaimerFontSize,
              
              // Brand Colors
              primaryColor: landingConfig.primaryColor || '#3b82f6',
              secondaryColor: landingConfig.secondaryColor || '#6366f1',
              backgroundColor: landingConfig.backgroundColor || '#ffffff',
              
              // Individual Box Colors
              guestSelectionBoxColor: landingConfig.guestSelectionBoxColor,
              daySelectionBoxColor: landingConfig.daySelectionBoxColor,
              footerDisclaimerBoxColor: landingConfig.footerDisclaimerBoxColor,
              
              // QR Configuration Rules from parent config - Use Button 1 values
              allowCustomGuests: dbConfig.config?.button1GuestsAllowCustom ?? true,
              defaultGuests: dbConfig.config?.button1GuestsDefault ?? 2,
              maxGuests: dbConfig.config?.button1GuestsMax ?? 10,
              allowCustomDays: dbConfig.config?.button1DaysAllowCustom ?? true,
              defaultDays: dbConfig.config?.button1DaysDefault ?? 3,
              maxDays: dbConfig.config?.button1DaysMax ?? 10
            })
            
            setLoading(false)
            return
          }
        } else {
          console.log('⚠️ Enhanced Landing - Database config not found, status:', dbResponse.status)
          console.log('⚠️ Enhanced Landing - Response text:', await dbResponse.text())
        }
      } catch (dbError) {
        console.error('⚠️ Enhanced Landing - Database error:', dbError)
      }
      
      // Fallback to qrConfigurations Map API
      console.log('📡 Enhanced Landing - Falling back to qrConfigurations Map API for qrId:', qrId)
      const response = await fetch(`/api/qr-config/${qrId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Enhanced Landing - Received config data from Map:', data)
        console.log('🖼️ Enhanced Landing - Logo URL:', data.logoUrl)
        setConfigData(data)
      } else {
        console.error('❌ Enhanced Landing - API response not ok:', response.status, response.statusText)
        throw new Error('Failed to fetch configuration')
      }
    } catch (error) {
      console.error('💥 Enhanced Landing - Error fetching QR config:', error)
      setError('Failed to load landing page configuration')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your landing page...</p>
        </div>
      </div>
    )
  }

  if (error || !configData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Landing Page Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested landing page could not be found.'}</p>
          <p className="text-sm text-gray-500">QR ID: {qrId}</p>
        </div>
      </div>
    )
  }

  return (
    <EnhancedLandingPageTemplate
      qrConfigId={configData.id}
      businessName={configData.businessName}
      logoUrl={configData.logoUrl}
      
      // Header Text with Typography
      headerText={configData.headerText}
      headerTextColor={configData.headerTextColor}
      headerFontFamily={configData.headerFontFamily}
      headerFontSize={configData.headerFontSize}
      
      // Description Text with Typography
      descriptionText={configData.descriptionText}
      descriptionTextColor={configData.descriptionTextColor}
      descriptionFontFamily={configData.descriptionFontFamily}
      descriptionFontSize={configData.descriptionFontSize}
      
      // CTA Button Text with Typography
      ctaButtonText={configData.ctaButtonText}
      ctaButtonTextColor={configData.ctaButtonTextColor}
      ctaButtonFontFamily={configData.ctaButtonFontFamily}
      ctaButtonFontSize={configData.ctaButtonFontSize}
      
      // Form Title Text with Typography
      formTitleText={configData.formTitleText}
      formTitleTextColor={configData.formTitleTextColor}
      formTitleFontFamily={configData.formTitleFontFamily}
      formTitleFontSize={configData.formTitleFontSize}
      
      // Form Instructions Text with Typography
      formInstructionsText={configData.formInstructionsText}
      formInstructionsTextColor={configData.formInstructionsTextColor}
      formInstructionsFontFamily={configData.formInstructionsFontFamily}
      formInstructionsFontSize={configData.formInstructionsFontSize}
      
      // Footer Disclaimer Text with Typography
      footerDisclaimerText={configData.footerDisclaimerText}
      footerDisclaimerTextColor={configData.footerDisclaimerTextColor}
      footerDisclaimerFontFamily={configData.footerDisclaimerFontFamily}
      footerDisclaimerFontSize={configData.footerDisclaimerFontSize}
      
      // Brand Colors
      primaryColor={configData.primaryColor}
      secondaryColor={configData.secondaryColor}
      backgroundColor={configData.backgroundColor}
      
      // Individual Box Colors
      guestSelectionBoxColor={configData.guestSelectionBoxColor}
      daySelectionBoxColor={configData.daySelectionBoxColor}
      footerDisclaimerBoxColor={configData.footerDisclaimerBoxColor}
      
      // QR Configuration Rules
      allowCustomGuests={configData.allowCustomGuests}
      defaultGuests={configData.defaultGuests}
      maxGuests={configData.maxGuests}
      allowCustomDays={configData.allowCustomDays}
      defaultDays={configData.defaultDays}
      maxDays={configData.maxDays}
    />
  )
}
