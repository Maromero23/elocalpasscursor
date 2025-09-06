import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"

// PUT /api/admin/qr-config/[id] - Update QR configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      sendMethod,
      landingPageRequired,
      allowCustomGuestsDays,
      pricingType,
      sendRebuyEmail,
      defaultGuests,
      defaultDays,
      fixedPrice
    } = await request.json()

    const { id } = params

    // Check if config exists
    const existingConfig = await prisma.qRConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 })
    }

    // Update configuration
    const updatedConfig = await prisma.qRConfig.update({
      where: { id },
      data: {
        sendMethod: sendMethod || "URL",
        landingPageRequired: landingPageRequired ?? true,
        allowCustomGuestsDays: allowCustomGuestsDays ?? false,
        pricingType: pricingType || "FIXED",
        sendRebuyEmail: sendRebuyEmail ?? false,
        defaultGuests: defaultGuests || 2,
        defaultDays: defaultDays || 3,
        fixedPrice: pricingType === "FIXED" ? fixedPrice : null
      }
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error("Error updating QR config:", error)
    return NextResponse.json({ error: "Internal server error" } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}

// DELETE /api/admin/qr-config/[id] - Delete QR configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if config exists
    const existingConfig = await prisma.qRConfig.findUnique({
      where: { id }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 })
    }

    // Delete configuration
    await prisma.qRConfig.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Configuration deleted successfully" })
  } catch (error) {
    console.error("Error deleting QR config:", error)
    return NextResponse.json({ error: "Internal server error" } finally {
    await prisma.$disconnect()
  }, { status: 500 })
  }
}
