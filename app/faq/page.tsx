'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useState } from 'react'

const faqData = [
  {
    id: 1,
    question: "Where can I purchase eLocalPass?",
    answer: "You can get it online at www.elocalpass.com"
  },
  {
    id: 2,
    question: "How much does my eLocalPass cost?", 
    answer: "The cost will be proportional to the number of days and people who wish to enjoy this benefit"
  },
  {
    id: 3,
    question: "Where can I validate my eLocalPass?",
    answer: "On our website, you can consult the list of restaurants, stores, and services where you can enjoy our multiple benefits"
  },
  {
    id: 4,
    question: "Is it only for locals?",
    answer: "No, eLocalPass is for tourists who are looking for the experience and benefits of a local"
  },
  {
    id: 5,
    question: "Can I use eLocalPass for more people than the registered?",
    answer: "For each visit, an eLocalPass holder is registered, and this benefit is extended only to the people selected"
  },
  {
    id: 6,
    question: "Can I transfer the benefits to someone else?",
    answer: "It is valid for a group of registered persons; however, one cardholder must be present each time"
  },
  {
    id: 7,
    question: "Do I get discounts at all restaurants in Quintana Roo with my eLocalPass?",
    answer: "No, you can enjoy varied discounts in a wide list of places"
  },
  {
    id: 8,
    question: "Do i only need to show QR code to validate my discount?",
    answer: "In most establishments only the QR code will be neccesary, however, we recommed that you carry your ID at all time"
  }
]

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<number[]>([])

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
          <h1 className="text-5xl font-bold mb-6">FAQs</h1>
          <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
            Welcome to our Frequently Asked Questions section! Here, you'll find clear answers to common 
            queries about eLocalPass. From how to get it to where to use it, we're here to help you make 
            the most of your experience. Dive in and discover all that eLocalPass has to offer!
          </p>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-4">
            {faqData.map((faq) => (
              <div 
                key={faq.id}
                className="bg-white border-2 border-orange-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-orange-50 transition-colors"
                >
                  <span className="text-orange-500 font-semibold text-lg">
                    {faq.question}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-orange-500 transform transition-transform ${
                      expandedItems.includes(faq.id) ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedItems.includes(faq.id) && (
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