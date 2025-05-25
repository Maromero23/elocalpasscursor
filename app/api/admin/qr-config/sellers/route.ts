import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

// GET /api/admin/qr-config/sellers - Fetch all sellers with their QR configurations
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/qr-config/sellers called')
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ Admin access confirmed, fetching sellers with configs...')
    const sellers = await prisma.user.findMany({
      where: {
        role: "SELLER"
      },
      include: {
        sellerConfigs: true,
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    console.log(`📊 Found ${sellers.length} sellers`)
    
    // Transform the data to include qrConfig at the top level
    const sellersWithConfigs = sellers.map((seller) => ({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      role: seller.role,
      location: seller.location,
      qrConfig: seller.sellerConfigs || null
    }))
    
    console.log('✅ Successfully transformed sellers data')
    return NextResponse.json(sellersWithConfigs)
  } catch (error) {
    console.error("❌ Error fetching sellers with configs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
