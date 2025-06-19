#!/usr/bin/env node

/**
 * Gmail App Password Test Script
 * 
 * This script tests if your Gmail App Password works correctly
 * Run: node test-gmail-app-password.js
 */

const nodemailer = require('nodemailer');

// Configuration - UPDATE THESE VALUES
const config = {
  EMAIL_USER: 'your-gmail@gmail.com',        // Replace with your Gmail address
  EMAIL_PASS: 'your-app-password-here',      // Replace with your 16-character App Password
  TEST_RECIPIENT: 'your-gmail@gmail.com'     // Replace with email to receive test
};

console.log('🧪 Testing Gmail App Password...\n');

async function testGmailAppPassword() {
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS
      }
    });

    console.log('✅ Transporter created');

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"ELocalPass Test" <${config.EMAIL_USER}>`,
      to: config.TEST_RECIPIENT,
      subject: '✅ Gmail App Password Test - SUCCESS',
      html: `
        <h2>🎉 Gmail App Password Test Successful!</h2>
        <p>Your Gmail App Password is working correctly.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>Email Service: Gmail</li>
          <li>From Address: ${config.EMAIL_USER}</li>
          <li>Test Time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can now use this configuration in your Vercel deployment.</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Check your inbox: ${config.TEST_RECIPIENT}`);
    
    console.log('\n🎯 Your Vercel Environment Variables:');
    console.log(`EMAIL_SERVICE=gmail`);
    console.log(`EMAIL_USER=${config.EMAIL_USER}`);
    console.log(`EMAIL_PASS=${config.EMAIL_PASS}`);
    console.log(`EMAIL_FROM_NAME=ELocalPass`);
    console.log(`EMAIL_FROM_ADDRESS=${config.EMAIL_USER}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Common solutions:');
      console.log('1. Make sure 2-Factor Authentication is enabled on your Google account');
      console.log('2. Generate a new App Password (16 characters)');
      console.log('3. Use the App Password, not your regular Gmail password');
      console.log('4. Remove spaces from the App Password or keep them as generated');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n🌐 Network error. Check your internet connection.');
    }
  }
}

// Run the test
testGmailAppPassword(); 