"use client"

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useTranslation } from '@/contexts/LanguageContext'

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
                <div className="flex justify-center">
                  <div className="w-32 h-24 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/restaurantes_current.webp" 
                      alt="Restaurants" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{t.home.restaurants_title}</h3>
                <p className="text-lg font-semibold">
                  {t.home.restaurants_description}
                </p>
              </div>
              
              {/* Shops */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-32 h-24 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/tiendas_current.webp" 
                      alt="Shops" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{t.home.shops_title}</h3>
                <p className="text-lg font-semibold">
                  {t.home.shops_description}
                </p>
              </div>
              
              {/* Services */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-32 h-24 rounded-2xl overflow-hidden">
                    <img 
                      src="/images/services_current.png" 
                      alt="Services" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{t.home.services_title}</h3>
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
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm uppercase tracking-wide">
                {t.home.testimonials_title}
              </span>
              <h2 className="text-4xl font-bold text-orange-500 mt-6">
                {t.home.testimonials_subtitle}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <img 
                    src="/images/person_1.jpg" 
                    alt="Customer" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">
                      {t.home.testimonial_1_title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t.home.testimonial_1_description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <img 
                    src="/images/person_2.jpg" 
                    alt="Customer" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">
                      {t.home.testimonial_2_title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t.home.testimonial_2_description}
                    </p>
                  </div>
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
