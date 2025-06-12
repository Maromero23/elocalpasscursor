// Clear localStorage utility - Run in browser console
console.log('🧹 Clearing ELocalPass localStorage data...')

const keysToRemove = [
  'elocalpass-saved-configurations',
  'elocalpass-landing-templates', 
  'elocalpass-landing-config',
  'elocalpass-welcome-email-config',
  'elocalpass-rebuy-email-config',
  'elocalpass-current-qr-progress',
  'savedConfigurations',
  'landingPageUrls'
]

let cleared = 0
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key)
    cleared++
    console.log(`✅ Removed: ${key}`)
  }
})

console.log(`🎉 Cleared ${cleared} localStorage items`)
console.log('✨ Ready for database-first QR configurations!')
