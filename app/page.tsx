"use client"

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section with Phone Mockup and Collage */}
      <main className="pt-20">
        <div className="relative bg-gradient-to-br from-blue-50 to-orange-50 py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              {/* Left side - Phone mockup and collage */}
              <div className="lg:w-1/2 mb-12 lg:mb-0 relative">
                {/* Background collage images */}
                <div className="relative w-full h-96 lg:h-[500px]">
                  <img 
                    src="/images/eLocalFondo.png" 
                    alt="eLocalPass collage"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Right side - Text content */}
              <div className="lg:w-1/2 lg:pl-12 text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold text-blue-800 mb-6">
                  eLocalPass
                </h1>
                <p className="text-2xl lg:text-3xl text-orange-500 font-semibold mb-6">
                  Pay like a local
                </p>
                <p className="text-lg lg:text-xl text-blue-700 mb-8 max-w-lg">
                  Elite application for travelers in México
                </p>
                <Link 
                  href="/passes" 
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-300"
                >
                  Get Your Pass
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurants, Shops & Services Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-800 mb-12">
              Restaurants, Shops & Services
            </h2>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="lg:w-1/3">
                <img 
                  src="/images/food_1.png" 
                  alt="Restaurants and food"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="lg:w-2/3 lg:pl-8">
                <p className="text-lg text-blue-700 leading-relaxed">
                  Discover the best local restaurants, shops, and services with exclusive discounts. 
                  Our partners offer authentic Mexican experiences that you won't find in tourist guidebooks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* As Easy As Section */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-800 text-center mb-12">
              As Easy As...
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <img 
                  src="/images/how1.svg" 
                  alt="Step 1"
                  className="w-24 h-24 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">1. Download</h3>
                <p className="text-gray-600">Get the eLocalPass app</p>
              </div>
              <div className="text-center">
                <img 
                  src="/images/how2.svg" 
                  alt="Step 2"
                  className="w-24 h-24 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">2. Choose</h3>
                <p className="text-gray-600">Select your pass duration</p>
              </div>
              <div className="text-center">
                <img 
                  src="/images/how3.svg" 
                  alt="Step 3"
                  className="w-24 h-24 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">3. Scan</h3>
                <p className="text-gray-600">Show your QR code</p>
              </div>
              <div className="text-center">
                <img 
                  src="/images/how4.svg" 
                  alt="Step 4"
                  className="w-24 h-24 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">4. Save</h3>
                <p className="text-gray-600">Enjoy local discounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Destinations Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-800 text-center mb-12">
              Discover Amazing Destinations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
              <div className="text-center">
                <img 
                  src="/images/cancun_icon.png" 
                  alt="Cancún"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Cancún</h3>
              </div>
              <div className="text-center">
                <img 
                  src="/images/tulum_icon.png" 
                  alt="Tulum"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Tulum</h3>
              </div>
              <div className="text-center">
                <img 
                  src="/images/cozumel_icon.png" 
                  alt="Cozumel"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Cozumel</h3>
              </div>
              <div className="text-center">
                <img 
                  src="/images/playa_carmen_icon.png" 
                  alt="Playa del Carmen"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Playa del Carmen</h3>
              </div>
              <div className="text-center">
                <img 
                  src="/images/puerto_morelos_icon.png" 
                  alt="Puerto Morelos"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Puerto Morelos</h3>
              </div>
              <div className="text-center">
                <img 
                  src="/images/isla_mujeres_icon.png" 
                  alt="Isla Mujeres"
                  className="w-20 h-20 mx-auto mb-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
                <h3 className="text-lg font-semibold text-blue-800">Isla Mujeres</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-800 text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <img 
                  src="/images/person_1.jpg" 
                  alt="Customer testimonial"
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="text-gray-600 mb-4 italic">"Amazing discounts! Saved so much money on our vacation."</p>
                <h4 className="font-semibold text-blue-800">Sarah M.</h4>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <img 
                  src="/images/person_2.jpg" 
                  alt="Customer testimonial"
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="text-gray-600 mb-4 italic">"Found the best local restaurants with great prices."</p>
                <h4 className="font-semibold text-blue-800">Mike D.</h4>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <img 
                  src="/images/person_3.jpg" 
                  alt="Customer testimonial"
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="text-gray-600 mb-4 italic">"Easy to use and authentic local experiences."</p>
                <h4 className="font-semibold text-blue-800">Lisa K.</h4>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <img 
                  src="/images/person_4.jpg" 
                  alt="Customer testimonial"
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="text-gray-600 mb-4 italic">"Best investment for our Mexico trip!"</p>
                <h4 className="font-semibold text-blue-800">Tom R.</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="py-16 bg-orange-500">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Save Like a Local?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who are already saving money and discovering authentic Mexico.
            </p>
            <Link 
              href="/passes" 
              className="inline-block bg-white hover:bg-gray-100 text-orange-500 font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-300"
            >
              Choose Your Pass
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
