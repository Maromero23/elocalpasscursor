// Test script to verify default template loading
const testDefaultTemplateLoading = async () => {
  try {
    console.log('🔧 Testing default template loading...')
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/admin/email-templates?isDefault=true')
    const result = await response.json()
    
    console.log('✅ Response status:', response.status)
    console.log('✅ Response data:', result)
    
    if (response.ok && result.templates && result.templates.length > 0) {
      const defaultTemplate = result.templates[0]
      console.log('✅ Default template found:', defaultTemplate.name)
      console.log('✅ Template has emailConfig:', !!defaultTemplate.emailConfig)
      
      if (defaultTemplate.emailConfig) {
        console.log('✅ Email config fields:', Object.keys(defaultTemplate.emailConfig))
      } else {
        console.log('❌ No emailConfig found in default template')
      }
    } else {
      console.log('❌ No default template found in database')
    }
  } catch (error) {
    console.error('❌ Error testing default template loading:', error)
  }
}

// Run the test
testDefaultTemplateLoading() 