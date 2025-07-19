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

  // Calculate price based on pass type and fixed pricing
  useEffect(() => {
    let totalPrice = 0

    if (passType === 'day') {
      // By Day Pass: $15 base + $15 per additional guest
      totalPrice = 15 + (guests - 1) * 15
    } else if (passType === 'week') {
      // Full Week Pass: $79.90 base + $79.90 per additional guest
      totalPrice = 79.90 + (guests - 1) * 79.90
    } else if (passType === 'custom') {
      // Custom Pass: $15 base + $15 per additional guest + $15 per additional day
      totalPrice = 15 + (guests - 1) * 15 + (days - 1) * 15
    }

    console.log('💰 PRICE CALCULATION:', {
      passType,
      guests,
      days,
      totalPrice,
      originalPrice: totalPrice
    })

    setOriginalPrice(totalPrice)
    setCalculatedPrice(totalPrice)
    // Reset discount when price changes
    setDiscountAmount(0)
  }, [guests, days, passType, isOpen]) // Added isOpen dependency

  // Auto-detect discount code and seller tracking from URL parameters (for rebuy emails)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const autoDiscount = urlParams.get('discount')
    const sellerId = urlParams.get('seller_id')
    const customerEmail = urlParams.get('customer_email')
    const customerName = urlParams.get('customer_name') ? decodeURIComponent(urlParams.get('customer_name')!) : null
    
    console.log('🔍 PASS MODAL: URL Parameters detected:', {
      autoDiscount,
      sellerId,
      customerEmail,
      customerName,
      fullUrl: window.location.search
    })
    
    if (autoDiscount) {
      setDiscountCode(autoDiscount)
      console.log(`🎫 PASS MODAL: Auto-detected discount code: ${autoDiscount}`)
      // Validate the auto-detected code
      validateDiscountCode(autoDiscount).then(isValid => {
        if (isValid) {
          setDiscountValid(true)
        } else {
          setDiscountError('Invalid discount code from email link')
        }
      })
    }
    
    if (sellerId) {
      console.log(`🔗 PASS MODAL: Customer came from seller: ${sellerId}`)
      // Store seller ID for commission tracking
      localStorage.setItem('elocalpass-seller-tracking', sellerId)
    }
    
    if (customerName) {
      console.log(`👤 PASS MODAL: Customer name detected: ${customerName}`)
      setCustomerName(customerName)
      console.log(`👤 PASS MODAL: Customer name set to state: ${customerName}`)
    } else {
      console.log(`❌ PASS MODAL: No customer name found in URL parameters`)
    }
    
    if (customerEmail) {
      console.log(`📧 PASS MODAL: Customer email detected: ${customerEmail}`)
      // Store customer email for order processing
      localStorage.setItem('elocalpass-customer-email', customerEmail)
      setCustomerEmail(customerEmail)
      setConfirmEmail(customerEmail) // Auto-fill confirm email
    }
  }, [])

  // Real-time discount code validation
  useEffect(() => {
    if (discountCode && discountCode.length === 5) {
      const validateCode = async () => {
        const isValid = await validateDiscountCode(discountCode)
        if (isValid) {
          setDiscountValid(true)
          setDiscountError(null)
        } else {
          setDiscountValid(false)
          setDiscountError('Invalid discount code')
          // Clear discount when code becomes invalid
          setDiscountAmount(0)
          setCalculatedPrice(originalPrice)
        }
      }
      
      // Debounce validation to avoid too many API calls
      const timeoutId = setTimeout(validateCode, 500)
      return () => clearTimeout(timeoutId)
    } else if (discountCode && discountCode.length > 0) {
      setDiscountValid(false)
      setDiscountError('Discount code must be 5 digits')
      // Clear discount when code format is wrong
      setDiscountAmount(0)
      setCalculatedPrice(originalPrice)
    } else {
      setDiscountValid(null)
      setDiscountError(null)
      // Clear discount when code is empty
      setDiscountAmount(0)
      setCalculatedPrice(originalPrice)
    }
  }, [discountCode])

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
          
          // Calculate discount amount
          const discountPercent = result.discountValue || 0
          const discountAmount = (originalPrice * discountPercent) / 100
          setDiscountAmount(discountAmount)
          setCalculatedPrice(originalPrice - discountAmount)
          
          return true
        }
      }
    } catch (error) {
      console.error('Error validating discount code:', error)
    }
    return false
  }

  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountValid, setDiscountValid] = useState<boolean | null>(null)
  const [originalPrice, setOriginalPrice] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [confirmEmail, setConfirmEmail] = useState<string>('')

  // Initialize price on component mount
  useEffect(() => {
    if (isOpen) {
      let initialPrice = 0
      
      if (passType === 'day') {
        initialPrice = 15 + (guests - 1) * 15
      } else if (passType === 'week') {
        initialPrice = 79.90 + (guests - 1) * 79.90
      } else if (passType === 'custom') {
        initialPrice = 15 + (guests - 1) * 15 + (days - 1) * 15
      }
      
      console.log('🚀 INITIAL PRICE SET:', {
        passType,
        guests,
        days,
        initialPrice
      })
      
      setOriginalPrice(initialPrice)
      setCalculatedPrice(initialPrice)
    }
  }, [isOpen, passType, guests, days])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setDiscountError(null)

    try {
      // Validate that price is greater than 0
      if (calculatedPrice <= 0) {
        setDiscountError('Invalid price. Please check your selection and try again.')
        setIsLoading(false)
        return
      }

      // Validate email confirmation
      if (customerEmail !== confirmEmail) {
        setDiscountError('Email addresses do not match. Please check and try again.')
        setIsLoading(false)
        return
      }

      // Validate discount code if provided
      if (discountCode && discountCode.trim()) {
        const isValid = await validateDiscountCode(discountCode)
        if (!isValid) {
          setDiscountError('Invalid discount code. Please check and try again.')
          setIsLoading(false)
          return
        }
        setDiscountValid(true)
      }

      // Get seller tracking from localStorage if available
      const sellerTracking = localStorage.getItem('elocalpass-seller-tracking')
      
      console.log('💳 PAYMENT SUBMIT:', {
        calculatedPrice,
        originalPrice,
        discountAmount,
        passType,
        guests,
        days,
        customerEmail,
        customerName
      })

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
        customerEmail: customerEmail, // Use form email
        customerName: customerName // Use form name
      }

      // Redirect to PayPal with order data
      const paypalUrl = new URL('https://www.sandbox.paypal.com/cgi-bin/webscr')
      paypalUrl.searchParams.set('cmd', '_xclick')
      paypalUrl.searchParams.set('business', 'sb-wtnhb38075507@business.example.com') // Your sandbox business email
      paypalUrl.searchParams.set('item_name', `ELocalPass ${passType.toUpperCase()} - ${guests} guests, ${days} days`)
      paypalUrl.searchParams.set('amount', calculatedPrice.toFixed(2))
      paypalUrl.searchParams.set('currency_code', 'USD')
      paypalUrl.searchParams.set('return', `${window.location.origin}/payment-success`)
      paypalUrl.searchParams.set('cancel_return', `${window.location.origin}/payment/cancel`)
      
      // Enable automatic return and PDT (Payment Data Transfer)
      paypalUrl.searchParams.set('rm', '2') // Return method: POST with payment data
      paypalUrl.searchParams.set('no_shipping', '1') // No shipping address required
      paypalUrl.searchParams.set('no_note', '1') // No note from customer
      
      // Add IPN (Instant Payment Notification) URL for webhook
      paypalUrl.searchParams.set('notify_url', `${window.location.origin}/api/paypal/webhook`)
      
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
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  value="now"
                  checked={deliveryType === 'now'}
                  onChange={(e) => setDeliveryType(e.target.value as 'now' | 'future')}
                  className="mr-2"
                />
                <span className="text-gray-900 font-medium">Immediate delivery</span>
              </label>
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  value="future"
                  checked={deliveryType === 'future'}
                  onChange={(e) => setDeliveryType(e.target.value as 'now' | 'future')}
                  className="mr-2"
                />
                <span className="text-gray-900 font-medium">Schedule delivery</span>
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
              onChange={(e) => {
                setDiscountCode(e.target.value)
                setDiscountError(null) // Clear error when user types
                setDiscountValid(null)
              }}
              placeholder="Enter discount code"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                discountError ? 'border-red-500' : discountValid ? 'border-green-500' : 'border-gray-300'
              }`}
            />
            {discountError && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {discountError}
              </p>
            )}
            {discountValid && (
              <p className="text-green-500 text-sm mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid discount code applied
              </p>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Address *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Confirm Email Address *
              </label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Confirm your email address"
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  confirmEmail && customerEmail !== confirmEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {confirmEmail && customerEmail !== confirmEmail && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Email addresses do not match
                </p>
              )}
            </div>
          </div>

          {/* Price Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Price:</span>
              <div className="text-right">
                {discountAmount > 0 ? (
                  <>
                    <div className="text-lg text-gray-500 line-through font-semibold" style={{textDecorationColor: 'red'}}>
                      ${originalPrice.toFixed(2)} USD
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      ${calculatedPrice.toFixed(2)} USD
                    </span>
                    <div className="text-sm text-green-600 font-semibold">
                      -${discountAmount.toFixed(2)} discount applied
                    </div>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-orange-600">
                    ${calculatedPrice.toFixed(2)} USD
                  </span>
                )}
              </div>
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