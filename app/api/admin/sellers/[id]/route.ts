import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"
import bcrypt from "bcryptjs"

// PUT /api/admin/sellers/[id] - Update seller
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password } = await request.json()
    const { id } = params

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if seller exists
    const existingSeller = await prisma.user.findUnique({
      where: { id, role: "SELLER" }
    })

    if (!existingSeller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingSeller.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
    }

    // Only update password if provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update seller
    const updatedSeller = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(updatedSeller)
  } catch (error) {
    console.error("Error updating seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/sellers/[id] - Delete seller
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if seller exists
    const existingSeller = await prisma.user.findUnique({
      where: { id, role: "SELLER" }
    })

    if (!existingSeller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    // Delete seller
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Seller deleted successfully" })
  } catch (error) {
    console.error("Error deleting seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
