"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log('🔍 LOGIN DEBUG: Starting login attempt for:', email)
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log('🔍 LOGIN DEBUG: SignIn result:', result)

      if (result?.error) {
        console.log('❌ LOGIN DEBUG: Login failed with error:', result.error)
        setError("Invalid email or password")
      } else {
        console.log('✅ LOGIN DEBUG: Login successful, getting session...')
        
        // Get the session to check user role
        const session = await getSession()
        console.log('🔍 LOGIN DEBUG: Session obtained:', session)
        console.log('👤 LOGIN DEBUG: User role:', session?.user?.role)
        
        if (session?.user?.role === "ADMIN") {
          console.log('🚀 LOGIN DEBUG: Redirecting to /admin')
          router.push("/admin")
        } else if (session?.user?.role === "DISTRIBUTOR") {
          console.log('🚀 LOGIN DEBUG: Redirecting to /distributor')
          router.push("/distributor")
        } else if (session?.user?.role === "LOCATION") {
          console.log('🚀 LOGIN DEBUG: Redirecting to /location')
          router.push("/location")
        } else if (session?.user?.role === "SELLER") {
          console.log('🚀 LOGIN DEBUG: Redirecting to /seller')
          router.push("/seller")
        } else if (session?.user?.role === "INDEPENDENT_SELLER") {
          console.log('🚀 LOGIN DEBUG: Redirecting to /independent-seller')
          router.push("/independent-seller")
        } else {
          console.log('❓ LOGIN DEBUG: Unknown role or no role found:', session?.user?.role)
        }
      }
    } catch (error) {
      console.error('💥 LOGIN DEBUG: Catch block error:', error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Elocalpass
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Need an account? Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
