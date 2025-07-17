'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useState } from 'react'
import { useTranslation } from '@/contexts/LanguageContext'

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const { t } = useTranslation()

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="pt-20">
        {/* Header Section */}
        <div className="bg-orange-400 text-center text-white py-16 px-4">
          <h1 className="text-5xl font-bold mb-6">{t.faq.title}</h1>
          <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
            {t.faq.subtitle}
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-4">
            {t.faq.questions.map((faq, index) => (
              <div 
                key={index}
                className="bg-white border-2 border-orange-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors"
              >
                <button
                  onClick={() => toggleExpanded(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-orange-50 transition-colors"
                >
                  <span className="text-orange-500 font-semibold text-lg">
                    {faq.question}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-orange-500 transform transition-transform ${
                      expandedItems.includes(index) ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedItems.includes(index) && (
                  <div className="px-6 pb-4 text-gray-700 border-t border-orange-100">
                    <p className="pt-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
} 