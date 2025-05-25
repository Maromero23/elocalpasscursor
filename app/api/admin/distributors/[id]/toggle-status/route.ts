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

    // Get current distributor status
    const distributor = await prisma.distributor.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            sellers: true
          }
        }
      }
    })

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const newStatus = !distributor.isActive

    // Update distributor and cascade to all locations and sellers
    await prisma.$transaction(async (tx) => {
      // Update distributor status
      await tx.distributor.update({
        where: { id },
        data: { isActive: newStatus }
      })

      // Update all locations under this distributor
      const locationIds = distributor.locations.map(loc => loc.id)
      if (locationIds.length > 0) {
        await tx.location.updateMany({
          where: { id: { in: locationIds } },
          data: { isActive: newStatus }
        })
      }

      // Update all sellers under these locations
      const sellerIds = distributor.locations.flatMap(loc => 
        loc.sellers.map(seller => seller.id)
      )
      if (sellerIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: sellerIds } },
          data: { isActive: newStatus }
        })
      }

      // Also update the distributor's user account
      await tx.user.update({
        where: { id: distributor.userId },
        data: { isActive: newStatus }
      })
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Distributor and all related locations and sellers ${newStatus ? 'activated' : 'deactivated'}` 
    })

  } catch (error) {
    console.error("Toggle distributor status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle distributor status" },
      { status: 500 }
    )
  }
}
