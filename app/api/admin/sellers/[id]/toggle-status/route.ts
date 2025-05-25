import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { prisma } from "../../../../../../lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get current seller status
    const seller = await prisma.user.findUnique({
      where: { id }
    })

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    const newStatus = !seller.isActive

    // Update seller status
    await prisma.user.update({
      where: { id },
      data: { isActive: newStatus }
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Seller ${newStatus ? 'activated' : 'deactivated'}` 
    })

  } catch (error) {
    console.error("Toggle seller status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle seller status" },
      { status: 500 }
    )
  }
}
