#!/usr/bin/env node

// Pre-deployment check script for ELocalPass
const fs = require('fs')
const path = require('path')

console.log('🚀 ELocalPass Deployment Check\n')

const checks = []

// Check 1: Environment variables
console.log('1. Checking environment variables...')
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

const optionalEnvVars = [
  'EMAIL_HOST',
  'EMAIL_USER', 
  'EMAIL_PASS',
  'SENDGRID_API_KEY',
  'RESEND_API_KEY',
  'FROM_EMAIL'
]

let envMissing = []
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    envMissing.push(envVar)
  }
})

if (envMissing.length > 0) {
  console.log('❌ Missing required environment variables:')
  envMissing.forEach(env => console.log(`   - ${env}`))
  checks.push(false)
} else {
  console.log('✅ All required environment variables present')
  checks.push(true)
}

// Check email service configuration
let emailConfigured = false
if (process.env.SENDGRID_API_KEY) {
  console.log('✅ SendGrid email service configured')
  emailConfigured = true
} else if (process.env.RESEND_API_KEY) {
  console.log('✅ Resend email service configured')
  emailConfigured = true
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ SMTP email service configured')
  emailConfigured = true
} else {
  console.log('⚠️  No email service configured')
}

// Check 2: Required files
console.log('\n2. Checking required files...')
const requiredFiles = [
  'package.json',
  'next.config.js',
  'prisma/schema.prisma',
  'lib/auth.ts',
  'lib/prisma.ts'
]

let filesMissing = []
requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    filesMissing.push(file)
  }
})

if (filesMissing.length > 0) {
  console.log('❌ Missing required files:')
  filesMissing.forEach(file => console.log(`   - ${file}`))
  checks.push(false)
} else {
  console.log('✅ All required files present')
  checks.push(true)
}

// Check 3: Dependencies
console.log('\n3. Checking dependencies...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = [
    'next',
    'react',
    'prisma',
    '@prisma/client',
    'next-auth',
    'nodemailer'
  ]
  
  let depsMissing = []
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      depsMissing.push(dep)
    }
  })
  
  if (depsMissing.length > 0) {
    console.log('❌ Missing required dependencies:')
    depsMissing.forEach(dep => console.log(`   - ${dep}`))
    checks.push(false)
  } else {
    console.log('✅ All required dependencies present')
    checks.push(true)
  }
} catch (error) {
  console.log('❌ Could not read package.json')
  checks.push(false)
}

// Check 4: Build test
console.log('\n4. Testing build...')
try {
  const { execSync } = require('child_process')
  console.log('   Running: npm run build')
  execSync('npm run build', { stdio: 'pipe' })
  console.log('✅ Build successful')
  checks.push(true)
} catch (error) {
  console.log('❌ Build failed')
  console.log('   Error:', error.message.split('\n')[0])
  checks.push(false)
}

// Summary
console.log('\n📋 Deployment Check Summary')
console.log('=' .repeat(40))

const passed = checks.filter(Boolean).length
const total = checks.length

if (passed === total) {
  console.log('🎉 All checks passed! Ready for deployment.')
  console.log('\nNext steps:')
  console.log('1. Commit your changes: git add . && git commit -m "Ready for production"')
  console.log('2. Push to GitHub: git push origin main')
  console.log('3. Deploy to Vercel or your preferred platform')
  console.log('4. Configure environment variables in production')
  console.log('5. Run database migrations: npx prisma migrate deploy')
} else {
  console.log(`❌ ${total - passed} check(s) failed. Please fix issues before deploying.`)
  process.exit(1)
}

if (!emailConfigured) {
  console.log('\n⚠️  Warning: No email service configured. Emails will not be sent.')
  console.log('   Configure one of: SENDGRID_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASS')
} 