import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { qrConfigurations } from '../../../../../lib/qr-storage'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { qrId, configData } = await request.json()
    
    if (!qrId || !configData) {
      return NextResponse.json({ error: 'QR ID and config data are required' }, { status: 400 })
    }
    
    // Get existing config from Map or create new one
    const existingConfig = qrConfigurations.get(qrId) || {}
    
    // Update the Map with the new landing page configuration
    const updatedConfig = {
      ...existingConfig,
      qrId,
      businessName: configData.businessName || existingConfig.businessName || 'Unknown Business',
      logoUrl: configData.logoUrl || existingConfig.logoUrl || '',
      
      // Header Text with Typography
      headerText: configData.headerText || existingConfig.headerText || 'Welcome',
      headerTextColor: configData.headerTextColor || existingConfig.headerTextColor || '#000',
      headerFontFamily: configData.headerFontFamily || existingConfig.headerFontFamily || 'Arial',
      headerFontSize: configData.headerFontSize || existingConfig.headerFontSize || '24px',
      
      // Description Text with Typography
      descriptionText: configData.descriptionText || existingConfig.descriptionText || 'Please fill out the form',
      descriptionTextColor: configData.descriptionTextColor || existingConfig.descriptionTextColor || '#666',
      descriptionFontFamily: configData.descriptionFontFamily || existingConfig.descriptionFontFamily || 'Arial',
      descriptionFontSize: configData.descriptionFontSize || existingConfig.descriptionFontSize || '18px',
      
      // CTA Button Text with Typography
      ctaButtonText: configData.ctaButtonText || existingConfig.ctaButtonText || 'Get Started',
      ctaButtonTextColor: configData.ctaButtonTextColor || existingConfig.ctaButtonTextColor || '#fff',
      ctaButtonFontFamily: configData.ctaButtonFontFamily || existingConfig.ctaButtonFontFamily || 'Arial',
      ctaButtonFontSize: configData.ctaButtonFontSize || existingConfig.ctaButtonFontSize || '18px',
      
      // Form Title Text with Typography
      formTitleText: configData.formTitleText || existingConfig.formTitleText || 'Sign Up',
      formTitleTextColor: configData.formTitleTextColor || existingConfig.formTitleTextColor || '#000',
      formTitleFontFamily: configData.formTitleFontFamily || existingConfig.formTitleFontFamily || 'Arial',
      formTitleFontSize: configData.formTitleFontSize || existingConfig.formTitleFontSize || '24px',
      
      // Form Instructions Text with Typography
      formInstructionsText: configData.formInstructionsText || existingConfig.formInstructionsText || 'Please complete the form',
      formInstructionsTextColor: configData.formInstructionsTextColor || existingConfig.formInstructionsTextColor || '#666',
      formInstructionsFontFamily: configData.formInstructionsFontFamily || existingConfig.formInstructionsFontFamily || 'Arial',
      formInstructionsFontSize: configData.formInstructionsFontSize || existingConfig.formInstructionsFontSize || '18px',
      
      // Footer Disclaimer Text with Typography
      footerDisclaimerText: configData.footerDisclaimerText || existingConfig.footerDisclaimerText || 'Terms apply',
      footerDisclaimerTextColor: configData.footerDisclaimerTextColor || existingConfig.footerDisclaimerTextColor || '#666',
      footerDisclaimerFontFamily: configData.footerDisclaimerFontFamily || existingConfig.footerDisclaimerFontFamily || 'Arial',
      footerDisclaimerFontSize: configData.footerDisclaimerFontSize || existingConfig.footerDisclaimerFontSize || '14px',
      
      // Brand Colors
      primaryColor: configData.primaryColor || existingConfig.primaryColor || '#2563eb',
      secondaryColor: configData.secondaryColor || existingConfig.secondaryColor || '#f97316',
      backgroundColor: configData.backgroundColor || existingConfig.backgroundColor || '#ffffff',
      
      // Individual Box Colors
      guestSelectionBoxColor: configData.guestSelectionBoxColor || existingConfig.guestSelectionBoxColor || '#fff',
      daySelectionBoxColor: configData.daySelectionBoxColor || existingConfig.daySelectionBoxColor || '#fff',
      footerDisclaimerBoxColor: configData.footerDisclaimerBoxColor || existingConfig.footerDisclaimerBoxColor || '#fff',
      
      // QR Configuration Rules (preserve existing or use defaults)
      allowCustomGuests: configData.allowCustomGuests ?? existingConfig.allowCustomGuests ?? true,
      defaultGuests: configData.defaultGuests || existingConfig.defaultGuests || 2,
      maxGuests: configData.maxGuests || existingConfig.maxGuests || 6,
      allowCustomDays: configData.allowCustomDays ?? existingConfig.allowCustomDays ?? true,
      defaultDays: configData.defaultDays || existingConfig.defaultDays || 7,
      maxDays: configData.maxDays || existingConfig.maxDays || 30,
      
      // Update timestamp
      updatedAt: new Date().toISOString(),
      createdAt: existingConfig.createdAt || new Date().toISOString()
    }
    
    // Save to Map
    qrConfigurations.set(qrId, updatedConfig)
    
    console.log(`✅ Updated qrConfigurations Map for ${qrId}`)
    console.log(`📋 Map now has ${qrConfigurations.size} configurations`)
    console.log(`🔍 Updated config data:`, JSON.stringify(updatedConfig, null, 2))
    console.log(`🔍 Available Map keys:`, Array.from(qrConfigurations.keys()))
    
    return NextResponse.json({ 
      success: true, 
      message: 'QR configuration Map updated successfully',
      qrId 
    })
    
  } catch (error) {
    console.error('Error updating QR configuration Map:', error)
    return NextResponse.json(
      { error: 'Failed to update QR configuration Map' },
      { status: 500 }
    )
  }
} 