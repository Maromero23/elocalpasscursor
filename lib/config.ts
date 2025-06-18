// Production configuration for ELocalPass
export const config = {
  // Base URLs
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'
    : 'http://localhost:3003',
  
  customerPortalUrl: process.env.NODE_ENV === 'production'
    ? `${process.env.NEXTAUTH_URL || 'https://your-app.vercel.app'}/customer/access`
    : 'http://localhost:3000/customer/access',
  
  // Email configuration
  email: {
    from: process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@elocalpass.com',
    replyTo: process.env.REPLY_TO_EMAIL,
  },
  
  // QR Code settings
  qr: {
    size: 256,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
  },
  
  // Security
  security: {
    tokenExpiryDays: 30,
    maxLoginAttempts: 5,
  },
  
  // Features
  features: {
    emailEnabled: true,
    smsEnabled: false,
    analyticsEnabled: true,
    debugMode: process.env.NODE_ENV === 'development',
  },
}

// Helper functions
export const getFullUrl = (path: string) => {
  return `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export const getCustomerPortalUrl = (token: string) => {
  return `${config.customerPortalUrl}?token=${token}`
}

export const getLandingPageUrl = (configId: string, urlId: string) => {
  return getFullUrl(`/landing-enhanced/${configId}?urlId=${urlId}`)
}

export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
} 