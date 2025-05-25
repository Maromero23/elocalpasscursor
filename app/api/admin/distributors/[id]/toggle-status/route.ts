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

    // Get current distributor status using raw query to avoid model issues
    const distributor = await prisma.$queryRaw`
      SELECT id, name, isActive, userId FROM Distributor WHERE id = ${id}
    `

    if (!distributor || (distributor as any[]).length === 0) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const currentDistributor = (distributor as any[])[0]
    const newStatus = !currentDistributor.isActive

    // Update distributor and cascade using raw SQL to avoid model issues
    await prisma.$transaction(async (tx) => {
      // Update distributor
      await tx.$executeRaw`
        UPDATE Distributor SET isActive = ${newStatus} WHERE id = ${id}
      `
      
      // Update distributor's user
      await tx.$executeRaw`
        UPDATE User SET isActive = ${newStatus} WHERE id = ${currentDistributor.userId}
      `

      // Get all locations for this distributor
      const locations = await tx.$queryRaw`
        SELECT id, userId FROM Location WHERE distributorId = ${id}
      `

      // Update all locations and their users
      for (const location of locations as any[]) {
        await tx.$executeRaw`
          UPDATE Location SET isActive = ${newStatus} WHERE id = ${location.id}
        `
        await tx.$executeRaw`
          UPDATE User SET isActive = ${newStatus} WHERE id = ${location.userId}
        `

        // Get all sellers for this location and update them
        const sellers = await tx.$queryRaw`
          SELECT id FROM User WHERE locationId = ${location.id} AND role = 'SELLER'
        `
        
        for (const seller of sellers as any[]) {
          await tx.$executeRaw`
            UPDATE User SET isActive = ${newStatus} WHERE id = ${seller.id}
          `
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Distributor ${newStatus ? 'activated' : 'deactivated'} successfully with all related locations and sellers`
    })

  } catch (error) {
    console.error("Toggle distributor status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle distributor status" },
      { status: 500 }
    )
  }
}
