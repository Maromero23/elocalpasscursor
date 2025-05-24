import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

// POST /api/admin/qr-config - Create new QR configuration for a seller
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      sellerId,
      sendMethod,
      landingPageRequired,
      allowCustomGuestsDays,
      pricingType,
      sendRebuyEmail,
      defaultGuests,
      defaultDays,
      fixedPrice
    } = await request.json()

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 })
    }

    // Check if seller exists and is a SELLER
    const seller = await prisma.user.findUnique({
      where: { 
        id: sellerId,
        role: "SELLER"
      }
    })

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 })
    }

    // Check if seller already has a configuration
    const existingConfig = await prisma.qRConfig.findUnique({
      where: { sellerId }
    })

    if (existingConfig) {
      return NextResponse.json({ error: "This seller already has a configuration" }, { status: 400 })
    }

    // Create configuration
    const config = await prisma.qRConfig.create({
      data: {
        sellerId,
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

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error creating QR config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
