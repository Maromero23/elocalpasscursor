"use client"

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <main className="pt-20">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-oranges-100 to-oranges-200 text-white text-center py-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            eLocalPass
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Pay like a local
          </p>
          <p className="text-lg md:text-xl max-w-4xl mx-auto px-4">
            Elite application for travelers in México
          </p>
        </div>

        {/* Features Section */}
        <div className="py-16 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-blues-100 mb-12">
            Discover Local Experiences
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-blues-100 mb-2">
                Local Businesses
              </h3>
              <p className="text-gray-600">
                Access exclusive discounts at restaurants, stores, and services
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-blues-100 mb-2">
                Special Pricing
              </h3>
              <p className="text-gray-600">
                Get the best deals with our tourist discount passes
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-blues-100 mb-2">
                Easy to Use
              </h3>
              <p className="text-gray-600">
                Simply show your QR code to enjoy instant discounts
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-slate-100 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-blues-100 mb-8">
              Ready to Experience Mexico Like a Local?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Choose your perfect eLocalPass and start saving today!
            </p>
            <Link 
              href="/passes"
              className="bg-green-600 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              View Our Passes
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
