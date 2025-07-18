'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Users, Clock, CreditCard, Gift } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

interface PassSelectionModalProps {
  passType: 'day' | 'week' | 'custom'
  isOpen: boolean
  onClose: () => void
}

interface PricingConfig {
  button2VariableBasePrice: number
  button2VariableGuestIncrease: number
  button2VariableDayIncrease: number
  button2VariableCommission: number
  button2IncludeTax: boolean
  button2TaxPercentage: number
}

export default function PassSelectionModal({ passType, isOpen, onClose }: PassSelectionModalProps) {
  const { t, language } = useTranslation()
  const [guests, setGuests] = useState(1)
  const [days, setDays] = useState(passType === 'day' ? 1 : passType === 'week' ? 7 : 1)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [deliveryType, setDeliveryType] = useState<'now' | 'future'>('now')
  const [discountCode, setDiscountCode] = useState('')
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null)
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Load pricing configuration from global QR config
  useEffect(() => {
    const loadPricingConfig = async () => {
      try {
        const response = await fetch('/api/admin/qr-global-config')
        if (response.ok) {
          const config = await response.json()
          setPricingConfig({
            button2VariableBasePrice: config.button2VariableBasePrice || 10,
            button2VariableGuestIncrease: config.button2VariableGuestIncrease || 5,
            button2VariableDayIncrease: config.button2VariableDayIncrease || 3,
            button2VariableCommission: config.button2VariableCommission || 0,
            button2IncludeTax: config.button2IncludeTax || false,
            button2TaxPercentage: config.button2TaxPercentage || 0
          })
        }
      } catch (error) {
        console.error('Error loading pricing config:', error)
      }
    }

    if (isOpen) {
      loadPricingConfig()
    }
  }, [isOpen])

  // Calculate price based on current configuration
  useEffect(() => {
    if (!pricingConfig) return

    let basePrice = pricingConfig.button2VariableBasePrice
    let guestPrice = (guests - 1) * pricingConfig.button2VariableGuestIncrease
    let dayPrice = (days - 1) * pricingConfig.button2VariableDayIncrease
    
    let totalPrice = basePrice + guestPrice + dayPrice

    // Add commission if configured
    if (pricingConfig.button2VariableCommission > 0) {
      totalPrice += (totalPrice * pricingConfig.button2VariableCommission / 100)
    }

    // Add tax if configured
    if (pricingConfig.button2IncludeTax && pricingConfig.button2TaxPercentage > 0) {
      totalPrice += (totalPrice * pricingConfig.button2TaxPercentage / 100)
    }

    setCalculatedPrice(totalPrice)
  }, [guests, days, pricingConfig])

  // Auto-detect discount code and seller tracking from URL parameters (for rebuy emails)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const autoDiscount = urlParams.get('discount')
    const sellerId = urlParams.get('seller_id')
    const customerEmail = urlParams.get('customer_email')
    
    if (autoDiscount) {
      setDiscountCode(autoDiscount)
      console.log(`🎫 PASS MODAL: Auto-detected discount code: ${autoDiscount}`)
    }
    
    if (sellerId) {
      console.log(`🔗 PASS MODAL: Customer came from seller: ${sellerId}`)
      // Store seller ID for commission tracking
      localStorage.setItem('elocalpass-seller-tracking', sellerId)
    }
    
    if (customerEmail) {
      console.log(`📧 PASS MODAL: Customer email detected: ${customerEmail}`)
      // Store customer email for order processing
      localStorage.setItem('elocalpass-customer-email', customerEmail)
    }
  }, [])

  // Validate discount code function
  const validateDiscountCode = async (code: string) => {
    if (!code || code.length !== 5) return false
    
    try {
      const response = await fetch(`/api/validate-discount-code?code=${code}`)
      if (response.ok) {
        const result = await response.json()
        if (result.valid) {
          // Store seller info for commission tracking
          localStorage.setItem('elocalpass-seller-tracking', result.sellerId)
          console.log(`✅ PASS MODAL: Valid discount code ${code} for seller ${result.sellerId}`)
          return true
        }
      }
    } catch (error) {
      console.error('Error validating discount code:', error)
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get seller tracking and customer email from localStorage if available
      const sellerTracking = localStorage.getItem('elocalpass-seller-tracking')
      const customerEmail = localStorage.getItem('elocalpass-customer-email')
      
      // Create the pass order
      const orderData = {
        passType,
        guests,
        days,
        deliveryType,
        deliveryDate: deliveryType === 'future' ? deliveryDate : null,
        deliveryTime: deliveryType === 'future' ? deliveryTime : null,
        discountCode: discountCode || null,
        calculatedPrice,
        sellerId: sellerTracking || null, // Track which seller referred this customer
        customerEmail: customerEmail || '', // Use detected customer email
        customerName: '' // Will be collected in PayPal flow
      }

      // Redirect to PayPal with order data
      const paypalUrl = new URL('https://www.paypal.com/cgi-bin/webscr')
      paypalUrl.searchParams.set('cmd', '_xclick')
      paypalUrl.searchParams.set('business', process.env.NEXT_PUBLIC_PAYPAL_EMAIL || 'your-paypal@email.com')
      paypalUrl.searchParams.set('item_name', `ELocalPass ${passType.toUpperCase()} - ${guests} guests, ${days} days`)
      paypalUrl.searchParams.set('amount', calculatedPrice.toFixed(2))
      paypalUrl.searchParams.set('currency_code', 'USD')
      paypalUrl.searchParams.set('return', `${window.location.origin}/payment/success`)
      paypalUrl.searchParams.set('cancel_return', `${window.location.origin}/payment/cancel`)
      
      // Add custom data for order processing
      paypalUrl.searchParams.set('custom', JSON.stringify(orderData))

      window.location.href = paypalUrl.toString()
    } catch (error) {
      console.error('Error processing order:', error)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {passType === 'day' && 'By Day Pass'}
            {passType === 'week' && 'Full Week Pass'}
            {passType === 'custom' && 'Custom Pass'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Guests Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Number of Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          {/* Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Number of Days
            </label>
            {passType === 'day' ? (
              <div className="text-gray-600 py-2">1 day (fixed)</div>
            ) : passType === 'week' ? (
              <div className="text-gray-600 py-2">7 days (fixed)</div>
            ) : (
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Delivery Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Delivery
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="now"
                  checked={deliveryType === 'now'}
                  onChange={(e) => setDeliveryType(e.target.value as 'now' | 'future')}
                  className="mr-2"
                />
                <span>Deliver now</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="future"
                  checked={deliveryType === 'future'}
                  onChange={(e) => setDeliveryType(e.target.value as 'now' | 'future')}
                  className="mr-2"
                />
                <span>Schedule for later</span>
              </label>
            </div>

            {deliveryType === 'future' && (
              <div className="mt-3 space-y-3">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          {/* Discount Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Gift className="w-4 h-4 inline mr-2" />
              Discount Code (Optional)
            </label>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter discount code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Price Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Price:</span>
              <span className="text-2xl font-bold text-orange-600">
                ${calculatedPrice.toFixed(2)} USD
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {guests} {guests === 1 ? 'guest' : 'guests'} × {days} {days === 1 ? 'day' : 'days'}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with PayPal
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 