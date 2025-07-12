"use client"

import { useState } from "react"
import { Building2, Mail, LogIn, AlertCircle } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"

export default function AffiliateLogin() {
  const { notifications, removeToast, success, error } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
      
      {/* PWA Debug Info - Show current app mode */}
      {typeof window !== 'undefined' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4">
            <p className="text-lg font-bold text-yellow-800 mb-2">🔧 PWA DEBUG INFO</p>
            <div className="text-sm space-y-1">
              <p><strong>Is iOS:</strong> {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
              <p><strong>Standalone Mode:</strong> {(navigator as any).standalone ? 'Yes' : 'No'}</p>
              <p><strong>Display Mode:</strong> {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}</p>
              <p><strong>Window Navigator Standalone:</strong> {String((navigator as any).standalone)}</p>
              <p><strong>Display Mode Query:</strong> {String(window.matchMedia('(display-mode: standalone)').matches)}</p>
              <p><strong>Window Location:</strong> {window.location.href}</p>
              <p><strong>Referrer:</strong> {document.referrer || 'None'}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 80)}...</p>
              <p className="text-red-600 font-medium">
                {((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) 
                  ? '✅ PWA MODE ACTIVE - Camera permissions should persist!'
                  : '❌ BROWSER MODE - Camera permissions will reset on refresh'}
              </p>
              {!((navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) && (
                <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                  <p className="text-xs text-red-700 font-bold">TROUBLESHOOTING:</p>
                  <p className="text-xs text-red-700">
                    • Are you opening from HOME SCREEN icon (not Safari browser)?<br/>
                    • Did you install from Safari (not Chrome)?<br/>
                    • Try: Delete app → Open Safari → Go to this page → Add to Home Screen
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
            <h3 className="text-lg font-bold text-blue-800 mb-3">📱 PWA Installation Guide</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p className="font-medium">To fix camera permission issues, install as PWA:</p>
              
              <div className="bg-red-100 border border-red-300 rounded p-2 mb-3">
                <p className="text-xs font-bold text-red-700">⚠️ COMMON MISTAKE:</p>
                <p className="text-xs text-red-700">
                  If delete shows "bookmark" (not "app") or opens in Safari → it's NOT a PWA!
                </p>
              </div>

              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li><strong>Make sure Safari is your DEFAULT browser temporarily</strong>
                  <div className="text-xs ml-4 mt-1 text-blue-600">
                    Settings → Safari → Default Browser App → Safari
                  </div>
                </li>
                <li><strong>Close ALL browser apps</strong> (Safari, Chrome, etc.)</li>
                <li><strong>Open Safari fresh</strong></li>
                <li><strong>Type in address bar:</strong> elocalpasscursor.vercel.app/affiliate/login</li>
                <li><strong>Wait for page to fully load</strong></li>
                <li><strong>Tap Share button</strong> (box with arrow up)</li>
                <li><strong>Look for "Add to Home Screen"</strong> (not "Add Bookmark"!)</li>
                <li><strong>Name it "ELocalPass Scanner"</strong> and tap "Add"</li>
                <li><strong>Test: Delete should say "Delete App" (not bookmark)</strong></li>
                <li><strong>Open from HOME SCREEN - should have NO browser bars</strong></li>
              </ol>
              
              <div className="bg-blue-100 border border-blue-200 rounded p-2 mt-3">
                <p className="text-xs font-bold text-blue-800">✅ Success Check:</p>
                <p className="text-xs text-blue-700">
                  • Delete shows "Delete App" (not "Delete Bookmark")<br/>
                  • Opens with NO Safari address bar/buttons<br/>
                  • Debug shows "PWA MODE ACTIVE"
                </p>
              </div>

              <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                <p className="text-xs font-bold text-yellow-700">🔧 If still not working:</p>
                <p className="text-xs text-yellow-700">
                  1. Change iPhone default browser to Safari in Settings<br/>
                  2. Restart iPhone<br/>
                  3. Try installation steps again
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