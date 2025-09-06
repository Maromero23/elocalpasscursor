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
  console.log("🔥 DISTRIBUTOR TOGGLE API CALLED:", params.id)
  
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "ADMIN") {
      console.log("❌ Unauthorized access to distributor toggle")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    console.log("✅ Distributor toggle authorized for:", id)

    // Get current distributor status using PostgreSQL syntax
    const distributor = await prisma.$queryRaw`
      SELECT id, name, "isActive", "userId" FROM "Distributor" WHERE id = ${id}
    `

    if (!distributor || (distributor as any[]).length === 0) {
      console.log("❌ Distributor not found")
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const currentDistributor = (distributor as any[])[0]
    const newStatus = !currentDistributor.isActive
    console.log("🔄 Toggling distributor from", currentDistributor.isActive, "to", newStatus)

    // Update distributor and cascade to all locations and sellers
    await prisma.$transaction(async (tx) => {
      // 1. Update distributor using PostgreSQL syntax
      await tx.$executeRaw`
        UPDATE "Distributor" SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${id}
      `
      console.log("✅ Distributor updated")

      // 2. Update the distributor's user using PostgreSQL syntax
      await tx.$executeRaw`
        UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${currentDistributor.userId}
      `
      console.log("✅ Distributor user updated")

      // 3. Get all locations for this distributor and update them
      const locations = await tx.$queryRaw`
        SELECT id, "userId" FROM "Location" WHERE "distributorId" = ${id}
      `
      
      console.log("📋 Found", (locations as any[]).length, "locations to update")
      
      for (const location of locations as any[]) {
        // Update location
        await tx.$executeRaw`
          UPDATE "Location" SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${location.id}
        `
        
        // Update location's user
        if (location.userId) {
          await tx.$executeRaw`
            UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${location.userId}
          `
        }
      }
      console.log("✅ All locations updated")

      // 4. Get all sellers for this distributor and update them
      const sellers = await tx.$queryRaw`
        SELECT id FROM users WHERE "distributorId" = ${id} AND (role = 'SELLER' OR role = 'INDEPENDENT_SELLER')
      `
      
      console.log("📋 Found", (sellers as any[]).length, "sellers to update")
      
      for (const seller of sellers as any[]) {
        await tx.$executeRaw`
          UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${seller.id}
        `
      }
      console.log("✅ All sellers updated")
    })

    console.log("🎉 Distributor toggle completed successfully with full cascade")
    return NextResponse.json({
      success: true,
      isActive: newStatus,
      message: `Distributor ${newStatus ? 'activated' : 'deactivated'} successfully with all locations and sellers`
    })

  } catch (error) {
    console.error("💥 Toggle distributor status error:", error)
    return NextResponse.json({ error: "Internal server error" } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}
