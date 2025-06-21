import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

// GET /api/admin/sellers - Fetch all sellers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use raw SQL with PostgreSQL syntax
    const sellers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.telephone,
        u.whatsapp,
        u.role,
        u."isActive",
        u."createdAt",
        u."locationId",
        u."configurationId",
        u."configurationName",
        l.id as "locationId",
        l.name as "locationName",
        l."isActive" as "locationIsActive",
        d.id as "distributorId",
        d.name as "distributorName",
        d."isActive" as "distributorIsActive"
      FROM users u
      LEFT JOIN "Location" l ON u."locationId" = l.id
      LEFT JOIN "Distributor" d ON l."distributorId" = d.id
      WHERE u.role = 'SELLER'
      ORDER BY u."createdAt" DESC
    `

    // Transform the result to match expected structure
    const formattedSellers = (sellers as any[]).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      telephone: row.telephone,
      whatsapp: row.whatsapp,
      role: row.role,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      locationId: row.locationId,
      configurationId: row.configurationId,
      configurationName: row.configurationName,
      location: row.locationId ? {
        id: row.locationId,
        name: row.locationName,
        isActive: Boolean(row.locationIsActive),
        distributor: row.distributorId ? {
          id: row.distributorId,
          name: row.distributorName,
          isActive: Boolean(row.distributorIsActive)
        } : null
      } : null
    }))

    return NextResponse.json(formattedSellers)
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 })
  }
}

// POST /api/admin/sellers - Create new seller with QR configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      name, 
      email, 
      password, 
      telephone,
      whatsapp,
      locationId,
      notes,
      // QR Configuration fields
      sendMethod,
      landingPageRequired,
      allowCustomGuestsDays,
      defaultGuests,
      defaultDays,
      pricingType,
      fixedPrice,
      sendRebuyEmail
    } = await request.json()

    if (!name || !email || !password || !locationId) {
      return NextResponse.json({ error: "Name, email, password, and location are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create seller and QR configuration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create seller
      const seller = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          telephone: telephone || null,
          whatsapp: whatsapp || null,
          notes: notes || null,
          role: "SELLER",
          locationId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      })

      // Create QR configuration
      const qrConfig = await tx.qRConfig.create({
        data: {
          sellerId: seller.id,
          sendMethod: sendMethod || "URL",
          landingPageRequired: landingPageRequired !== undefined ? landingPageRequired : true,
          allowCustomGuestsDays: allowCustomGuestsDays !== undefined ? allowCustomGuestsDays : false,
          defaultGuests: defaultGuests || 2,
          defaultDays: defaultDays || 3,
          pricingType: pricingType || "FIXED",
          fixedPrice: fixedPrice || 0,
          sendRebuyEmail: sendRebuyEmail !== undefined ? sendRebuyEmail : false,
        }
      })

      return { seller, qrConfig }
    })

    return NextResponse.json(result.seller)
  } catch (error) {
    console.error("Error creating seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
