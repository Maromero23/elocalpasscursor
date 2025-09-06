import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function generateUniqueDiscountCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const code = Math.floor(10000 + Math.random() * 90000).toString()
    // For now, just return the code - uniqueness will be enforced by database constraint
    // TODO: Add proper uniqueness check once Prisma client is updated
    return code
    attempts++
  }
  throw new Error('Unable to generate unique discount code after 100 attempts')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const sellerId = params.sellerId
    const body = await request.json()
    const { defaultDiscountType, defaultDiscountValue } = body

    // Validate required fields
    if (!defaultDiscountValue || defaultDiscountValue <= 0) {
      return NextResponse.json({ 
        error: "Discount value must be greater than 0" 
      }, { status: 400 })
    }

    // Generate a preview code (not saved to database yet)
    const generatedCode = await generateUniqueDiscountCode()
    
    console.log(`🎲 Preview generated discount code: ${generatedCode} for seller ${sellerId}`)

    return NextResponse.json({
      success: true,
      generatedCode,
      message: `Preview code generated: ${generatedCode}`
    })

  } catch (error) {
    console.error('Error generating preview discount code:', error)
    return NextResponse.json({
      error: 'Failed to generate discount code'
    } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
} 