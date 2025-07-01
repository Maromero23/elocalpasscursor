// Using native fetch (Node.js 18+)

async function testQStashIntegration() {
  console.log('🧪 Testing QStash Integration...');
  
  // Test environment variables
  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL;
  
  console.log('🔑 Environment Variables:');
  console.log(`  QSTASH_URL: ${qstashUrl || 'MISSING'}`);
  console.log(`  QSTASH_TOKEN: ${qstashToken ? 'SET (length: ' + qstashToken.length + ')' : 'MISSING'}`);
  
  if (!qstashToken) {
    console.log('❌ QSTASH_TOKEN is missing!');
    return;
  }
  
  // Test QStash API connectivity
  try {
    console.log('\n📡 Testing QStash API connectivity...');
    
    // Test a simple immediate message to our own endpoint
    const testPayload = {
      url: `https://elocalpasscursor.vercel.app/api/scheduled-qr/process-single`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer internal'
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    };
    
    // Try QStash V2 with proper URL format
    const targetUrl = 'https://elocalpasscursor.vercel.app/api/scheduled-qr/process-single';
    console.log(`🎯 Trying to publish to: ${targetUrl}`);
    
    const response = await fetch(`https://qstash.upstash.io/v2/publish/${targetUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qstashToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    });
    
    const responseText = await response.text();
    console.log(`📋 Response Status: ${response.status}`);
    console.log(`📋 Response Body: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ QStash API connectivity successful!');
      try {
        const data = JSON.parse(responseText);
        console.log(`🆔 Message ID: ${data.messageId}`);
      } catch (e) {
        console.log('📋 Response is not JSON:', responseText);
      }
    } else {
      console.log('❌ QStash API call failed!');
      console.log('🔍 This might be why scheduled QRs aren\'t working automatically');
    }
    
  } catch (error) {
    console.log('❌ QStash API test failed:', error.message);
  }
}

testQStashIntegration().catch(console.error); 