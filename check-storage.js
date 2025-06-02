// Check localStorage for saved configurations
console.log('Checking localStorage for saved configurations...')

if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('elocalpass-saved-configurations')
  console.log('Raw saved data:', saved)
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      console.log('Parsed configurations:', parsed)
      console.log('Number of configs:', parsed.length)
    } catch (error) {
      console.error('Error parsing saved configurations:', error)
    }
  } else {
    console.log('No saved configurations found in localStorage')
  }
} else {
  console.log('localStorage not available')
}
