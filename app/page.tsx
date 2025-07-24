"use client"

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useTranslation } from '@/contexts/LanguageContext'

// Testimonials Component with Rotation
function TestimonialsSection() {
  const { t } = useTranslation()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    {
      title: "Unparalleled Customer Service",
      description: "The customer service provided by this platform is unparalleled. They went above and beyond to assist me and ensure that I had an amazing time during my trip.",
      image: "/images/person_1.jpg"
    },
    {
      title: "Wide Range of Options", 
      description: "I was impressed by the wide range of options available on this platform. From accommodations to tours and activities, there was something for everyone in Cancun, Playa del Carmen, and Tulum.",
      image: "/images/person_2.jpg"
    },
    {
      title: "Seamless Booking Experience",
      description: "The seamless booking experience on this platform made it incredibly easy to plan and book my trip to Cancun, Playa del Carmen, and Tulum. Highly recommended!",
      image: "/images/person_1.jpg"
    },
    {
      title: "Reliable and Trustworthy",
      description: "I found this platform to be reliable and trustworthy. They provided accurate information and delivered on their promises, ensuring a stress-free travel experience.",
      image: "/images/person_2.jpg"
    },
    {
      title: "Unbeatable Deals",
      description: "Using this platform, I found unbeatable deals on accommodations, activities, and attractions in Cancun, Playa del Carmen, and Tulum. It saved me a lot of money!",
      image: "/images/person_1.jpg"
    }
  ]

  // Auto-rotate testimonials every 8 seconds with sliding animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev: number) => (prev + 1) % testimonials.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm uppercase tracking-wide">
            TESTIMONIALS
          </span>
          <h2 className="text-4xl font-bold text-orange-500 mt-6">
            What they say about us?
          </h2>
        </div>

        <div className="max-w-6xl mx-auto overflow-hidden">
          <div 
            className="flex transition-transform duration-2000 ease-in-out"
            style={{ 
              transform: `translateX(-${(currentTestimonial * 100)}%)`,
              width: `${testimonials.length * 100}%`
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="w-full flex-shrink-0 px-4">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-48">
                    <div className="flex h-full">
                      <div className="w-40 flex-shrink-0">
                        <img 
                          src={testimonial.image}
                          alt="Customer" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-gray-100 p-6 flex flex-col justify-center">
                        <h4 className="font-bold text-gray-800 mb-3 text-lg">
                          {testimonial.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {testimonial.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-48">
                    <div className="flex h-full">
                      <div className="w-40 flex-shrink-0">
                        <img 
                          src={testimonials[(index + 1) % testimonials.length].image}
                          alt="Customer" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 bg-gray-100 p-6 flex flex-col justify-center">
                        <h4 className="font-bold text-gray-800 mb-3 text-lg">
                          {testimonials[(index + 1) % testimonials.length].title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {testimonials[(index + 1) % testimonials.length].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section with Phone Mockup and Floating Images */}
      <main className="pt-20">
        <div className="relative flex flex-col lg:flex-row justify-center items-center w-full pt-8 px-4">
          {/* Left side - Phone mockup with floating collage */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative w-full h-96 lg:h-[500px] flex justify-center items-center">
              {/* Home page image */}
              <img 
                src="/images/homepage-image.png" 
                alt="eLocalPass Experiences" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Right side - Text content */}
          <div className="w-full lg:w-1/2 px-4 lg:px-8 text-center lg:text-left mt-8 lg:mt-0">
            <h1 className="text-3xl lg:text-5xl font-bold text-blue-700 mb-6 leading-tight">
              {t.home.hero_title}
            </h1>
            <div className="space-y-4 mb-8">
              <p className="text-xl text-gray-700">
                {t.home.hero_description_1}
              </p>
              <p className="text-lg text-orange-500 font-semibold">
                {t.home.hero_description_2}
              </p>
              <p className="text-lg text-orange-600 font-bold">
                {t.home.hero_description_3}
              </p>
            </div>
            
            <Link 
              href="/passes"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-300"
            >
              {t.home.get_your_pass}
            </Link>
          </div>
        </div>

        {/* Restaurants, Shops, Services Section */}
        <section className="bg-orange-500 py-12 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center text-white">
              {/* Restaurants */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{t.home.restaurants_title}</h3>
                <div className="flex justify-center">
                  <div className="w-64 h-48 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/restaurantes_current.webp" 
                      alt="Restaurants" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-lg font-semibold">
                  {t.home.restaurants_description}
                </p>
              </div>
              
              {/* Shops */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{t.home.shops_title}</h3>
                <div className="flex justify-center">
                  <div className="w-64 h-48 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/tiendas_current.webp" 
                      alt="Shops" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-lg font-semibold">
                  {t.home.shops_description}
                </p>
              </div>
              
              {/* Services */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">{t.home.services_title}</h3>
                <div className="flex justify-center">
                  <div className="w-64 h-48 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/services_current.png" 
                      alt="Services" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-lg font-semibold">
                  {t.home.services_description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* As Easy As Section */}
        <div className="py-16 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Left side - Text content */}
              <div className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0">
                <h2 className="text-4xl lg:text-5xl font-bold text-blue-700 mb-8">
                  {t.home.as_easy_as_title}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <span className="text-orange-500 text-2xl font-bold mr-4">+</span>
                    <span className="text-xl lg:text-2xl text-gray-700">
                      {t.home.as_easy_as_step_1}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-orange-500 text-2xl font-bold mr-4">+</span>
                    <span className="text-xl lg:text-2xl text-gray-700">
                      {t.home.as_easy_as_step_2}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-orange-500 text-2xl font-bold mr-4">+</span>
                    <span className="text-xl lg:text-2xl text-gray-700">
                      {t.home.as_easy_as_step_3}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Video/Illustration area */}
              <div className="lg:w-1/2">
                <div className="relative rounded-lg overflow-hidden shadow-2xl bg-gradient-to-br from-blue-200 to-blue-300 p-8">
                  <div className="aspect-video bg-blue-200 flex items-center justify-center rounded-lg">
                    {/* Illustrated people placeholder - simplified version */}
                    <div className="flex space-x-4 items-center">
                      <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👩</span>
                      </div>
                      <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨</span>
                      </div>
                      <div className="w-16 h-16 bg-green-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👩</span>
                      </div>
                      <div className="w-16 h-16 bg-orange-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨</span>
                      </div>
                    </div>
                    {/* YouTube play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l7-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blue Banner Section */}
        <div className="py-6 bg-blue-700">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white text-center">
              <span dangerouslySetInnerHTML={{ __html: t.home.cities_title }} />
            </h2>
          </div>
        </div>

        {/* Cities Section with Large Photos */}
        <div className="py-8 bg-white">
          <div className="px-6">
            {/* 3x3 Grid of Cities - Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {/* Row 1 */}
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/cancun_large.png" alt="Cancún" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/tulum_large.png" alt="Tulum" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/cozumel_large.png" alt="Cozumel" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              {/* Row 2 */}
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/playa_carmen_large.png" alt="Playa del Carmen" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/isla_mujeres_large.png" alt="Isla Mujeres" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/puerto_morelos_large.png" alt="Puerto Morelos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              {/* Row 3 */}
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/bacalar_large.png" alt="Bacalar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/puerto_aventuras_large.png" alt="Puerto Aventuras" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              
              <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer">
                <img src="/images/holbox_large.png" alt="Holbox" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Orange Contact Section */}
        <div className="py-12 bg-orange-500 text-center text-white">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <div className="flex justify-center space-x-8 mb-6">
                <a 
                  href="https://www.facebook.com/eLocalpassmex/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href={`https://wa.me/5219842110483`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/elocalpassmex/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
              
              <div className="space-y-4">
                <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm uppercase tracking-wide">
                  CONTACT US!
                </div>
                
                <div className="text-2xl font-bold">
                  +52 984 211 0483
                </div>
                
                <div className="text-lg">
                  Info@elocalpass.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
