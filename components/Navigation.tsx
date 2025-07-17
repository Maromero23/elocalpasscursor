"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import { ChevronDown } from 'lucide-react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [locationsDropdownOpen, setLocationsDropdownOpen] = useState(false)
  const { t, language, setLanguage } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cities = [
    { name: 'Bacalar', slug: 'bacalar' },
    { name: 'Cancún', slug: 'cancun' },
    { name: 'Cozumel', slug: 'cozumel' },
    { name: 'Holbox', slug: 'holbox' },
    { name: 'Isla Mujeres', slug: 'isla-mujeres' },
    { name: 'Playa del Carmen', slug: 'playa-del-carmen' },
    { name: 'Puerto Aventuras', slug: 'puerto-aventuras' },
    { name: 'Puerto Morelos', slug: 'puerto-morelos' },
    { name: 'Tulum', slug: 'tulum' }
  ]

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setLocationsDropdownOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setLocationsDropdownOpen(false)
    }, 300) // 300ms delay before closing
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <nav className="bg-slate-100 text-blue-700 z-50 fixed w-full shadow-md p-3 transition-opacity duration-300">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-full items-center justify-between xl:flex-row flex-col">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Logo and Navigation */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/">
                <img 
                  className="h-14 w-auto left-0" 
                  src="/images/elocal_logo_2.png" 
                  alt="eLocalPass Logo" 
                />
              </Link>
            </div>
            
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4 items-center h-full">
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-orange-500 hover:font-semibold px-3 py-2 text-sm font-medium"
                >
                  {t.navigation.home}
                </Link>
                <div 
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className="text-blue-600 hover:text-orange-500 hover:font-semibold px-3 py-2 text-sm font-medium flex items-center"
                  >
                    {t.navigation.locations}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {locationsDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                    >
                      <div className="py-1">
                        {cities.map((city) => (
                          <Link
                            key={city.slug}
                            href={`/locations/${city.slug}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-500"
                            onClick={() => setLocationsDropdownOpen(false)}
                          >
                            {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link 
                  href="/passes"
                  className="text-blue-600 hover:text-orange-500 hover:font-semibold px-3 py-2 text-sm font-medium"
                >
                  {t.navigation.passes}
                </Link>
                <Link 
                  href="/faq"
                  className="text-blue-600 hover:text-orange-500 hover:font-semibold px-3 py-2 text-sm font-medium"
                >
                  {t.navigation.faq}
                </Link>
                <Link 
                  href="/contact"
                  className="text-blue-600 hover:text-orange-500 hover:font-semibold px-3 py-2 text-sm font-medium"
                >
                  {t.navigation.contact}
                </Link>
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="hidden sm:flex space-x-4 items-center">
            <Link 
              href="/login"
              className="relative flex bg-oranges-200 cursor-pointer hover:bg-oranges-500 border-2 border-orange-400 text-white px-4 py-1 rounded-md text-sm mx-2"
            >
              {t.navigation.login}
            </Link>
            <button 
              onClick={() => setLanguage('en')} 
              className={`text-xl hover:scale-110 transition-transform ${language === 'en' ? 'ring-2 ring-orange-400 rounded' : ''}`}
              title="English"
            >
              🇺🇸
            </button>
            <button 
              onClick={() => setLanguage('es')} 
              className={`text-xl hover:scale-110 transition-transform ${language === 'es' ? 'ring-2 ring-orange-400 rounded' : ''}`}
              title="Español"
            >
              🇲🇽
            </button>
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link 
              href="/"
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-orange-500"
            >
              {t.navigation.home}
            </Link>
            <Link 
              href="/locations"
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-orange-500"
            >
              {t.navigation.locations}
            </Link>
            <Link 
              href="/passes"
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-orange-500"
            >
              {t.navigation.passes}
            </Link>
            <Link 
              href="/faq"
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-orange-500"
            >
              {t.navigation.faq}
            </Link>
            <Link 
              href="/contact"
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-orange-500"
            >
              {t.navigation.contact}
            </Link>
            <Link 
              href="/login"
              className="block px-3 py-2 text-base font-medium bg-oranges-200 text-white rounded-md"
            >
              {t.navigation.login}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
} 