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

    // Get current location status
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        sellers: true
      }
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const newStatus = !location.isActive

    // Update location and cascade to all sellers
    await prisma.$transaction(async (tx) => {
      // Update location status
      await tx.location.update({
        where: { id },
        data: { isActive: newStatus }
      })

      // Update all sellers under this location
      const sellerIds = location.sellers.map(seller => seller.id)
      if (sellerIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: sellerIds } },
          data: { isActive: newStatus }
        })
      }

      // Also update the location's user account
      await tx.user.update({
        where: { id: location.userId },
        data: { isActive: newStatus }
      })
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Location and all sellers ${newStatus ? 'activated' : 'deactivated'}` 
    })

  } catch (error) {
    console.error("Toggle location status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle location status" },
      { status: 500 }
    )
  }
}
