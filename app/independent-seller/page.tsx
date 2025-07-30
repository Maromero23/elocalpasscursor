"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "../../components/auth/protected-route"
import Link from "next/link"
import { 
  BarChart3, QrCode, Building2, TrendingUp, Users, 
  ArrowRight, LogOut, Home
} from "lucide-react"

export default function IndependentSellerDashboard() {
  const { data: session } = useSession()

  return (
    <ProtectedRoute allowedRoles={["INDEPENDENT_SELLER"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Independent Seller Portal
                  </h1>
                  <p className="text-sm text-gray-500">Welcome, {session?.user?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Role: Independent Seller
                </span>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Dashboard
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              As an independent seller, you have access to both analytics and QR generation tools. 
              Select the dashboard you'd like to use.
            </p>
          </div>

          {/* Dashboard Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Analytics Dashboard Option */}
            <Link href="/admin/analytics">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 cursor-pointer border-2 border-transparent hover:border-blue-200">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    📊 Analytics Dashboard
                  </h3>
                  
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
                      <span>View QR Code Statistics</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BarChart3 className="h-5 w-5 text-blue-500 mr-3" />
                      <span>Revenue Reports & Trends</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Customer Analytics</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Building2 className="h-5 w-5 text-indigo-500 mr-3" />
                      <span>Business Performance</span>
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    View Analytics
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                </div>
              </div>
            </Link>

            {/* QR Generator Dashboard Option */}
            <Link href="/seller">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 cursor-pointer border-2 border-transparent hover:border-orange-200">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <QrCode className="h-8 w-8 text-orange-600" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    🎯 QR Generator
                  </h3>
                  
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center text-gray-600">
                      <QrCode className="h-5 w-5 text-orange-500 mr-3" />
                      <span>Create QR Codes</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 text-green-500 mr-3" />
                      <span>Send to Customers</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Building2 className="h-5 w-5 text-blue-500 mr-3" />
                      <span>Manage Orders</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="h-5 w-5 text-purple-500 mr-3" />
                      <span>Track Sales</span>
                    </div>
                  </div>
                  
                  <div className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                    Generate QRs
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                💡 Independent Seller Benefits
              </h4>
              <p className="text-gray-600">
                You have full access to both dashboards. Use <strong>Analytics</strong> to track your business performance 
                and <strong>QR Generator</strong> to create and send QR codes to your customers. 
                You can switch between them anytime!
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
} 