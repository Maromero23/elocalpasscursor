"use client"

import { useState, useEffect } from "react"
import { Camera, QrCode, Users, TrendingUp, MapPin, Mail, Phone, Percent, LogOut, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ToastNotifications } from "@/components/toast-notification"
import { useToast } from "@/hooks/use-toast"

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

  // Check authentication on load
  useEffect(() => {
    checkAuth()
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

  const handleQRScan = async () => {
    if (!qrInput.trim()) {
      error('Please enter a QR code')
      return
    }

    setScanning(true)
    try {
      const response = await fetch('/api/affiliate/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrInput.trim() })
      })

      const result: ScanResult = await response.json()

      if (result.success && result.visit) {
        success('Visit Logged!', `Successfully logged visit for ${result.visit.customerName}`)
        setQrInput('')
        setRecentVisits(prev => [result.visit!, ...prev.slice(0, 9)])
        setStats(prev => ({ ...prev, today: prev.today + 1 }))
        
        if (affiliate) {
          setAffiliate(prev => prev ? { ...prev, totalVisits: prev.totalVisits + 1 } : null)
        }
      } else {
        error('Scan Failed', result.details || result.error || 'Unknown error')
      }

    } catch (err) {
      console.error('Scan error:', err)
      error('Scan Failed', 'Failed to process QR code')
    } finally {
      setScanning(false)
    }
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
          <div className="space-y-4">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                />
                <button
                  onClick={handleQRScan}
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
            <p className="text-sm text-gray-600">
              💡 Ask customers to show their ELocalPass QR code or have them read the code to you
            </p>
          </div>
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