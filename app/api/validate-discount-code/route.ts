import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({
        valid: false,
        message: 'No discount code provided'
      })
    }

    console.log(`🎫 DISCOUNT VALIDATION: Validating code "${code}" (length: ${code.length})`)

    // 🐛 BUG FIX: Handle both regular seller codes (5 chars) and rebuy email codes (variable length)
    
    // CASE 1: Regular seller discount codes (5 characters, e.g., "ABCD1")
    if (code.length === 5) {
      console.log(`🔍 DISCOUNT VALIDATION: Checking regular seller code: ${code}`)
      
      const seller = await prisma.user.findFirst({
        where: { 
          discountCode: code,
          OR: [
            { role: 'SELLER' },
            { role: 'INDEPENDENT_SELLER' }
          ]
        },
        select: {
          id: true,
          name: true,
          defaultDiscountType: true,
          defaultDiscountValue: true,
          discountCode: true
        }
      })

      if (seller && seller.defaultDiscountValue && seller.defaultDiscountValue > 0) {
        console.log(`✅ DISCOUNT VALIDATION: Valid seller code for ${seller.name} (${seller.defaultDiscountValue}% off)`)
        return NextResponse.json({
          valid: true,
          sellerId: seller.id,
          sellerName: seller.name,
          discountType: seller.defaultDiscountType,
          discountValue: seller.defaultDiscountValue,
          code: seller.discountCode,
          codeType: 'seller'
        })
      }
    }

    // CASE 2: Rebuy email discount codes (variable length, e.g., "REBUY15", "SELLER10PCT")
    console.log(`🔍 DISCOUNT VALIDATION: Checking rebuy email code patterns: ${code}`)
    
    // Pattern 1: REBUY{value} (e.g., "REBUY15")
    const rebuyMatch = code.match(/^REBUY(\d+)$/)
    if (rebuyMatch) {
      const discountValue = parseInt(rebuyMatch[1])
      console.log(`✅ DISCOUNT VALIDATION: Valid rebuy code REBUY${discountValue}`)
      return NextResponse.json({
        valid: true,
        sellerId: null, // Rebuy codes don't have specific sellers - seller comes from URL parameter
        sellerName: 'Rebuy Email',
        discountType: 'percentage',
        discountValue: discountValue,
        code: code,
        codeType: 'rebuy'
      })
    }

    // Pattern 2: SELLER{value}PCT (e.g., "SELLER10PCT")
    const sellerPctMatch = code.match(/^SELLER(\d+)PCT$/)
    if (sellerPctMatch) {
      const discountValue = parseInt(sellerPctMatch[1])
      console.log(`✅ DISCOUNT VALIDATION: Valid seller default code SELLER${discountValue}PCT`)
      return NextResponse.json({
        valid: true,
        sellerId: null, // Seller comes from URL parameter
        sellerName: 'Seller Default',
        discountType: 'percentage',
        discountValue: discountValue,
        code: code,
        codeType: 'seller_default'
      })
    }

    // Pattern 3: SELLER{value}USD (e.g., "SELLER5USD")
    const sellerUsdMatch = code.match(/^SELLER(\d+)USD$/)
    if (sellerUsdMatch) {
      const discountValue = parseInt(sellerUsdMatch[1])
      console.log(`✅ DISCOUNT VALIDATION: Valid seller default code SELLER${discountValue}USD`)
      return NextResponse.json({
        valid: true,
        sellerId: null, // Seller comes from URL parameter
        sellerName: 'Seller Default',
        discountType: 'fixed',
        discountValue: discountValue,
        code: code,
        codeType: 'seller_default'
      })
    }

    console.log(`❌ DISCOUNT VALIDATION: No matching pattern found for code: ${code}`)
    return NextResponse.json({
      valid: false,
      message: 'Discount code not found or invalid format'
    })

  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json({
      valid: false,
      message: 'Server error'
    }, { status: 500 })
  }
} 