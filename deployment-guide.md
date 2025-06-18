# ELocalPass Live Deployment Guide

## 🚀 Option 1: Vercel Deployment (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account (free tier available)
3. Email service provider account (see Email Setup section)

### Steps:

#### 1. Prepare Repository
```bash
# Commit all changes
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your ELocalPass repository
5. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### 3. Environment Variables Setup
In Vercel dashboard, add these environment variables:

```env
# Database
DATABASE_URL="your-production-database-url"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Email Service (choose one)
# Option A: Gmail SMTP
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="your-app-password"

# Option B: SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"

# Option C: Resend
RESEND_API_KEY="your-resend-api-key"
```

## 📧 Email Service Setup

### Option A: Gmail SMTP (Free, Easy)
1. Enable 2FA on your Gmail account
2. Generate App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use credentials in environment variables

### Option B: SendGrid (Professional)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Verify sender identity
4. Free tier: 100 emails/day

### Option C: Resend (Modern, Developer-friendly)
1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add your domain
4. Free tier: 3,000 emails/month

## 🗄️ Database Setup

### Option A: PlanetScale (Recommended)
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Login and create database
pscale auth login
pscale database create elocalpass-prod

# Get connection string
pscale connect elocalpass-prod main --port 3309
```

### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MySQL database
4. Copy connection string

### Option C: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string

## 🔧 Code Updates for Production

### 1. Update Email Configuration
```typescript
// lib/email-config.ts
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}

// For SendGrid
export const sendGridConfig = {
  apiKey: process.env.SENDGRID_API_KEY,
  from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
}
```

### 2. Update Base URLs
```typescript
// lib/config.ts
export const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-app.vercel.app'
    : 'http://localhost:3003',
  
  customerPortalUrl: process.env.NODE_ENV === 'production'
    ? 'https://your-app.vercel.app/customer/access'
    : 'http://localhost:3000/customer/access',
}
```

## 🧪 Testing Plan

### Phase 1: Basic Email Testing
1. Deploy to staging environment
2. Test welcome email delivery
3. Test customer portal access
4. Test rebuy email scheduling

### Phase 2: Complete Flow Testing
1. Create landing page URL
2. Fill out form as customer
3. Verify email delivery
4. Test QR code download
5. Test customer portal functionality

### Phase 3: Multi-language Testing
1. Test Spanish browser → Spanish emails
2. Test English browser → English emails
3. Test other languages → English fallback

## 📋 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Email service configured and tested
- [ ] Domain/subdomain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] All API endpoints tested
- [ ] Error handling in place
- [ ] Logging configured

## 🔍 Monitoring & Debugging

### 1. Vercel Function Logs
- Check Vercel dashboard → Functions tab
- Monitor API response times
- Check for errors in email sending

### 2. Email Delivery Monitoring
```typescript
// Add to email sending functions
console.log(`📧 Email sent to: ${email}`);
console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
console.log(`📧 Timestamp: ${new Date().toISOString()}`);
```

### 3. Database Monitoring
- Monitor QR code creation
- Check customer access token generation
- Verify email scheduling

## 🚨 Common Issues & Solutions

### Email Not Sending
1. Check SMTP credentials
2. Verify firewall settings
3. Check spam folders
4. Verify sender authentication

### Database Connection Issues
1. Check connection string format
2. Verify SSL settings
3. Check IP whitelist

### CORS Issues
1. Update NEXTAUTH_URL
2. Check domain configuration
3. Verify API routes

## 📞 Support Contacts

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- SendGrid Support: [sendgrid.com/support](https://sendgrid.com/support)
- PlanetScale Support: [planetscale.com/support](https://planetscale.com/support) 