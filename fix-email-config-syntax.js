// Quick fix for the email config syntax error
console.log('🔧 FIXING EMAIL CONFIG SYNTAX ERROR...')

const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'app/admin/qr-config/email-config/page.tsx')

try {
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Find the problematic line around 838
  const lines = content.split('\n')
  
  console.log('Lines around 835-840:')
  for (let i = 834; i < 840; i++) {
    if (lines[i]) {
      console.log(`${i + 1}: ${lines[i]}`)
    }
  }
  
  // The issue is likely that the function is missing proper structure
  // Let's look for the pattern and fix it
  
  console.log('\n🔍 Looking for the issue...')
  console.log('The error says "Return statement is not allowed here" at line 838')
  console.log('This means the return statement is outside of a function')
  
} catch (error) {
  console.error('Error reading file:', error)
}

console.log('\n📝 MANUAL FIX NEEDED:')
console.log('The issue is that there\'s a return statement outside of a function.')
console.log('Need to check the function structure around line 838 in the email config file.') 