// Clear Button 4 localStorage for testing
console.log('Clearing Button 4 localStorage...')

// Clear Button 4 specific items
localStorage.removeItem('elocalpass-button4-config')
localStorage.removeItem('elocalpass-welcome-email-config')

console.log('Button 4 localStorage cleared!')
console.log('Current localStorage items:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  if (key && key.includes('button4') || key && key.includes('welcome')) {
    console.log(`${key}: ${localStorage.getItem(key)}`)
  }
} 