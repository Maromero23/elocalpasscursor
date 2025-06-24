#!/usr/bin/env node

const https = require('https');

console.log('🧪 REBUY EMAIL SYSTEM TESTER');
console.log('============================');
console.log('This script will test the rebuy email service every minute for 5 minutes.');
console.log('');
console.log('Instructions:');
console.log('1. Go to: https://elocalpasscursor.vercel.app/seller');
console.log('2. Select a config with rebuy emails enabled (like "testing rebuy email now")');
console.log('3. Generate a QR code with DIRECT delivery method');
console.log('4. Use test email: jorgeruiz23@gmail.com');
console.log('5. This script will automatically check for rebuy emails every minute');
console.log('');

let testCount = 0;
const maxTests = 5;

function testRebuyService() {
  testCount++;
  const now = new Date();
  
  console.log(`[${now.toLocaleTimeString()}] 🔄 Test ${testCount}/${maxTests}: Checking rebuy email service...`);
  
  const options = {
    hostname: 'elocalpasscursor.vercel.app',
    path: '/api/rebuy-emails/send',
    method: 'GET',
    headers: {
      'User-Agent': 'RebuyEmailTester/1.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.success) {
          console.log(`[${now.toLocaleTimeString()}] ✅ Service responded successfully`);
          console.log(`[${now.toLocaleTimeString()}] 📊 Found ${result.totalFound} QR codes in testing window`);
          console.log(`[${now.toLocaleTimeString()}] 📧 Processed ${result.results.length} rebuy emails`);
          
          if (result.results.length > 0) {
            console.log(`[${now.toLocaleTimeString()}] 🎉 SUCCESS! Rebuy emails sent:`);
            result.results.forEach(email => {
              console.log(`[${now.toLocaleTimeString()}]    - ${email.email}: ${email.status} (QR: ${email.qrCode})`);
            });
          } else {
            console.log(`[${now.toLocaleTimeString()}] ⏳ No rebuy emails sent yet. Keep waiting...`);
          }
        } else {
          console.log(`[${now.toLocaleTimeString()}] ❌ Service error: ${result.error}`);
        }
      } catch (error) {
        console.log(`[${now.toLocaleTimeString()}] ❌ Failed to parse response: ${error.message}`);
        console.log(`[${now.toLocaleTimeString()}] Raw response: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`[${now.toLocaleTimeString()}] ❌ Request failed: ${error.message}`);
  });

  req.end();
}

// Run the first test immediately
testRebuyService();

// Then run every 60 seconds for 5 times total
const interval = setInterval(() => {
  if (testCount >= maxTests) {
    console.log('');
    console.log('🏁 Testing completed!');
    console.log('If no rebuy emails were sent, make sure:');
    console.log('1. You created a QR code with a configuration that has rebuy emails enabled');
    console.log('2. You used the DIRECT delivery method');
    console.log('3. The QR code was created at least 2 minutes ago');
    console.log('4. The customer email was provided');
    clearInterval(interval);
    process.exit(0);
  } else {
    testRebuyService();
  }
}, 60000); // 60 seconds

console.log(`[${new Date().toLocaleTimeString()}] ⏰ Next test in 60 seconds...`); 