"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="text-center w-full">
          <h1 className="text-4xl font-bold mb-6">
            Welcome to Elocalpass
          </h1>
          <p className="text-lg mb-8">
            Discount QR codes for travelers
          </p>
          
          {session ? (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">
                ✅ Logged in as: {session.user.name} ({session.user.role})
              </p>
              <div className="space-x-4">
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Go to Admin Dashboard
                  </Link>
                )}
                {session.user.role === "SELLER" && (
                  <Link
                    href="/seller"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Go to Seller Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                🔐 Authentication system ready for testing
              </p>
              <div className="space-x-4">
                <Link
                  href="/auth/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <p className="text-yellow-800 font-semibold">🚨 Day 2 Testing Required</p>
            <p className="text-yellow-700 mt-1">
              Test login/logout functionality for both Admin and Seller roles before proceeding to Day 3.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
