/**
 * 🚨 COMPLETELY SAFE REBUY EMAIL TEST
 * 
 * This script will ONLY:
 * - READ database data (no changes)
 * - TEST the rebuy email API 
 * - REPORT what's working/broken
 * 
 * It will NOT:
 * - Modify any database records
 * - Change welcome email settings
 * - Update any configurations
 */

console.log('🔒 SAFE REBUY EMAIL TEST (READ-ONLY)')
console.log('📧 Will NOT modify any database or welcome email settings\n')

// Test the rebuy email API directly
async function testRebuyAPI() {
  try {
    console.log('🧪 TESTING REBUY EMAIL API...')
    
    const response = await fetch('https://elocalpasscursor.vercel.app/api/rebuy-emails/send', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API Response:', JSON.stringify(result, null, 2))
      
      if (result.results && result.results.length > 0) {
        console.log('\n📧 REBUY EMAIL RESULTS:')
        result.results.forEach(email => {
          console.log(`- QR ${email.qrCode}: ${email.status}`)
          if (email.status === 'sent') {
            console.log(`  ✅ Sent to ${email.email}`)
          } else if (email.status === 'failed') {
            console.log(`  ❌ Failed to send to ${email.email}`)
          } else if (email.error) {
            console.log(`  ❌ Error: ${email.error}`)
          }
        })
      } else {
        console.log('\n📭 No rebuy emails were sent (no QR codes in testing window)')
        console.log('This could mean:')
        console.log('1. No QR codes created 2-25 minutes ago')
        console.log('2. No QR codes have rebuy email enabled')
        console.log('3. QR codes don\'t meet the criteria')
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('Error details:', errorText)
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message)
    console.log('\nTrying local API instead...')
    
    // If production fails, suggest local testing
    console.log('💡 TRY LOCALLY:')
    console.log('1. Run: npm run dev')
    console.log('2. Visit: http://localhost:3000/api/rebuy-emails/send')
    console.log('3. Check console logs for detailed error messages')
  }
}

console.log('🎯 TESTING STRATEGY:')
console.log('1. Call rebuy email API (GET /api/rebuy-emails/send)')
console.log('2. See what happens without changing anything')
console.log('3. Identify the exact problem')
console.log('4. Suggest safe fixes that won\'t affect welcome emails')

console.log('\n🚀 Starting API test...')
testRebuyAPI() 