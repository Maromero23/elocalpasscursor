// Debug script to check localStorage for button configurations
console.log('🔍 DEBUGGING localStorage FOR BUTTON CONFIGURATIONS:')

// Check Button 4
const button4Config = localStorage.getItem('elocalpass-button4-config')
console.log('Button 4 localStorage:', button4Config)
if (button4Config) {
  try {
    const parsed = JSON.parse(button4Config)
    console.log('Button 4 parsed:', parsed)
    console.log('Button 4 has choice:', !!parsed.choice)
    console.log('Button 4 choice value:', parsed.choice)
  } catch (error) {
    console.log('Button 4 parse error:', error)
  }
}

// Check Button 5
const button5Config = localStorage.getItem('elocalpass-button5-config')
console.log('Button 5 localStorage:', button5Config)
if (button5Config) {
  try {
    const parsed = JSON.parse(button5Config)
    console.log('Button 5 parsed:', parsed)
    console.log('Button 5 has choice:', !!parsed.choice)
    console.log('Button 5 choice value:', parsed.choice)
  } catch (error) {
    console.log('Button 5 parse error:', error)
  }
}

// Check Button 6
const button6Config = localStorage.getItem('elocalpass-button6-config')
console.log('Button 6 localStorage:', button6Config)
if (button6Config) {
  try {
    const parsed = JSON.parse(button6Config)
    console.log('Button 6 parsed:', parsed)
    console.log('Button 6 has choice:', !!parsed.choice)
    console.log('Button 6 choice value:', parsed.choice)
  } catch (error) {
    console.log('Button 6 parse error:', error)
  }
}

// Check welcome email config
const welcomeEmailConfig = localStorage.getItem('elocalpass-welcome-email-config')
console.log('Welcome Email localStorage:', welcomeEmailConfig ? 'EXISTS' : 'NOT FOUND')

// Check rebuy email config
const rebuyEmailConfig = localStorage.getItem('elocalpass-rebuy-email-config')
console.log('Rebuy Email localStorage:', rebuyEmailConfig ? 'EXISTS' : 'NOT FOUND')

console.log('�� DEBUG COMPLETE') 