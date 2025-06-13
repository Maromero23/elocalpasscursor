import { NextRequest, NextResponse } from 'next/server'
import { qrConfigurations } from '../../../../lib/qr-storage'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } }
) {
  try {
    const { qrId } = params

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR ID is required' },
        { status: 400 }
      )
    }

    // Get QR configurations from storage
    console.log(`🔍 Looking for QR config: ${qrId}`)
    console.log(`📋 Available configs:`, Array.from(qrConfigurations.keys()))
    console.log(`🗂️ Total stored configs: ${qrConfigurations.size}`)
    
    const storedConfig = qrConfigurations.get(qrId)
    console.log(`🔍 Raw stored config for ${qrId}:`, storedConfig ? 'FOUND' : 'NOT FOUND')
    
    if (storedConfig) {
      console.log(`✅ Found stored config for ${qrId}:`, JSON.stringify(storedConfig, null, 2))
      
      const qrConfig: QRConfigData = {
        id: qrId,
        businessName: storedConfig.businessName,
        logoUrl: storedConfig.logoUrl || '',
        headerText: storedConfig.headerText,
        headerTextColor: storedConfig.headerTextColor,
        headerFontFamily: storedConfig.headerFontFamily,
        headerFontSize: storedConfig.headerFontSize,
        descriptionText: storedConfig.descriptionText,
        descriptionTextColor: storedConfig.descriptionTextColor,
        descriptionFontFamily: storedConfig.descriptionFontFamily,
        descriptionFontSize: storedConfig.descriptionFontSize,
        ctaButtonText: storedConfig.ctaButtonText,
        ctaButtonTextColor: storedConfig.ctaButtonTextColor,
        ctaButtonFontFamily: storedConfig.ctaButtonFontFamily,
        ctaButtonFontSize: storedConfig.ctaButtonFontSize,
        formTitleText: storedConfig.formTitleText,
        formTitleTextColor: storedConfig.formTitleTextColor,
        formTitleFontFamily: storedConfig.formTitleFontFamily,
        formTitleFontSize: storedConfig.formTitleFontSize,
        formInstructionsText: storedConfig.formInstructionsText,
        formInstructionsTextColor: storedConfig.formInstructionsTextColor,
        formInstructionsFontFamily: storedConfig.formInstructionsFontFamily,
        formInstructionsFontSize: storedConfig.formInstructionsFontSize,
        footerDisclaimerText: storedConfig.footerDisclaimerText,
        footerDisclaimerTextColor: storedConfig.footerDisclaimerTextColor,
        footerDisclaimerFontFamily: storedConfig.footerDisclaimerFontFamily,
        footerDisclaimerFontSize: storedConfig.footerDisclaimerFontSize,
        primaryColor: storedConfig.primaryColor,
        secondaryColor: storedConfig.secondaryColor,
        backgroundColor: storedConfig.backgroundColor,
        guestSelectionBoxColor: storedConfig.guestSelectionBoxColor,
        daySelectionBoxColor: storedConfig.daySelectionBoxColor,
        footerDisclaimerBoxColor: storedConfig.footerDisclaimerBoxColor,
        allowCustomGuests: storedConfig.allowCustomGuests,
        defaultGuests: storedConfig.defaultGuests,
        maxGuests: storedConfig.maxGuests,
        allowCustomDays: storedConfig.allowCustomDays,
        defaultDays: storedConfig.defaultDays,
        maxDays: storedConfig.maxDays
      }

      console.log(`✅ Found stored QR config: ${qrId}`)
      return NextResponse.json(qrConfig)
    }

    // Fallback to mock data for testing
    console.log(`⚠️ No stored config found for ${qrId}, using mock data`)
    
    const mockData: QRConfigData = {
      id: qrId,
      businessName: 'Club Viva',
      logoUrl: undefined,
      headerText: 'THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.',
      headerTextColor: '#000',
      headerFontFamily: 'Arial',
      headerFontSize: '24px',
      descriptionText: 'TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.',
      descriptionTextColor: '#666',
      descriptionFontFamily: 'Arial',
      descriptionFontSize: '18px',
      ctaButtonText: 'Get your eLocalPass now!',
      ctaButtonTextColor: '#fff',
      ctaButtonFontFamily: 'Arial',
      ctaButtonFontSize: '18px',
      formTitleText: 'Sign up for your eLocalPass',
      formTitleTextColor: '#000',
      formTitleFontFamily: 'Arial',
      formTitleFontSize: '24px',
      formInstructionsText: 'Please fill out the form below to receive your eLocalPass',
      formInstructionsTextColor: '#666',
      formInstructionsFontFamily: 'Arial',
      formInstructionsFontSize: '18px',
      footerDisclaimerText: 'By signing up, you agree to our terms and conditions',
      footerDisclaimerTextColor: '#666',
      footerDisclaimerFontFamily: 'Arial',
      footerDisclaimerFontSize: '14px',
      primaryColor: '#2563eb', // Blue
      secondaryColor: '#f97316', // Orange  
      backgroundColor: '#fef3f2',
      guestSelectionBoxColor: '#fff',
      daySelectionBoxColor: '#fff',
      footerDisclaimerBoxColor: '#fff',
      allowCustomGuests: true,
      defaultGuests: 2,
      maxGuests: 6,
      allowCustomDays: true,
      defaultDays: 7,
      maxDays: 30
    }

    return NextResponse.json(mockData)
    
  } catch (error) {
    console.error('Error fetching QR configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR configuration' },
      { status: 500 }
    )
  }
}
