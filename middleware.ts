import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    if (
      pathname === "/" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/customer") ||
      pathname.startsWith("/api/customer") ||
      pathname.startsWith("/landing") ||
      pathname.startsWith("/landing-enhanced") ||
      pathname.startsWith("/affiliate") ||
      pathname.startsWith("/api/affiliate") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/images") ||
      pathname === "/manifest.json" ||
      pathname === "/sw.js" ||
      pathname.startsWith("/icon-") ||
      pathname.startsWith("/locations") ||
      pathname.startsWith("/api/locations") ||
      pathname.startsWith("/api/paypal") ||
      pathname.startsWith("/api/orders") ||
      pathname.startsWith("/api/verify-payment") ||
      pathname === "/passes" ||
      pathname === "/faq" ||
      pathname === "/contact" ||
      pathname === "/payment-success" ||
      pathname === "/payment/cancel"
    ) {
      return NextResponse.next()
    }

    // Admin routes - only admins can access
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    }

    // Distributor routes - only distributors can access
    if (pathname.startsWith("/distributor")) {
      if (token?.role !== "DISTRIBUTOR") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    }

    // Location routes - only locations can access
    if (pathname.startsWith("/location")) {
      if (token?.role !== "LOCATION") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    }

    // Seller routes - only sellers can access
    if (pathname.startsWith("/seller")) {
      if (token?.role !== "SELLER") {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/customer") ||
          pathname.startsWith("/api/customer") ||
          pathname.startsWith("/landing") ||
          pathname.startsWith("/landing-enhanced") ||
          pathname.startsWith("/affiliate") ||
          pathname.startsWith("/api/affiliate") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname.startsWith("/images") ||
          pathname === "/manifest.json" ||
          pathname === "/sw.js" ||
          pathname.startsWith("/icon-") ||
          pathname.startsWith("/locations") ||
          pathname.startsWith("/api/locations") ||
          pathname.startsWith("/api/paypal") ||
          pathname.startsWith("/api/orders") ||
          pathname.startsWith("/api/verify-payment") ||
          pathname === "/passes" ||
          pathname === "/faq" ||
          pathname === "/contact" ||
          pathname === "/payment-success" ||
          pathname === "/payment/cancel"
        ) {
          return true
        }

        // Require token for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - icon- (PWA icons)
     * - images (static images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-|images).*)",
  ],
}
