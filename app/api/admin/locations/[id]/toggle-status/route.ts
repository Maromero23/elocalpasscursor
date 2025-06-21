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
  console.log("🔥 LOCATION TOGGLE API CALLED:", params.id)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log("❌ Unauthorized access to location toggle")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    console.log("✅ Location toggle authorized for:", id)

    const prisma = new PrismaClient()

    // Get current location status using PostgreSQL syntax
    const location = await prisma.$queryRaw`
      SELECT "isActive" FROM "Location" WHERE id = ${id}
    ` as any[]

    if (!location || location.length === 0) {
      console.log("❌ Location not found")
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const currentLocation = location[0]
    const newStatus = !currentLocation.isActive
    console.log("🔄 Toggling location from", currentLocation.isActive, "to", newStatus)

    // Update location and cascade to sellers only (don't affect distributor)
    await prisma.$transaction(async (tx) => {
      // Update location using PostgreSQL syntax
      await tx.$executeRaw`
        UPDATE "Location" SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${id}
      `
      console.log("✅ Location updated")
      
      // Update location's user using PostgreSQL syntax
      await tx.$executeRaw`
        UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = (SELECT "userId" FROM "Location" WHERE id = ${id})
      `
      console.log("✅ Location user updated")

      // Get all sellers for this location and update them using PostgreSQL syntax
      const sellers = await tx.$queryRaw`
        SELECT id FROM users WHERE "locationId" = ${id} AND role = 'SELLER'
      `
      
      console.log("📋 Found", (sellers as any[]).length, "sellers to update")
      
      for (const seller of sellers as any[]) {
        await tx.$executeRaw`
          UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${seller.id}
        `
      }
      console.log("✅ All sellers updated")
    })

    console.log("🎉 Location toggle completed successfully")
    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Location ${newStatus ? 'activated' : 'deactivated'} successfully with all related sellers`
    })

  } catch (error) {
    console.error("💥 Toggle location status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle location status" },
      { status: 500 }
    )
  }
}
