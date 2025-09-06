import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "LOCATION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the location data for this LOCATION user
    const locationData = await prisma.location.findFirst({
      where: { 
        userId: session.user.id  // Location users have a unique userId
      },
      include: {
        sellers: {
          include: {
            qrCodes: {
              include: {
                scans: true
              }
            },
            sellerConfigs: true
          }
        }
      }
    })

    if (!locationData) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const response = {
      id: locationData.id,
      name: locationData.name,
      sellers: locationData.sellers.map((seller: any) => ({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        qrCodes: seller.qrCodes.map((qr: any) => ({
          id: qr.id,
          guestLimit: qr.guestLimit,
          cost: qr.cost,
          expiresAt: qr.expiresAt,
          isActive: qr.isActive,
          scans: qr.scans.map((scan: any) => ({
            id: scan.id,
            scannedAt: scan.scannedAt
          }))
        })),
        sellerConfigs: seller.sellerConfigs.map((config: any) => ({
          id: config.id,
          sendMethod: config.sendMethod,
          landingPageRequired: config.landingPageRequired,
          allowCustomGuests: config.allowCustomGuests,
          pricingType: config.pricingType,
          sendRebuyEmail: config.sendRebuyEmail
        }))
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching location dashboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch location data" } finally {
    await prisma.$disconnect()
  },
      { status: 500 }
    )
  }
}
