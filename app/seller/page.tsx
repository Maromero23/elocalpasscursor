"use client"

import { useSession, signOut } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SellerDashboard() {
  const { data: session } = useSession()

  return (
    <ProtectedRoute allowedRoles={["SELLER"]}>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Seller Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session?.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🏪 Seller Dashboard
                </h2>
                <p className="text-gray-600 mb-4">
                  Role: {session?.user?.role}
                </p>
                <p className="text-green-600 font-semibold">
                  ✅ Authentication working! Seller access granted.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                  <p>Next features to build:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• QR Code Generation</li>
                    <li>• QR Distribution</li>
                    <li>• Sales Statistics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
