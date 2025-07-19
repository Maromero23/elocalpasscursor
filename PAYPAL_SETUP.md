# PayPal Real Account Setup Guide

## 🔧 Environment Variables to Set in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

### **Required Variables:**
```
PAYPAL_CLIENT_ID=AeqfFZ7yqykc9zjN7G8DSyr4jGItsbstfofxSF96Q4J9ueJOFwTv2PLoiYwz0r0mkrm5FaG-DraVbJMz
PAYPAL_CLIENT_SECRET=YOUR_REAL_PAYPAL_CLIENT_SECRET
PAYPAL_BUSINESS_EMAIL=your-real-paypal-email@example.com
```

### **Optional Variables (if you have them):**
```
PAYPAL_WEBHOOK_ID=YOUR_WEBHOOK_ID
PAYPAL_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

## 📋 Steps to Complete Setup:

### **1. Get Your PayPal Client Secret**
1. Go to https://developer.paypal.com/
2. Log in with your real PayPal account
3. Go to "My Apps & Credentials"
4. Find your app and click "Show" next to Client Secret
5. Copy the secret

### **2. Update Business Email**
Replace `your-real-paypal-email@example.com` with your actual PayPal business email in:
- `components/PassSelectionModal.tsx` (line ~299)
- `app/test-paypal/page.tsx` (line ~27)

### **3. Set Up PayPal Webhooks (Optional but Recommended)**
1. Go to PayPal Developer Dashboard
2. Go to "Webhooks" section
3. Create a new webhook with URL: `https://elocalpasscursor.vercel.app/api/paypal/webhook`
4. Select events: `PAYMENT.CAPTURE.COMPLETED`
5. Copy the webhook ID and secret

### **4. Test the Integration**
1. Deploy the changes to Vercel
2. Go to https://elocalpasscursor.vercel.app/passes
3. Try a $1 day pass purchase
4. Complete the PayPal payment
5. Verify you get redirected back and receive welcome email

## ✅ What's Changed:
- ✅ PayPal URL: `sandbox.paypal.com` → `paypal.com`
- ✅ API URL: `api-m.sandbox.paypal.com` → `api-m.paypal.com`
- ✅ Pricing: $15 → $1 for testing
- ✅ Business email: Updated placeholder

## 🚨 Important Notes:
- **Real payments will be processed** - use $1 for testing
- **Webhooks will fire reliably** in production
- **Automatic redirects will work** properly
- **Welcome emails will be sent** after payment

## 🔍 Troubleshooting:
- If webhooks don't fire, check PayPal webhook logs
- If redirects don't work, check PayPal IPN settings
- If emails don't send, check email service configuration 