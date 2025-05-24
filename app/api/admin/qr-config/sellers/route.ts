import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../../lib/auth"
import { prisma } from "../../../../../lib/prisma"

// GET /api/admin/qr-config/sellers - Fetch all sellers with their QR configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sellers = await prisma.user.findMany({
      where: {
        role: "SELLER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sellerConfigs: {
          select: {
            id: true,
            sellerId: true,
            sendMethod: true,
            landingPageRequired: true,
            allowCustomGuestsDays: true,
            defaultGuests: true,
            defaultDays: true,
            pricingType: true,
            fixedPrice: true,
            sendRebuyEmail: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    // Transform the data to include qrConfig at the top level
    const sellersWithConfigs = sellers.map((seller: {
      id: string;
      name: string;
      email: string;
      role: string;
      sellerConfigs: Array<{
        id: string;
        sellerId: string;
        sendMethod: string;
        landingPageRequired: boolean;
        allowCustomGuestsDays: boolean;
        defaultGuests: number;
        defaultDays: number;
        pricingType: string;
        fixedPrice: number | null;
        sendRebuyEmail: boolean;
      }>;
    }) => ({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      role: seller.role,
      qrConfig: seller.sellerConfigs.length > 0 ? seller.sellerConfigs[0] : undefined
    }))
    
    return NextResponse.json(sellersWithConfigs)
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
