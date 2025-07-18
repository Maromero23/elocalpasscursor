'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useTranslation } from '@/contexts/LanguageContext'
import PassSelectionModal from '@/components/PassSelectionModal'

export default function PassesPage() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPassType, setSelectedPassType] = useState<'day' | 'week' | 'custom' | null>(null)

  const handlePassSelection = (passType: 'day' | 'week' | 'custom') => {
    setSelectedPassType(passType)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPassType(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="pt-20">
        {/* Header */}
        <div className="bg-orange-400 text-center text-white font-bold text-2xl sm:text-4xl py-8">
          {t.passes.title}
        </div>
        
        {/* Cards Section */}
        <div className="flex justify-center items-center min-h-[500px] px-4 py-12 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-6 max-w-5xl w-full">
            
            {/* BY DAY PASS */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.passes.byDayPass.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{t.passes.byDayPass.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">$ 15</span>
                <span className="text-lg text-gray-600">.00</span>
                <span className="text-lg text-gray-600 ml-1">USD</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-1">X PERSON</p>
              </div>
              
              <div className="space-y-2 mb-8 text-sm text-gray-700">
                <div className="flex items-center justify-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Choose up to 6 people
                </div>
                <div className="flex items-center justify-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Choose for 1 or 6 days
                </div>
              </div>
              
              <button 
                onClick={() => handlePassSelection('day')}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-8 rounded-lg w-full transition-colors"
              >
                {t.passes.byDayPass.buttonText}
              </button>
            </div>

            {/* FULL WEEK PASS - Featured */}
            <div className="bg-blue-900 rounded-2xl shadow-xl p-8 flex-1 text-center text-white transform md:scale-105">
              <h3 className="text-xl font-bold mb-2">{t.passes.fullWeekPass.title}</h3>
              <p className="text-sm text-blue-200 mb-6">{t.passes.fullWeekPass.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">$ 79</span>
                <span className="text-lg">.90</span>
                <span className="text-lg ml-1">USD</span>
              </div>
              
              <div className="text-sm text-blue-200 mb-6">
                <p className="mb-1">X PERSON</p>
              </div>
              
              <div className="space-y-2 mb-8 text-sm">
                <div className="flex items-center justify-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Choose up to 6 people
                </div>
                <div className="flex items-center justify-start">
                  <span className="text-green-400 mr-2">✓</span>
                  Only week
                </div>
              </div>
              
              <button 
                onClick={() => handlePassSelection('week')}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-8 rounded-lg w-full transition-colors"
              >
                {t.passes.fullWeekPass.buttonText}
              </button>
            </div>

            {/* CUSTOM PASS */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.passes.customPass.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{t.passes.customPass.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">Custom</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-1">X PERSON</p>
              </div>
              
              <div className="space-y-2 mb-8 text-sm text-gray-700">
                <div className="flex items-center justify-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Choose up to 6 people
                </div>
                <div className="flex items-center justify-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Choose for more than 1 week
                </div>
              </div>
              
              <button 
                onClick={() => handlePassSelection('custom')}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-8 rounded-lg w-full transition-colors"
              >
                {t.passes.customPass.buttonText}
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-blue-900 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-orange-400 mb-12">Testimonials</h2>
            
            <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                  👤
                </div>
              </div>
              
              <blockquote className="text-gray-700 text-lg italic mb-4">
                "Custom Pass allowed me to tailor my visit exactly how I wanted. The flexibility was amazing, and I really appreciated the great customer service!"
              </blockquote>
              
              <cite className="text-gray-900 font-semibold">- Michael S.</cite>
              
              <div className="flex justify-center mt-4">
                <div className="flex text-yellow-400">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pass Selection Modal */}
      {isModalOpen && selectedPassType && (
        <PassSelectionModal
          passType={selectedPassType}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      <Footer />
    </div>
  )
} 