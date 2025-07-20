// Create a proper default template with full emailConfig structure
const createProperDefaultTemplate = async () => {
  try {
    console.log('🔧 Creating proper default template...')
    
    // First, delete the old default template
    const deleteResponse = await fetch('https://elocalpasscursor.vercel.app/api/admin/email-templates?isDefault=true')
    const deleteResult = await deleteResponse.json()
    
    if (deleteResult.templates && deleteResult.templates.length > 0) {
      const oldTemplate = deleteResult.templates[0]
      console.log('🗑️ Deleting old default template:', oldTemplate.name)
      
      const deleteOldResponse = await fetch(`https://elocalpasscursor.vercel.app/api/admin/email-templates/${oldTemplate.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (deleteOldResponse.ok) {
        console.log('✅ Old default template deleted')
      } else {
        console.log('⚠️ Could not delete old template, continuing...')
      }
    }
    
    // Create new default template with full emailConfig structure
    const newDefaultTemplate = {
      name: 'Default Email Template',
      subject: 'Welcome to eLocalPass!',
      isDefault: true,
      emailConfig: {
        useDefaultEmail: true,
        
        // Email Header
        emailHeaderText: 'Welcome to eLocalPass!',
        emailHeaderColor: '#3b82f6',
        emailHeaderTextColor: '#ffffff',
        emailHeaderFontFamily: 'Arial, sans-serif',
        emailHeaderFontSize: '28',
        
        // Main Message
        emailMessageText: 'Congratulations! Starting today you will be able to pay like a local while on vacation with eLocalPass',
        emailMessageTextColor: '#374151',
        emailMessageFontFamily: 'Arial, sans-serif',
        emailMessageFontSize: '16',
        
        // CTA Button
        emailCtaText: 'View Your Pass',
        emailCtaTextColor: '#ffffff',
        emailCtaFontFamily: 'Arial, sans-serif',
        emailCtaFontSize: '18',
        emailCtaBackgroundColor: '#3b82f6',
        
        // Important Notice
        emailNoticeText: 'IMPORTANT: Remember to show your eLocalPass AT ARRIVAL to any of our affiliated establishments.',
        emailNoticeTextColor: '#dc2626',
        emailNoticeFontFamily: 'Arial, sans-serif',
        emailNoticeFontSize: '14',
        
        // Footer Message
        emailFooterText: 'Enjoy hundreds of discounts throughout your destination! Click below and discover all the benefits.',
        emailFooterTextColor: '#6b7280',
        emailFooterFontFamily: 'Arial, sans-serif',
        emailFooterFontSize: '14',
        
        // Brand Colors
        emailPrimaryColor: '#3b82f6',
        emailSecondaryColor: '#f97316',
        emailBackgroundColor: '#ffffff',
        
        // Media Content
        logoUrl: '',
        bannerImages: [],
        newBannerUrl: '',
        videoUrl: '',
        
        // Affiliate Configuration
        enableLocationBasedAffiliates: true,
        selectedAffiliates: [],
        customAffiliateMessage: 'Discover amazing local discounts at these partner establishments:',
        
        // Advanced Options
        includeQRInEmail: false,
        emailAccountCreationUrl: 'https://elocalpass.com/create-account',
        customCssStyles: '',
        
        // Default Template Fields
        companyName: 'ELocalPass',
        defaultWelcomeMessage: 'Welcome to your local pass experience!'
      }
    }
    
    console.log('📝 Creating new default template with full structure...')
    console.log('📝 Template data:', JSON.stringify(newDefaultTemplate, null, 2))
    
    const createResponse = await fetch('https://elocalpasscursor.vercel.app/api/admin/email-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newDefaultTemplate)
    })
    
    const createResult = await createResponse.json()
    
    if (createResponse.ok) {
      console.log('✅ New default template created successfully!')
      console.log('✅ Template ID:', createResult.id)
    } else {
      console.log('❌ Failed to create default template:', createResult)
    }
    
  } catch (error) {
    console.error('❌ Error creating default template:', error)
  }
}

// Run the script
createProperDefaultTemplate() 