'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EnhancedLandingPageTemplate } from '../../../components/enhanced-landing-page-template'

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

  useEffect(() => {
    if (qrId) {
      fetchQRConfigData()
    }
  }, [qrId])

  const fetchQRConfigData = async () => {
    try {
      console.log('🔍 Enhanced Landing Page - Fetching QR config for ID:', qrId)
      
      // First try to load from database
      try {
        const dbResponse = await fetch(`/api/admin/saved-configs/${qrId}`, {
          credentials: 'include'
        })
        
        if (dbResponse.ok) {
          const dbConfig = await dbResponse.json()
          console.log('✅ Enhanced Landing - Loaded config from database:', dbConfig)
          
          // Use landingPageConfig from database
          if (dbConfig.landingPageConfig) {
            const landingConfig = dbConfig.landingPageConfig
            console.log('✅ Enhanced Landing - Using database landing page config:', landingConfig)
            
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
              
              // QR Configuration Rules from parent config
              allowCustomGuests: dbConfig.config?.allowCustomGuests ?? true,
              defaultGuests: dbConfig.config?.defaultGuests ?? 2,
              maxGuests: dbConfig.config?.maxGuests ?? 10,
              allowCustomDays: dbConfig.config?.allowCustomDays ?? true,
              defaultDays: dbConfig.config?.defaultDays ?? 3,
              maxDays: dbConfig.config?.maxDays ?? 10
            })
            
            setLoading(false)
            return
          }
        } else {
          console.log('⚠️ Enhanced Landing - Database config not found, trying qrConfigurations Map')
        }
      } catch (dbError) {
        console.log('⚠️ Enhanced Landing - Database error, trying qrConfigurations Map:', dbError)
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
