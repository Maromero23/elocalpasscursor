"use client"

import { useState, useEffect } from "react"
import { Building2, Mail, LogIn, AlertCircle } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"

export default function AffiliateLogin() {
  const { notifications, removeToast, success, error } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [pwaInstallStatus, setPwaInstallStatus] = useState<'checking' | 'browser' | 'pwa'>('checking')

  useEffect(() => {
    // Enhanced PWA detection
    const checkPWAStatus = () => {
      if (typeof window === 'undefined') return
      
      const isStandalone = Boolean((navigator as any).standalone) || 
                          (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
      const hasNoReferrer = !document.referrer || !document.referrer.includes('safari')
      const isPWA = isStandalone && hasNoReferrer
      
      if (isPWA) {
        setPwaInstallStatus('pwa')
        console.log('✅ PWA MODE DETECTED - Camera permissions should persist!')
      } else {
        setPwaInstallStatus('browser')
        console.log('❌ BROWSER MODE DETECTED - Camera permissions will reset!')
      }
    }

    // Check immediately and after a delay
    checkPWAStatus()
    setTimeout(checkPWAStatus, 1000)

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handlePWAInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') {
        success('PWA Installed!', 'App added to home screen')
      }
      setInstallPrompt(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      console.log('🔐 LOGIN: Starting login process for', email.toLowerCase().trim())
      
      const response = await fetch('/api/affiliate/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const result = await response.json()
      console.log('🌐 LOGIN: Login API response status:', response.status)

      if (result.success) {
        console.log('✅ LOGIN: Login successful for', result.affiliate.name)
        console.log('   - Session token received:', result.sessionToken ? `${result.sessionToken.substring(0, 8)}...` : 'NO TOKEN')
        
        success('Login Successful!', `Welcome ${result.affiliate.name}`)
        
        // Store session backup in localStorage for persistence across restarts
        if (result.sessionToken) {
          console.log('💾 LOGIN: Storing session backup in localStorage...')
          localStorage.setItem('affiliate-session-backup', result.sessionToken)
          localStorage.setItem('affiliate-email', result.affiliate.email)
          localStorage.setItem('affiliate-name', result.affiliate.name)
          console.log('💾 LOGIN: Session backup stored successfully')
          console.log('   - Token:', `${result.sessionToken.substring(0, 8)}...${result.sessionToken.substring(result.sessionToken.length - 8)}`)
          console.log('   - Email:', result.affiliate.email)
          console.log('   - Name:', result.affiliate.name)
          
          // Verify storage worked
          const storedToken = localStorage.getItem('affiliate-session-backup')
          const storedEmail = localStorage.getItem('affiliate-email')
          console.log('🔍 LOGIN: Verification - Token stored:', storedToken ? `${storedToken.substring(0, 8)}...` : 'FAILED')
          console.log('🔍 LOGIN: Verification - Email stored:', storedEmail || 'FAILED')
        } else {
          console.log('⚠️ LOGIN: WARNING - No session token received from server!')
        }
        
        // For PWA compatibility, check if we're in standalone mode
        const isStandalone = (navigator as any).standalone || 
                           (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
        console.log('📱 LOGIN: PWA Mode detected:', isStandalone ? 'YES' : 'NO')
        
        if (isStandalone) {
          // If in standalone mode, redirect within the PWA to avoid breaking out to Safari
          console.log('🔄 LOGIN: Redirecting within PWA to /affiliate')
          window.location.replace('/affiliate')
        } else {
          // If in browser mode, use regular redirect
          console.log('🔄 LOGIN: Redirecting in browser to /affiliate')
          window.location.href = '/affiliate'
        }
      } else {
        console.log('❌ LOGIN: Login failed:', result.error)
        error('Login Failed', result.error || 'Authentication failed')
      }

    } catch (err) {
      console.error('💥 LOGIN: Login error:', err)
      error('Login Failed', 'Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ELocalPass Affiliate Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your business dashboard to scan customer QR codes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Business Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your.business@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Information</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">No Password Required</p>
                  <p>Simply enter your registered business email to access your dashboard.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Long-lasting Sessions</p>
                  <p>Stay logged in for 30 days across multiple devices.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">QR Code Scanning</p>
                  <p>Scan customer ELocalPass QR codes to apply discounts and track visits.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your ELocalPass administrator
            </p>
          </div>
        </div>
      </div>
      
      {/* Manual PWA Install Button for iOS */}
      {typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-purple-100 border-2 border-purple-400 rounded-lg p-4">
            <h3 className="text-lg font-bold text-purple-800 mb-2">📲 INSTALL AS PWA APP</h3>
            <p className="text-sm text-purple-700 mb-3">
              For persistent camera permissions, install as a PWA:
            </p>
            <div className="bg-white border border-purple-300 rounded p-3 mb-3">
              <p className="text-xs font-bold text-purple-800 mb-2">📋 MANUAL INSTALLATION:</p>
              <ol className="text-xs text-purple-700 space-y-1">
                <li>1. Tap Safari's <strong>Share button</strong> ⬇️</li>
                <li>2. Scroll down to <strong>"Add to Home Screen"</strong></li>
                <li>3. Change name to <strong>"ELocalPass Scanner"</strong></li>
                <li>4. Tap <strong>"Add"</strong></li>
                <li>5. Open from <strong>HOME SCREEN</strong> (not Safari!)</li>
              </ol>
            </div>
            <div className="text-xs text-purple-600">
              ⚠️ <strong>Note:</strong> iOS doesn't support automatic PWA installation. Must be done manually through Safari's Share menu.
            </div>
          </div>
        </div>
      )}
      
      {/* CRITICAL PWA STATUS WARNING - Show at top */}
      {pwaInstallStatus === 'browser' && (
        <div className="mb-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-red-50 border-4 border-red-500 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-800 mb-2">
                  🚨 USING SAFARI BROWSER
                </h2>
                <p className="text-sm text-red-700 font-medium mb-2">
                  This will cause camera permissions to reset constantly! You need to install as PWA.
                </p>
                <div className="bg-white border border-red-300 rounded p-3">
                  <p className="text-xs font-bold text-red-800 mb-2">🔧 IMMEDIATE FIX REQUIRED:</p>
                  <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                    <li><strong>Tap Share button</strong> (⬆️ at bottom of Safari)</li>
                    <li><strong>Scroll down</strong> and tap <strong>"Add to Home Screen"</strong></li>
                    <li><strong>Change name to "ELocalPass"</strong> and tap <strong>"Add"</strong></li>
                    <li><strong>IMPORTANT:</strong> Delete current app icon first if it exists</li>
                    <li><strong>Only open from home screen</strong> (never Safari!)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pwaInstallStatus === 'pwa' && (
        <div className="mb-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-800">
                  ✅ PWA MODE ACTIVE
                </h3>
                <p className="text-sm text-green-700">
                  Camera permissions should persist! You're ready to scan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced PWA Debug Info */}
      {typeof window !== 'undefined' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className={`${pwaInstallStatus === 'pwa' ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'} border-2 rounded-lg p-4`}>
            <p className="text-lg font-bold mb-2">
              {pwaInstallStatus === 'pwa' ? '✅ PWA STATUS: ACTIVE' : '❌ PWA STATUS: NOT INSTALLED'}
            </p>
            <div className="text-sm space-y-1">
              <p><strong>User Agent Check:</strong> {navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('CriOS') ? '🟡 Safari' : '🔵 Other Browser'}</p>
              <p><strong>Standalone Mode:</strong> {(navigator as any).standalone ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Display Mode:</strong> {window && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? '✅ Standalone' : '❌ Browser'}</p>
              <p><strong>Referrer Check:</strong> {document.referrer ? `🔍 ${document.referrer.substring(0, 50)}...` : '✅ None (good for PWA)'}</p>
              <p><strong>URL Parameters:</strong> {window.location.search || '(none)'}</p>
              
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="text-xs font-bold mb-1">🔧 INSTALLATION TEST:</p>
                <div className="space-y-1">
                  <div id="pwa-test-results" className="text-xs">
                    <button 
                      onClick={() => {
                        const resultsDiv = document.getElementById('pwa-test-results')
                        if (!resultsDiv) return
                        
                        // Test all PWA components
                        let results = []
                        
                        // 1. Service Worker Test
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.register('/sw.js')
                            .then(() => results.push('✅ Service Worker: OK'))
                            .catch(() => results.push('❌ Service Worker: Failed'))
                        } else {
                          results.push('❌ Service Worker: Not Supported')
                        }
                        
                        // 2. Manifest Test
                        fetch('/manifest.json')
                          .then(response => {
                            if (response.ok) {
                              results.push('✅ Manifest: Available')
                            } else {
                              results.push('❌ Manifest: HTTP ' + response.status)
                            }
                          })
                          .catch(() => results.push('❌ Manifest: Network Error'))
                        
                        // 3. PWA Detection
                        const standalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
                        results.push(standalone ? '✅ PWA Mode: Active' : '❌ PWA Mode: Browser Only')
                        
                        // 4. Camera API Test
                        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                          results.push('✅ Camera API: Available')
                        } else {
                          results.push('❌ Camera API: Not Available')
                        }
                        
                        // Update results after a delay to allow async operations
                        setTimeout(() => {
                          resultsDiv.innerHTML = `
                            <div class="text-xs space-y-1">
                              ${results.map(r => `<div>${r}</div>`).join('')}
                            </div>
                          `
                        }, 1000)
                        
                        resultsDiv.innerHTML = '<div class="text-xs">🔄 Testing...</div>'
                      }}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      🧪 Run PWA Test
                    </button>
                    <div className="text-xs mt-1">Click to test PWA components</div>
                  </div>
                </div>
              </div>
              
              {pwaInstallStatus === 'browser' && (
                <div className="mt-3 p-2 bg-red-50 border border-red-300 rounded">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠️ CAMERA PERMISSION PROBLEM:</p>
                  <p className="text-xs text-red-700">
                    Safari resets camera permissions on every page reload. Install as PWA to fix this permanently.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PWA Installation Guide - Show only if not in standalone mode */}
      {typeof window !== 'undefined' && !((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-800 mb-3">📱 FIX PWA INSTALLATION</h3>
            <div className="text-sm text-blue-700 space-y-2">
              
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                <p className="text-sm font-bold text-red-700">🔴 STEP 1: CHECK DEFAULT BROWSER</p>
                <p className="text-xs text-red-700 mt-1">
                  <strong>iPhone Settings → Safari → Default Browser App</strong><br/>
                  Must be set to <strong>"Safari"</strong> (not Chrome/Edge/etc.)
                </p>
              </div>

              <div className="bg-orange-100 border border-orange-300 rounded p-3 mb-3">
                <p className="text-sm font-bold text-orange-700">🟠 STEP 2: FRESH INSTALLATION</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs text-orange-700 mt-1">
                  <li>Delete current home screen icon</li>
                  <li>Force close ALL browser apps</li>
                  <li>Open Safari (not from bookmark!)</li>
                  <li>Type: elocalpasscursor.vercel.app/affiliate/login</li>
                  <li>Tap Share → "Add to Home Screen"</li>
                  <li>Name: "ELocalPass Scanner"</li>
                </ol>
              </div>

              <div className="bg-green-100 border border-green-300 rounded p-3">
                <p className="text-sm font-bold text-green-700">🟢 STEP 3: VERIFY SUCCESS</p>
                <p className="text-xs text-green-700 mt-1">
                  ✅ Long-press icon → shows "Delete App" (not "Delete Bookmark")<br/>
                  ✅ Opens with NO Safari address bar<br/>
                  ✅ Debug shows "PWA MODE ACTIVE"<br/>
                  ✅ Service Worker: Registered ✅<br/>
                  ✅ Manifest Available: Available ✅
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
      
      <ToastNotifications notifications={notifications} onRemove={removeToast} />
    </div>
  )
} 