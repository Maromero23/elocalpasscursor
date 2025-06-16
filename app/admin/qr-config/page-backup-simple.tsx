'use client'

import { useState, useEffect } from 'react'

export default function QRConfigPage() {
  const [savedButtons, setSavedButtons] = useState(new Set())
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qr-saved-buttons')
      if (saved) {
        setSavedButtons(new Set(JSON.parse(saved)))
      }
    } catch (error) {
      console.error('Failed to load saved buttons:', error)
    }
  }, [])
  
  const saveButton = (buttonNumber) => {
    const newSaved = new Set(savedButtons)
    newSaved.add(buttonNumber)
    setSavedButtons(newSaved)
    localStorage.setItem('qr-saved-buttons', JSON.stringify(Array.from(newSaved)))
  }
  
  const clearAllSaved = () => {
    setSavedButtons(new Set())
    localStorage.removeItem('qr-saved-buttons')
  }
  
  const isButtonSaved = (buttonNumber) => savedButtons.has(buttonNumber)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">QR Configuration System</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Progress</h2>
            <button 
              onClick={clearAllSaved}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Progress
            </button>
          </div>
          
          <div className="flex space-x-4 mb-8">
            {[1, 2, 3, 4, 5].map(num => (
              <div 
                key={num}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${isButtonSaved(num) ? 'bg-green-500' : 'bg-gray-400'}`}
              >
                {isButtonSaved(num) ? '✓' : num}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Configuration {num}</h3>
                <button 
                  onClick={() => saveButton(num)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save {num}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}