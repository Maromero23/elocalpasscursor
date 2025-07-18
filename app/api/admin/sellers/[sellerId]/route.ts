import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// Generate unique 5-digit discount code
async function generateUniqueDiscountCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 100
  
  while (attempts < maxAttempts) {
    // Generate random 5-digit number
    const code = Math.floor(10000 + Math.random() * 90000).toString()
    
    // For now, just return the code - uniqueness will be enforced by database constraint
    // TODO: Add proper uniqueness check once Prisma client is updated
    return code
    
    attempts++
  }
  
  throw new Error('Unable to generate unique discount code after 100 attempts')
}

// PUT /api/admin/sellers/[sellerId] - Update seller and QR configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sellerId = params.sellerId
    const body = await request.json()
    const { name, email, password, telephone, whatsapp, notes, defaultDiscountType, defaultDiscountValue, discountCode } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        error: "Name and email are required" 
      }, { status: 400 })
    }

    // Auto-generate unique discount code if not provided and discount is set
    let finalDiscountCode = discountCode
    if (!discountCode && defaultDiscountValue && defaultDiscountValue > 0) {
      finalDiscountCode = await generateUniqueDiscountCode()
      console.log(`🎲 Auto-generated discount code: ${finalDiscountCode} for seller ${name}`)
    }

    // Check if seller exists
    const existingSeller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { sellerConfigs: true }
    })

    if (!existingSeller || existingSeller.role !== "SELLER") {
      return NextResponse.json({ 
        error: "Seller not found" 
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      telephone: telephone || null,
      whatsapp: whatsapp || null,
      notes: notes || null,
      defaultDiscountType: defaultDiscountType || null,
      defaultDiscountValue: defaultDiscountValue || null,
      discountCode: finalDiscountCode || null
    }

    // Only update password if provided
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update seller basic info only
    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: updateData,
      include: {
        location: {
          include: {
            distributor: true
          }
        },
        sellerConfigs: true
      }
    })

    return NextResponse.json({
      message: "Seller updated successfully",
      seller: updatedSeller,
      generatedDiscountCode: finalDiscountCode !== discountCode ? finalDiscountCode : null
    })

  } catch (error) {
    console.error("Error updating seller:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/sellers/[sellerId] - Delete seller
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sellerId = params.sellerId

    // Check if seller exists
    const existingSeller = await prisma.user.findUnique({
      where: { id: sellerId }
    })

    if (!existingSeller || existingSeller.role !== "SELLER") {
      return NextResponse.json({ 
        error: "Seller not found" 
      }, { status: 404 })
    }

    // Delete seller and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete QR configuration first (if exists)
      await tx.qRConfig.deleteMany({
        where: { sellerId: sellerId }
      })

      // Delete the seller
      await tx.user.delete({
        where: { id: sellerId }
      })
    })

    return NextResponse.json({
      message: "Seller deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting seller:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
