"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

type UserRole = "ADMIN" | "SELLER"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
      // Redirect based on user role
      if (session.user.role === "ADMIN") {
        router.push("/admin")
      } else if (session.user.role === "SELLER") {
        router.push("/seller")
      } else if (session.user.role === "INDEPENDENT_SELLER") {
        router.push("/independent-seller")
      }
      return
    }
  }, [session, status, router, allowedRoles, redirectTo])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    return null
  }

  return <>{children}</>
}
