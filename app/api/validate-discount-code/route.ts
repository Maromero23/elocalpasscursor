import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.length !== 5) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid discount code format'
      })
    }

    // Find seller with this discount code
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

    if (!seller || !seller.defaultDiscountValue || seller.defaultDiscountValue <= 0) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code not found or inactive'
      })
    }

    return NextResponse.json({
      valid: true,
      sellerId: seller.id,
      sellerName: seller.name,
      discountType: seller.defaultDiscountType,
      discountValue: seller.defaultDiscountValue,
      code: seller.discountCode
    })

  } catch (error) {
    console.error('Error validating discount code:', error)
    return NextResponse.json({
      valid: false,
      message: 'Server error'
    }, { status: 500 })
  }
} 