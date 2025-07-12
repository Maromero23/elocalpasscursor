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

  useEffect(() => {
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
      const response = await fetch('/api/affiliate/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const result = await response.json()

      if (result.success) {
        success('Login Successful!', `Welcome ${result.affiliate.name}`)
        
        // Store session backup in localStorage for persistence across restarts
        if (result.sessionToken) {
          localStorage.setItem('affiliate-session-backup', result.sessionToken)
          localStorage.setItem('affiliate-email', result.affiliate.email)
          localStorage.setItem('affiliate-name', result.affiliate.name)
          console.log('💾 Session backup stored in localStorage')
        }
        
        // For PWA compatibility, check if we're in standalone mode
        const isStandalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
        
        if (isStandalone) {
          // If in standalone mode, redirect within the PWA to avoid breaking out to Safari
          window.location.replace('/affiliate')
        } else {
          // If in browser mode, use regular redirect
          window.location.href = '/affiliate'
        }
      } else {
        error('Login Failed', result.error || 'Authentication failed')
      }

    } catch (err) {
      console.error('Login error:', err)
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
      
      {/* PWA Debug Info - Show current app mode */}
      {typeof window !== 'undefined' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
            <p className="text-lg font-bold text-yellow-800 mb-2">🔧 PWA DEBUG INFO</p>
            <div className="text-sm space-y-1">
              <p><strong>Is iOS:</strong> {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
              <p><strong>Standalone Mode:</strong> {(navigator as any).standalone ? 'Yes' : 'No'}</p>
              <p><strong>Display Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</p>
              <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}</p>
              <p><strong>SW Registration:</strong> <span id="sw-status">Checking...</span></p>
              <p><strong>Manifest Available:</strong> <span id="manifest-status">Checking...</span></p>
              <p><strong>Install Prompt Available:</strong> {installPrompt ? 'Yes ✅' : 'No (iOS doesn\'t support auto-install)'}</p>
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>Referrer:</strong> {document.referrer || 'None'}</p>
              
              {/* Manual test button */}
              <div className="mt-3">
                <button 
                  onClick={() => {
                    console.log('Manual PWA test triggered');
                    
                    // Test Service Worker
                    const swElement = document.getElementById('sw-status');
                    if (swElement) swElement.textContent = 'Testing...';
                    
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.register('/sw.js')
                        .then(() => {
                          if (swElement) swElement.textContent = 'SUCCESS ✅';
                        })
                        .catch((error) => {
                          if (swElement) swElement.textContent = 'FAILED ❌';
                          console.error('SW failed:', error);
                        });
                    } else {
                      if (swElement) swElement.textContent = 'Not Supported ❌';
                    }
                    
                    // Test Manifest
                    const manifestElement = document.getElementById('manifest-status');
                    if (manifestElement) manifestElement.textContent = 'Testing...';
                    
                    fetch('/manifest.json')
                      .then(response => {
                        if (response.ok) {
                          if (manifestElement) manifestElement.textContent = 'SUCCESS ✅';
                        } else {
                          if (manifestElement) manifestElement.textContent = 'HTTP ' + response.status + ' ❌';
                        }
                      })
                      .catch(error => {
                        if (manifestElement) manifestElement.textContent = 'NETWORK ERROR ❌';
                        console.error('Manifest failed:', error);
                      });
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  🔧 Manual Test
                </button>
              </div>
              <p className="text-red-600 font-medium">
                {((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) 
                  ? '✅ PWA MODE ACTIVE - Camera permissions should persist!'
                  : '❌ BROWSER MODE - Camera permissions will reset on refresh'}
              </p>
              {!((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) && (
                <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                  <p className="text-xs text-red-700 font-bold">⚠️ CRITICAL ISSUE DETECTED:</p>
                  <p className="text-xs text-red-700 font-bold">
                    You're in BROWSER MODE but should be in PWA MODE for camera permissions!
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    <strong>Solution:</strong> Use Safari's Share → "Add to Home Screen" manually
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <script dangerouslySetInnerHTML={{
            __html: `
              // Robust PWA debug script for iOS Safari
              (function() {
                console.log('PWA Debug: Starting robust checks...');
                
                function updateStatus(id, text) {
                  const element = document.getElementById(id);
                  if (element) {
                    element.textContent = text;
                    console.log('Updated ' + id + ': ' + text);
                  } else {
                    console.log('Element not found: ' + id);
                  }
                }
                
                // Wait for DOM to be ready
                function startChecks() {
                  console.log('DOM ready, starting PWA checks...');
                  
                  // Immediate updates
                  updateStatus('sw-status', 'Starting...');
                  updateStatus('manifest-status', 'Starting...');
                  
                  // Test Service Worker
                  console.log('Testing Service Worker...');
                  if ('serviceWorker' in navigator) {
                    updateStatus('sw-status', 'Registering...');
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        updateStatus('sw-status', 'SUCCESS ✅');
                        console.log('Service Worker: Registration successful');
                      })
                      .catch(function(error) {
                        updateStatus('sw-status', 'FAILED ❌');
                        console.error('Service Worker: Registration failed', error);
                      });
                  } else {
                    updateStatus('sw-status', 'Not Supported ❌');
                  }
                  
                  // Test Manifest
                  console.log('Testing Manifest...');
                  updateStatus('manifest-status', 'Fetching...');
                  fetch('/manifest.json')
                    .then(function(response) {
                      if (response.ok) {
                        updateStatus('manifest-status', 'SUCCESS ✅');
                        console.log('Manifest: Fetch successful');
                      } else {
                        updateStatus('manifest-status', 'HTTP ' + response.status + ' ❌');
                        console.error('Manifest: HTTP error', response.status);
                      }
                    })
                    .catch(function(error) {
                      updateStatus('manifest-status', 'NETWORK ERROR ❌');
                      console.error('Manifest: Network error', error);
                    });
                }
                
                // Start checks when DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', startChecks);
                } else {
                  // DOM is already ready
                  setTimeout(startChecks, 100);
                }
              })();
            `
          }} />
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