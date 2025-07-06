"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, QrCode, Users, TrendingUp, MapPin, Mail, Phone, Percent, LogOut, RefreshCw, CheckCircle, XCircle, AlertCircle, X, Type } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"
import QrScanner from 'qr-scanner'

interface Affiliate {
  id: string
  name: string
  email: string
  discount: string | null
  city: string | null
  category: string | null
  totalVisits: number
  lastVisitAt: string | null
}

interface Visit {
  id: string
  qrCode: string
  customerName: string
  customerEmail: string
  discountApplied: string
  visitedAt: string
  qrDetails: {
    code: string
    guests: number
    days: number
    expiresAt: string
  }
}

interface ScanResult {
  success: boolean
  message: string
  visit?: Visit
  error?: string
  details?: string
  debugInfo?: {
    currentServerTime: string
    qrExpiresAt: string
    timeDifferenceMs: number
    qrCreatedAt: string
    daysValid: number
    customerName: string
  }
}

export default function AffiliateDashboard() {
  const { notifications, removeToast, success, error } = useToast()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [qrInput, setQrInput] = useState('')
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })

  // Camera scanning states
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  // Check authentication on load
  useEffect(() => {
    checkAuth()
  }, [])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/affiliate/profile')
      if (response.ok) {
        const data = await response.json()
        setAffiliate(data.affiliate)
        setRecentVisits(data.recentVisits || [])
        setStats(data.stats || { today: 0, thisWeek: 0, thisMonth: 0 })
      } else {
        // Redirect to login
        window.location.href = '/affiliate/login'
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      window.location.href = '/affiliate/login'
    } finally {
      setLoading(false)
    }
  }

  const startCameraScanning = async () => {
    setCameraLoading(true)
    setCameraError(null)
    
    try {
      console.log('Starting camera scanning...')
      
      // Check if we're on HTTPS (required for camera access)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS connection')
      }

      // Check for basic camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by this browser')
      }

      // Check for QR Scanner library support
      if (!QrScanner.hasCamera()) {
        throw new Error('No camera detected on this device')
      }

      // Request camera permissions explicitly for iOS
      console.log('Requesting camera permissions...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' } // Prefer back camera
          } 
        })
        
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop())
        console.log('Camera permissions granted')
      } catch (permissionError: any) {
        console.error('Camera permission error:', permissionError)
        let errorMessage = 'Camera access denied'
        
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access in your browser settings.'
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device'
        } else if (permissionError.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported by this browser'
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application'
        }
        
        throw new Error(errorMessage)
      }

      // Set camera active first and wait for video element to be ready
      setCameraActive(true)
      
      // Wait for video element to be rendered
      console.log('Waiting for video element...')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!videoRef.current) {
        console.error('Video element still not ready after waiting')
        throw new Error('Video element not ready - please try again')
      }

      console.log('Creating QR scanner...')
      
      // Create QR scanner instance with iOS-friendly options
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data)
          handleQRScanResult(result.data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5, // Limit scan rate for better performance
          calculateScanRegion: (video) => {
            // Create a centered scan region for better iOS performance
            const smallestDimension = Math.min(video.videoWidth, video.videoHeight)
            const scanRegionSize = Math.round(0.6 * smallestDimension)
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize
            }
          }
        }
      )

      console.log('Starting QR scanner...')
      await qrScannerRef.current.start()
      console.log('QR scanner started successfully')
      
    } catch (err: any) {
      console.error('Camera startup error:', err)
      setCameraError(err.message || 'Failed to access camera')
      setCameraActive(false)
      setShowManualInput(true) // Auto-fallback to manual input
    } finally {
      setCameraLoading(false)
    }
  }

  const stopCameraScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setCameraActive(false)
    setCameraError(null)
  }

  const handleQRScanResult = async (qrCode: string) => {
    // Stop scanning temporarily while processing
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
    }

    setScanning(true)
    try {
      const response = await fetch('/api/affiliate/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrCode.trim() })
      })

      const result: ScanResult = await response.json()

      if (result.success && result.visit) {
        success('Visit Logged!', `Successfully logged visit for ${result.visit.customerName}`)
        setRecentVisits(prev => [result.visit!, ...prev.slice(0, 9)])
        setStats(prev => ({ ...prev, today: prev.today + 1 }))
        
        if (affiliate) {
          setAffiliate(prev => prev ? { ...prev, totalVisits: prev.totalVisits + 1 } : null)
        }

        // Close camera after successful scan
        stopCameraScanning()
      } else {
        error('Scan Failed', result.details || result.error || 'Unknown error')
        
        // Show debug information if available (for troubleshooting)
        if (result.debugInfo) {
          console.log('🔍 QR SCAN DEBUG INFO:', result.debugInfo)
          
          // Show detailed debug info in a more user-friendly way
          const debugMessage = `
Debug Information:
• Server Time: ${new Date(result.debugInfo.currentServerTime).toLocaleString()}
• QR Expires: ${new Date(result.debugInfo.qrExpiresAt).toLocaleString()}
• Time Difference: ${result.debugInfo.timeDifferenceMs}ms
• QR Created: ${new Date(result.debugInfo.qrCreatedAt).toLocaleString()}
• Days Valid: ${result.debugInfo.daysValid}
• Customer: ${result.debugInfo.customerName}
          `.trim()
          
          // Show debug info in a second toast for troubleshooting
          setTimeout(() => {
            error('Debug Info', debugMessage)
          }, 1000)
        }
        
        // Restart camera for another attempt
        if (cameraActive && qrScannerRef.current) {
          setTimeout(() => {
            qrScannerRef.current?.start()
          }, 2000)
        }
      }

    } catch (err) {
      console.error('Scan error:', err)
      error('Scan Failed', 'Failed to process QR code')
      
      // Restart camera for another attempt
      if (cameraActive && qrScannerRef.current) {
        setTimeout(() => {
          qrScannerRef.current?.start()
        }, 2000)
      }
    } finally {
      setScanning(false)
    }
  }

  const handleManualQRScan = async () => {
    if (!qrInput.trim()) {
      error('Please enter a QR code')
      return
    }

    await handleQRScanResult(qrInput.trim())
    setQrInput('')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/affiliate/auth/logout', { method: 'POST' })
      window.location.href = '/affiliate/login'
    } catch (err) {
      console.error('Logout error:', err)
      window.location.href = '/affiliate/login'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <QrCode className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {affiliate.name}
                </h1>
                <p className="text-sm text-gray-600">Affiliate Dashboard - QR Scanner</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Affiliate Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{affiliate.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Percent className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="font-medium">{affiliate.discount || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{affiliate.city || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="font-medium">{affiliate.totalVisits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.today}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.thisWeek}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.thisMonth}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* QR Scanner */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-600" />
            Scan Customer QR Code
          </h3>

          {/* Always render video element but hide it when not active */}
          <div className="relative">
            <video
              ref={videoRef}
              className={`w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg bg-black ${
                cameraActive ? 'block' : 'hidden'
              }`}
              playsInline
              muted
            />
            {/* Show scanning overlay when processing QR codes */}
            {scanning && cameraActive && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Processing QR code...</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Scanner UI */}
          {!showManualInput && (
            <div className="space-y-4">
              {!cameraActive ? (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Camera QR Scanner</h4>
                  <p className="text-gray-600 mb-4">Point your camera at the customer's QR code</p>
                  <div className="space-y-3">
                    <button
                      onClick={startCameraScanning}
                      disabled={cameraLoading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cameraLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 mr-2" />
                          Start Camera Scanner
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowManualInput(true)}
                      disabled={cameraLoading}
                      className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Use manual input instead
                    </button>
                  </div>
                  {cameraError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Camera Error:</strong> {cameraError}
                      </p>
                      <div className="mt-3 space-y-2">
                        <button
                          onClick={() => setShowManualInput(true)}
                          className="block w-full text-sm text-red-600 underline hover:text-red-800"
                        >
                          Switch to manual input
                        </button>
                        <button
                          onClick={() => {
                            setCameraError(null)
                            startCameraScanning()
                          }}
                          className="block w-full text-sm text-blue-600 underline hover:text-blue-800"
                        >
                          Try camera again
                        </button>
                      </div>
                    </div>
                  )}
                  {cameraLoading && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Setting up camera...</strong> Please allow camera access when prompted.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={stopCameraScanning}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Stop Camera
                    </button>
                    <button
                      onClick={() => {
                        stopCameraScanning()
                        setShowManualInput(true)
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Manual Input
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Camera className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Scanning Tips:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li>Hold your device steady</li>
                          <li>Ensure good lighting</li>
                          <li>Center the QR code in the camera view</li>
                          <li>Move closer or further if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Input UI */}
          {showManualInput && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Manual QR Code Entry</h4>
                <button
                  onClick={() => setShowManualInput(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Back to camera
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter QR Code (e.g., EL-1234567890-abc123)
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="EL-1234567890-abc123"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualQRScan()}
                  />
                  <button
                    onClick={handleManualQRScan}
                    disabled={scanning || !qrInput.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {scanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Manual Entry Tips:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Ask customers to read their QR code aloud</li>
                      <li>QR codes start with "EL-" followed by numbers and letters</li>
                      <li>Double-check the code before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Visits */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Recent Visits ({recentVisits.length})
            </h3>
          </div>
          
          {recentVisits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No visits recorded yet</p>
              <p className="text-sm text-gray-400">Start scanning customer QR codes to track visits</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon('success')}
                      <div>
                        <p className="font-medium text-gray-900">{visit.customerName}</p>
                        <p className="text-sm text-gray-600">{visit.customerEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {visit.discountApplied}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(visit.visitedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>QR: {visit.qrCode}</span>
                    <span>Guests: {visit.qrDetails.guests}</span>
                    <span>Days: {visit.qrDetails.days}</span>
                    <span>Expires: {new Date(visit.qrDetails.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ToastNotifications notifications={notifications} onRemove={removeToast} />
    </div>
  )
} 