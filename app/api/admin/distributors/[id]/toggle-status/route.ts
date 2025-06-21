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

    // Get current distributor status using PostgreSQL syntax
    const distributor = await prisma.$queryRaw`
      SELECT id, name, "isActive", "userId" FROM "Distributor" WHERE id = ${id}
    `

    if (!distributor || (distributor as any[]).length === 0) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 })
    }

    const currentDistributor = (distributor as any[])[0]
    const newStatus = !currentDistributor.isActive

    // Update distributor status using PostgreSQL syntax
    await prisma.$executeRaw`
      UPDATE "Distributor" SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${id}
    `

    // Also update the associated user status using PostgreSQL syntax
    await prisma.$executeRaw`
      UPDATE users SET "isActive" = ${newStatus}, "updatedAt" = NOW() WHERE id = ${currentDistributor.userId}
    `

    return NextResponse.json({
      success: true,
      isActive: newStatus,
      message: `Distributor ${newStatus ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error("Error toggling distributor status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
