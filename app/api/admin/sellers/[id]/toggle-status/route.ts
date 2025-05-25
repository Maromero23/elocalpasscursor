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

    // Get current seller status using raw query
    const seller = await prisma.$queryRaw`
      SELECT id, name, isActive, role FROM users WHERE id = ${id} AND role = 'SELLER'
    `

    if (!seller || (seller as any[]).length === 0) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    const currentSeller = (seller as any[])[0]
    const newStatus = !currentSeller.isActive

    // Update only the individual seller (no cascading)
    await prisma.$executeRaw`
      UPDATE users SET isActive = ${newStatus} WHERE id = ${id}
    `

    return NextResponse.json({ 
      success: true, 
      isActive: newStatus,
      message: `Seller ${newStatus ? 'activated' : 'deactivated'} successfully`
    })

  } catch (error) {
    console.error("Toggle seller status error:", error)
    return NextResponse.json(
      { error: "Failed to toggle seller status" },
      { status: 500 }
    )
  }
}
