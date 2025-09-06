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
  { params }: { params: { sellerId: string } }
) {
  console.log("🔥 SELLER TOGGLE API CALLED:", params.sellerId)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log("❌ Unauthorized access to seller toggle")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sellerId } = params
    console.log("✅ Seller toggle authorized for:", sellerId)

    const prisma = new PrismaClient()

    // Get current seller status using PostgreSQL syntax
    const seller = await prisma.$queryRaw`
      SELECT "isActive", "locationId", "distributorId" FROM users WHERE id = ${sellerId} AND (role = 'SELLER' OR role = 'INDEPENDENT_SELLER')
    ` as any[]

    if (!seller || seller.length === 0) {
      console.log("❌ Seller not found")
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    const currentSeller = seller[0]
    const newStatus = !currentSeller.isActive
    console.log("🔄 Toggling seller from", currentSeller.isActive, "to", newStatus)

    // If trying to activate, check if parent location and distributor are active
    if (newStatus === true) {
      // Check if location is active
      if (currentSeller.locationId) {
        const location = await prisma.$queryRaw`
          SELECT "isActive" FROM "Location" WHERE id = ${currentSeller.locationId}
        ` as any[]
        
        if (location.length > 0 && !location[0].isActive) {
          console.log("❌ Cannot activate seller: location is inactive")
          return NextResponse.json({ 
            error: "Cannot activate seller: location must be active first" 
          }, { status: 400 })
        }
      }

      // Check if distributor is active
      if (currentSeller.distributorId) {
        const distributor = await prisma.$queryRaw`
          SELECT "isActive" FROM "Distributor" WHERE id = ${currentSeller.distributorId}
        ` as any[]
        
        if (distributor.length > 0 && !distributor[0].isActive) {
          console.log("❌ Cannot activate seller: distributor is inactive")
          return NextResponse.json({ 
            error: "Cannot activate seller: distributor must be active first" 
          }, { status: 400 })
        }
      }
    }

    // Update seller status
    await prisma.$executeRaw`
      UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${sellerId}
    `
    console.log("✅ Seller updated")

    console.log("🎉 Seller toggle completed successfully")
    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Seller ${newStatus ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error("💥 Toggle seller status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle seller status" } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
} 