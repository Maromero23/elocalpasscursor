import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

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

    // Get current location status using raw query
    const location = await prisma.$queryRaw`
      SELECT id, name, isActive, userId, distributorId FROM Location WHERE id = ${id}
    `

    if (!location || (location as any[]).length === 0) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const currentLocation = (location as any[])[0]
    const newStatus = !currentLocation.isActive

    // Update location and cascade to sellers only (don't affect distributor)
    await prisma.$transaction(async (tx) => {
      // Update location
      await tx.$executeRaw`
        UPDATE Location SET isActive = ${newStatus} WHERE id = ${id}
      `
      
      // Update location's user
      await tx.$executeRaw`
        UPDATE User SET isActive = ${newStatus} WHERE id = ${currentLocation.userId}
      `

      // Get all sellers for this location and update them
      const sellers = await tx.$queryRaw`
        SELECT id FROM User WHERE locationId = ${id} AND role = 'SELLER'
      `
      
      for (const seller of sellers as any[]) {
        await tx.$executeRaw`
          UPDATE User SET isActive = ${newStatus} WHERE id = ${seller.id}
        `
      }
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Location ${newStatus ? 'activated' : 'deactivated'} successfully with all related sellers`
    })

  } catch (error) {
    console.error("Toggle location status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle location status" },
      { status: 500 }
    )
  }
}
