// Check what fields the default template actually has
const checkDefaultTemplateFields = async () => {
  try {
    console.log('🔧 Checking default template fields...')
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/admin/email-templates?isDefault=true')
    const result = await response.json()
    
    if (response.ok && result.templates && result.templates.length > 0) {
      const defaultTemplate = result.templates[0]
      console.log('✅ Default template found:', defaultTemplate.name)
      console.log('✅ All template fields:', Object.keys(defaultTemplate))
      console.log('✅ Template data:', JSON.stringify(defaultTemplate, null, 2))
    } else {
      console.log('❌ No default template found')
    }
  } catch (error) {
    console.error('❌ Error checking default template fields:', error)
  }
}

// Run the check
checkDefaultTemplateFields() 